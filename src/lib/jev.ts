import { asNumber, asRecord, asString, extractError, readJson } from "./http";
import { emptyProviderResult, isSchemaValid } from "./metrics";
import { costUsd } from "./pricing";
import type {
  CanonicalQuestion,
  NormalizedAnswer,
  ProviderResult,
} from "./types";

const JEV_URL = "https://api.typesafe.ai/v1/systemone";
const JEV_MODEL = "jev-latest";

type JevQuestion = {
  type: "noul" | "choice" | "score";
  instructions: string;
  criteria?: Record<string, string> | string[];
};

export type JevRequest = {
  model: string;
  state: string;
  questions: Record<string, JevQuestion>;
};

export function toJevRequest(
  input: string,
  questions: CanonicalQuestion[],
): JevRequest {
  const mapped: Record<string, JevQuestion> = {};
  for (const question of questions) {
    if (question.type === "boolean") {
      mapped[question.id] = {
        type: "noul",
        instructions: question.instructions,
        criteria: {
          true: "The condition is true",
          false: "The condition is false",
        },
      };
      continue;
    }
    if (question.type === "choice") {
      mapped[question.id] = {
        type: "choice",
        instructions: question.instructions,
        criteria: Object.fromEntries(
          (question.options ?? []).map((option) => [option.value, option.description]),
        ),
      };
      continue;
    }
    mapped[question.id] = {
      type: "score",
      instructions: question.instructions,
      criteria: (question.levels ?? []).map((level) =>
        `${level.label}: ${level.description}`,
      ),
    };
  }
  return { model: JEV_MODEL, state: input, questions: mapped };
}

function probabilityMap(value: unknown): Record<string, number> | undefined {
  const record = asRecord(value);
  if (!record) {
    return undefined;
  }
  const entries = Object.entries(record)
    .map(([key, probability]) => [key, asNumber(probability)] as const)
    .filter((entry): entry is readonly [string, number] => entry[1] !== null);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export function fromJevResponse(
  body: unknown,
  questions: CanonicalQuestion[],
  latencyMs: number,
): ProviderResult {
  const record = asRecord(body) ?? {};
  const answersRecord = asRecord(record.answers) ?? {};
  const usage = asRecord(record.usage) ?? {};
  const routing = asRecord(record.routing);
  const inputTokens = asNumber(usage.input_tokens) ?? 0;
  const outputTokens = asNumber(usage.output_tokens) ?? 0;
  const model =
    asString(record.model) ?? asString(routing?.model) ?? JEV_MODEL;

  const answers: NormalizedAnswer[] = questions.map((question) => {
    const raw = asRecord(answersRecord[question.id]);
    if (!raw) {
      return {
        questionId: question.id,
        type: question.type,
        value: null,
        schemaValid: false,
      };
    }

    if (question.type === "boolean") {
      const probability = asNumber(raw.noul);
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
      const draft: Omit<NormalizedAnswer, "schemaValid"> = {
        questionId: question.id,
        type: "choice",
        value: asString(raw.choice),
        probabilities: probabilityMap(raw.probabilities),
        confidence: asNumber(raw.confidence) ?? undefined,
      };
      return { ...draft, schemaValid: isSchemaValid(question, draft) };
    }

    const draft: Omit<NormalizedAnswer, "schemaValid"> = {
      questionId: question.id,
      type: "score",
      value: asNumber(raw.score),
      probabilities: probabilityMap(raw.probabilities),
      confidence: asNumber(raw.confidence) ?? undefined,
    };
    return { ...draft, schemaValid: isSchemaValid(question, draft) };
  });

  return {
    provider: "jev",
    model,
    configured: true,
    ok: true,
    latencyMs,
    inputTokens,
    outputTokens,
    costUsd: costUsd("jev", inputTokens),
    answers,
    raw: body,
  };
}

export async function evaluateJev(
  input: string,
  questions: CanonicalQuestion[],
  apiKey?: string,
): Promise<ProviderResult> {
  const key = apiKey?.trim();
  if (!key) {
    return emptyProviderResult(
      "jev",
      JEV_MODEL,
      "No TypeSafe key. Add one in Settings or .env.local.",
      false,
      questions,
    );
  }

  const payload = toJevRequest(input, questions);
  const started = performance.now();
  try {
    const response = await fetch(JEV_URL, {
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
          "jev",
          JEV_MODEL,
          extractError(body, response.status),
          true,
          questions,
          latencyMs,
        ),
        raw: body,
      };
    }
    return fromJevResponse(body, questions, latencyMs);
  } catch (error) {
    const latencyMs = Math.round(performance.now() - started);
    return emptyProviderResult(
      "jev",
      JEV_MODEL,
      error instanceof Error ? error.message : "Jev request failed",
      true,
      questions,
      latencyMs,
    );
  }
}
