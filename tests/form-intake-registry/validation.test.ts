import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { validateFormExport } from "../../src/form-intake-registry";
import type { SourceBytes } from "../../src/form-intake-registry";

const fixturePath = resolve("fixtures/form-intake-registry/synthetic-export.json");

function source(value: unknown): SourceBytes {
  const bytes = new TextEncoder().encode(typeof value === "string" ? value : JSON.stringify(value));
  return {
    bytes,
    locator: "synthetic.json",
    digest: `sha256:${"0".repeat(64)}`,
    read_at: "2026-08-09T10:00:00.000Z",
  };
}

function fixture(): Record<string, unknown> {
  return JSON.parse(readFileSync(fixturePath, "utf8")) as Record<string, unknown>;
}

describe("form-v3 validation", () => {
  it("accepts the actual response-array export shape and preserves optional extensions", () => {
    const result = validateFormExport(source(fixture()));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.export.sections).toHaveLength(3);
      expect(result.value.export.extensions.fixtureNote).toBeTypeOf("string");
      expect(result.value.diagnostics.some((item) => item.code === "FIR-SCHEMA-W001")).toBe(true);
    }
  });

  it("treats an unanswered n3-style response as valid without inventing a value", () => {
    const result = validateFormExport(source(fixture()));
    expect(result.ok).toBe(true);
    if (result.ok) {
      const n3 = result.value.export.sections.flatMap((section) => section.responses).find((response) => response.questionId === "n3");
      expect(n3).toMatchObject({ answered: false, questionType: "build-a-list" });
      expect(n3).not.toHaveProperty("value");
    }
  });

  it("accepts a partial export when counts and present sections agree", () => {
    const value = fixture();
    value.sections = (value.sections as unknown[]).slice(0, 1);
    value.totalQuestions = 2;
    value.totalAnswered = 2;
    const result = validateFormExport(source(value));
    expect(result.ok).toBe(true);
  });

  it("rejects malformed JSON with E_SCHEMA", () => {
    const result = validateFormExport(source("{broken"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("E_SCHEMA");
  });

  it("preserves unknown optional fields but rejects unknown declared-required fields", () => {
    const optional = fixture();
    optional.futureOptional = { retained: true };
    expect(validateFormExport(source(optional)).ok).toBe(true);

    const required = fixture();
    required.meta = { requiredFields: ["futureRequired"] };
    const result = validateFormExport(source(required));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("E_SCHEMA");
      expect(result.error.diagnostics?.some((item) => item.code === "FIR-SCHEMA-E005")).toBe(true);
    }
  });

  it("rejects an answer whose value shape contradicts questionType", () => {
    const value = fixture();
    const sections = value.sections as Array<{ responses: Array<Record<string, unknown>> }>;
    sections[0].responses[0].value = ["not", "textarea"];
    const result = validateFormExport(source(value));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.diagnostics?.some((item) => item.code === "FIR-SCHEMA-E017")).toBe(true);
  });

  it("accepts invisible controls structurally so normalization can remove them with a diagnostic", () => {
    const value = fixture();
    const sections = value.sections as Array<{ responses: Array<Record<string, unknown>> }>;
    sections[0].responses[0].value = "safe\u202Etext";
    const result = validateFormExport(source(value));
    expect(result.ok).toBe(true);
  });

  it("rejects unknown export versions", () => {
    const value = fixture();
    value.schema = "exocore-architecture-form-v4";
    const result = validateFormExport(source(value));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("E_VERSION");
  });
});
