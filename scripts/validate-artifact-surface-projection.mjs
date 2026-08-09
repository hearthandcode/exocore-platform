#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const projectionUrl = new URL(
  "../public/artifact-surface/artifact-surface.v0.1.json",
  import.meta.url,
);
const schemaUrl = new URL(
  "../public/artifact-surface/artifact-surface.v0.1.schema.json",
  import.meta.url,
);
const projection = JSON.parse(await readFile(projectionUrl, "utf8"));
const schema = JSON.parse(await readFile(schemaUrl, "utf8"));
const failures = [];
let checks = 0;

const REQUIRED_DENIED_EFFECTS = [
  "canonical-write",
  "filesystem-scan",
  "ingestion",
  "workflow-transition",
  "human-gate-decision",
  "persistence",
  "provider-call",
  "network-access",
  "credential-access",
  "scheduling",
  "publication",
  "migration",
  "deployment",
  "git-mutation",
];
const ARTIFACT_CLASSES = new Set([
  "source",
  "evidence",
  "inference",
  "hypothesis",
  "proposal",
  "plan",
  "projection",
  "receipt",
  "historical-material",
]);
const REVIEW_STATES = new Set([
  "unreviewed",
  "in-review",
  "reviewed-current",
  "re-review-required",
  "deferred",
  "not-required",
  "approved-for-design",
]);
const SHA256 = /^[0-9a-f]{64}$/;
const EXPECTED_SOURCE_SET_DIGEST =
  "7af6fa4ff72bef850cbe25b01ff0d992b57eb6a4c98fb4d7cc81484d55a802a3";

function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeRelativePath(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith("/") &&
    !/^[A-Za-z]:/.test(value) &&
    !value.includes("\\") &&
    value.split("/").every((segment) => segment !== "" && segment !== "..")
  );
}

function validate(value) {
  const problems = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ["root"];
  }
  const rootKeys = Object.keys(value);
  if (rootKeys.some((key) => !["contract", "artifacts"].includes(key))) problems.push("root-keys");
  const contract = value.contract;
  if (!contract || typeof contract !== "object" || Array.isArray(contract)) {
    problems.push("contract");
  } else {
    if (contract.projectionId !== "exocore-artifact-surface-v0.1") problems.push("projection-id");
    if (contract.version !== "0.1.0") problems.push("version");
    if (contract.authorityEffect !== "derived-non-authoritative") problems.push("authority");
    if (contract.canonical !== false) problems.push("canonical");
    if (contract.syntheticOnly !== true) problems.push("synthetic");
    if (contract.readOnly !== true) problems.push("read-only");
    if (contract.mountState !== "unmounted-candidate") problems.push("mount-state");
    if (!SHA256.test(contract.sourceSetDigest ?? "")) problems.push("source-digest");
    if (!Array.isArray(contract.deniedEffects) || !REQUIRED_DENIED_EFFECTS.every((effect) => contract.deniedEffects.includes(effect))) problems.push("denied-effects");
  }
  if (!Array.isArray(value.artifacts) || value.artifacts.length === 0) {
    problems.push("artifacts");
    return problems;
  }
  const ids = [];
  const paths = [];
  const targets = [];
  for (const artifact of value.artifacts) {
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
      problems.push("artifact");
      continue;
    }
    ids.push(artifact.artifactId);
    paths.push(artifact.artifactPath);
    if (!ARTIFACT_CLASSES.has(artifact.artifactClass)) problems.push("artifact-class");
    if (!REVIEW_STATES.has(artifact.reviewState)) problems.push("review-state");
    if (!safeRelativePath(artifact.artifactPath)) problems.push("artifact-path");
    if (!SHA256.test(artifact.contentDigest ?? "")) problems.push("content-digest");
    if (artifact.provenance?.sourceKind !== "synthetic-fixture") problems.push("provenance");
    if (typeof artifact.contentPreview?.text !== "string" || artifact.contentPreview.text.length === 0 || artifact.contentPreview.text.length > 500) problems.push("preview");
    if (!Array.isArray(artifact.relations)) problems.push("relations");
    else artifact.relations.forEach((relation) => targets.push(relation.targetArtifactId));
  }
  if (new Set(ids).size !== ids.length) problems.push("duplicate-id");
  if (new Set(paths).size !== paths.length) problems.push("duplicate-path");
  const idSet = new Set(ids);
  if (!targets.every((target) => idSet.has(target))) problems.push("relation-closure");
  return problems;
}

check(schema.$schema === "https://json-schema.org/draft/2020-12/schema", "schema draft");
check(schema.additionalProperties === false, "closed root schema");
check(schema.$defs.contract.additionalProperties === false, "closed contract schema");
check(schema.$defs.artifactReference.additionalProperties === false, "closed artifact schema");
check(schema.$defs.provenance.additionalProperties === false, "closed provenance schema");
check(schema.$defs.contentPreview.additionalProperties === false, "closed preview schema");
check(schema.$defs.relation.additionalProperties === false, "closed relation schema");

const positiveProblems = validate(projection);
check(positiveProblems.length === 0, `valid fixture: ${positiveProblems.join(", ")}`);
check(projection.contract.sourceSetDigest === EXPECTED_SOURCE_SET_DIGEST, "accepted IFG source-set digest");
check(projection.artifacts.length === 2, "two representative artifacts");
check(projection.artifacts.some((artifact) => artifact.artifactClass === "proposal"), "proposal represented");
check(projection.artifacts.some((artifact) => artifact.artifactClass === "plan"), "plan represented");
check(projection.artifacts.every((artifact) => safeRelativePath(artifact.artifactPath)), "relative paths");
check(projection.artifacts.every((artifact) => SHA256.test(artifact.contentDigest)), "content digests");
check(projection.artifacts.every((artifact) => artifact.contentPreview.text.length <= 500), "bounded previews");
check(projection.artifacts.every((artifact) => artifact.provenance.sourceKind === "synthetic-fixture"), "synthetic provenance");
check(REQUIRED_DENIED_EFFECTS.every((effect) => projection.contract.deniedEffects.includes(effect)), "all effects denied");

const serialized = JSON.stringify(projection);
for (const forbidden of [
  "/home/",
  "hearthandcode-hub",
  '"source_locator"',
  '"private_body"',
  '"restricted_body"',
  '"credentials"',
  '"provider_state"',
  '"raw_response"',
  '"personal_profile"',
]) {
  check(!serialized.includes(forbidden), `forbidden output: ${forbidden}`);
}

const mutations = [
  ["authority inflation", (value) => { value.contract.authorityEffect = "canonical"; }],
  ["canonical true", (value) => { value.contract.canonical = true; }],
  ["synthetic disabled", (value) => { value.contract.syntheticOnly = false; }],
  ["read-only disabled", (value) => { value.contract.readOnly = false; }],
  ["mounted state", (value) => { value.contract.mountState = "mounted"; }],
  ["missing denied effect", (value) => { value.contract.deniedEffects = value.contract.deniedEffects.filter((effect) => effect !== "canonical-write"); }],
  ["absolute path", (value) => { value.artifacts[0].artifactPath = "/private/example.md"; }],
  ["path traversal", (value) => { value.artifacts[0].artifactPath = "examples/../private.md"; }],
  ["unknown artifact class", (value) => { value.artifacts[0].artifactClass = "fact"; }],
  ["unknown review state", (value) => { value.artifacts[0].reviewState = "verified"; }],
  ["bad digest", (value) => { value.artifacts[0].contentDigest = "not-a-digest"; }],
  ["live provenance", (value) => { value.artifacts[0].provenance.sourceKind = "live-hub"; }],
  ["overlong preview", (value) => { value.artifacts[0].contentPreview.text = "x".repeat(501); }],
  ["duplicate ID", (value) => { value.artifacts[1].artifactId = value.artifacts[0].artifactId; }],
  ["duplicate path", (value) => { value.artifacts[1].artifactPath = value.artifacts[0].artifactPath; }],
  ["unresolved relation", (value) => { value.artifacts[0].relations[0].targetArtifactId = "AR-PUBLIC-999"; }],
  ["unknown root field", (value) => { value.writeBack = true; }],
];

for (const [label, mutate] of mutations) {
  const candidate = clone(projection);
  mutate(candidate);
  check(validate(candidate).length > 0, `mutation rejected: ${label}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  console.error(`validate-artifact-surface-projection: ${checks - failures.length} / ${checks} checks passed`);
  process.exit(1);
}

console.log(`validate-artifact-surface-projection: all ${checks} / ${checks} checks passed`);
console.log(`projection file: ${fileURLToPath(projectionUrl)}`);
console.log(`schema file: ${fileURLToPath(schemaUrl)}`);
