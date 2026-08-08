import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
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
        .filter((record) => record.lineage_key === lineageKey && record.superseded_by === null)
        .sort((left, right) => right.ingested_at.localeCompare(left.ingested_at))[0] ?? null,
    );
  }

  save(record: RegistryRecord): void {
    if (this.records.has(record.registry_id)) throw new Error("record already exists");
    this.records.set(record.registry_id, clone(record));
    this.dedupe.set(record.dedupe_key, record.registry_id);
  }

  update(record: RegistryRecord): void {
    if (!this.records.has(record.registry_id)) throw new Error("record does not exist");
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

export class FileRegistryStore implements RegistryStore {
  private readonly recordsDir: string;
  private readonly dedupeDir: string;
  private readonly payloadsDir: string;
  private readonly projectionsDir: string;
  private readonly logPath: string;

  constructor(storeRoot: string) {
    this.recordsDir = join(storeRoot, "records");
    this.dedupeDir = join(storeRoot, "indexes", "dedupe");
    this.payloadsDir = join(storeRoot, "payloads");
    this.projectionsDir = join(storeRoot, "projections");
    this.logPath = join(storeRoot, "LOG.jsonl");
    for (const path of [this.recordsDir, this.dedupeDir, this.payloadsDir, this.projectionsDir]) {
      mkdirSync(path, { recursive: true });
    }
  }

  get(registryId: string): RegistryRecord | null {
    return readJson<RegistryRecord>(join(this.recordsDir, `${registryId}.json`));
  }

  getByDedupeKey(dedupeKey: string): RegistryRecord | null {
    try {
      const id = readFileSync(join(this.dedupeDir, keyFile(dedupeKey)), "utf8").trim();
      return this.get(id);
    } catch {
      return null;
    }
  }

  getLatestByLineage(lineageKey: string): RegistryRecord | null {
    return readdirSync(this.recordsDir)
      .filter((name) => name.endsWith(".json"))
      .map((name) => readJson<RegistryRecord>(join(this.recordsDir, name)))
      .filter((record): record is RegistryRecord => Boolean(record))
      .filter((record) => record.lineage_key === lineageKey && record.superseded_by === null)
      .sort((left, right) => right.ingested_at.localeCompare(left.ingested_at))[0] ?? null;
  }

  save(record: RegistryRecord): void {
    if (this.get(record.registry_id)) throw new Error("record already exists");
    atomicJson(join(this.recordsDir, `${record.registry_id}.json`), record);
    writeFileSync(join(this.dedupeDir, keyFile(record.dedupe_key)), `${record.registry_id}\n`, "utf8");
    this.event("register.inserted", record.registry_id);
  }

  update(record: RegistryRecord): void {
    if (!this.get(record.registry_id)) throw new Error("record does not exist");
    atomicJson(join(this.recordsDir, `${record.registry_id}.json`), record);
    this.event("register.updated", record.registry_id);
  }

  savePayload(registryId: string, payload: unknown): string {
    atomicJson(join(this.payloadsDir, `${registryId}.json`), payload);
    return `store://payloads/${registryId}`;
  }

  saveProjection(projection: ProjectionView): void {
    atomicJson(join(this.projectionsDir, `${projection.projection_id}.json`), projection);
    this.event("project.built", projection.projection_id);
  }

  getProjection(projectionId: string): ProjectionView | null {
    return readJson<ProjectionView>(join(this.projectionsDir, `${projectionId}.json`));
  }

  count(): number {
    return readdirSync(this.recordsDir).filter((name) => name.endsWith(".json")).length;
  }

  private event(event: string, id: string): void {
    appendFileSync(this.logPath, `${JSON.stringify({ event, id })}\n`, "utf8");
  }
}

function keyFile(key: string): string {
  return key.replace(/^sha256:/, "");
}

function atomicJson(path: string, value: unknown): void {
  const temp = `${path}.tmp`;
  writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temp, path);
}

function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

function clone<T>(value: T): T {
  return value === null || value === undefined ? value : structuredClone(value);
}
