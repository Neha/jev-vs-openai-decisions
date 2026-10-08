import { evaluateJev } from "./jev";
import type { RequestKeys } from "./keys";
import { evaluateOpenAI } from "./openai-decisions";
import { scoreProviderResult } from "./metrics";
import type { CanonicalCase, CanonicalQuestion, ProviderResult } from "./types";

export async function runProviders(
  input: string,
  questions: CanonicalQuestion[],
  keys: RequestKeys = {},
): Promise<{ jev: ProviderResult; openai: ProviderResult }> {
  const [jev, openai] = await Promise.all([
    evaluateJev(input, questions, keys.jev),
    evaluateOpenAI(input, questions, keys.openai),
  ]);
  return { jev, openai };
}

export async function runCase(testCase: CanonicalCase, keys: RequestKeys = {}) {
  const { jev, openai } = await runProviders(testCase.input, testCase.questions, keys);
  return {
    caseId: testCase.id,
    jev: scoreProviderResult(testCase, jev),
    openai: scoreProviderResult(testCase, openai),
  };
}
