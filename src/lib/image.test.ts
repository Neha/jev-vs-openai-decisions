import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isImageDataUrl } from "./image";
import { unsupportedImageResult } from "./metrics";
import { DEPARTMENT_QUESTION } from "./templates";

describe("isImageDataUrl", () => {
  it("accepts png jpeg and webp data URLs", () => {
    assert.equal(isImageDataUrl("data:image/png;base64,aGVsbG8="), true);
    assert.equal(isImageDataUrl("data:image/jpeg;base64,aGVsbG8="), true);
    assert.equal(isImageDataUrl("data:image/webp;base64,aGVsbG8="), true);
  });

  it("rejects hosted URLs and empty payloads", () => {
    assert.equal(isImageDataUrl("https://example.com/photo.png"), false);
    assert.equal(isImageDataUrl("data:image/png;base64,"), false);
    assert.equal(isImageDataUrl("data:image/gif;base64,aGVsbG8="), false);
  });
});

describe("unsupportedImageResult", () => {
  it("marks Jev as skipped rather than failed-unconfigured", () => {
    const result = unsupportedImageResult("jev", "jev-latest", [DEPARTMENT_QUESTION]);
    assert.equal(result.ok, false);
    assert.equal(result.unsupported, true);
    assert.equal(result.configured, true);
    assert.equal(result.answers[0]?.value, null);
  });
});
