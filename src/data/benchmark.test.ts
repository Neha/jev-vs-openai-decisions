import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BENCHMARK_CASES } from "./benchmark";

describe("benchmark dataset", () => {
  it("ships 24 labeled text cases covering all question types", () => {
    assert.equal(BENCHMARK_CASES.length, 24);
    const types = new Set(
      BENCHMARK_CASES.flatMap((testCase) => testCase.questions.map((question) => question.type)),
    );
    assert.deepEqual([...types].sort(), ["boolean", "choice", "score"]);
    for (const testCase of BENCHMARK_CASES) {
      assert.ok(testCase.input.trim().length > 0);
      assert.equal(testCase.gold.length, testCase.questions.length);
      for (const question of testCase.questions) {
        const gold = testCase.gold.find((label) => label.questionId === question.id);
        assert.ok(gold, `missing gold for ${testCase.id}/${question.id}`);
        if (question.type === "boolean") {
          assert.equal(typeof gold?.boolean, "boolean");
        }
        if (question.type === "choice") {
          const allowed = (question.options ?? []).map((option) => option.value);
          assert.ok(gold?.choice && allowed.includes(gold.choice));
        }
        if (question.type === "score") {
          assert.equal(typeof gold?.scoreLevel, "number");
        }
      }
    }
  });
});
