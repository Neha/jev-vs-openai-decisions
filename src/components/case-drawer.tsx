import { formatAnswer } from "@/lib/display";
import { formatMs, formatUsd } from "@/lib/format";
import type {
  CanonicalQuestion,
  GoldLabel,
  ProviderId,
  ScoredProviderResult,
} from "@/lib/types";
import { ProviderMark } from "./provider-mark";

export function CaseDrawer({
  title,
  input,
  questions,
  gold,
  jev,
  laya,
  openai,
  onClose,
}: {
  title: string;
  input: string;
  questions: readonly CanonicalQuestion[];
  gold: GoldLabel[];
  jev?: ScoredProviderResult;
  laya?: ScoredProviderResult;
  openai?: ScoredProviderResult;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button className="absolute inset-0" aria-label="Close case" onClick={onClose} />
      <aside className="relative max-h-[90vh] w-full max-w-6xl overflow-auto rounded-[32px] bg-[var(--panel)] p-8 shadow-2xl sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[15px] font-medium text-[var(--muted)]">Case</p>
            <h2 className="mt-2 text-[34px] leading-none font-semibold tracking-tight">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[var(--bg)] px-5 py-2.5 text-[17px] text-[var(--muted)] hover:text-[var(--text)]"
          >
            Close
          </button>
        </div>
        <p className="mt-5 max-w-3xl text-[19px] leading-8 text-[var(--muted)]">{input}</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <ProviderDetail id="jev" result={jev} questions={questions} gold={gold} />
          <ProviderDetail id="laya" result={laya} questions={questions} gold={gold} />
          <ProviderDetail id="openai" result={openai} questions={questions} gold={gold} />
        </div>
      </aside>
    </div>
  );
}

function goldText(question: CanonicalQuestion, gold: GoldLabel[]): string {
  const label = gold.find((item) => item.questionId === question.id);
  if (!label) {
    return "—";
  }
  if (question.type === "boolean") {
    return label.boolean ? "yes" : "no";
  }
  if (question.type === "choice") {
    return label.choice ?? "—";
  }
  const level = question.levels?.[label.scoreLevel ?? -1];
  return level ? `${label.scoreLevel} ${level.label}` : String(label.scoreLevel);
}

function ProviderDetail({
  id,
  result,
  questions,
  gold,
}: {
  id: ProviderId;
  result?: ScoredProviderResult;
  questions: readonly CanonicalQuestion[];
  gold: GoldLabel[];
}) {
  return (
    <section className="rounded-[24px] bg-[var(--bg)] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <ProviderMark id={id} size="lg" />
        {result ? (
          <p className="tabular text-[15px] text-[var(--muted)]">
            {formatMs(result.latencyMs)} · {result.inputTokens} tok · {formatUsd(result.costUsd)}
          </p>
        ) : null}
      </div>
      {result?.error ? <p className="mt-4 text-[17px] text-[var(--bad)]">{result.error}</p> : null}
      {!result ? <p className="mt-5 text-[17px] text-[var(--muted)]">Not scored yet</p> : null}
      <ul className="mt-6 space-y-6">
        {questions.map((question) => {
          const answer = result?.answers.find((item) => item.questionId === question.id);
          return (
            <li key={question.id}>
              <p className="text-[15px] text-[var(--muted)]">
                {question.id} · gold {goldText(question, gold)}
              </p>
              <p className="tabular mt-1 text-[28px] leading-none font-semibold tracking-tight">
                {formatAnswer(answer)}
                {answer?.correct === true ? (
                  <span className="ml-2 text-[17px] font-medium text-[var(--good)]">correct</span>
                ) : null}
                {answer?.correct === false ? (
                  <span className="ml-2 text-[17px] font-medium text-[var(--bad)]">wrong</span>
                ) : null}
              </p>
              {answer?.probabilities ? (
                <ul className="mt-3 space-y-2">
                  {Object.entries(answer.probabilities).map(([key, value]) => (
                    <li key={key} className="flex items-center gap-3 text-[15px]">
                      <span className="w-24 truncate text-[var(--muted)]">{key}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
                        <span
                          className="block h-full rounded-full bg-[var(--text)]"
                          style={{ width: `${Math.round(value * 100)}%` }}
                        />
                      </span>
                      <span className="tabular w-12 text-right">{Math.round(value * 100)}%</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
      {result?.raw ? (
        <details className="mt-6">
          <summary className="cursor-pointer text-[15px] text-[var(--muted)]">Raw JSON</summary>
          <pre className="mt-3 overflow-auto rounded-2xl bg-white p-4 text-[13px] leading-5 text-[var(--muted)]">
            {JSON.stringify(result.raw, null, 2)}
          </pre>
        </details>
      ) : null}
    </section>
  );
}
