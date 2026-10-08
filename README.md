# Jev vs OpenAI Decisions

Next.js dashboard that live-compares **TypeSafe Jev** and **OpenAI Decisions** on the same labeled cases: price, correctness, latency, tokens, schema validity, and refusals.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Add keys in **Settings**, or put them in `.env.local`:

```
TYPESAFE_API_KEY=
OPENAI_API_KEY=
```

Settings keys stay in the browser and are sent only for each run. Env keys are a server-side fallback. A Settings key overrides env for that provider. **Never commit `.env.local` or real keys.**

## What it measures

- **Price** from billed input tokens × published rates (Jev `$0.042 / 1M`, OpenAI Decisions `$0.10 / 1M`).
- **Correctness** against gold labels: choice exact match, boolean at 0.5 plus Brier, score rounded to nearest level.
- **Latency** measured in this app, plus tokens, schema-valid %, errors, and refusals.

The benchmark is text-only so both APIs can answer every case. OpenAI image input is noted in the UI, not scored.

## Scripts

```bash
npm test
npm run typecheck
npm run build
```
