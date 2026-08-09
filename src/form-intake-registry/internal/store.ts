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
import type { RegistryStore } from "../ports/registry-store";

export type { RegistryStore } from "../ports/registry-store";
export { InMemoryRegistryStore } from "../adapters/in-memory-registry-store";

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
    for (const path of [
      this.recordsDir,
      this.dedupeDir,
      this.payloadsDir,
      this.projectionsDir,
    ]) {
      mkdirSync(path, { recursive: true });
    }
  }

  get(registryId: string): RegistryRecord | null {
    return readJson<RegistryRecord>(
      join(this.recordsDir, `${registryId}.json`),
    );
  }

  getByDedupeKey(dedupeKey: string): RegistryRecord | null {
    try {
      const id = readFileSync(
        join(this.dedupeDir, keyFile(dedupeKey)),
        "utf8",
      ).trim();
      return this.get(id);
    } catch {
      return null;
    }
  }

  getLatestByLineage(lineageKey: string): RegistryRecord | null {
    return (
      readdirSync(this.recordsDir)
        .filter((name) => name.endsWith(".json"))
        .map((name) => readJson<RegistryRecord>(join(this.recordsDir, name)))
        .filter((record): record is RegistryRecord => Boolean(record))
        .filter(
          (record) =>
            record.lineage_key === lineageKey && record.superseded_by === null,
        )
        .sort((left, right) =>
          right.ingested_at.localeCompare(left.ingested_at),
        )[0] ?? null
    );
  }

  save(record: RegistryRecord): void {
    if (this.get(record.registry_id)) throw new Error("record already exists");
    atomicJson(join(this.recordsDir, `${record.registry_id}.json`), record);
    writeFileSync(
      join(this.dedupeDir, keyFile(record.dedupe_key)),
      `${record.registry_id}\n`,
      "utf8",
    );
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
    atomicJson(
      join(this.projectionsDir, `${projection.projection_id}.json`),
      projection,
    );
    this.event("project.built", projection.projection_id);
  }

  getProjection(projectionId: string): ProjectionView | null {
    return readJson<ProjectionView>(
      join(this.projectionsDir, `${projectionId}.json`),
    );
  }

  count(): number {
    return readdirSync(this.recordsDir).filter((name) => name.endsWith(".json"))
      .length;
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
