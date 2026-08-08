import { canonicalJson, sha256 } from "./internal/hash";
import type { ProjectionView, RegistryRecord } from "./types";

export function buildProjection(record: RegistryRecord, timestamp: string): ProjectionView {
  const candidates = record.payload?.candidates ?? [];
  const stable = {
    registry_id: record.registry_id,
    source_kind: record.source_kind,
    sensitivity: record.sensitivity,
    review_state: record.review_state,
    disposition_state: record.disposition_state,
    candidate_count: candidates.length,
    answered_count: candidates.filter((candidate) => candidate.answered).length,
    question_states: candidates.map((candidate) => ({
      question_id: candidate.question_id,
      answered: candidate.answered,
    })),
  };
  return {
    projection_id: `irp-${sha256(record.registry_id).slice(7, 31)}`,
    canonical_path: `registry:${record.registry_id}`,
    source_digest: record.source_digest,
    schema_version: "exocore.intake-registry.projection.v1",
    rendered_digest: sha256(canonicalJson(stable)),
    projection_timestamp: timestamp,
    freshness_state: "current",
    authority_class: "projection",
    verification_state: false,
    audience_class: record.sensitivity,
    stale_reason: null,
    recovery_path: record.recovery_path,
    supersession: { superseded_by: record.superseded_by },
    view: stable,
  };
}
