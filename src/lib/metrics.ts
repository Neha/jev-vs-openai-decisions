import type {
  CanonicalCase,
  CanonicalQuestion,
  GoldLabel,
  NormalizedAnswer,
  ProviderResult,
  ProviderSummary,
  ScoredAnswer,
  ScoredProviderResult,
  Winner,
} from "./types";

export function emptyProviderResult(
  provider: ProviderResult["provider"],
  model: string,
  error: string,
  configured: boolean,
  questions: CanonicalQuestion[],
  latencyMs = 0,
): ProviderResult {
  return {
    provider,
    model,
    configured,
    ok: false,
    error,
    latencyMs,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    answers: questions.map((question) => ({
      questionId: question.id,
      type: question.type,
      value: null,
      schemaValid: false,
    })),
  };
}

export function isSchemaValid(
  question: CanonicalQuestion,
  answer: Omit<NormalizedAnswer, "schemaValid">,
): boolean {
  if (answer.refused || answer.type === "refusal") {
    return false;
  }
  if (question.type === "boolean") {
    return (
      answer.type === "boolean" &&
      typeof answer.value === "number" &&
      answer.value >= 0 &&
      answer.value <= 1
    );
  }
  if (question.type === "choice") {
    const allowed = new Set((question.options ?? []).map((option) => option.value));
    return (
      answer.type === "choice" &&
      typeof answer.value === "string" &&
      allowed.has(answer.value)
    );
  }
  return (
    answer.type === "score" &&
    typeof answer.value === "number" &&
    Number.isFinite(answer.value)
  );
}

export function scoreAnswer(
  question: CanonicalQuestion,
  answer: NormalizedAnswer,
  gold: GoldLabel | undefined,
): ScoredAnswer {
  if (!gold) {
    return { ...answer, correct: null };
  }

  if (answer.refused || !answer.schemaValid || answer.value === null) {
    const scored: ScoredAnswer = { ...answer, correct: false };
    if (question.type === "boolean" && gold.boolean !== undefined) {
      scored.brier = 1;
    }
    if (question.type === "score" && gold.scoreLevel !== undefined) {
      scored.absError = Number.NaN;
    }
    return scored;
  }

  if (question.type === "boolean" && gold.boolean !== undefined) {
    const probability = Number(answer.value);
    const target = gold.boolean ? 1 : 0;
    return {
      ...answer,
      correct: probability >= 0.5 === gold.boolean,
      brier: (probability - target) ** 2,
    };
  }

  if (question.type === "choice" && gold.choice !== undefined) {
    return {
      ...answer,
      correct: answer.value === gold.choice,
    };
  }

  if (question.type === "score" && gold.scoreLevel !== undefined) {
    const score = Number(answer.value);
    return {
      ...answer,
      correct: Math.round(score) === gold.scoreLevel,
      absError: Math.abs(score - gold.scoreLevel),
    };
  }

  return { ...answer, correct: null };
}

export function scoreProviderResult(
  testCase: CanonicalCase,
  result: ProviderResult,
): ScoredProviderResult {
  const goldById = new Map(testCase.gold.map((label) => [label.questionId, label]));
  const questionsById = new Map(
    testCase.questions.map((question) => [question.id, question]),
  );
  const answers = result.answers.map((answer) => {
    const question = questionsById.get(answer.questionId);
    if (!question) {
      return { ...answer, correct: null };
    }
    return scoreAnswer(question, answer, goldById.get(answer.questionId));
  });
  const judged = answers.filter((answer) => answer.correct !== null);
  return {
    ...result,
    answers,
    correctCount: judged.filter((answer) => answer.correct).length,
    scoredCount: judged.length,
  };
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[index] ?? 0;
}

export function summarize(
  results: ScoredProviderResult[],
  provider: ProviderResult["provider"],
): ProviderSummary {
  const runs = results.filter((result) => result.provider === provider);
  const latencies = runs.filter((result) => result.ok).map((result) => result.latencyMs);
  const tokens = runs.filter((result) => result.ok).map((result) => result.inputTokens);
  const answers = runs.flatMap((result) => result.answers);
  const judged = answers.filter((answer) => answer.correct !== null);
  const briers = judged
    .map((answer) => answer.brier)
    .filter((value): value is number => typeof value === "number");
  const absErrors = judged
    .map((answer) => answer.absError)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const schemaAnswers = answers.length;
  const correctCount = judged.filter((answer) => answer.correct).length;
  const scoredCount = judged.length;

  return {
    provider,
    runCount: runs.length,
    totalUsd: runs.reduce((sum, result) => sum + result.costUsd, 0),
    accuracy: scoredCount === 0 ? 0 : correctCount / scoredCount,
    correctCount,
    scoredCount,
    meanLatencyMs:
      latencies.length === 0
        ? 0
        : latencies.reduce((sum, value) => sum + value, 0) / latencies.length,
    p95LatencyMs: percentile(latencies, 95),
    meanTokens:
      tokens.length === 0
        ? 0
        : tokens.reduce((sum, value) => sum + value, 0) / tokens.length,
    schemaValidPct:
      schemaAnswers === 0
        ? 0
        : answers.filter((answer) => answer.schemaValid).length / schemaAnswers,
    errorCount: runs.filter((result) => !result.ok).length,
    refusalCount: answers.filter((answer) => answer.refused).length,
    meanBrier:
      briers.length === 0
        ? null
        : briers.reduce((sum, value) => sum + value, 0) / briers.length,
    meanAbsError:
      absErrors.length === 0
        ? null
        : absErrors.reduce((sum, value) => sum + value, 0) / absErrors.length,
  };
}

export function pickWinner(
  jev?: ScoredProviderResult,
  openai?: ScoredProviderResult,
): Winner {
  if (!jev?.ok && !openai?.ok) {
    return "none";
  }
  if (jev?.ok && !openai?.ok) {
    return "jev";
  }
  if (openai?.ok && !jev?.ok) {
    return "openai";
  }
  if (!jev || !openai) {
    return "none";
  }
  const jevAccuracy = jev.scoredCount === 0 ? 0 : jev.correctCount / jev.scoredCount;
  const openaiAccuracy =
    openai.scoredCount === 0 ? 0 : openai.correctCount / openai.scoredCount;
  if (jevAccuracy !== openaiAccuracy) {
    return jevAccuracy > openaiAccuracy ? "jev" : "openai";
  }
  return "tie";
}
