# Jev vs OpenAI Decisions

Live comparison of [TypeSafe Jev](https://docs.typesafe.ai/api) and [OpenAI Decisions](https://developers.openai.com/api/docs/guides/decisions) on the same labeled cases.

The dashboard scores **price**, **correctness**, **latency**, tokens, schema validity, and refusals so you can see both APIs answer the same ticket side by side.

## Screens

- **Playground** — paste one message, pick a question template (route, urgency, severity, or all three), click **Run both**. The Jev and OpenAI panels fill with answers, latency, tokens, and estimated cost.
- **Labeled benchmark** — 24 text-only support tickets (36 scored questions). Click **Run all 24** to stream results into the scoreboard and table. Click a row for probabilities and raw JSON.
- **Settings** — paste API keys. They stay in this browser and are sent only for each run.

The benchmark is text-only so both APIs can answer every case. OpenAI can also take images; Jev cannot. Image support is noted in the UI, not scored.

## Setup

```bash
git clone https://github.com/Neha/jev-vs-openai-decisions.git
cd jev-vs-openai-decisions
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Add keys in **Settings**, or put them in `.env.local`:

```
TYPESAFE_API_KEY=
OPENAI_API_KEY=
```

A Settings key overrides env for that provider. **Never commit `.env.local` or real keys.**

## What it measures

| Metric | How it is computed |
| --- | --- |
| Price | Billed input tokens × published rates (Jev `$0.042 / 1M`, OpenAI Decisions `$0.10 / 1M`). Output is free on both. |
| Correctness | Choice exact match; boolean at 0.5 plus Brier; score rounded to the nearest gold level. |
| Latency | Round-trip time measured in this app (mean and p95). |
| Other | Mean tokens, schema-valid %, errors, refusals. |

Models: Jev `jev-latest` (`POST /v1/systemone`) and OpenAI `gpt-6-luna` (`POST /v1/decisions`).

## Scripts

```bash
npm test
npm run typecheck
npm run build
```

## Author

Neha Sharma · [nehasharma.dev](https://nehasharma.dev) · [GitHub](https://github.com/Neha) · [LinkedIn](https://www.linkedin.com/in/nehha/) · [X](https://x.com/hellonehha)

© 2026–2027 Neha Sharma. Licensed under [MIT](LICENSE).
