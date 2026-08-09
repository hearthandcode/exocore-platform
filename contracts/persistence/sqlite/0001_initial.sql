PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  checksum TEXT NOT NULL CHECK (checksum LIKE 'sha256:%')
) STRICT;

CREATE TABLE IF NOT EXISTS records (
  record_id TEXT PRIMARY KEY,
  namespace TEXT NOT NULL,
  kind TEXT NOT NULL,
  schema_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL CHECK (schema_version > 0),
  owner_module TEXT NOT NULL,
  authority_class TEXT NOT NULL CHECK (authority_class IN ('source','evidence','inference','hypothesis','proposal','plan','projection','receipt','historical')),
  lifecycle TEXT NOT NULL CHECK (lifecycle IN ('draft','active','deprecated','archived')),
  sensitivity TEXT NOT NULL CHECK (sensitivity IN ('public-safe','internal','restricted')),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  content_digest TEXT NOT NULL CHECK (content_digest LIKE 'sha256:%'),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  supersedes_id TEXT NULL REFERENCES records(record_id),
  UNIQUE(namespace, content_digest)
) STRICT;

CREATE INDEX IF NOT EXISTS records_namespace_idx ON records(namespace);
CREATE INDEX IF NOT EXISTS records_owner_idx ON records(owner_module);

CREATE TABLE IF NOT EXISTS relations (
  relation_id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES records(record_id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES records(record_id) ON DELETE CASCADE,
  relation_kind TEXT NOT NULL CHECK (relation_kind IN ('contains','depends-on','derives-from','supersedes','projects-to','correlated-with')),
  properties_json TEXT NOT NULL CHECK (json_valid(properties_json)),
  created_at TEXT NOT NULL,
  UNIQUE(source_id, target_id, relation_kind)
) STRICT;

CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES records(record_id) ON DELETE CASCADE,
  event_kind TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  occurred_at TEXT NOT NULL,
  causation_id TEXT NULL,
  correlation_id TEXT NOT NULL,
  UNIQUE(record_id, sequence)
) STRICT;

CREATE TABLE IF NOT EXISTS workflow_runs (
  workflow_run_id TEXT PRIMARY KEY,
  workflow_schema TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','running','completed','failed','cancelled')),
  input_digest TEXT NOT NULL CHECK (input_digest LIKE 'sha256:%'),
  started_at TEXT NOT NULL,
  completed_at TEXT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS workflow_steps (
  workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(workflow_run_id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  status TEXT NOT NULL CHECK (status IN ('pending','running','completed','failed','cancelled')),
  evidence_json TEXT NOT NULL CHECK (json_valid(evidence_json)),
  completed_at TEXT NULL,
  PRIMARY KEY (workflow_run_id, step_id),
  UNIQUE(workflow_run_id, sequence)
) STRICT;

CREATE TABLE IF NOT EXISTS projection_outbox (
  outbox_id TEXT PRIMARY KEY,
  aggregate_id TEXT NOT NULL REFERENCES records(record_id) ON DELETE CASCADE,
  target TEXT NOT NULL CHECK (target IN ('qdrant','neo4j')),
  operation TEXT NOT NULL CHECK (operation IN ('upsert','delete')),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  status TEXT NOT NULL CHECK (status IN ('pending','processing','completed','failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(aggregate_id, target, operation, payload_json)
) STRICT;

CREATE INDEX IF NOT EXISTS projection_outbox_status_idx ON projection_outbox(status, available_at);

CREATE TABLE IF NOT EXISTS projection_checkpoints (
  projector_id TEXT NOT NULL,
  target TEXT NOT NULL CHECK (target IN ('qdrant','neo4j')),
  last_event_id TEXT NULL,
  last_sequence INTEGER NOT NULL DEFAULT 0 CHECK (last_sequence >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (projector_id, target)
) STRICT;
