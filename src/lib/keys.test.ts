import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { configuredFromKeys, resolveProviderKey } from "./keys";

describe("resolveProviderKey", () => {
  it("prefers a request header over env", () => {
    assert.equal(resolveProviderKey(" header-key ", "env-key"), "header-key");
    assert.equal(resolveProviderKey("", "env-key"), "env-key");
    assert.equal(resolveProviderKey(null, " env-key "), "env-key");
    assert.equal(resolveProviderKey("   ", "  "), undefined);
  });
});

describe("configuredFromKeys", () => {
  it("marks a provider ready when a key is present", () => {
    assert.deepEqual(configuredFromKeys({ jev: "a", laya: undefined, openai: undefined }), {
      jev: true,
      laya: false,
      openai: false,
    });
  });
});
