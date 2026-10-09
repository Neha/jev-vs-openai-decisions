import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  leaderColor,
  pickLeaders,
  pickSummaryLeaders,
  percentile,
  scoreAnswer,
  scoreProviderResult,
  summarize,
} from "./metrics";
import { costUsd } from "./pricing";
import {
  DEPARTMENT_QUESTION,
  SEVERITY_QUESTION,
  URGENCY_QUESTION,
} from "./templates";
import type { CanonicalCase, ProviderResult, ProviderSummary } from "./types";

describe("costUsd", () => {
  it("uses published input rates and ignores empty usage", () => {
    assert.equal(costUsd("jev", 1_000_000), 0.042);
    assert.equal(costUsd("openai", 1_000_000), 0.1);
    assert.equal(costUsd("jev", 0), 0);
  });
});

describe("scoreAnswer", () => {
  it("scores boolean at 0.5 and reports Brier", () => {
    const yes = scoreAnswer(
      URGENCY_QUESTION,
      {
        questionId: "urgent",
        type: "boolean",
        value: 0.91,
        schemaValid: true,
      },
      { questionId: "urgent", boolean: true },
    );
    assert.equal(yes.correct, true);
    assert.ok(yes.brier !== undefined && yes.brier < 0.01);

    const miss = scoreAnswer(
      URGENCY_QUESTION,
      {
        questionId: "urgent",
        type: "boolean",
        value: 0.2,
        schemaValid: true,
      },
      { questionId: "urgent", boolean: true },
    );
    assert.equal(miss.correct, false);
    assert.ok(miss.brier !== undefined && miss.brier > 0.6);
  });

  it("requires an exact choice match", () => {
    const hit = scoreAnswer(
      DEPARTMENT_QUESTION,
      {
        questionId: "department",
        type: "choice",
        value: "billing",
        schemaValid: true,
      },
      { questionId: "department", choice: "billing" },
    );
    const miss = scoreAnswer(
      DEPARTMENT_QUESTION,
      {
        questionId: "department",
        type: "choice",
        value: "sales",
        schemaValid: true,
      },
      { questionId: "department", choice: "billing" },
    );
    assert.equal(hit.correct, true);
    assert.equal(miss.correct, false);
  });

  it("rounds score to the nearest gold level", () => {
    const hit = scoreAnswer(
      SEVERITY_QUESTION,
      {
        questionId: "severity",
        type: "score",
        value: 1.1,
        schemaValid: true,
      },
      { questionId: "severity", scoreLevel: 1 },
    );
    const miss = scoreAnswer(
      SEVERITY_QUESTION,
      {
        questionId: "severity",
        type: "score",
        value: 2.8,
        schemaValid: true,
      },
      { questionId: "severity", scoreLevel: 1 },
    );
    assert.equal(hit.correct, true);
    assert.ok(hit.absError !== undefined && Math.abs(hit.absError - 0.1) < 1e-12);
    assert.equal(miss.correct, false);
  });

  it("treats refusals as incorrect", () => {
    const scored = scoreAnswer(
      DEPARTMENT_QUESTION,
      {
        questionId: "department",
        type: "refusal",
        value: null,
        schemaValid: false,
        refused: true,
      },
      { questionId: "department", choice: "billing" },
    );
    assert.equal(scored.correct, false);
  });
});

describe("summarize", () => {
  it("aggregates accuracy, p95 latency, and cost", () => {
    const testCase: CanonicalCase = {
      id: "one",
      title: "one",
      input: "charged twice",
      questions: [DEPARTMENT_QUESTION],
      gold: [{ questionId: "department", choice: "billing" }],
    };
    const make = (latencyMs: number, choice: string, tokens: number): ProviderResult => ({
      provider: "jev",
      model: "jev-latest",
      configured: true,
      ok: true,
      latencyMs,
      inputTokens: tokens,
      outputTokens: 0,
      costUsd: costUsd("jev", tokens),
      answers: [
        {
          questionId: "department",
          type: "choice",
          value: choice,
          schemaValid: true,
        },
      ],
    });
    const results = [
      scoreProviderResult(testCase, make(100, "billing", 300)),
      scoreProviderResult(testCase, make(200, "sales", 300)),
      scoreProviderResult(testCase, make(400, "billing", 300)),
    ];
    const summary = summarize(results, "jev");
    assert.equal(summary.correctCount, 2);
    assert.equal(summary.scoredCount, 3);
    assert.equal(summary.accuracy, 2 / 3);
    assert.equal(summary.p95LatencyMs, 400);
    assert.ok(summary.totalUsd > 0);
    assert.equal(summary.schemaValidPct, 1);
  });
});

describe("percentile", () => {
  it("returns the last value for a short list at p95", () => {
    assert.equal(percentile([10, 20, 30], 95), 30);
    assert.equal(percentile([], 95), 0);
  });
});

describe("pickLeaders", () => {
  it("ranks two providers and ties on equal accuracy", () => {
    const jev = {
      provider: "jev" as const,
      model: "jev",
      configured: true,
      ok: true,
      latencyMs: 80,
      inputTokens: 10,
      outputTokens: 0,
      costUsd: 0.001,
      answers: [],
      correctCount: 2,
      scoredCount: 2,
    };
    const openai = { ...jev, provider: "openai" as const, correctCount: 1 };
    assert.deepEqual(pickLeaders([jev, openai]), {
      kind: "single",
      ids: ["jev"],
    });
    assert.deepEqual(pickLeaders([jev, { ...openai, correctCount: 2 }]), {
      kind: "tie",
      ids: ["jev", "openai"],
    });
  });
});

describe("pickSummaryLeaders", () => {
  it("picks the higher-accuracy board winner and ties when equal", () => {
    const jev: ProviderSummary = {
      provider: "jev",
      totalUsd: 0,
      accuracy: 0.97,
      correctCount: 35,
      scoredCount: 36,
      meanLatencyMs: 0,
      p95LatencyMs: 0,
      meanTokens: 0,
      schemaValidPct: 1,
      errorCount: 0,
      refusalCount: 0,
      meanBrier: null,
      meanAbsError: null,
      runCount: 24,
    };
    const openai: ProviderSummary = { ...jev, provider: "openai", accuracy: 0.94, correctCount: 34 };
    assert.deepEqual(pickSummaryLeaders([jev, openai]), {
      kind: "single",
      ids: ["jev"],
    });
    assert.deepEqual(pickSummaryLeaders([jev, { ...openai, accuracy: 0.97, correctCount: 35 }]), {
      kind: "tie",
      ids: ["jev", "openai"],
    });
    assert.deepEqual(pickSummaryLeaders([undefined, undefined]), {
      kind: "none",
      ids: [],
    });
  });
});

describe("leaderColor", () => {
  it("uses brand color for a single lead and a distinct tie color", () => {
    assert.equal(leaderColor(["jev"]), "var(--jev)");
    assert.equal(leaderColor(["openai"]), "var(--openai)");
    assert.equal(leaderColor(["jev", "openai"]), "var(--tie, #6d28d9)");
    assert.equal(leaderColor([]), "var(--muted)");
  });
});
