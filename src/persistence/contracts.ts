export interface PersistenceStatus {
  schema: "exocore.persistence.status.v1";
  adapter: "sqlite-local-transitory";
  authority_role: "local-transitory";
  enabled: boolean;
  initialized: boolean;
  schema_version: number;
  data_boundary: "tauri-app-data";
  database_name: "exocore-local-v1.sqlite3";
  record_count: number;
  relation_count: number;
  event_count: number;
  workflow_run_count: number;
  pending_projection_count: number;
  migration_target: "postgresql-durable-authority";
  projection_targets: ["qdrant", "neo4j"];
  verification_state: false;
}

export interface PersistenceProof {
  schema: "exocore.persistence.proof.v1";
  fixture: "exocore.persistence.review-fixture.v1";
  operation: "exocore.persistence.run-proof.v1";
  idempotent: true;
  evidence: string[];
  status: PersistenceStatus;
}
