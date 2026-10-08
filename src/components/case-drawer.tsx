import { formatAnswer } from "@/lib/display";
import { formatMs, formatUsd } from "@/lib/format";
import type {
  CanonicalQuestion,
  GoldLabel,
  ScoredProviderResult,
} from "@/lib/types";

export function CaseDrawer({
  title,
  input,
  questions,
  gold,
  jev,
  openai,
  onClose,
}: {
  title: string;
  input: string;
  questions: readonly CanonicalQuestion[];
  gold: GoldLabel[];
  jev?: ScoredProviderResult;
  openai?: ScoredProviderResult;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <button className="absolute inset-0" aria-label="Close case" onClick={onClose} />
      <aside className="relative max-h-[88vh] w-full max-w-5xl overflow-auto rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-[var(--muted)] uppercase">Case</p>
            <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-sm text-[var(--muted)] hover:text-white"
          >
            Close
          </button>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">{input}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ProviderDetail label="Jev" accent="var(--jev)" result={jev} questions={questions} gold={gold} />
          <ProviderDetail
            label="OpenAI"
            accent="var(--openai)"
            result={openai}
            questions={questions}
            gold={gold}
          />
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
  label,
  accent,
  result,
  questions,
  gold,
}: {
  label: string;
  accent: string;
  result?: ScoredProviderResult;
  questions: readonly CanonicalQuestion[];
  gold: GoldLabel[];
}) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold" style={{ color: accent }}>
          {label}
        </h3>
        {result ? (
          <p className="tabular text-xs text-[var(--muted)]">
            {formatMs(result.latencyMs)} · {result.inputTokens} tok · {formatUsd(result.costUsd)}
          </p>
        ) : null}
      </div>
      {result?.error ? <p className="mt-3 text-sm text-[var(--bad)]">{result.error}</p> : null}
      <ul className="mt-4 space-y-4">
        {questions.map((question) => {
          const answer = result?.answers.find((item) => item.questionId === question.id);
          return (
            <li key={question.id}>
              <p className="text-xs tracking-wide text-[var(--muted)] uppercase">
                {question.id} · gold {goldText(question, gold)}
              </p>
              <p className="tabular mt-1 text-xl font-semibold">
                {formatAnswer(answer)}
                {answer?.correct === true ? (
                  <span className="ml-2 text-sm text-[var(--good)]">correct</span>
                ) : null}
                {answer?.correct === false ? (
                  <span className="ml-2 text-sm text-[var(--bad)]">wrong</span>
                ) : null}
              </p>
              {answer?.probabilities ? (
                <ul className="mt-2 space-y-1">
                  {Object.entries(answer.probabilities).map(([key, value]) => (
                    <li key={key} className="flex items-center gap-2 text-xs">
                      <span className="w-24 truncate text-[var(--muted)]">{key}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded bg-black/40">
                        <span
                          className="block h-full"
                          style={{
                            width: `${Math.round(value * 100)}%`,
                            background: accent,
                          }}
                        />
                      </span>
                      <span className="tabular w-10 text-right">{Math.round(value * 100)}%</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
      {result?.raw ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-[var(--muted)]">Raw JSON</summary>
          <pre className="mt-2 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] leading-5 text-[var(--muted)]">
            {JSON.stringify(result.raw, null, 2)}
          </pre>
        </details>
      ) : null}
    </section>
  );
}
