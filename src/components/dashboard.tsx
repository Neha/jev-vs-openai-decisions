"use client";

import { useMemo, useState, type ReactNode } from "react";
import { BENCHMARK_CASES } from "@/data/benchmark";
import { formatAnswer, leaderLabel } from "@/lib/display";
import { formatMs, formatUsd } from "@/lib/format";
import { leaderColor, pickLeaders, summarize } from "@/lib/metrics";
import type {
  CanonicalCase,
  CanonicalQuestion,
  GoldLabel,
  ProviderSummary,
  ScoredProviderResult,
} from "@/lib/types";
import { apiKeyHeaders } from "@/lib/client-keys";
import { CaseDrawer } from "./case-drawer";
import { PageShell } from "./page-shell";
import { Playground } from "./playground";
import { ProviderMark } from "./provider-mark";
import { Scoreboard } from "./scoreboard";

type Configured = { jev: boolean; laya: boolean; openai: boolean };

type BenchRow = {
  testCase: CanonicalCase;
  jev?: ScoredProviderResult;
  laya?: ScoredProviderResult;
  openai?: ScoredProviderResult;
};

type DrawerState = {
  title: string;
  input: string;
  questions: readonly CanonicalQuestion[];
  gold: GoldLabel[];
  jev?: ScoredProviderResult;
  laya?: ScoredProviderResult;
  openai?: ScoredProviderResult;
};

export function Dashboard() {
  const [rows, setRows] = useState<BenchRow[]>(() =>
    BENCHMARK_CASES.map((testCase) => ({ testCase })),
  );
  const [benchRunning, setBenchRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [summaries, setSummaries] = useState<{
    jev?: ProviderSummary;
    laya?: ProviderSummary;
    openai?: ProviderSummary;
  }>({});
  const [drawer, setDrawer] = useState<DrawerState | null>(null);

  const liveSummaries = useMemo(() => {
    if (summaries.jev && summaries.laya && summaries.openai) {
      return summaries;
    }
    const jev = rows.map((row) => row.jev).filter((value): value is ScoredProviderResult => Boolean(value));
    const laya = rows.map((row) => row.laya).filter((value): value is ScoredProviderResult => Boolean(value));
    const openai = rows
      .map((row) => row.openai)
      .filter((value): value is ScoredProviderResult => Boolean(value));
    return {
      jev: jev.length ? summarize(jev, "jev") : summaries.jev,
      laya: laya.length ? summarize(laya, "laya") : summaries.laya,
      openai: openai.length ? summarize(openai, "openai") : summaries.openai,
    };
  }, [rows, summaries]);

  async function runBenchmark() {
    setBenchRunning(true);
    setCompleted(0);
    setRows(BENCHMARK_CASES.map((testCase) => ({ testCase })));
    try {
      const response = await fetch("/api/benchmark", {
        method: "POST",
        headers: apiKeyHeaders(),
      });
      if (!response.body) {
        throw new Error("No benchmark stream");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.replace(/^data:\s*/, "").trim();
          if (!line) {
            continue;
          }
          const event = JSON.parse(line) as {
            type: string;
            configured?: Configured;
            index?: number;
            caseId?: string;
            title?: string;
            input?: string;
            questions?: CanonicalQuestion[];
            gold?: GoldLabel[];
            jev?: ScoredProviderResult;
            laya?: ScoredProviderResult;
            openai?: ScoredProviderResult;
            summaries?: { jev: ProviderSummary; laya: ProviderSummary; openai: ProviderSummary };
          };
          if (event.type === "case" && event.caseId && event.jev && event.laya && event.openai) {
            setRows((current) =>
              current.map((row) =>
                row.testCase.id === event.caseId
                  ? { ...row, jev: event.jev, laya: event.laya, openai: event.openai }
                  : row,
              ),
            );
            setCompleted((value) => value + 1);
            if (event.summaries) {
              setSummaries(event.summaries);
            }
          }
          if (event.type === "done" && event.summaries) {
            setSummaries(event.summaries);
          }
        }
      }
    } finally {
      setBenchRunning(false);
    }
  }

  return (
    <PageShell>
      <header className="max-w-3xl">
        <h1 className="text-[52px] leading-[1.05] font-semibold tracking-tight sm:text-[64px]">
          Three models.
          <br />
          One ticket.
        </h1>
        <p className="mt-6 text-[21px] leading-8 text-[var(--muted)]">
          <DocLink href="https://docs.typesafe.ai/api">Jev</DocLink> and{" "}
          <DocLink href="https://laya.studio/docs">Laya</DocLink> share System One
          and read text.{" "}
          <DocLink href="https://developers.openai.com/api/docs/guides/decisions">
            OpenAI Decisions
          </DocLink>{" "}
          can also read a photo. Score them on the same 24 support cases — photos
          never enter the board.
        </p>
      </header>

      <Playground />

      <section className="rounded-[32px] bg-[var(--panel)] p-8 sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[15px] font-medium text-[var(--muted)]">Step 2 · scored</p>
            <h2 className="mt-2 text-[34px] leading-none font-semibold tracking-tight">Score 24 cases</h2>
            <p className="mt-3 max-w-xl text-[19px] leading-7 text-[var(--muted)]">
              {completed}/{BENCHMARK_CASES.length} done. Text only, with gold labels.
              Click a row for the full ticket.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void runBenchmark()}
            disabled={benchRunning}
            className="rounded-full bg-[var(--btn)] px-8 py-3.5 text-[17px] font-semibold text-[var(--on-btn)] disabled:opacity-40"
          >
            {benchRunning ? "Scoring…" : "Run all 24"}
          </button>
        </div>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="sticky left-0 bg-[var(--panel)] pb-4 pr-6 text-[15px] font-medium text-[var(--muted)]">
                  Case
                </th>
                <th className="pb-4 text-[15px] font-medium text-[var(--muted)]">Gold</th>
                <th className="pb-4 pr-4">
                  <ProviderMark id="jev" size="sm" />
                </th>
                <th className="pb-4 pr-4">
                  <ProviderMark id="laya" size="sm" />
                </th>
                <th className="pb-4 pr-4">
                  <ProviderMark id="openai" size="sm" />
                </th>
                <th className="pb-4 text-[15px] font-medium text-[var(--muted)]">Lead</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const leader = pickLeaders([row.jev, row.laya, row.openai]);
                const open = () =>
                  setDrawer({
                    title: row.testCase.title,
                    input: row.testCase.input,
                    questions: row.testCase.questions,
                    gold: row.testCase.gold,
                    jev: row.jev,
                    laya: row.laya,
                    openai: row.openai,
                  });
                return (
                  <tr
                    key={row.testCase.id}
                    role="button"
                    tabIndex={0}
                    className="group cursor-pointer border-b border-[var(--line)] last:border-0 hover:bg-[var(--bg)]"
                    onClick={open}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        open();
                      }
                    }}
                  >
                    <td className="sticky left-0 bg-[var(--panel)] py-5 pr-6 text-[18px] font-medium tracking-tight group-hover:bg-[var(--bg)]">
                      {row.testCase.title}
                    </td>
                    <td className="tabular py-5 pr-6 text-[16px] text-[var(--muted)]">
                      {row.testCase.gold
                        .map((label) =>
                          label.choice ??
                          (label.boolean === undefined ? label.scoreLevel : label.boolean ? "yes" : "no"),
                        )
                        .join(" · ")}
                    </td>
                    <td className="tabular py-5 pr-4 text-[16px]">
                      <ResultCell result={row.jev} />
                    </td>
                    <td className="tabular py-5 pr-4 text-[16px]">
                      <ResultCell result={row.laya} />
                    </td>
                    <td className="tabular py-5 pr-4 text-[16px]">
                      <ResultCell result={row.openai} />
                    </td>
                    <td className="py-5 text-[16px] font-medium" style={{ color: leaderColor(leader.ids) }}>
                      {leaderLabel(leader)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Scoreboard jev={liveSummaries.jev} laya={liveSummaries.laya} openai={liveSummaries.openai} />

      {drawer ? <CaseDrawer {...drawer} onClose={() => setDrawer(null)} /> : null}
    </PageShell>
  );
}

function DocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-[var(--text)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--text)]"
    >
      {children}
    </a>
  );
}

function ResultCell({ result }: { result?: ScoredProviderResult }) {
  if (!result) {
    return <span className="text-[var(--muted)]">—</span>;
  }
  if (result.unsupported) {
    return <span className="text-[var(--muted)]">N/A</span>;
  }
  if (!result.ok) {
    return <span className="text-[var(--bad)]">{result.configured ? "error" : "no key"}</span>;
  }
  return (
    <span>
      {result.answers.map(formatAnswer).join(" · ")}
      <span className="mt-1 block text-[13px] text-[var(--muted)]">
        {formatMs(result.latencyMs)} · {formatUsd(result.costUsd)}
      </span>
    </span>
  );
}
