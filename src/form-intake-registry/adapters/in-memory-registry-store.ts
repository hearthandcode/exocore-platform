import type { ProjectionView, RegistryRecord } from "../types";
import type { RegistryStore } from "../ports/registry-store";

export class InMemoryRegistryStore implements RegistryStore {
  private readonly records = new Map<string, RegistryRecord>();
  private readonly dedupe = new Map<string, string>();
  private readonly projections = new Map<string, ProjectionView>();
  private readonly payloads = new Map<string, unknown>();

  get(registryId: string): RegistryRecord | null {
    return clone(this.records.get(registryId) ?? null);
  }

  getByDedupeKey(dedupeKey: string): RegistryRecord | null {
    const id = this.dedupe.get(dedupeKey);
    return id ? this.get(id) : null;
  }

  getLatestByLineage(lineageKey: string): RegistryRecord | null {
    return clone(
      [...this.records.values()]
        .filter(
          (record) =>
            record.lineage_key === lineageKey && record.superseded_by === null,
        )
        .sort((left, right) =>
          right.ingested_at.localeCompare(left.ingested_at),
        )[0] ?? null,
    );
  }

  save(record: RegistryRecord): void {
    if (this.records.has(record.registry_id)) {
      throw new Error("record already exists");
    }
    this.records.set(record.registry_id, clone(record));
    this.dedupe.set(record.dedupe_key, record.registry_id);
  }

  update(record: RegistryRecord): void {
    if (!this.records.has(record.registry_id)) {
      throw new Error("record does not exist");
    }
    this.records.set(record.registry_id, clone(record));
  }

  savePayload(registryId: string, payload: unknown): string {
    this.payloads.set(registryId, clone(payload));
    return `store://payloads/${registryId}`;
  }

  saveProjection(projection: ProjectionView): void {
    this.projections.set(projection.projection_id, clone(projection));
  }

  getProjection(projectionId: string): ProjectionView | null {
    return clone(this.projections.get(projectionId) ?? null);
  }

  count(): number {
    return this.records.size;
  }
}

function clone<T>(value: T): T {
  return value === null || value === undefined ? value : structuredClone(value);
}
