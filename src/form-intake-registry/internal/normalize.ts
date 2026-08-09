import { canonicalJson, sha256 } from "./hash";
import type {
  IntakeCandidate,
  NormalizedPayload,
  SourceBytes,
  ValidatedFormExport,
  ValidationDiagnostic,
} from "../types";

const BIDI_CONTROLS = /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

export function normalizeFormExport(
  validated: ValidatedFormExport,
  source: SourceBytes,
): { payload: NormalizedPayload; diagnostics: ValidationDiagnostic[]; dedupeKey: string; lineageKey: string } {
  const diagnostics = [...validated.diagnostics];
  const candidates: IntakeCandidate[] = [];
  for (const section of validated.export.sections) {
    for (const response of section.responses) {
      const normalized = response.answered
        ? normalizeValue(response.questionType, response.value, `$.${section.id}.${response.questionId}`, diagnostics)
        : null;
      candidates.push({
        candidate_id: `ic-${sha256(`${source.digest}\0${response.questionId}`).slice(7, 31)}`,
        question_id: response.questionId,
        section_id: section.id,
        answer_type: response.questionType,
        answer_value: normalized,
        answered: response.answered,
        source_ref: {
          source_locator: source.locator,
          source_digest: source.digest,
          export_schema_version: validated.export.schema,
        },
      });
    }
  }
  const payload: NormalizedPayload = {
    form_id: "exocore-architecture-development-form",
    form_revision: `${validated.export.schema}@${validated.export.version}`,
    exported_at: validated.export.exportedAt,
    candidates,
  };
  const canonicalAnswers = validated.export.sections.map((section) => ({
    section_id: section.id,
    answers: candidates
      .filter((candidate) => candidate.section_id === section.id)
      .sort((left, right) => left.question_id.localeCompare(right.question_id))
      .map((candidate) => ({
        question_id: candidate.question_id,
        answer_type: candidate.answer_type,
        answered: candidate.answered,
        answer_value: candidate.answer_value,
      })),
  }));
  const dedupeKey = sha256(
    `${payload.form_id}\0${payload.form_revision}\0${canonicalJson(canonicalAnswers)}`,
  );
  const lineageKey = sha256(`${payload.form_id}\0${payload.form_revision}`);
  return { payload, diagnostics, dedupeKey, lineageKey };
}

function normalizeValue(
  type: IntakeCandidate["answer_type"],
  value: unknown,
  path: string,
  diagnostics: ValidationDiagnostic[],
): unknown {
  if (typeof value === "string") return clean(value, path, diagnostics).trim();
  if (typeof value === "number") return value;
  if (Array.isArray(value)) {
    const cleaned = value.map((item, index) => clean(String(item), `${path}[${index}]`, diagnostics).trim());
    if (type === "multi-choice") return [...new Set(cleaned)].sort();
    return cleaned;
  }
  return value;
}

function clean(value: string, path: string, diagnostics: ValidationDiagnostic[]): string {
  if (!BIDI_CONTROLS.test(value)) return value;
  BIDI_CONTROLS.lastIndex = 0;
  diagnostics.push({
    path,
    code: "FIR-NORMALIZE-W001",
    message: "Invisible bidirectional control characters were removed.",
    severity: "warning",
  });
  return value.replace(BIDI_CONTROLS, "");
}
