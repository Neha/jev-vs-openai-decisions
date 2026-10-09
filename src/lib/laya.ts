import { extractError, readJson } from "./http";
import { fromJevResponse, toJevRequest } from "./jev";
import { emptyProviderResult } from "./metrics";
import type { CanonicalQuestion, ProviderResult } from "./types";

const LAYA_URL = "https://api.laya.studio/v1/systemone";
const LAYA_MODEL = "laya";

export function toLayaRequest(input: string, questions: CanonicalQuestion[]) {
  const mapped = toJevRequest(input, questions);
  return { state: mapped.state, questions: mapped.questions };
}

export async function evaluateLaya(
  input: string,
  questions: CanonicalQuestion[],
  apiKey?: string,
): Promise<ProviderResult> {
  const key = apiKey?.trim();
  if (!key) {
    return emptyProviderResult(
      "laya",
      LAYA_MODEL,
      "No Laya key. Add one in Settings or .env.local.",
      false,
      questions,
    );
  }

  const payload = toLayaRequest(input, questions);
  const started = performance.now();
  try {
    const response = await fetch(LAYA_URL, {
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
          "laya",
          LAYA_MODEL,
          extractError(body, response.status),
          true,
          questions,
          latencyMs,
        ),
        raw: body,
      };
    }
    return fromJevResponse(body, questions, latencyMs, "laya");
  } catch (error) {
    const latencyMs = Math.round(performance.now() - started);
    return emptyProviderResult(
      "laya",
      LAYA_MODEL,
      error instanceof Error ? error.message : "Laya request failed",
      true,
      questions,
      latencyMs,
    );
  }
}
