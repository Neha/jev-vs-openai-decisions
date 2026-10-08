import type { NormalizedAnswer, Winner } from "./types";

export function formatAnswer(answer: NormalizedAnswer | undefined): string {
  if (!answer) {
    return "—";
  }
  if (answer.refused || answer.type === "refusal") {
    return "refused";
  }
  if (answer.value === null) {
    return "—";
  }
  if (answer.type === "boolean" && typeof answer.value === "number") {
    return `${Math.round(answer.value * 100)}% yes`;
  }
  if (answer.type === "score" && typeof answer.value === "number") {
    return answer.value.toFixed(2);
  }
  return String(answer.value);
}

export function winnerLabel(winner: Winner): string {
  if (winner === "jev") {
    return "Jev";
  }
  if (winner === "openai") {
    return "OpenAI";
  }
  if (winner === "tie") {
    return "Tie";
  }
  return "—";
}
