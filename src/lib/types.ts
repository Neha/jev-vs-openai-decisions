export type ProviderId = "jev" | "openai";

export type QuestionType = "boolean" | "choice" | "score";

export type ChoiceOption = {
  value: string;
  description: string;
};

export type ScoreLevel = {
  label: string;
  description: string;
};

export type CanonicalQuestion = {
  id: string;
  type: QuestionType;
  instructions: string;
  options?: ChoiceOption[];
  levels?: ScoreLevel[];
};

export type GoldLabel = {
  questionId: string;
  boolean?: boolean;
  choice?: string;
  scoreLevel?: number;
};

export type CanonicalCase = {
  id: string;
  title: string;
  input: string;
  questions: CanonicalQuestion[];
  gold: GoldLabel[];
};

export type NormalizedAnswer = {
  questionId: string;
  type: QuestionType | "refusal";
  value: number | string | null;
  probabilities?: Record<string, number>;
  confidence?: number;
  schemaValid: boolean;
  refused?: boolean;
};

export type ScoredAnswer = NormalizedAnswer & {
  correct: boolean | null;
  brier?: number;
  absError?: number;
};

export type ProviderResult = {
  provider: ProviderId;
  model: string;
  configured: boolean;
  ok: boolean;
  error?: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  answers: NormalizedAnswer[];
  raw?: unknown;
};

export type ScoredProviderResult = Omit<ProviderResult, "answers"> & {
  answers: ScoredAnswer[];
  correctCount: number;
  scoredCount: number;
};

export type ProviderSummary = {
  provider: ProviderId;
  totalUsd: number;
  accuracy: number;
  correctCount: number;
  scoredCount: number;
  meanLatencyMs: number;
  p95LatencyMs: number;
  meanTokens: number;
  schemaValidPct: number;
  errorCount: number;
  refusalCount: number;
  meanBrier: number | null;
  meanAbsError: number | null;
  runCount: number;
};

export type Winner = "jev" | "openai" | "tie" | "none";
