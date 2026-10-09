import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fromJevResponse, toJevRequest } from "./jev";
import { fromOpenAIResponse, toOpenAIRequest } from "./openai-decisions";
import {
  DEPARTMENT_QUESTION,
  SEVERITY_QUESTION,
  URGENCY_QUESTION,
} from "./templates";

const questions = [DEPARTMENT_QUESTION, URGENCY_QUESTION, SEVERITY_QUESTION];

describe("Jev adapter", () => {
  it("maps canonical questions onto the TypeSafe request shape", () => {
    const request = toJevRequest("I was charged twice.", questions);
    assert.equal(request.model, "jev-latest");
    assert.equal(request.state, "I was charged twice.");
    assert.equal(request.questions.department?.type, "choice");
    assert.equal(request.questions.urgent?.type, "noul");
    assert.equal(request.questions.severity?.type, "score");
    assert.deepEqual(request.questions.department?.criteria, {
      billing: DEPARTMENT_QUESTION.options?.[0]?.description,
      technical: DEPARTMENT_QUESTION.options?.[1]?.description,
      shipping: DEPARTMENT_QUESTION.options?.[2]?.description,
      account: DEPARTMENT_QUESTION.options?.[3]?.description,
      sales: DEPARTMENT_QUESTION.options?.[4]?.description,
    });
    assert.ok(Array.isArray(request.questions.severity?.criteria));
    assert.equal((request.questions.severity?.criteria as string[]).length, 4);
  });

  it("normalizes noul, choice, and score answers", () => {
    const result = fromJevResponse(
      {
        model: "jev-1.13.0",
        answers: {
          department: {
            type: "choice",
            choice: "billing",
            probabilities: { billing: 0.88, technical: 0.12, sales: 0 },
            confidence: 0.81,
          },
          urgent: { type: "noul", noul: 0.95 },
          severity: {
            type: "score",
            score: 1.05,
            probabilities: { "0": 0, "1": 0.95, "2": 0.05 },
            confidence: 0.92,
          },
        },
        usage: { input_tokens: 318, output_tokens: 34 },
      },
      questions,
      142,
    );
    assert.equal(result.ok, true);
    assert.equal(result.provider, "jev");
    assert.equal(result.latencyMs, 142);
    assert.equal(result.inputTokens, 318);
    assert.ok(Math.abs(result.costUsd - (318 * 0.042) / 1_000_000) < 1e-12);
    assert.equal(result.answers[0]?.value, "billing");
    assert.equal(result.answers[0]?.schemaValid, true);
    assert.equal(result.answers[1]?.value, 0.95);
    assert.equal(result.answers[2]?.value, 1.05);
  });

  it("marks unknown choice values as schema-invalid", () => {
    const result = fromJevResponse(
      {
        answers: {
          department: { type: "choice", choice: "legal" },
        },
        usage: { input_tokens: 10 },
      },
      [DEPARTMENT_QUESTION],
      10,
    );
    assert.equal(result.answers[0]?.schemaValid, false);
  });
});

describe("OpenAI adapter", () => {
  it("maps canonical questions onto the Decisions request shape", () => {
    const request = toOpenAIRequest("I was charged twice.", questions);
    assert.equal(request.model, "gpt-6-luna");
    assert.equal(request.input, "I was charged twice.");
    assert.equal(request.questions[0]?.type, "choice");
    assert.equal(request.questions[1]?.type, "predicate");
    assert.equal(request.questions[2]?.type, "score");
    assert.equal(request.questions[0] && "choices" in request.questions[0], true);
  });

  it("wraps an image as a user message with inline data URL parts", () => {
    const image = "data:image/png;base64,abc123";
    const request = toOpenAIRequest("Inspect this receipt.", questions, image);
    assert.ok(Array.isArray(request.input));
    const message = request.input[0];
    assert.equal(message?.role, "user");
    assert.deepEqual(message?.content, [
      { type: "input_text", text: "Inspect this receipt." },
      { type: "input_image", image_url: image },
    ]);
  });

  it("normalizes predicate, choice, score, and refusal answers", () => {
    const result = fromOpenAIResponse(
      {
        model: "gpt-6-luna",
        answers: [
          {
            type: "choice",
            name: "department",
            choice: "billing",
            confidence: 0.9,
            probabilities: [
              { value: "billing", probability: 0.9 },
              { value: "technical", probability: 0.1 },
            ],
          },
          { type: "predicate", name: "urgent", probability: 0.8 },
          {
            type: "score",
            name: "severity",
            score: 2.2,
            confidence: 0.6,
            probabilities: [
              { value: 0, label: "routine", probability: 0 },
              { value: 2, label: "urgent", probability: 0.8 },
              { value: 3, label: "critical", probability: 0.2 },
            ],
          },
        ],
        usage: { input_tokens: 410, output_tokens: 0 },
      },
      questions,
      88,
    );
    assert.equal(result.provider, "openai");
    assert.equal(result.answers[0]?.value, "billing");
    assert.equal(result.answers[0]?.probabilities?.billing, 0.9);
    assert.equal(result.answers[1]?.value, 0.8);
    assert.equal(result.answers[2]?.value, 2.2);
    assert.equal(result.answers[2]?.probabilities?.urgent, 0.8);
    assert.ok(Math.abs(result.costUsd - 0.000041) < 1e-12);

    const refused = fromOpenAIResponse(
      {
        answers: [{ type: "refusal", name: "department" }],
      },
      [DEPARTMENT_QUESTION],
      5,
    );
    assert.equal(refused.answers[0]?.refused, true);
    assert.equal(refused.answers[0]?.schemaValid, false);
  });
});
