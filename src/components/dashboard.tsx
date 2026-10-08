"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BENCHMARK_CASES } from "@/data/benchmark";
import { formatAnswer, winnerLabel } from "@/lib/display";
import { formatMs, formatUsd } from "@/lib/format";
import { pickWinner, summarize } from "@/lib/metrics";
import { TEMPLATES, type TemplateId } from "@/lib/templates";
import type {
  CanonicalCase,
  CanonicalQuestion,
  GoldLabel,
  ProviderResult,
  ProviderSummary,
  ScoredProviderResult,
} from "@/lib/types";
import { apiKeyHeaders, storedConfigured } from "@/lib/client-keys";
import { CaseDrawer } from "./case-drawer";
import { ProviderPanel } from "./provider-panel";
import { Scoreboard } from "./scoreboard";
import { SiteNav } from "./site-nav";

type Configured = { jev: boolean; openai: boolean };

type BenchRow = {
  testCase: CanonicalCase;
  jev?: ScoredProviderResult;
  openai?: ScoredProviderResult;
};

type DrawerState = {
  title: string;
  input: string;
  questions: readonly CanonicalQuestion[];
  gold: GoldLabel[];
  jev?: ScoredProviderResult;
  openai?: ScoredProviderResult;
};

const SAMPLE =
  "I was charged twice for my order and nobody has replied for 3 days. I need this refunded before my card statement closes tomorrow.";

export function Dashboard() {
  const [configured, setConfigured] = useState<Configured>({ jev: false, openai: false });
  const [template, setTemplate] = useState<TemplateId>("combined");
  const [input, setInput] = useState(SAMPLE);
  const [playgroundRunning, setPlaygroundRunning] = useState(false);
  const [playground, setPlayground] = useState<{
    jev?: ProviderResult;
    openai?: ProviderResult;
  }>({});
  const [playgroundError, setPlaygroundError] = useState<string | null>(null);
  const [rows, setRows] = useState<BenchRow[]>(() =>
    BENCHMARK_CASES.map((testCase) => ({ testCase })),
  );
  const [benchRunning, setBenchRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [summaries, setSummaries] = useState<{
    jev?: ProviderSummary;
    openai?: ProviderSummary;
  }>({});
  const [drawer, setDrawer] = useState<DrawerState | null>(null);

  const questions = TEMPLATES[template].questions;
  const liveSummaries = useMemo(() => {
    if (summaries.jev && summaries.openai) {
      return summaries;
    }
    const jev = rows.map((row) => row.jev).filter((value): value is ScoredProviderResult => Boolean(value));
    const openai = rows
      .map((row) => row.openai)
      .filter((value): value is ScoredProviderResult => Boolean(value));
    return {
      jev: jev.length ? summarize(jev, "jev") : summaries.jev,
      openai: openai.length ? summarize(openai, "openai") : summaries.openai,
    };
  }, [rows, summaries]);

  useEffect(() => {
    const local = storedConfigured();
    void fetch("/api/status")
      .then((response) => response.json())
      .then((data: { env?: Configured }) => {
        const env = data.env ?? { jev: false, openai: false };
        setConfigured({
          jev: env.jev || local.jev,
          openai: env.openai || local.openai,
        });
      })
      .catch(() => setConfigured(local));
  }, []);

  async function runPlayground() {
    setPlaygroundRunning(true);
    setPlaygroundError(null);
    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: apiKeyHeaders(),
        body: JSON.stringify({ input, template }),
      });
      const data = (await response.json()) as {
        error?: string;
        jev?: ProviderResult;
        openai?: ProviderResult;
      };
      if (!response.ok) {
        setPlaygroundError(data.error ?? "Run failed");
        return;
      }
      setPlayground({ jev: data.jev, openai: data.openai });
    } catch (error) {
      setPlaygroundError(error instanceof Error ? error.message : "Run failed");
    } finally {
      setPlaygroundRunning(false);
    }
  }

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
            openai?: ScoredProviderResult;
            summaries?: { jev: ProviderSummary; openai: ProviderSummary };
          };
          if (event.type === "status" && event.configured) {
            setConfigured(event.configured);
          }
          if (event.type === "case" && event.caseId && event.jev && event.openai) {
            setRows((current) =>
              current.map((row) =>
                row.testCase.id === event.caseId
                  ? { ...row, jev: event.jev, openai: event.openai }
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
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8">
      <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Jev vs OpenAI Decisions
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Same labeled cases. Typed answers only. Price from billed input tokens,
            correctness against gold labels, latency measured in this app.
            Text-only so the matchup is fair — OpenAI can also take images; Jev cannot.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <SiteNav />
          <div className="flex gap-2">
            <KeyPill name="TypeSafe" ok={configured.jev} />
            <KeyPill name="OpenAI" ok={configured.openai} />
          </div>
        </div>
      </header>

      <Scoreboard jev={liveSummaries.jev} openai={liveSummaries.openai} />

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)]/85 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <label className="flex-1">
            <span className="text-[11px] tracking-[0.2em] text-[var(--muted)] uppercase">
              Playground
            </span>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm leading-6 outline-none focus:border-[var(--jev)]"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={template}
              onChange={(event) => setTemplate(event.target.value as TemplateId)}
              className="rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-3 text-sm"
            >
              {Object.values(TEMPLATES).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void runPlayground()}
              disabled={playgroundRunning || !input.trim()}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"
            >
              {playgroundRunning ? "Running…" : "Run both"}
            </button>
          </div>
        </div>
        {playgroundError ? (
          <p className="mt-3 text-sm text-[var(--bad)]">{playgroundError}</p>
        ) : null}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <ProviderPanel
            accent="jev"
            title="Jev"
            model="jev-latest"
            result={playground.jev}
            questions={questions}
          />
          <ProviderPanel
            accent="openai"
            title="OpenAI"
            model="gpt-6-luna"
            result={playground.openai}
            questions={questions}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)]/85 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Labeled benchmark</h2>
            <p className="text-sm text-[var(--muted)]">
              {completed}/{BENCHMARK_CASES.length} cases · 24 tickets, boolean / choice / score
            </p>
          </div>
          <button
            type="button"
            onClick={() => void runBenchmark()}
            disabled={benchRunning}
            className="rounded-xl border border-[var(--line)] bg-[var(--bg)] px-5 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {benchRunning ? "Scoring…" : "Run all 24"}
          </button>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
              <tr>
                <th className="pb-3 font-medium">Case</th>
                <th className="pb-3 font-medium">Gold</th>
                <th className="pb-3 font-medium text-[var(--jev)]">Jev</th>
                <th className="pb-3 font-medium text-[var(--openai)]">OpenAI</th>
                <th className="pb-3 font-medium">Winner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const winner = pickWinner(row.jev, row.openai);
                return (
                  <tr
                    key={row.testCase.id}
                    className="cursor-pointer border-t border-[var(--line)] hover:bg-white/5"
                    onClick={() =>
                      setDrawer({
                        title: row.testCase.title,
                        input: row.testCase.input,
                        questions: row.testCase.questions,
                        gold: row.testCase.gold,
                        jev: row.jev,
                        openai: row.openai,
                      })
                    }
                  >
                    <td className="py-3 pr-3">
                      <p className="font-medium">{row.testCase.title}</p>
                      <p className="max-w-xs truncate text-xs text-[var(--muted)]">
                        {row.testCase.input}
                      </p>
                    </td>
                    <td className="tabular py-3 pr-3 text-[var(--muted)]">
                      {row.testCase.gold
                        .map((label) => label.choice ?? (label.boolean === undefined ? label.scoreLevel : label.boolean ? "yes" : "no"))
                        .join(" · ")}
                    </td>
                    <td className="tabular py-3 pr-3">
                      <ResultCell result={row.jev} />
                    </td>
                    <td className="tabular py-3 pr-3">
                      <ResultCell result={row.openai} />
                    </td>
                    <td className="py-3">
                      <span
                        className={
                          winner === "jev"
                            ? "text-[var(--jev)]"
                            : winner === "openai"
                              ? "text-[var(--openai)]"
                              : "text-[var(--muted)]"
                        }
                      >
                        {winnerLabel(winner)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {drawer ? <CaseDrawer {...drawer} onClose={() => setDrawer(null)} /> : null}
    </main>
  );
}

function KeyPill({ name, ok }: { name: string; ok: boolean }) {
  return (
    <Link
      href="/settings"
      className="rounded-full border border-[var(--line)] bg-[var(--bg-2)] px-3 py-1 text-xs hover:border-white/20"
    >
      <span
        className="mr-2 inline-block h-2 w-2 rounded-full"
        style={{ background: ok ? "var(--good)" : "var(--bad)" }}
      />
      {name} {ok ? "key" : "missing"}
    </Link>
  );
}

function ResultCell({ result }: { result?: ScoredProviderResult }) {
  if (!result) {
    return <span className="text-[var(--muted)]">—</span>;
  }
  if (!result.ok) {
    return <span className="text-[var(--bad)]">{result.configured ? "error" : "no key"}</span>;
  }
  return (
    <span>
      {result.answers.map(formatAnswer).join(" · ")}
      <span className="ml-2 text-[11px] text-[var(--muted)]">
        {formatMs(result.latencyMs)} · {formatUsd(result.costUsd)}
      </span>
    </span>
  );
}
