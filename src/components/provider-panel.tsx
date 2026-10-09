import { formatAnswer } from "@/lib/display";
import { formatMs, formatUsd } from "@/lib/format";
import type { CanonicalQuestion, ProviderId, ProviderResult } from "@/lib/types";
import { ProviderMark } from "./provider-mark";

type ProviderPanelProps = {
  accent: ProviderId;
  model: string;
  result?: ProviderResult;
  questions: readonly CanonicalQuestion[];
  capability: string;
  skipReason?: string;
};

export function ProviderPanel({
  accent,
  model,
  result,
  questions,
  capability,
  skipReason,
}: ProviderPanelProps) {
  const skipped = Boolean(skipReason) && (!result || result.unsupported);

  return (
    <article className="min-h-64 rounded-[28px] bg-[var(--bg)] p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <ProviderMark id={accent} size="lg" />
          <p className="mt-2 text-[15px] text-[var(--muted)]">{capability}</p>
        </div>
        <p className="tabular pt-1 text-[15px] text-[var(--muted)]">{result?.model ?? model}</p>
      </div>
      {skipped ? (
        <p className="mt-10 text-[17px] leading-7 text-[var(--muted)]">{skipReason}</p>
      ) : !result ? (
        <p className="mt-10 text-[22px] tracking-tight text-[var(--muted)]">Waiting</p>
      ) : !result.configured || !result.ok ? (
        <p className="mt-10 text-[17px] leading-7 text-[var(--bad)]">{result.error}</p>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-3 gap-3 text-[15px]">
            <div>
              <dt className="text-[var(--muted)]">Time</dt>
              <dd className="tabular mt-1 text-[17px] font-medium">{formatMs(result.latencyMs)}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Tokens</dt>
              <dd className="tabular mt-1 text-[17px] font-medium">{result.inputTokens}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Cost</dt>
              <dd className="tabular mt-1 text-[17px] font-medium">{formatUsd(result.costUsd)}</dd>
            </div>
          </dl>
          <ul className="mt-6 space-y-5">
            {questions.map((question) => {
              const answer = result.answers.find((item) => item.questionId === question.id);
              return (
                <li key={question.id} className="border-t border-[var(--line)] pt-4">
                  <p className="text-[15px] text-[var(--muted)]">{question.id}</p>
                  <p className="tabular mt-1 text-[32px] leading-none font-semibold tracking-tight">
                    {formatAnswer(answer)}
                  </p>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </article>
  );
}
