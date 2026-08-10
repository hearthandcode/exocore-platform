import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { evaluateModularity } from "./check-modularity.mjs";

function policy(exceptions = []) {
  return {
    policy: "exocore.modularity-policy.v1",
    version: 1,
    preferredMaxLines: 200,
    boundaryMaxLines: 80,
    sourceExtensions: [".ts", ".rs", ".py"],
    excludedDirectories: ["node_modules"],
    boundaryFiles: ["index.ts", "mod.rs", "__init__.py"],
    exceptions,
  };
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "exocore-modularity-"));
  return {
    root,
    write(path, lines) {
      const target = join(root, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, Array.from({ length: lines }, (_, index) => `line ${index + 1}`).join("\n"));
    },
    remove() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

const today = "2026-08-08";

function approved(path, reviewBy = "2026-10-01") {
  return {
    path,
    owner: "test-owner",
    reason: "Existing debt under review.",
    splitPlan: "Split responsibilities before adding behavior.",
    reviewBy,
  };
}

test("small focused files pass", () => {
  const repo = fixture();
  try {
    repo.write("src/feature/command.ts", 80);
    const result = evaluateModularity({ root: repo.root, policy: policy(), today });
    assert.deepEqual(result.violations, []);
    assert.deepEqual(result.warnings, []);
  } finally {
    repo.remove();
  }
});

test("unapproved oversized source fails", () => {
  const repo = fixture();
  try {
    repo.write("src/feature/everything.ts", 201);
    const result = evaluateModularity({ root: repo.root, policy: policy(), today });
    assert.equal(result.violations.length, 1);
    assert.match(result.violations[0], /split by responsibility/);
  } finally {
    repo.remove();
  }
});

test("approved debt stays visible without failing", () => {
  const repo = fixture();
  try {
    repo.write("src/legacy.ts", 240);
    const result = evaluateModularity({ root: repo.root, policy: policy([approved("src/legacy.ts")]), today });
    assert.deepEqual(result.violations, []);
    assert.equal(result.warnings.length, 1);
    assert.match(result.warnings[0], /approved debt/);
  } finally {
    repo.remove();
  }
});

test("expired exceptions fail closed", () => {
  const repo = fixture();
  try {
    repo.write("src/legacy.ts", 240);
    const result = evaluateModularity({ root: repo.root, policy: policy([approved("src/legacy.ts", "2026-08-07")]), today });
    assert.equal(result.violations.length, 1);
    assert.match(result.violations[0], /exception expired/);
  } finally {
    repo.remove();
  }
});

test("boundary barrels use the tighter limit", () => {
  const repo = fixture();
  try {
    repo.write("src/feature/index.ts", 81);
    const result = evaluateModularity({ root: repo.root, policy: policy(), today });
    assert.equal(result.violations.length, 1);
    assert.match(result.violations[0], /boundary threshold 80/);
  } finally {
    repo.remove();
  }
});
