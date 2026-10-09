import { PROVIDER_LABEL } from "@/lib/display";
import type { ProviderId } from "@/lib/types";

const COLOR: Record<ProviderId, string> = {
  jev: "var(--jev)",
  openai: "var(--openai)",
};

export function ProviderMark({
  id,
  size = "md",
}: {
  id: ProviderId;
  size?: "sm" | "md" | "lg";
}) {
  const dot = size === "lg" ? "h-3 w-3" : size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  const type =
    size === "lg" ? "text-[28px] font-semibold tracking-tight" : size === "sm" ? "text-[15px] font-medium" : "text-[17px] font-semibold tracking-tight";

  return (
    <span className={`inline-flex items-center gap-2.5 ${type}`}>
      <span className={`shrink-0 rounded-full ${dot}`} style={{ background: COLOR[id] }} />
      {PROVIDER_LABEL[id]}
    </span>
  );
}
