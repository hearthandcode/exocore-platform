import { typedError, type TypedError } from "./errors";
import type {
  AnswerType,
  FormExport,
  FormResponse,
  FormSection,
  Result,
  SourceBytes,
  ValidatedFormExport,
  ValidationDiagnostic,
} from "./types";

const ANSWER_TYPES = new Set<AnswerType>([
  "text",
  "textarea",
  "single-choice",
  "multi-choice",
  "ranking",
  "build-a-list",
  "scale",
  "select",
]);
const TOP_LEVEL = new Set([
  "schema",
  "version",
  "exportedAt",
  "totalQuestions",
  "totalAnswered",
  "sections",
  "rawResponses",
  "meta",
]);
const SECTION_KEYS = new Set(["id", "title", "description", "total", "answered", "responses"]);
const RESPONSE_KEYS = new Set([
  "questionId",
  "questionLabel",
  "questionType",
  "required",
  "value",
  "answered",
]);

export function validateFormExport(
  source: SourceBytes,
): Result<ValidatedFormExport, TypedError> {
  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(source.bytes));
  } catch (error) {
    return schemaError("Export is not valid JSON.", [
      diagnostic("$", "FIR-SCHEMA-E001", error instanceof Error ? error.message : "JSON parse failed"),
    ]);
  }
  if (!isRecord(raw)) {
    return schemaError("Export must be an object.", [diagnostic("$", "FIR-SCHEMA-E002", "Expected object")]);
  }

  const errors: ValidationDiagnostic[] = [];
  const warnings: ValidationDiagnostic[] = [];
  requireString(raw, "schema", "$", errors);
  requireNumber(raw, "version", "$", errors);
  requireString(raw, "exportedAt", "$", errors);
  requireNumber(raw, "totalQuestions", "$", errors);
  requireNumber(raw, "totalAnswered", "$", errors);
  if (!Array.isArray(raw.sections)) errors.push(diagnostic("$.sections", "FIR-SCHEMA-E003", "Expected array"));
  if (!isRecord(raw.rawResponses)) errors.push(diagnostic("$.rawResponses", "FIR-SCHEMA-E004", "Expected object"));

  if (raw.schema !== "exocore-architecture-form-v3") {
    return {
      ok: false,
      error: typedError("E_VERSION", "validate", "Unsupported form export schema.", {
        diagnostics: [{ path: "$.schema", code: "FIR-VERSION-E001", message: String(raw.schema) }],
        suggestedAction: "Use an exocore-architecture-form-v3 export or add a reviewed adapter.",
      }),
    };
  }

  const unknownTop = unknownEntries(raw, TOP_LEVEL);
  for (const key of Object.keys(unknownTop)) {
    warnings.push(diagnostic(`$.${key}`, "FIR-SCHEMA-W001", "Unknown optional field preserved but inert.", "warning"));
  }
  const requiredFields = isRecord(raw.meta) && Array.isArray(raw.meta.requiredFields)
    ? raw.meta.requiredFields
    : [];
  for (const field of requiredFields) {
    if (typeof field !== "string" || !TOP_LEVEL.has(field)) {
      errors.push(diagnostic("$.meta.requiredFields", "FIR-SCHEMA-E005", `Unknown required field: ${String(field)}`));
    }
  }

  const sections: FormSection[] = [];
  const questionIds = new Set<string>();
  if (Array.isArray(raw.sections)) {
    raw.sections.forEach((sectionRaw, sectionIndex) => {
      const path = `$.sections[${sectionIndex}]`;
      if (!isRecord(sectionRaw)) {
        errors.push(diagnostic(path, "FIR-SCHEMA-E006", "Expected section object"));
        return;
      }
      requireString(sectionRaw, "id", path, errors);
      requireString(sectionRaw, "title", path, errors);
      requireString(sectionRaw, "description", path, errors);
      requireNumber(sectionRaw, "total", path, errors);
      requireNumber(sectionRaw, "answered", path, errors);
      if (!Array.isArray(sectionRaw.responses)) {
        errors.push(diagnostic(`${path}.responses`, "FIR-SCHEMA-E007", "Expected response array"));
        return;
      }
      const responses: FormResponse[] = [];
      sectionRaw.responses.forEach((responseRaw, responseIndex) => {
        const responsePath = `${path}.responses[${responseIndex}]`;
        const response = parseResponse(responseRaw, responsePath, errors, warnings);
        if (!response) return;
        if (questionIds.has(response.questionId)) {
          errors.push(diagnostic(`${responsePath}.questionId`, "FIR-SCHEMA-E008", "Duplicate question id"));
        }
        questionIds.add(response.questionId);
        responses.push(response);
      });
      if (typeof sectionRaw.total === "number" && sectionRaw.total !== responses.length) {
        errors.push(diagnostic(`${path}.total`, "FIR-SCHEMA-E009", "Section total does not match responses."));
      }
      const answered = responses.filter((response) => response.answered).length;
      if (typeof sectionRaw.answered === "number" && sectionRaw.answered !== answered) {
        errors.push(diagnostic(`${path}.answered`, "FIR-SCHEMA-E010", "Section answered count is inconsistent."));
      }
      if (typeof sectionRaw.id === "string" && typeof sectionRaw.title === "string" && typeof sectionRaw.description === "string" && typeof sectionRaw.total === "number" && typeof sectionRaw.answered === "number") {
        sections.push({
          id: sectionRaw.id,
          title: sectionRaw.title,
          description: sectionRaw.description,
          total: sectionRaw.total,
          answered: sectionRaw.answered,
          responses,
          extensions: unknownEntries(sectionRaw, SECTION_KEYS),
        });
      }
    });
  }

  if (typeof raw.totalQuestions === "number" && raw.totalQuestions !== questionIds.size) {
    errors.push(diagnostic("$.totalQuestions", "FIR-SCHEMA-E011", "Total questions does not match unique response entries."));
  }
  const totalAnswered = sections.flatMap((section) => section.responses).filter((response) => response.answered).length;
  if (typeof raw.totalAnswered === "number" && raw.totalAnswered !== totalAnswered) {
    errors.push(diagnostic("$.totalAnswered", "FIR-SCHEMA-E012", "Total answered count is inconsistent."));
  }
  if (typeof raw.exportedAt === "string" && Number.isNaN(Date.parse(raw.exportedAt))) {
    errors.push(diagnostic("$.exportedAt", "FIR-SCHEMA-E013", "Expected ISO-8601 timestamp."));
  }

  if (errors.length > 0) return schemaError("Form export failed validation.", errors);
  const value: FormExport = {
    schema: "exocore-architecture-form-v3",
    version: raw.version as number,
    exportedAt: raw.exportedAt as string,
    totalQuestions: raw.totalQuestions as number,
    totalAnswered: raw.totalAnswered as number,
    sections,
    rawResponses: raw.rawResponses as Record<string, unknown>,
    extensions: unknownTop,
  };
  return { ok: true, value: { export: value, diagnostics: warnings } };
}

function parseResponse(
  value: unknown,
  path: string,
  errors: ValidationDiagnostic[],
  warnings: ValidationDiagnostic[],
): FormResponse | null {
  if (!isRecord(value)) {
    errors.push(diagnostic(path, "FIR-SCHEMA-E014", "Expected response object"));
    return null;
  }
  requireString(value, "questionId", path, errors);
  requireString(value, "questionLabel", path, errors);
  requireString(value, "questionType", path, errors);
  requireBoolean(value, "required", path, errors);
  requireBoolean(value, "answered", path, errors);
  if (typeof value.questionType === "string" && !ANSWER_TYPES.has(value.questionType as AnswerType)) {
    errors.push(diagnostic(`${path}.questionType`, "FIR-SCHEMA-E015", "Unknown answer type."));
  }
  if (value.answered === true && !("value" in value)) {
    errors.push(diagnostic(`${path}.value`, "FIR-SCHEMA-E016", "Answered response requires a value."));
  }
  if (value.answered === true && typeof value.questionType === "string") {
    validateAnswerShape(value.questionType as AnswerType, value.value, `${path}.value`, errors);
  }
  for (const key of Object.keys(unknownEntries(value, RESPONSE_KEYS))) {
    warnings.push(diagnostic(`${path}.${key}`, "FIR-SCHEMA-W001", "Unknown optional field preserved but inert.", "warning"));
  }
  if (typeof value.questionId !== "string" || typeof value.questionLabel !== "string" || typeof value.questionType !== "string" || !ANSWER_TYPES.has(value.questionType as AnswerType) || typeof value.required !== "boolean" || typeof value.answered !== "boolean") return null;
  return {
    questionId: value.questionId,
    questionLabel: value.questionLabel,
    questionType: value.questionType as AnswerType,
    required: value.required,
    ...(value.answered || "value" in value ? { value: value.value } : {}),
    answered: value.answered,
    extensions: unknownEntries(value, RESPONSE_KEYS),
  };
}

function validateAnswerShape(type: AnswerType, value: unknown, path: string, errors: ValidationDiagnostic[]): void {
  if (["text", "textarea", "single-choice", "select"].includes(type) && typeof value !== "string") {
    errors.push(diagnostic(path, "FIR-SCHEMA-E017", `Expected string for ${type}.`));
  }
  if (["multi-choice", "ranking", "build-a-list"].includes(type) && (!Array.isArray(value) || !value.every((item) => typeof item === "string"))) {
    errors.push(diagnostic(path, "FIR-SCHEMA-E018", `Expected string array for ${type}.`));
  }
  if (type === "scale" && typeof value !== "number") {
    errors.push(diagnostic(path, "FIR-SCHEMA-E019", "Expected number for scale."));
  }
}

function schemaError(message: string, diagnostics: ValidationDiagnostic[]): Result<never, TypedError> {
  return {
    ok: false,
    error: typedError("E_SCHEMA", "validate", message, {
      diagnostics: diagnostics.map(({ path, code, message: diagnosticMessage }) => ({ path, code, message: diagnosticMessage })),
      suggestedAction: "Correct the exported fields shown in diagnostics and retry.",
    }),
  };
}

function diagnostic(path: string, code: string, message: string, severity: "error" | "warning" = "error"): ValidationDiagnostic {
  return { path, code, message, severity };
}

function requireString(value: Record<string, unknown>, key: string, path: string, errors: ValidationDiagnostic[]): void {
  if (typeof value[key] !== "string") errors.push(diagnostic(`${path}.${key}`, "FIR-SCHEMA-E020", "Expected string."));
}
function requireNumber(value: Record<string, unknown>, key: string, path: string, errors: ValidationDiagnostic[]): void {
  if (typeof value[key] !== "number" || !Number.isFinite(value[key])) errors.push(diagnostic(`${path}.${key}`, "FIR-SCHEMA-E021", "Expected finite number."));
}
function requireBoolean(value: Record<string, unknown>, key: string, path: string, errors: ValidationDiagnostic[]): void {
  if (typeof value[key] !== "boolean") errors.push(diagnostic(`${path}.${key}`, "FIR-SCHEMA-E022", "Expected boolean."));
}
function unknownEntries(value: Record<string, unknown>, allowed: Set<string>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !allowed.has(key)));
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
