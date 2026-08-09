import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtures = [
  "synthetic-export.json",
  "synthetic-export-mutated.json",
  "synthetic-export-malformed.json",
];

describe("synthetic fixture governance", () => {
  it.each(fixtures)("records deterministic bytes for %s", (name) => {
    const bytes = readFileSync(resolve("fixtures/form-intake-registry", name));
    expect(createHash("sha256").update(bytes).digest("hex")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("contains no private path, credential-like field, or real response locator", () => {
    for (const name of fixtures) {
      const text = readFileSync(resolve("fixtures/form-intake-registry", name), "utf8");
      expect(text).not.toMatch(/\/home\/|password|api[_-]?key|token|private[_/-]?hub/i);
    }
  });
});
