import { formatAnswer } from "@/lib/display";
import { formatMs, formatUsd } from "@/lib/format";
import type { CanonicalQuestion, ProviderResult } from "@/lib/types";

export function ProviderPanel({
  accent,
  title,
  model,
  result,
  questions,
}: {
  accent: "jev" | "openai";
  title: string;
  model: string;
  result?: ProviderResult;
  questions: readonly CanonicalQuestion[];
}) {
  const color = accent === "jev" ? "var(--jev)" : "var(--openai)";
  const wash = accent === "jev" ? "var(--jev-dim)" : "var(--openai-dim)";

  return (
    <article
      className="min-h-56 rounded-2xl border border-[var(--line)] p-5"
      style={{ background: wash }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold" style={{ color }}>
          {title}
        </h3>
        <p className="tabular text-xs text-[var(--muted)]">{result?.model ?? model}</p>
      </div>
      {!result ? (
        <p className="mt-8 text-sm text-[var(--muted)]">Run to fill this panel.</p>
      ) : !result.configured ? (
        <p className="mt-8 text-sm text-[var(--bad)]">{result.error}</p>
      ) : !result.ok ? (
        <p className="mt-8 text-sm text-[var(--bad)]">{result.error}</p>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-[var(--muted)]">Latency</dt>
              <dd className="tabular mt-1">{formatMs(result.latencyMs)}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Tokens</dt>
              <dd className="tabular mt-1">{result.inputTokens}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Cost</dt>
              <dd className="tabular mt-1">{formatUsd(result.costUsd)}</dd>
            </div>
          </dl>
          <ul className="mt-5 space-y-3">
            {questions.map((question) => {
              const answer = result.answers.find((item) => item.questionId === question.id);
              return (
                <li key={question.id} className="border-t border-[var(--line)] pt-3">
                  <p className="text-xs tracking-wide text-[var(--muted)] uppercase">
                    {question.id}
                  </p>
                  <p className="tabular mt-1 text-2xl font-semibold" style={{ color }}>
                    {formatAnswer(answer)}
                  </p>
                  {answer?.confidence !== undefined ? (
                    <p className="tabular text-xs text-[var(--muted)]">
                      confidence {Math.round(answer.confidence * 100)}%
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </article>
  );
}
