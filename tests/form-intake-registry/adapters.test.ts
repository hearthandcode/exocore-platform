import { mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FormExportFileAdapter,
  HubRegistryReadAdapter,
} from "../../src/form-intake-registry/internal/adapters";

function root(): string {
  return mkdtempSync(join(tmpdir(), "fir-adapter-"));
}

describe("bounded source adapters", () => {
  it("reads valid UTF-8 and records an exact digest", () => {
    const directory = root();
    writeFileSync(join(directory, "input.json"), "{}\n");
    const result = new FormExportFileAdapter(directory).read("input.json");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.locator).toBe("input.json");
      expect(result.value.digest).toMatch(/^sha256:[0-9a-f]{64}$/);
    }
  });

  it.each([
    ["missing.json", "E_NOT_FOUND"],
    ["../outside.json", "E_TRAVERSAL"],
  ])("fails closed for %s", (locator, code) => {
    const result = new FormExportFileAdapter(root()).read(locator);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(code);
  });

  it("rejects oversized input before reading it", () => {
    const directory = root();
    writeFileSync(join(directory, "large.json"), "x".repeat(32));
    const result = new FormExportFileAdapter(directory, { maxBytes: 8 }).read("large.json");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("E_TOO_LARGE");
  });

  it("rejects invalid UTF-8", () => {
    const directory = root();
    writeFileSync(join(directory, "invalid.json"), Buffer.from([0xc3, 0x28]));
    const result = new FormExportFileAdapter(directory).read("invalid.json");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("E_ENCODING");
  });

  it("rejects a symlink escape", () => {
    const directory = root();
    const outside = join(tmpdir(), `fir-outside-${process.pid}.json`);
    writeFileSync(outside, "{}\n");
    symlinkSync(outside, join(directory, "escape.json"));
    const result = new FormExportFileAdapter(directory).read("escape.json");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("E_TRAVERSAL");
  });

  it("exposes the Hub lane as a read-only adapter with no write method", () => {
    const directory = root();
    writeFileSync(join(directory, "candidate.json"), "{}\n");
    const adapter = new HubRegistryReadAdapter(directory);
    expect(adapter.describe().kind).toBe("hub-intake-candidate");
    expect("write" in adapter).toBe(false);
    expect(adapter.read("candidate.json").ok).toBe(true);
  });
});
