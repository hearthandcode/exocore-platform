import { typedError, type TypedError } from "./errors";
import { canonicalJson, sha256 } from "./internal/hash";
import { normalizeFormExport } from "./internal/normalize";
import type { RegistryStore } from "./internal/store";
import { buildProjection } from "./projection";
import type {
  FlagDeclaration,
  IngestReport,
  ProjectionView,
  RegisterReport,
  RegistryRecord,
  RegistryRecordView,
  Result,
  Sensitivity,
  SourceAdapter,
  SourceBytes,
  ValidatedFormExport,
  VerifyReport,
} from "./types";
import { validateFormExport } from "./validation";

export const flagDeclaration: FlagDeclaration = {
  id: "form-intake-registry.enabled",
  default: false,
  owner: "form-intake-registry",
  enabled_behavior: "pipeline-and-projection-active",
  disabled_behavior: "inert-no-state-written-E_DISABLED",
};

export interface ModuleOptions {
  enabled?: boolean;
  store: RegistryStore;
  now?: () => string;
}

export class FormIntakeRegistryModule {
  private readonly enabled: boolean;
  private readonly store: RegistryStore;
  private readonly now: () => string;

  constructor(options: ModuleOptions) {
    this.enabled = options.enabled ?? flagDeclaration.default;
    this.store = options.store;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  ingest(
    adapter: SourceAdapter,
    locator: string,
    sensitivity: Sensitivity = "internal",
  ): Result<IngestReport, TypedError> {
    const gate = this.gate("ingest");
    if (gate) return { ok: false, error: gate };
    if (adapter.kind !== "form-export") {
      return {
        ok: false,
        error: typedError("E_CONFLICT", "ingest", "The Hub registry on-disk record shape is not established by the current v0.2 projection contract.", {
          path: locator,
          recoverable: false,
          suggestedAction: "Use the Hub adapter for read-only digest evidence until a reviewed candidate-record handoff exists.",
        }),
      };
    }
    const source = adapter.read(locator);
    if (!source.ok) return source;
    const validated = this.validate(source.value);
    if (!validated.ok) return validated;
    const registered = this.register(validated.value, source.value, adapter, sensitivity);
    if (!registered.ok) return registered;
    const normalized = normalizeFormExport(validated.value, source.value);
    return {
      ok: true,
      value: {
        ...registered.value,
        diagnostics: normalized.diagnostics,
        candidate_count: normalized.payload.candidates.length,
      },
    };
  }

  validate(source: SourceBytes): Result<ValidatedFormExport, TypedError> {
    const gate = this.gate("validate");
    if (gate) return { ok: false, error: gate };
    return validateFormExport(source);
  }

  register(
    validated: ValidatedFormExport,
    source: SourceBytes,
    adapter: SourceAdapter,
    sensitivity: Sensitivity = "internal",
  ): Result<RegisterReport, TypedError> {
    const gate = this.gate("register");
    if (gate) return { ok: false, error: gate };
    try {
      const normalized = normalizeFormExport(validated, source);
      const existing = this.store.getByDedupeKey(normalized.dedupeKey);
      if (existing) {
        existing.last_seen_at = this.now();
        this.store.update(existing);
        return { ok: true, value: { action: "seen", record: existing, previous_registry_id: existing.registry_id } };
      }

      const registryId = `ir-${sha256(`${normalized.dedupeKey}\0exocore.intake-registry.v1`).slice(7, 33)}`;
      const timestamp = this.now();
      const payloadDigest = sha256(canonicalJson(normalized.payload));
      const restricted = sensitivity === "restricted";
      const record: RegistryRecord = {
        registry_id: registryId,
        schema_version: "exocore.intake-registry.v1",
        source_kind: adapter.kind,
        source_locator: source.locator,
        source_digest: source.digest,
        ingested_at: timestamp,
        last_seen_at: timestamp,
        export_schema_version: validated.export.schema,
        dedupe_key: normalized.dedupeKey,
        lineage_key: normalized.lineageKey,
        payload: restricted ? null : normalized.payload,
        payload_digest: restricted ? payloadDigest : null,
        payload_locator: null,
        sensitivity,
        review_state: "unreviewed",
        disposition_state: "candidate",
        verification_state: false,
        superseded_by: null,
        recovery_path: `${adapter.id}:${source.locator}`,
      };
      if (restricted) record.payload_locator = this.store.savePayload(registryId, normalized.payload);

      const previous = this.store.getLatestByLineage(normalized.lineageKey);
      this.store.save(record);
      if (previous && previous.registry_id !== record.registry_id) {
        previous.superseded_by = record.registry_id;
        this.store.update(previous);
        return { ok: true, value: { action: "superseded", record, previous_registry_id: previous.registry_id } };
      }
      return { ok: true, value: { action: "inserted", record, previous_registry_id: null } };
    } catch {
      return {
        ok: false,
        error: typedError("E_STORE", "register", "Registry storage failed without mutating the source export.", {
          path: source.locator,
          suggestedAction: "Check the feature-local store path and retry.",
        }),
      };
    }
  }

  project(registryId: string): Result<ProjectionView, TypedError> {
    const gate = this.gate("project");
    if (gate) return { ok: false, error: gate };
    try {
      const record = this.store.get(registryId);
      if (!record) {
        return { ok: false, error: typedError("E_NOT_FOUND", "project", "Registry record was not found.", { path: registryId }) };
      }
      const projection = buildProjection(record, this.now());
      this.store.saveProjection(projection);
      return { ok: true, value: projection };
    } catch {
      return { ok: false, error: typedError("E_PROJECTION", "project", "Projection build failed.", { path: registryId }) };
    }
  }

  verify(projectionId: string, adapter: SourceAdapter): Result<VerifyReport, TypedError> {
    const gate = this.gate("verify");
    if (gate) return { ok: false, error: gate };
    const projection = this.store.getProjection(projectionId);
    if (!projection) return { ok: false, error: typedError("E_NOT_FOUND", "verify", "Projection was not found.", { path: projectionId }) };
    const record = this.store.get(projection.view.registry_id);
    if (!record) return { ok: false, error: typedError("E_VERIFY", "verify", "Projection source record is missing.", { path: projectionId }) };
    const source = adapter.read(record.source_locator);
    if (!source.ok) return source;
    const rebuilt = buildProjection(record, this.now());
    const mismatched: string[] = [];
    if (source.value.digest !== record.source_digest) mismatched.push("source_digest");
    if (rebuilt.rendered_digest !== projection.rendered_digest) mismatched.push("rendered_digest");
    const matches = mismatched.length === 0;
    const observed: ProjectionView = {
      ...projection,
      projection_timestamp: this.now(),
      freshness_state: matches ? "current" : "stale",
      stale_reason: matches ? null : mismatched.join(","),
    };
    this.store.saveProjection(observed);
    return { ok: true, value: { projection: observed, matches, mismatched_fields: mismatched } };
  }

  inspect(registryId: string): Result<RegistryRecordView, TypedError> {
    const gate = this.gate("inspect");
    if (gate) return { ok: false, error: gate };
    const record = this.store.get(registryId);
    if (!record) return { ok: false, error: typedError("E_NOT_FOUND", "inspect", "Registry record was not found.", { path: registryId }) };
    return { ok: true, value: { record, payload_redacted: record.payload === null } };
  }

  private gate(operation: string): TypedError | null {
    if (this.enabled) return null;
    return typedError("E_DISABLED", operation, "Form Intake Registry is disabled.", {
      recoverable: true,
      suggestedAction: "Enable form-intake-registry.enabled deliberately.",
    });
  }
}
