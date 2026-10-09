import type { Leader, NormalizedAnswer, ProviderId } from "./types";

export const PROVIDER_LABEL: Record<ProviderId, string> = {
  jev: "Jev",
  openai: "OpenAI",
};

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

export function leaderLabel(leader: Leader): string {
  if (leader.kind === "none" || leader.ids.length === 0) {
    return "—";
  }
  const names = leader.ids.map((id) => PROVIDER_LABEL[id]);
  if (leader.kind === "tie") {
    return `Tie · ${names.join(" · ")}`;
  }
  return names[0] ?? "—";
}
