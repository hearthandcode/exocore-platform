export type ArtifactClass =
  | "source"
  | "evidence"
  | "inference"
  | "hypothesis"
  | "proposal"
  | "plan"
  | "projection"
  | "receipt"
  | "historical-material";

export type ArtifactLifecycleState =
  | "draft"
  | "active"
  | "reviewed"
  | "amended"
  | "needs-review"
  | "archived"
  | "deprecated"
  | "superseded";

export type ArtifactReviewState =
  | "unreviewed"
  | "in-review"
  | "reviewed-current"
  | "re-review-required"
  | "deferred"
  | "not-required"
  | "approved-for-design";

export type ArtifactSensitivity = "public" | "internal" | "restricted";

export type ArtifactRelationKind =
  | "supports"
  | "supersedes"
  | "derived-from"
  | "implements"
  | "relates-to"
  | "conflicts-with";

export type DeniedArtifactEffect =
  | "canonical-write"
  | "filesystem-scan"
  | "ingestion"
  | "workflow-transition"
  | "human-gate-decision"
  | "persistence"
  | "provider-call"
  | "network-access"
  | "credential-access"
  | "scheduling"
  | "publication"
  | "migration"
  | "deployment"
  | "git-mutation";

export interface ArtifactSurfaceContract {
  projectionId: "exocore-artifact-surface-v0.1";
  version: "0.1.0";
  authorityEffect: "derived-non-authoritative";
  canonical: false;
  syntheticOnly: true;
  readOnly: true;
  mountState: "unmounted-candidate";
  sourceIdentity: string;
  sourceSetDigest: string;
  deniedEffects: DeniedArtifactEffect[];
  limits: string[];
}

export interface ArtifactProvenanceProjection {
  sourceLabel: string;
  sourceKind: "synthetic-fixture";
  summary: string;
}

export interface ArtifactContentPreview {
  mediaType: "text/markdown";
  text: string;
  truncated: boolean;
}

export interface ArtifactRelationProjection {
  kind: ArtifactRelationKind;
  targetArtifactId: string;
}

export interface ArtifactReferenceProjection {
  artifactId: string;
  title: string;
  summary: string;
  artifactClass: ArtifactClass;
  lifecycleState: ArtifactLifecycleState;
  reviewState: ArtifactReviewState;
  sensitivity: ArtifactSensitivity;
  artifactPath: string;
  contentDigest: string;
  provenance: ArtifactProvenanceProjection;
  contentPreview: ArtifactContentPreview;
  relations: ArtifactRelationProjection[];
}

export interface ArtifactSurfaceProjection {
  contract: ArtifactSurfaceContract;
  artifacts: ArtifactReferenceProjection[];
}

export interface ArtifactSurfaceDiagnostic {
  code: string;
  message: string;
}

export interface ArtifactSurfaceValidation {
  valid: boolean;
  diagnostics: ArtifactSurfaceDiagnostic[];
}
