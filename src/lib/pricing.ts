import type { ProviderId } from "./types";

/** Published input-token rates. Output is free on both decision APIs. */
export const INPUT_USD_PER_MILLION: Record<ProviderId, number> = {
  jev: 0.042,
  openai: 0.1,
};

export function costUsd(provider: ProviderId, inputTokens: number): number {
  if (!Number.isFinite(inputTokens) || inputTokens <= 0) {
    return 0;
  }
  return (inputTokens * INPUT_USD_PER_MILLION[provider]) / 1_000_000;
}
