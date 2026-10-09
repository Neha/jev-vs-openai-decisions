# Jev vs Laya vs OpenAI Decisions

Live comparison of [TypeSafe Jev](https://docs.typesafe.ai/api), [Laya Studio](https://api.laya.studio), and [OpenAI Decisions](https://developers.openai.com/api/docs/guides/decisions) on the same labeled cases.

The dashboard scores **price**, **correctness**, **latency**, tokens, schema validity, and refusals so you can see all three APIs answer the same ticket side by side.

## Screens

- **Playground** — paste a message, optionally attach an image, pick a question template, then run. Text runs all three APIs. An image runs OpenAI only; Jev and Laya show as unsupported.
- **Vision lane** — three sample image tickets you can load into the playground. They are not scored.
- **Labeled benchmark** — 24 text-only support tickets (36 scored questions). Click **Run all 24** to stream results into the scoreboard and table. Click a row for probabilities and raw JSON.
- **Settings** — paste API keys. They stay in this browser and are sent only for each run.

The benchmark is text-only so all three APIs can answer every case. OpenAI can also take images; Jev and Laya cannot. Image tickets never feed Price, Correctness, or Latency.

Jev and Laya share the System One protocol, so that column pair is a same-wire comparison. OpenAI uses a different request shape and is the only vision provider.

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
LAYA_API_KEY=
OPENAI_API_KEY=
```

A Settings key overrides env for that provider. **Never commit `.env.local` or real keys.**

## What it measures

| Metric | How it is computed |
| --- | --- |
| Price | Billed input tokens × published rates (Jev `$0.042 / 1M`, Laya `$0.0357 / 1M`, OpenAI Decisions `$0.10 / 1M`). Output is free on these APIs. |
| Correctness | Choice exact match; boolean at 0.5 plus Brier; score rounded to the nearest gold level. |
| Latency | Round-trip time measured in this app (mean and p95). |
| Other | Mean tokens, schema-valid %, errors, refusals. |

Do not compare raw confidence values across providers. The table ranks by accuracy and allows ties.

Models: Jev `jev-latest` (`POST /v1/systemone`), Laya Studio (`POST /v1/systemone`, model omitted), OpenAI `gpt-6-luna` (`POST /v1/decisions`).

## Scripts

```bash
npm test
npm run typecheck
npm run build
```

## Author

Neha Sharma · [nehasharma.dev](https://nehasharma.dev) · [GitHub](https://github.com/Neha) · [LinkedIn](https://www.linkedin.com/in/nehha/) · [X](https://x.com/hellonehha)

© 2026–2027 Neha Sharma. Licensed under [MIT](LICENSE).
