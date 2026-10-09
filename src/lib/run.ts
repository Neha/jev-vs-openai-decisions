import { evaluateJev } from "./jev";
import type { RequestKeys } from "./keys";
import { evaluateLaya } from "./laya";
import { evaluateOpenAI } from "./openai-decisions";
import { scoreProviderResult, unsupportedImageResult } from "./metrics";
import type { CanonicalCase, CanonicalQuestion, ProviderResult } from "./types";

export async function runProviders(
  input: string,
  questions: CanonicalQuestion[],
  keys: RequestKeys = {},
  image?: string,
): Promise<{ jev: ProviderResult; laya: ProviderResult; openai: ProviderResult }> {
  const [jev, laya, openai] = await Promise.all([
    image
      ? Promise.resolve(unsupportedImageResult("jev", "jev-latest", questions))
      : evaluateJev(input, questions, keys.jev),
    image
      ? Promise.resolve(unsupportedImageResult("laya", "laya", questions))
      : evaluateLaya(input, questions, keys.laya),
    evaluateOpenAI(input, questions, keys.openai, image),
  ]);
  return { jev, laya, openai };
}

export async function runCase(testCase: CanonicalCase, keys: RequestKeys = {}) {
  const { jev, laya, openai } = await runProviders(testCase.input, testCase.questions, keys);
  return {
    caseId: testCase.id,
    jev: scoreProviderResult(testCase, jev),
    laya: scoreProviderResult(testCase, laya),
    openai: scoreProviderResult(testCase, openai),
  };
}
