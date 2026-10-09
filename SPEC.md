# Jev vs OpenAI Decisions — spec

Live comparison dashboard for TypeSafe Jev and OpenAI Decisions. Keys come from the Settings page or `.env.local`. Both APIs run the same labeled text cases.

## Requirements

**Requirement 1: Live playground**

*User story:* As a presenter, I want to paste one case, run the APIs, and see answers side by side, so the video can show a single decision in real time.

Acceptance criteria:

1. WHEN the user submits a text case, THE app SHALL call Jev and OpenAI in parallel with equivalent questions.
2. THE UI SHALL show each provider’s answer, latency, input tokens, and estimated USD cost.
3. IF one provider fails, THEN THE app SHALL still show the other results and a clear error for the failed side.

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
3. THE case table SHALL rank providers by accuracy and allow ties instead of a binary winner.
4. THE scoreboard SHALL name an overall winner from labeled correctness and SHALL say Tie when accuracy is equal.

**Requirement 4: Secrets**

*User story:* As a developer, I want API keys to stay out of git, so the repo can be public.

Acceptance criteria:

1. THE app SHALL accept keys from the Settings page (browser storage, sent per request) or from `TYPESAFE_API_KEY` / `OPENAI_API_KEY` in `.env.local`.
2. IF a Settings key is present, THEN THE app SHALL use it instead of env for that provider.
3. IF a key is missing, THEN THE app SHALL show which provider is unconfigured instead of calling it.
4. THE repository SHALL NOT contain real keys.

**Requirement 5: Modality**

*User story:* As a presenter, I want the UI to show that OpenAI can take images and Jev cannot, without mixing that into correctness.

Acceptance criteria:

1. THE scoreboard SHALL show input capability separately from scored metrics (Jev text, OpenAI text + image).
2. WHEN the playground has an image, THE app SHALL run OpenAI and mark Jev as unsupported, not as a scored miss.
3. THE labeled benchmark SHALL remain text-only.
4. THE vision samples SHALL not update Price, Correctness, or Latency.

## Design

- Canonical case shape: shared `input` + `questions` (`boolean` | `choice` | `score`) + gold labels.
- Jev adapter: `POST https://api.typesafe.ai/v1/systemone` with a questions map (`noul` / `choice` / `score`) and `jev-latest`.
- OpenAI adapter: `POST https://api.openai.com/v1/decisions` with a questions array (`predicate` / `choice` / `score`).
- Cost: Jev `$0.042 / 1M`; OpenAI Decisions `$0.10 / 1M` input tokens.
- Correctness: choice exact match; boolean at 0.5 plus Brier; score rounded to nearest level plus absolute error; refusals are invalid.
- UI: light scoreboard with an Inputs capability strip, live ticket playground (optional image), vision samples, streaming benchmark table, case drawer.
- OpenAI image input: inline base64 data URL in a user message (`input_text` + `input_image`). Jev is skipped when an image is present.
- Traceability: R1 → playground + `/api/run`; R2 → dataset + scoring; R3 → scoreboard; R4 → server routes + status; R5 → Inputs strip + image skip + vision lane.

## Tasks

1. Scaffold app, env example, this spec. (R4)
2. Canonical types, adapters, metrics. (R1, R3)
3. `/api/run` and `/api/benchmark`. (R1, R2)
4. Labeled cases. (R2)
5. Camera-ready UI. (R1, R3, R4)
6. Unit tests and browser verification. (review)
7. Modality UI: Inputs strip, playground image attach, vision lane. (R5)
