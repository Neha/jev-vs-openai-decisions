import { formatMs, formatNumber, formatPct, formatUsd } from "@/lib/format";
import type { ProviderSummary } from "@/lib/types";

function emptySummary(provider: ProviderSummary["provider"]): ProviderSummary {
  return {
    provider,
    totalUsd: 0,
    accuracy: 0,
    correctCount: 0,
    scoredCount: 0,
    meanLatencyMs: 0,
    p95LatencyMs: 0,
    meanTokens: 0,
    schemaValidPct: 0,
    errorCount: 0,
    refusalCount: 0,
    meanBrier: null,
    meanAbsError: null,
    runCount: 0,
  };
}

function SplitStat({
  label,
  jev,
  openai,
  hint,
}: {
  label: string;
  jev: string;
  openai: string;
  hint?: string;
}) {
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)]/90 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--muted)] uppercase">
        {label}
      </p>
      {hint ? <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p> : null}
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] tracking-wide text-[var(--jev)]">Jev</p>
          <p className="tabular mt-1 text-4xl font-semibold tracking-tight text-[var(--jev)] sm:text-5xl">
            {jev}
          </p>
        </div>
        <div>
          <p className="text-[11px] tracking-wide text-[var(--openai)]">OpenAI</p>
          <p className="tabular mt-1 text-4xl font-semibold tracking-tight text-[var(--openai)] sm:text-5xl">
            {openai}
          </p>
        </div>
      </div>
    </article>
  );
}

export function Scoreboard({
  jev,
  openai,
}: {
  jev?: ProviderSummary;
  openai?: ProviderSummary;
}) {
  const j = jev ?? emptySummary("jev");
  const o = openai ?? emptySummary("openai");

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <SplitStat
        label="Price"
        hint="Estimated from billed input tokens"
        jev={formatUsd(j.totalUsd)}
        openai={formatUsd(o.totalUsd)}
      />
      <SplitStat
        label="Correctness"
        hint={
          j.scoredCount || o.scoredCount
            ? `${j.correctCount}/${j.scoredCount} vs ${o.correctCount}/${o.scoredCount}`
            : "Needs labeled benchmark answers"
        }
        jev={formatPct(j.accuracy)}
        openai={formatPct(o.accuracy)}
      />
      <SplitStat
        label="Latency"
        hint={`p95 ${formatMs(j.p95LatencyMs)} vs ${formatMs(o.p95LatencyMs)}`}
        jev={formatMs(j.meanLatencyMs)}
        openai={formatMs(o.meanLatencyMs)}
      />
      <div className="grid grid-cols-2 gap-3 lg:col-span-3 sm:grid-cols-4">
        <Chip label="Mean tokens" jev={formatNumber(j.meanTokens, 0)} openai={formatNumber(o.meanTokens, 0)} />
        <Chip label="Schema valid" jev={formatPct(j.schemaValidPct)} openai={formatPct(o.schemaValidPct)} />
        <Chip
          label="Errors / refusals"
          jev={`${j.errorCount} / ${j.refusalCount}`}
          openai={`${o.errorCount} / ${o.refusalCount}`}
        />
        <Chip
          label="Brier (boolean)"
          jev={j.meanBrier === null ? "—" : formatNumber(j.meanBrier, 3)}
          openai={o.meanBrier === null ? "—" : formatNumber(o.meanBrier, 3)}
        />
      </div>
    </section>
  );
}

function Chip({
  label,
  jev,
  openai,
}: {
  label: string;
  jev: string;
  openai: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)]/80 px-4 py-3">
      <p className="text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">{label}</p>
      <p className="tabular mt-2 text-sm">
        <span className="text-[var(--jev)]">{jev}</span>
        <span className="mx-2 text-[var(--muted)]">·</span>
        <span className="text-[var(--openai)]">{openai}</span>
      </p>
    </div>
  );
}
