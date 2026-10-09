import { PROVIDER_LABEL } from "@/lib/display";
import { formatMs, formatNumber, formatPct, formatUsd } from "@/lib/format";
import { leaderColor, pickSummaryLeaders } from "@/lib/metrics";
import type { Leader, ProviderId, ProviderSummary } from "@/lib/types";
import { StatusPill } from "./lead-mark";
import { ProviderMark } from "./provider-mark";

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

function dash(summary: ProviderSummary, value: string) {
  return summary.runCount === 0 ? "—" : value;
}

function winnerCell(leader: Leader, id: ProviderId) {
  if (leader.kind === "none") {
    return "—";
  }
  if (!leader.ids.includes(id)) {
    return "—";
  }
  return leader.kind === "tie" ? "Tie" : "Winner";
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
  const ready = j.runCount > 0 || o.runCount > 0;
  const winner = pickSummaryLeaders([jev, openai]);

  const hero: Array<{ label: string; hint: string; jev: string; openai: string }> = [
    {
      label: "Winner",
      hint: "On correctness",
      jev: winnerCell(winner, "jev"),
      openai: winnerCell(winner, "openai"),
    },
    {
      label: "Reads",
      hint: "Not a score",
      jev: "Text",
      openai: "Text + photo",
    },
    {
      label: "Price",
      hint: "Input tokens",
      jev: dash(j, formatUsd(j.totalUsd)),
      openai: dash(o, formatUsd(o.totalUsd)),
    },
    {
      label: "Correct",
      hint: ready ? `${j.correctCount}/${j.scoredCount} · ${o.correctCount}/${o.scoredCount}` : "Gold labels",
      jev: dash(j, formatPct(j.accuracy)),
      openai: dash(o, formatPct(o.accuracy)),
    },
    {
      label: "Latency",
      hint: "Mean round trip",
      jev: dash(j, formatMs(j.meanLatencyMs)),
      openai: dash(o, formatMs(o.meanLatencyMs)),
    },
  ];

  const detail: Array<{ label: string; jev: string; openai: string }> = [
    {
      label: "p95",
      jev: dash(j, formatMs(j.p95LatencyMs)),
      openai: dash(o, formatMs(o.p95LatencyMs)),
    },
    {
      label: "Tokens",
      jev: dash(j, formatNumber(j.meanTokens, 0)),
      openai: dash(o, formatNumber(o.meanTokens, 0)),
    },
    {
      label: "Schema",
      jev: dash(j, formatPct(j.schemaValidPct)),
      openai: dash(o, formatPct(o.schemaValidPct)),
    },
    {
      label: "Misses",
      jev: dash(j, `${j.errorCount} / ${j.refusalCount}`),
      openai: dash(o, `${o.errorCount} / ${o.refusalCount}`),
    },
    {
      label: "Brier",
      jev: j.meanBrier === null ? "—" : formatNumber(j.meanBrier, 3),
      openai: o.meanBrier === null ? "—" : formatNumber(o.meanBrier, 3),
    },
  ];

  return (
    <section className="overflow-hidden rounded-[32px] bg-[var(--panel)]">
      <div className="px-8 pt-10 pb-6 sm:px-10">
        <h2 className="text-[34px] leading-none font-semibold tracking-tight">Scoreboard</h2>
        {ready && winner.kind !== "none" ? (
          <p
            className={`mt-5 flex items-center gap-3 text-[40px] leading-none font-semibold tracking-tight ${
              winner.kind === "tie" ? "text-[#6d28d9]" : ""
            }`}
            style={winner.kind === "tie" ? undefined : { color: leaderColor(winner.ids) }}
          >
            {winner.kind === "tie" ? (
              <>
                <span className="flex items-center gap-1.5" aria-hidden>
                  <span className="block h-4 w-4 rounded-full bg-[var(--jev)]" />
                  <span className="block h-4 w-4 rounded-full bg-[var(--openai)]" />
                </span>
                Tie
              </>
            ) : (
              `${PROVIDER_LABEL[winner.ids[0] ?? "jev"]} wins`
            )}
          </p>
        ) : null}
        <p className="mt-3 max-w-2xl text-[19px] leading-7 text-[var(--muted)]">
          {ready
            ? "On labeled correctness. Photos never count here."
            : "Empty until you score the 24 labeled tickets. Photos never count here."}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-t border-[var(--line)]">
              <th className="w-[28%] px-8 py-5 text-[15px] font-medium text-[var(--muted)] sm:px-10">
                Metric
              </th>
              <th className="px-4 py-5">
                <div className="flex flex-col items-start gap-2">
                  <ProviderMark id="jev" />
                  <ColumnBadge leader={winner} id="jev" />
                </div>
              </th>
              <th className="px-4 py-5 pr-8 sm:pr-10">
                <div className="flex flex-col items-start gap-2">
                  <ProviderMark id="openai" />
                  <ColumnBadge leader={winner} id="openai" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {hero.map((row) => {
              const winnerRow = row.label === "Winner";
              return (
                <tr key={row.label} className="border-t border-[var(--line)]">
                  <th className="px-8 py-6 align-top sm:px-10">
                    <p className="text-[19px] font-semibold">{row.label}</p>
                    <p className="mt-1 text-[15px] leading-5 font-normal text-[var(--muted)]">{row.hint}</p>
                  </th>
                  <td className={winnerRow ? "px-4 py-6" : "tabular px-4 py-6 text-[32px] leading-none font-semibold tracking-tight"}>
                    {winnerRow ? <WinnerCell label={row.jev} tone="jev" /> : row.jev}
                  </td>
                  <td className={winnerRow ? "px-4 py-6 pr-8 sm:pr-10" : "tabular px-4 py-6 pr-8 text-[32px] leading-none font-semibold tracking-tight sm:pr-10"}>
                    {winnerRow ? <WinnerCell label={row.openai} tone="openai" /> : row.openai}
                  </td>
                </tr>
              );
            })}
            {detail.map((row) => (
              <tr key={row.label} className="border-t border-[var(--line)]">
                <th className="px-8 py-4 text-[16px] font-medium text-[var(--muted)] sm:px-10">{row.label}</th>
                <td className="tabular px-4 py-4 text-[18px] font-medium">{row.jev}</td>
                <td className="tabular px-4 py-4 pr-8 text-[18px] font-medium sm:pr-10">{row.openai}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ColumnBadge({ leader, id }: { leader: Leader; id: ProviderId }) {
  if (leader.kind === "tie") {
    return <StatusPill tone="tie" size="sm">Tie</StatusPill>;
  }
  if (leader.kind === "single" && leader.ids[0] === id) {
    return <StatusPill tone={id} size="sm">Winner</StatusPill>;
  }
  return null;
}

function WinnerCell({ label, tone }: { label: string; tone: ProviderId }) {
  if (label === "—") {
    return <span className="text-[32px] leading-none text-[var(--muted)]">—</span>;
  }
  if (label === "Tie") {
    return (
      <StatusPill tone="tie" size="lg">
        <span className="flex items-center gap-1" aria-hidden>
          <span className="block h-2.5 w-2.5 rounded-full bg-[var(--jev)]" />
          <span className="block h-2.5 w-2.5 rounded-full bg-[var(--openai)]" />
        </span>
        Tie
      </StatusPill>
    );
  }
  return <StatusPill tone={tone} size="lg">Winner</StatusPill>;
}
