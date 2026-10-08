# Jev vs OpenAI Decisions — spec

Live comparison dashboard for TypeSafe Jev and OpenAI Decisions. Keys come from the Settings page or `.env.local`. Both APIs run the same labeled text cases.

## Requirements

**Requirement 1: Live playground**

*User story:* As a presenter, I want to paste one case, run both APIs, and see answers side by side, so the video can show a single decision in real time.

Acceptance criteria:

1. WHEN the user submits a case, THE app SHALL call both APIs in parallel with equivalent questions.
2. THE UI SHALL show each provider’s answer, latency, input tokens, and estimated USD cost.
3. IF one provider fails, THEN THE app SHALL still show the other result and a clear error for the failed side.

**Requirement 2: Labeled benchmark**

*User story:* As a presenter, I want a built-in labeled set, so correctness is measured rather than guessed.

Acceptance criteria:

1. THE app SHALL ship about 24 text cases covering boolean, choice, and score questions, including some multi-question cases.
2. WHEN a run finishes, THE app SHALL score each answer against gold labels.
3. THE benchmark SHALL be text-only so both APIs can answer every case.

**Requirement 3: Metrics board**

*User story:* As a presenter, I want large, filmable numbers for price, correctness, and other metrics.

Acceptance criteria:

1. THE board SHALL show, per provider: total USD, accuracy, mean latency, p95 latency, mean tokens, schema-valid %, and error/refusal count.
2. THE board SHALL update as cases complete, not only at the end.

**Requirement 4: Secrets**

*User story:* As a developer, I want API keys to stay out of git, so the repo can be public.

Acceptance criteria:

1. THE app SHALL accept keys from the Settings page (browser storage, sent per request) or from `TYPESAFE_API_KEY` / `OPENAI_API_KEY` in `.env.local`.
2. IF a Settings key is present, THEN THE app SHALL use it instead of env for that provider.
3. IF a key is missing, THEN THE app SHALL show which provider is unconfigured instead of calling it.
4. THE repository SHALL NOT contain real keys.

## Design

- Canonical case shape: shared `input` + `questions` (`boolean` | `choice` | `score`) + gold labels.
- Jev adapter: `POST https://api.typesafe.ai/v1/systemone` with a questions map (`noul` / `choice` / `score`).
- OpenAI adapter: `POST https://api.openai.com/v1/decisions` with a questions array (`predicate` / `choice` / `score`).
- Cost: Jev `$0.042 / 1M` input tokens; OpenAI Decisions `$0.10 / 1M` input tokens.
- Correctness: choice exact match; boolean at 0.5 plus Brier; score rounded to nearest level plus absolute error; refusals are invalid.
- UI: dark scoreboard, playground, streaming benchmark table, case drawer.
- Traceability: R1 → playground + `/api/run`; R2 → dataset + scoring; R3 → scoreboard; R4 → server routes + status.

## Tasks

1. Scaffold app, env example, this spec. (R4)
2. Canonical types, adapters, metrics. (R1, R3)
3. `/api/run` and `/api/benchmark`. (R1, R2)
4. Labeled cases. (R2)
5. Camera-ready UI. (R1, R3, R4)
6. Unit tests and browser verification. (review)
