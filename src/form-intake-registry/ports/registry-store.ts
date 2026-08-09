import type { ProjectionView, RegistryRecord } from "../types";

export interface RegistryStore {
  get(registryId: string): RegistryRecord | null;
  getByDedupeKey(dedupeKey: string): RegistryRecord | null;
  getLatestByLineage(lineageKey: string): RegistryRecord | null;
  save(record: RegistryRecord): void;
  update(record: RegistryRecord): void;
  savePayload(registryId: string, payload: unknown): string;
  saveProjection(projection: ProjectionView): void;
  getProjection(projectionId: string): ProjectionView | null;
  count(): number;
}
