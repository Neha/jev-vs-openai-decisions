import { formatMs, formatNumber, formatPct, formatUsd } from "@/lib/format";
import type { ProviderSummary } from "@/lib/types";
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

export function Scoreboard({
  jev,
  laya,
  openai,
}: {
  jev?: ProviderSummary;
  laya?: ProviderSummary;
  openai?: ProviderSummary;
}) {
  const j = jev ?? emptySummary("jev");
  const l = laya ?? emptySummary("laya");
  const o = openai ?? emptySummary("openai");
  const ready = j.runCount > 0 || l.runCount > 0 || o.runCount > 0;

  const hero: Array<{ label: string; hint: string; jev: string; laya: string; openai: string }> = [
    {
      label: "Reads",
      hint: "Not a score",
      jev: "Text",
      laya: "Text",
      openai: "Text + photo",
    },
    {
      label: "Price",
      hint: "Input tokens",
      jev: dash(j, formatUsd(j.totalUsd)),
      laya: dash(l, formatUsd(l.totalUsd)),
      openai: dash(o, formatUsd(o.totalUsd)),
    },
    {
      label: "Correct",
      hint: ready
        ? `${j.correctCount}/${j.scoredCount} · ${l.correctCount}/${l.scoredCount} · ${o.correctCount}/${o.scoredCount}`
        : "Gold labels",
      jev: dash(j, formatPct(j.accuracy)),
      laya: dash(l, formatPct(l.accuracy)),
      openai: dash(o, formatPct(o.accuracy)),
    },
    {
      label: "Latency",
      hint: "Mean round trip",
      jev: dash(j, formatMs(j.meanLatencyMs)),
      laya: dash(l, formatMs(l.meanLatencyMs)),
      openai: dash(o, formatMs(o.meanLatencyMs)),
    },
  ];

  const detail: Array<{ label: string; jev: string; laya: string; openai: string }> = [
    {
      label: "p95",
      jev: dash(j, formatMs(j.p95LatencyMs)),
      laya: dash(l, formatMs(l.p95LatencyMs)),
      openai: dash(o, formatMs(o.p95LatencyMs)),
    },
    {
      label: "Tokens",
      jev: dash(j, formatNumber(j.meanTokens, 0)),
      laya: dash(l, formatNumber(l.meanTokens, 0)),
      openai: dash(o, formatNumber(o.meanTokens, 0)),
    },
    {
      label: "Schema",
      jev: dash(j, formatPct(j.schemaValidPct)),
      laya: dash(l, formatPct(l.schemaValidPct)),
      openai: dash(o, formatPct(o.schemaValidPct)),
    },
    {
      label: "Misses",
      jev: dash(j, `${j.errorCount} / ${j.refusalCount}`),
      laya: dash(l, `${l.errorCount} / ${l.refusalCount}`),
      openai: dash(o, `${o.errorCount} / ${o.refusalCount}`),
    },
    {
      label: "Brier",
      jev: j.meanBrier === null ? "—" : formatNumber(j.meanBrier, 3),
      laya: l.meanBrier === null ? "—" : formatNumber(l.meanBrier, 3),
      openai: o.meanBrier === null ? "—" : formatNumber(o.meanBrier, 3),
    },
  ];

  return (
    <section className="overflow-hidden rounded-[32px] bg-[var(--panel)]">
      <div className="px-8 pt-10 pb-6 sm:px-10">
        <h2 className="text-[34px] leading-none font-semibold tracking-tight">Scoreboard</h2>
        <p className="mt-3 max-w-2xl text-[19px] leading-7 text-[var(--muted)]">
          {ready
            ? "Filled by the labeled run. Photos never count here."
            : "Empty until you score the 24 labeled tickets. Photos never count here."}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-t border-[var(--line)]">
              <th className="w-[22%] px-8 py-5 text-[15px] font-medium text-[var(--muted)] sm:px-10">
                Metric
              </th>
              <th className="px-4 py-5">
                <ProviderMark id="jev" />
              </th>
              <th className="px-4 py-5">
                <ProviderMark id="laya" />
              </th>
              <th className="px-4 py-5 pr-8 sm:pr-10">
                <ProviderMark id="openai" />
              </th>
            </tr>
          </thead>
          <tbody>
            {hero.map((row) => (
              <tr key={row.label} className="border-t border-[var(--line)]">
                <th className="px-8 py-6 align-top sm:px-10">
                  <p className="text-[19px] font-semibold">{row.label}</p>
                  <p className="mt-1 text-[15px] leading-5 font-normal text-[var(--muted)]">{row.hint}</p>
                </th>
                <td className="tabular px-4 py-6 text-[32px] leading-none font-semibold tracking-tight">
                  {row.jev}
                </td>
                <td className="tabular px-4 py-6 text-[32px] leading-none font-semibold tracking-tight">
                  {row.laya}
                </td>
                <td className="tabular px-4 py-6 pr-8 text-[32px] leading-none font-semibold tracking-tight sm:pr-10">
                  {row.openai}
                </td>
              </tr>
            ))}
            {detail.map((row) => (
              <tr key={row.label} className="border-t border-[var(--line)]">
                <th className="px-8 py-4 text-[16px] font-medium text-[var(--muted)] sm:px-10">{row.label}</th>
                <td className="tabular px-4 py-4 text-[18px] font-medium">{row.jev}</td>
                <td className="tabular px-4 py-4 text-[18px] font-medium">{row.laya}</td>
                <td className="tabular px-4 py-4 pr-8 text-[18px] font-medium sm:pr-10">{row.openai}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
