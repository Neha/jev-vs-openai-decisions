import type { ReactNode } from "react";
import { PROVIDER_LABEL } from "@/lib/display";
import type { Leader, ProviderId } from "@/lib/types";

const TONE: Record<ProviderId | "tie", { color?: string; bg?: string; className: string }> = {
  jev: { color: "var(--jev)", bg: "var(--jev-dim)", className: "" },
  openai: { color: "var(--openai)", bg: "var(--openai-dim)", className: "" },
  tie: { className: "text-[#6d28d9] bg-[rgba(109,40,217,0.12)]" },
};

export function LeadMark({
  leader,
  size = "md",
}: {
  leader: Leader;
  size?: "sm" | "md" | "lg";
}) {
  if (leader.kind === "none" || leader.ids.length === 0) {
    return <span className="text-[var(--muted)]">—</span>;
  }
  if (leader.kind === "tie") {
    return (
      <StatusPill tone="tie" size={size}>
        <span className="flex items-center gap-1" aria-hidden>
          <span className="block h-2 w-2 rounded-full bg-[var(--jev)]" />
          <span className="block h-2 w-2 rounded-full bg-[var(--openai)]" />
        </span>
        Tie
      </StatusPill>
    );
  }
  const id = leader.ids[0] ?? "jev";
  return <StatusPill tone={id} size={size}>{PROVIDER_LABEL[id]}</StatusPill>;
}

export function StatusPill({
  tone,
  size = "md",
  children,
}: {
  tone: ProviderId | "tie";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}) {
  const pad =
    size === "lg"
      ? "px-4 py-2 text-[19px]"
      : size === "sm"
        ? "px-2.5 py-1 text-[13px]"
        : "px-3 py-1.5 text-[15px]";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-semibold tracking-tight ${pad} ${TONE[tone].className}`}
      style={
        TONE[tone].color
          ? { color: TONE[tone].color, background: TONE[tone].bg }
          : undefined
      }
    >
      {children}
    </span>
  );
}
