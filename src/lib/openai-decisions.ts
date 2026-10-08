import { asNumber, asRecord, asString, extractError, readJson } from "./http";
import { emptyProviderResult, isSchemaValid } from "./metrics";
import { costUsd } from "./pricing";
import type {
  CanonicalQuestion,
  NormalizedAnswer,
  ProviderResult,
} from "./types";

const OPENAI_URL = "https://api.openai.com/v1/decisions";
const OPENAI_MODEL = "gpt-6-luna";

type OpenAIQuestion =
  | { type: "predicate"; name: string; instructions: string }
  | {
      type: "choice";
      name: string;
      instructions: string;
      choices: { value: string; description: string }[];
    }
  | {
      type: "score";
      name: string;
      instructions: string;
      levels: { label: string; description: string }[];
    };

export type OpenAIRequest = {
  model: string;
  input: string;
  questions: OpenAIQuestion[];
};

export function toOpenAIRequest(
  input: string,
  questions: CanonicalQuestion[],
): OpenAIRequest {
  return {
    model: OPENAI_MODEL,
    input,
    questions: questions.map((question): OpenAIQuestion => {
      if (question.type === "boolean") {
        return {
          type: "predicate",
          name: question.id,
          instructions: question.instructions,
        };
      }
      if (question.type === "choice") {
        return {
          type: "choice",
          name: question.id,
          instructions: question.instructions,
          choices: question.options ?? [],
        };
      }
      return {
        type: "score",
        name: question.id,
        instructions: question.instructions,
        levels: question.levels ?? [],
      };
    }),
  };
}

function probabilityMapFromUnknown(value: unknown): Record<string, number> | undefined {
  const record = asRecord(value);
  if (record) {
    const entries = Object.entries(record)
      .map(([key, probability]) => [key, asNumber(probability)] as const)
      .filter((entry): entry is readonly [string, number] => entry[1] !== null);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }
  if (!Array.isArray(value)) {
    return undefined;
  }
  const mapped: Record<string, number> = {};
  for (const item of value) {
    const row = asRecord(item);
    if (!row) {
      continue;
    }
    const probability = asNumber(row.probability);
    if (probability === null) {
      continue;
    }
    const key =
      asString(row.label) ??
      asString(row.value) ??
      (asNumber(row.value) !== null ? String(row.value) : null);
    if (key) {
      mapped[key] = probability;
    }
  }
  return Object.keys(mapped).length > 0 ? mapped : undefined;
}

function usageTokens(body: Record<string, unknown>): {
  inputTokens: number;
  outputTokens: number;
} {
  const usage = asRecord(body.usage) ?? {};
  return {
    inputTokens:
      asNumber(usage.input_tokens) ?? asNumber(usage.prompt_tokens) ?? 0,
    outputTokens:
      asNumber(usage.output_tokens) ?? asNumber(usage.completion_tokens) ?? 0,
  };
}

export function fromOpenAIResponse(
  body: unknown,
  questions: CanonicalQuestion[],
  latencyMs: number,
): ProviderResult {
  const record = asRecord(body) ?? {};
  const rawAnswers = Array.isArray(record.answers) ? record.answers : [];
  const byName = new Map<string, Record<string, unknown>>();
  for (const item of rawAnswers) {
    const row = asRecord(item);
    if (!row) {
      continue;
    }
    const name = asString(row.name);
    if (name) {
      byName.set(name, row);
    }
  }

  const { inputTokens, outputTokens } = usageTokens(record);
  const model = asString(record.model) ?? OPENAI_MODEL;

  const answers: NormalizedAnswer[] = questions.map((question, index) => {
    const raw =
      byName.get(question.id) ?? asRecord(rawAnswers[index]) ?? undefined;
    if (!raw) {
      return {
        questionId: question.id,
        type: question.type,
        value: null,
        schemaValid: false,
      };
    }

    if (asString(raw.type) === "refusal") {
      return {
        questionId: question.id,
        type: "refusal",
        value: null,
        schemaValid: false,
        refused: true,
      };
    }

    if (question.type === "boolean") {
      const probability = asNumber(raw.probability);
      const draft: Omit<NormalizedAnswer, "schemaValid"> = {
        questionId: question.id,
        type: "boolean",
        value: probability,
        probabilities:
          probability === null ? undefined : { yes: probability, no: 1 - probability },
      };
      return { ...draft, schemaValid: isSchemaValid(question, draft) };
    }

    if (question.type === "choice") {
      const choice =
        asString(raw.choice) ??
        (typeof raw.choice === "boolean" ? String(raw.choice) : null);
      const draft: Omit<NormalizedAnswer, "schemaValid"> = {
        questionId: question.id,
        type: "choice",
        value: choice,
        probabilities: probabilityMapFromUnknown(raw.probabilities),
        confidence: asNumber(raw.confidence) ?? undefined,
      };
      return { ...draft, schemaValid: isSchemaValid(question, draft) };
    }

    const draft: Omit<NormalizedAnswer, "schemaValid"> = {
      questionId: question.id,
      type: "score",
      value: asNumber(raw.score),
      probabilities: probabilityMapFromUnknown(raw.probabilities),
      confidence: asNumber(raw.confidence) ?? undefined,
    };
    return { ...draft, schemaValid: isSchemaValid(question, draft) };
  });

  return {
    provider: "openai",
    model,
    configured: true,
    ok: true,
    latencyMs,
    inputTokens,
    outputTokens,
    costUsd: costUsd("openai", inputTokens),
    answers,
    raw: body,
  };
}

export async function evaluateOpenAI(
  input: string,
  questions: CanonicalQuestion[],
  apiKey?: string,
): Promise<ProviderResult> {
  const key = apiKey?.trim();
  if (!key) {
    return emptyProviderResult(
      "openai",
      OPENAI_MODEL,
      "No OpenAI key. Add one in Settings or .env.local.",
      false,
      questions,
    );
  }

  const payload = toOpenAIRequest(input, questions);
  const started = performance.now();
  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });
    const latencyMs = Math.round(performance.now() - started);
    const body = await readJson(response);
    if (!response.ok) {
      return {
        ...emptyProviderResult(
          "openai",
          OPENAI_MODEL,
          extractError(body, response.status),
          true,
          questions,
          latencyMs,
        ),
        raw: body,
      };
    }
    return fromOpenAIResponse(body, questions, latencyMs);
  } catch (error) {
    const latencyMs = Math.round(performance.now() - started);
    return emptyProviderResult(
      "openai",
      OPENAI_MODEL,
      error instanceof Error ? error.message : "OpenAI request failed",
      true,
      questions,
      latencyMs,
    );
  }
}
