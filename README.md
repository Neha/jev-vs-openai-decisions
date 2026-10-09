# Jev vs OpenAI Decisions

Live comparison of [TypeSafe Jev](https://docs.typesafe.ai/api) and [OpenAI Decisions](https://developers.openai.com/api/docs/guides/decisions) on the same support ticket.

The board scores **price**, **correctness**, and **latency** so you can see both APIs answer the same case side by side.

![The comparison board](docs/board.png)

## How it works

1. **Try one ticket** — paste a message, optionally attach an image, pick a question template, then run. Text runs both APIs. An image runs OpenAI only; Jev sits out. This path is not scored.
2. **Score 24 cases** — labeled text-only tickets (36 scored questions). Click **Run all 24** to stream results. Click a row for probabilities and raw JSON.
3. **Scoreboard** — fills from the labeled run and names a winner on correctness. Photos never count here.

Jev uses System One (text only). OpenAI uses a different request shape and is the only vision provider. Add keys on the **Keys** page; they stay in this browser and are sent only for each run.

## Setup

```bash
git clone https://github.com/Neha/jev-vs-openai-decisions.git
cd jev-vs-openai-decisions
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Add keys on **Keys**, or put them in `.env.local`:

```
TYPESAFE_API_KEY=
OPENAI_API_KEY=
```

A Keys-page value overrides env for that provider. **Never commit `.env.local` or real keys.**

## What it measures

| Metric | How it is computed |
| --- | --- |
| Price | Billed input tokens × published rates (Jev `$0.042 / 1M`, OpenAI Decisions `$0.10 / 1M`). Output is free on these APIs. |
| Correctness | Choice exact match; boolean at 0.5 plus Brier; score rounded to the nearest gold level. |
| Latency | Round-trip time measured in this app (mean and p95). |
| Other | Mean tokens, schema-valid %, errors, refusals. |

Do not compare raw confidence values across providers. The table ranks by accuracy and allows ties.

Models: Jev `jev-latest` (`POST /v1/systemone`), OpenAI `gpt-6-luna` (`POST /v1/decisions`).

## Scripts

```bash
npm test
npm run typecheck
npm run build
```

## Author

Neha Sharma · [nehasharma.dev](https://nehasharma.dev) · [GitHub](https://github.com/Neha) · [LinkedIn](https://www.linkedin.com/in/nehha/) · [X](https://x.com/hellonehha)

© 2026–2027 Neha Sharma. Licensed under [MIT](LICENSE).
