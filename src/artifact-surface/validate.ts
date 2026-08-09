import type {
  ArtifactReferenceProjection,
  ArtifactSurfaceDiagnostic,
  ArtifactSurfaceProjection,
  ArtifactSurfaceValidation,
} from "./contracts";

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

const LIFECYCLE_STATES = new Set([
  "draft",
  "active",
  "reviewed",
  "amended",
  "needs-review",
  "archived",
  "deprecated",
  "superseded",
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

const SENSITIVITY_STATES = new Set(["public", "internal", "restricted"]);
const RELATION_KINDS = new Set([
  "supports",
  "supersedes",
  "derived-from",
  "implements",
  "relates-to",
  "conflicts-with",
]);

const REQUIRED_DENIED_EFFECTS = new Set([
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
]);

const ROOT_KEYS = new Set(["contract", "artifacts"]);
const CONTRACT_KEYS = new Set([
  "projectionId",
  "version",
  "authorityEffect",
  "canonical",
  "syntheticOnly",
  "readOnly",
  "mountState",
  "sourceIdentity",
  "sourceSetDigest",
  "deniedEffects",
  "limits",
]);
const ARTIFACT_KEYS = new Set([
  "artifactId",
  "title",
  "summary",
  "artifactClass",
  "lifecycleState",
  "reviewState",
  "sensitivity",
  "artifactPath",
  "contentDigest",
  "provenance",
  "contentPreview",
  "relations",
]);
const PROVENANCE_KEYS = new Set(["sourceLabel", "sourceKind", "summary"]);
const PREVIEW_KEYS = new Set(["mediaType", "text", "truncated"]);
const RELATION_KEYS = new Set(["kind", "targetArtifactId"]);
const SHA256 = /^[0-9a-f]{64}$/;
const ARTIFACT_ID = /^AR-PUBLIC-[0-9]{3}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function add(
  diagnostics: ArtifactSurfaceDiagnostic[],
  condition: boolean,
  code: string,
  message: string,
): void {
  if (!condition) diagnostics.push({ code, message });
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: Set<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function hasEveryString(values: unknown, required: Set<string>): boolean {
  return (
    Array.isArray(values) &&
    values.every((value) => typeof value === "string") &&
    [...required].every((item) => values.includes(item))
  );
}

function isSafeRelativePath(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value) || value.includes("\\")) {
    return false;
  }
  return value.split("/").every((segment) => segment !== "" && segment !== "..");
}

function validateArtifact(
  value: unknown,
  index: number,
  diagnostics: ArtifactSurfaceDiagnostic[],
): value is ArtifactReferenceProjection {
  const prefix = `artifacts[${index}]`;
  if (!isRecord(value)) {
    diagnostics.push({ code: "EXO-ART-E020", message: `${prefix} must be an object.` });
    return false;
  }

  add(diagnostics, hasOnlyKeys(value, ARTIFACT_KEYS), "EXO-ART-E021", `${prefix} has unknown fields.`);
  add(diagnostics, typeof value.artifactId === "string" && ARTIFACT_ID.test(value.artifactId), "EXO-ART-E022", `${prefix}.artifactId is invalid.`);
  add(diagnostics, typeof value.title === "string" && value.title.length > 0 && value.title.length <= 160, "EXO-ART-E023", `${prefix}.title is invalid.`);
  add(diagnostics, typeof value.summary === "string" && value.summary.length > 0 && value.summary.length <= 320, "EXO-ART-E024", `${prefix}.summary is invalid.`);
  add(diagnostics, ARTIFACT_CLASSES.has(value.artifactClass as string), "EXO-ART-E025", `${prefix}.artifactClass is unknown.`);
  add(diagnostics, LIFECYCLE_STATES.has(value.lifecycleState as string), "EXO-ART-E026", `${prefix}.lifecycleState is unknown.`);
  add(diagnostics, REVIEW_STATES.has(value.reviewState as string), "EXO-ART-E027", `${prefix}.reviewState is unknown.`);
  add(diagnostics, SENSITIVITY_STATES.has(value.sensitivity as string), "EXO-ART-E028", `${prefix}.sensitivity is unknown.`);
  add(diagnostics, isSafeRelativePath(value.artifactPath), "EXO-ART-E029", `${prefix}.artifactPath must be safe and repository-relative.`);
  add(diagnostics, typeof value.contentDigest === "string" && SHA256.test(value.contentDigest), "EXO-ART-E030", `${prefix}.contentDigest must be SHA-256.`);

  const provenance = value.provenance;
  add(diagnostics, isRecord(provenance), "EXO-ART-E031", `${prefix}.provenance is required.`);
  if (isRecord(provenance)) {
    add(diagnostics, hasOnlyKeys(provenance, PROVENANCE_KEYS), "EXO-ART-E032", `${prefix}.provenance has unknown fields.`);
    add(diagnostics, typeof provenance.sourceLabel === "string" && provenance.sourceLabel.length > 0 && provenance.sourceLabel.length <= 160, "EXO-ART-E033", `${prefix}.provenance.sourceLabel is invalid.`);
    add(diagnostics, provenance.sourceKind === "synthetic-fixture", "EXO-ART-E034", `${prefix}.provenance must remain synthetic.`);
    add(diagnostics, typeof provenance.summary === "string" && provenance.summary.length > 0 && provenance.summary.length <= 320, "EXO-ART-E035", `${prefix}.provenance.summary is invalid.`);
  }

  const preview = value.contentPreview;
  add(diagnostics, isRecord(preview), "EXO-ART-E036", `${prefix}.contentPreview is required.`);
  if (isRecord(preview)) {
    add(diagnostics, hasOnlyKeys(preview, PREVIEW_KEYS), "EXO-ART-E037", `${prefix}.contentPreview has unknown fields.`);
    add(diagnostics, preview.mediaType === "text/markdown", "EXO-ART-E038", `${prefix}.contentPreview.mediaType is unsupported.`);
    add(diagnostics, typeof preview.text === "string" && preview.text.length > 0 && preview.text.length <= 500, "EXO-ART-E039", `${prefix}.contentPreview.text must contain at most 500 characters.`);
    add(diagnostics, typeof preview.truncated === "boolean", "EXO-ART-E040", `${prefix}.contentPreview.truncated must be boolean.`);
  }

  const relations = value.relations;
  add(diagnostics, Array.isArray(relations), "EXO-ART-E041", `${prefix}.relations must be an array.`);
  if (Array.isArray(relations)) {
    relations.forEach((relation, relationIndex) => {
      const relationPrefix = `${prefix}.relations[${relationIndex}]`;
      add(diagnostics, isRecord(relation), "EXO-ART-E042", `${relationPrefix} must be an object.`);
      if (isRecord(relation)) {
        add(diagnostics, hasOnlyKeys(relation, RELATION_KEYS), "EXO-ART-E043", `${relationPrefix} has unknown fields.`);
        add(diagnostics, RELATION_KINDS.has(relation.kind as string), "EXO-ART-E044", `${relationPrefix}.kind is unknown.`);
        add(diagnostics, typeof relation.targetArtifactId === "string" && ARTIFACT_ID.test(relation.targetArtifactId), "EXO-ART-E045", `${relationPrefix}.targetArtifactId is invalid.`);
      }
    });
  }

  return true;
}

export function validateArtifactSurfaceProjection(value: unknown): ArtifactSurfaceValidation {
  const diagnostics: ArtifactSurfaceDiagnostic[] = [];
  if (!isRecord(value)) {
    return {
      valid: false,
      diagnostics: [{ code: "EXO-ART-E001", message: "Projection must be an object." }],
    };
  }

  add(diagnostics, hasOnlyKeys(value, ROOT_KEYS), "EXO-ART-E002", "Projection has unknown root fields.");
  const contract = value.contract;
  add(diagnostics, isRecord(contract), "EXO-ART-E003", "Projection contract is required.");
  if (isRecord(contract)) {
    add(diagnostics, hasOnlyKeys(contract, CONTRACT_KEYS), "EXO-ART-E004", "Projection contract has unknown fields.");
    add(diagnostics, contract.projectionId === "exocore-artifact-surface-v0.1", "EXO-ART-E005", "Projection ID is unsupported.");
    add(diagnostics, contract.version === "0.1.0", "EXO-ART-E006", "Projection version is unsupported.");
    add(diagnostics, contract.authorityEffect === "derived-non-authoritative", "EXO-ART-E007", "Projection cannot claim source authority.");
    add(diagnostics, contract.canonical === false, "EXO-ART-E008", "Projection must remain noncanonical.");
    add(diagnostics, contract.syntheticOnly === true, "EXO-ART-E009", "Projection must remain synthetic-only.");
    add(diagnostics, contract.readOnly === true, "EXO-ART-E010", "Projection must remain read-only.");
    add(diagnostics, contract.mountState === "unmounted-candidate", "EXO-ART-E011", "Projection must remain unmounted.");
    add(diagnostics, typeof contract.sourceIdentity === "string" && contract.sourceIdentity.length > 0, "EXO-ART-E012", "Source identity is required.");
    add(diagnostics, typeof contract.sourceSetDigest === "string" && SHA256.test(contract.sourceSetDigest), "EXO-ART-E013", "Source-set digest must be SHA-256.");
    add(diagnostics, hasEveryString(contract.deniedEffects, REQUIRED_DENIED_EFFECTS), "EXO-ART-E014", "Every consequential effect must be denied.");
    add(diagnostics, Array.isArray(contract.limits) && contract.limits.length > 0 && contract.limits.every((item) => typeof item === "string" && item.length > 0), "EXO-ART-E015", "Projection limits are required.");
  }

  const artifacts = value.artifacts;
  add(diagnostics, Array.isArray(artifacts) && artifacts.length > 0, "EXO-ART-E016", "At least one artifact is required.");
  if (Array.isArray(artifacts)) {
    artifacts.forEach((artifact, index) => validateArtifact(artifact, index, diagnostics));
    const ids = artifacts.flatMap((artifact) => isRecord(artifact) && typeof artifact.artifactId === "string" ? [artifact.artifactId] : []);
    const paths = artifacts.flatMap((artifact) => isRecord(artifact) && typeof artifact.artifactPath === "string" ? [artifact.artifactPath] : []);
    add(diagnostics, new Set(ids).size === ids.length, "EXO-ART-E017", "Artifact IDs must be unique.");
    add(diagnostics, new Set(paths).size === paths.length, "EXO-ART-E018", "Artifact paths must be unique.");
    const idSet = new Set(ids);
    const relationTargets = artifacts.flatMap((artifact) => {
      if (!isRecord(artifact) || !Array.isArray(artifact.relations)) return [];
      return artifact.relations.flatMap((relation) => isRecord(relation) && typeof relation.targetArtifactId === "string" ? [relation.targetArtifactId] : []);
    });
    add(diagnostics, relationTargets.every((target) => idSet.has(target)), "EXO-ART-E019", "Every relation target must resolve inside the projection.");
  }

  return { valid: diagnostics.length === 0, diagnostics };
}

export function assertArtifactSurfaceProjection(value: unknown): ArtifactSurfaceProjection {
  const result = validateArtifactSurfaceProjection(value);
  if (!result.valid) {
    throw new Error(result.diagnostics.map((item) => `${item.code}: ${item.message}`).join("\n"));
  }
  return value as ArtifactSurfaceProjection;
}
