export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type SourceKind = "form-export" | "hub-intake-candidate";
export type Sensitivity = "public-safe" | "internal" | "restricted";
export type ReviewState = "unreviewed" | "in-review" | "reviewed" | "deferred";
export type DispositionState =
  | "candidate"
  | "accepted-proposal"
  | "parked"
  | "rejected";
export type AnswerType =
  | "text"
  | "textarea"
  | "single-choice"
  | "multi-choice"
  | "ranking"
  | "build-a-list"
  | "scale"
  | "select";

export interface SourceBytes {
  bytes: Uint8Array;
  locator: string;
  digest: string;
  read_at: string;
}

export interface AdapterDescriptor {
  id: string;
  kind: SourceKind;
  root_policy: string;
  size_bound: number;
  utf8_policy: "strict";
}

export interface SourceAdapter {
  readonly id: string;
  readonly kind: SourceKind;
  read(locator: string): Result<SourceBytes, import("./errors").TypedError>;
  describe(): AdapterDescriptor;
}

export interface FormResponse {
  questionId: string;
  questionLabel: string;
  questionType: AnswerType;
  required: boolean;
  value?: unknown;
  answered: boolean;
  extensions: Record<string, unknown>;
}

export interface FormSection {
  id: string;
  title: string;
  description: string;
  total: number;
  answered: number;
  responses: FormResponse[];
  extensions: Record<string, unknown>;
}

export interface FormExport {
  schema: "exocore-architecture-form-v3";
  version: number;
  exportedAt: string;
  totalQuestions: number;
  totalAnswered: number;
  sections: FormSection[];
  rawResponses: Record<string, unknown>;
  extensions: Record<string, unknown>;
}

export interface ValidationDiagnostic {
  path: string;
  code: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidatedFormExport {
  export: FormExport;
  diagnostics: ValidationDiagnostic[];
}

export interface IntakeCandidate {
  candidate_id: string;
  question_id: string;
  section_id: string;
  answer_type: AnswerType;
  answer_value: unknown | null;
  answered: boolean;
  source_ref: {
    source_locator: string;
    source_digest: string;
    export_schema_version: string;
  };
}

export interface NormalizedPayload {
  form_id: "exocore-architecture-development-form";
  form_revision: string;
  exported_at: string;
  candidates: IntakeCandidate[];
}

export interface RegistryRecord {
  registry_id: string;
  schema_version: "exocore.intake-registry.v1";
  source_kind: SourceKind;
  source_locator: string;
  source_digest: string;
  ingested_at: string;
  last_seen_at: string;
  export_schema_version: string;
  dedupe_key: string;
  lineage_key: string;
  payload: NormalizedPayload | null;
  payload_digest: string | null;
  payload_locator: string | null;
  sensitivity: Sensitivity;
  review_state: ReviewState;
  disposition_state: DispositionState;
  verification_state: false;
  superseded_by: string | null;
  recovery_path: string;
}

export interface ProjectionView {
  projection_id: string;
  canonical_path: string;
  source_digest: string;
  schema_version: "exocore.intake-registry.projection.v1";
  rendered_digest: string;
  projection_timestamp: string;
  freshness_state: "current" | "stale" | "failed" | "rebuilding";
  authority_class: "projection";
  verification_state: false;
  audience_class: Sensitivity;
  stale_reason: string | null;
  recovery_path: string;
  supersession: { superseded_by: string | null };
  view: {
    registry_id: string;
    source_kind: SourceKind;
    sensitivity: Sensitivity;
    review_state: ReviewState;
    disposition_state: DispositionState;
    candidate_count: number;
    answered_count: number;
    question_states: Array<{ question_id: string; answered: boolean }>;
  };
}

export interface RegisterReport {
  action: "inserted" | "seen" | "superseded";
  record: RegistryRecord;
  previous_registry_id: string | null;
}

export interface IngestReport extends RegisterReport {
  diagnostics: ValidationDiagnostic[];
  candidate_count: number;
}

export interface VerifyReport {
  projection: ProjectionView;
  matches: boolean;
  mismatched_fields: string[];
}

export interface RegistryRecordView {
  record: RegistryRecord;
  payload_redacted: boolean;
}

export interface FlagDeclaration {
  id: "form-intake-registry.enabled";
  default: false;
  owner: "form-intake-registry";
  enabled_behavior: "pipeline-and-projection-active";
  disabled_behavior: "inert-no-state-written-E_DISABLED";
}
