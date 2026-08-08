import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

for (const name of ["form-export.schema.json", "registry-record.schema.json"]) {
  describe(name, () => {
    it("is parseable Draft 2020-12 JSON Schema", () => {
      const schema = JSON.parse(
        readFileSync(resolve("contracts/form-intake-registry/v1", name), "utf8"),
      );
      expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
      expect(schema.$id).toContain("hearthandcode.org/schemas/exocore/");
    });
  });
}
