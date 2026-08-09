use rusqlite::{params, Connection, OpenFlags, OptionalExtension};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard};
use tauri::{AppHandle, Manager, State};

use crate::foundation::ipc::FoundationRuntime;
use crate::foundation::{ErrorCode, TypedError};

const DATABASE_NAME: &str = "exocore-local-v1.sqlite3";
const MIGRATION: &str = include_str!("../../../contracts/persistence/sqlite/0001_initial.sql");
const REVIEW_NAMESPACE: &str = "exocore.review-lab";
const PROOF_WORKFLOW_ID: &str = "workflow-persistence-review-v1";

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct PersistenceStatus {
    pub schema: &'static str,
    pub adapter: &'static str,
    pub authority_role: &'static str,
    pub enabled: bool,
    pub initialized: bool,
    pub schema_version: i64,
    pub data_boundary: &'static str,
    pub database_name: &'static str,
    pub record_count: i64,
    pub relation_count: i64,
    pub event_count: i64,
    pub workflow_run_count: i64,
    pub pending_projection_count: i64,
    pub migration_target: &'static str,
    pub projection_targets: [&'static str; 2],
    pub verification_state: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct PersistenceProof {
    pub schema: &'static str,
    pub fixture: &'static str,
    pub operation: &'static str,
    pub idempotent: bool,
    pub evidence: Vec<&'static str>,
    pub status: PersistenceStatus,
}

#[tauri::command]
pub fn persistence_status(
    app: AppHandle,
    foundation: State<'_, Mutex<FoundationRuntime>>,
) -> Result<PersistenceStatus, TypedError> {
    let enabled = foundation_lock(&foundation)?.module_enabled("persistence")?;
    status_at(&database_path(&app)?, enabled)
}

#[tauri::command]
pub fn persistence_run_review_fixture(
    app: AppHandle,
    foundation: State<'_, Mutex<FoundationRuntime>>,
) -> Result<PersistenceProof, TypedError> {
    foundation_lock(&foundation)?.require_module_enabled("persistence")?;
    run_review_fixture_at(&database_path(&app)?)
}

#[tauri::command]
pub fn persistence_reset_review_fixture(
    app: AppHandle,
    foundation: State<'_, Mutex<FoundationRuntime>>,
) -> Result<PersistenceStatus, TypedError> {
    foundation_lock(&foundation)?.require_module_enabled("persistence")?;
    reset_review_fixture_at(&database_path(&app)?, true)
}

fn foundation_lock<'a>(
    foundation: &'a State<'_, Mutex<FoundationRuntime>>,
) -> Result<MutexGuard<'a, FoundationRuntime>, TypedError> {
    foundation.lock().map_err(|_| {
        persistence_error(
            "exocore.persistence.foundation-lock.v1",
            "foundation runtime lock is unavailable",
            true,
        )
    })
}

fn database_path(app: &AppHandle) -> Result<PathBuf, TypedError> {
    app.path()
        .app_data_dir()
        .map(|directory| directory.join(DATABASE_NAME))
        .map_err(|_| {
            persistence_error(
                "exocore.persistence.path.v1",
                "application data directory is unavailable",
                false,
            )
        })
}

fn status_at(path: &Path, enabled: bool) -> Result<PersistenceStatus, TypedError> {
    if !path.exists() {
        return Ok(empty_status(enabled));
    }
    let connection = Connection::open_with_flags(path, OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|error| database_error("exocore.persistence.status.v1", &error))?;
    read_status(&connection, enabled, true)
}

fn run_review_fixture_at(path: &Path) -> Result<PersistenceProof, TypedError> {
    let mut connection = open_and_migrate(path)?;
    let transaction = connection
        .transaction()
        .map_err(|error| database_error("exocore.persistence.run-proof.v1", &error))?;
    let timestamp = "2026-08-09T14:00:00Z";
    let source_payload = r#"{"label":"synthetic review source","value":1}"#;
    let projection_payload =
        r#"{"label":"synthetic review projection","source":"record-review-source-v1"}"#;
    let source_digest = digest(source_payload.as_bytes());
    let projection_digest = digest(projection_payload.as_bytes());

    transaction
        .execute(
            "INSERT INTO records(record_id, namespace, kind, schema_id, schema_version, owner_module, authority_class, lifecycle, sensitivity, payload_json, content_digest, created_at, updated_at, supersedes_id)
             VALUES (?1, ?2, 'evidence', 'exocore.persistence.review-record.v1', 1, 'persistence', 'evidence', 'active', 'public-safe', ?3, ?4, ?5, ?5, NULL)
             ON CONFLICT(record_id) DO UPDATE SET updated_at=excluded.updated_at",
            params!["record-review-source-v1", REVIEW_NAMESPACE, source_payload, source_digest, timestamp],
        )
        .map_err(|error| database_error("exocore.persistence.run-proof.v1", &error))?;
    transaction
        .execute(
            "INSERT INTO records(record_id, namespace, kind, schema_id, schema_version, owner_module, authority_class, lifecycle, sensitivity, payload_json, content_digest, created_at, updated_at, supersedes_id)
             VALUES (?1, ?2, 'artifact', 'exocore.persistence.review-projection.v1', 1, 'persistence', 'projection', 'active', 'public-safe', ?3, ?4, ?5, ?5, NULL)
             ON CONFLICT(record_id) DO UPDATE SET updated_at=excluded.updated_at",
            params!["record-review-projection-v1", REVIEW_NAMESPACE, projection_payload, projection_digest, timestamp],
        )
        .map_err(|error| database_error("exocore.persistence.run-proof.v1", &error))?;
    transaction
        .execute(
            "INSERT OR IGNORE INTO relations(relation_id, source_id, target_id, relation_kind, properties_json, created_at)
             VALUES ('relation-review-derives-v1', 'record-review-projection-v1', 'record-review-source-v1', 'derives-from', '{}', ?1)",
            [timestamp],
        )
        .map_err(|error| database_error("exocore.persistence.run-proof.v1", &error))?;
    transaction
        .execute(
            "INSERT OR IGNORE INTO events(event_id, record_id, event_kind, sequence, payload_json, occurred_at, causation_id, correlation_id)
             VALUES ('event-review-source-v1', 'record-review-source-v1', 'record.committed', 1, '{}', ?1, NULL, 'correlation-review-v1')",
            [timestamp],
        )
        .map_err(|error| database_error("exocore.persistence.run-proof.v1", &error))?;
    transaction
        .execute(
            "INSERT OR IGNORE INTO workflow_runs(workflow_run_id, workflow_schema, status, input_digest, started_at, completed_at)
             VALUES (?1, 'exocore.persistence.review-workflow.v1', 'completed', ?2, ?3, ?3)",
            params![PROOF_WORKFLOW_ID, digest(b"synthetic-persistence-review"), timestamp],
        )
        .map_err(|error| database_error("exocore.persistence.run-proof.v1", &error))?;
    for (sequence, step_id) in ["migrate", "commit", "relate", "enqueue", "inspect"]
        .iter()
        .enumerate()
    {
        transaction
            .execute(
                "INSERT OR IGNORE INTO workflow_steps(workflow_run_id, step_id, sequence, status, evidence_json, completed_at)
                 VALUES (?1, ?2, ?3, 'completed', '{\"outcome\":\"passed\"}', ?4)",
                params![PROOF_WORKFLOW_ID, step_id, (sequence + 1) as i64, timestamp],
            )
            .map_err(|error| database_error("exocore.persistence.run-proof.v1", &error))?;
    }
    for target in ["qdrant", "neo4j"] {
        transaction
            .execute(
                "INSERT OR IGNORE INTO projection_outbox(outbox_id, aggregate_id, target, operation, payload_json, status, attempts, available_at, created_at)
                 VALUES (?1, 'record-review-source-v1', ?2, 'upsert', '{\"record_id\":\"record-review-source-v1\"}', 'pending', 0, ?3, ?3)",
                params![format!("outbox-review-{target}-v1"), target, timestamp],
            )
            .map_err(|error| database_error("exocore.persistence.run-proof.v1", &error))?;
    }
    transaction
        .commit()
        .map_err(|error| database_error("exocore.persistence.run-proof.v1", &error))?;

    let status = status_at(path, true)?;
    Ok(PersistenceProof {
        schema: "exocore.persistence.proof.v1",
        fixture: "exocore.persistence.review-fixture.v1",
        operation: "exocore.persistence.run-proof.v1",
        idempotent: true,
        evidence: vec![
            "migration v1 applied with checksum",
            "two canonical records committed transactionally",
            "one typed relation and one immutable event committed",
            "workflow and five ordered steps persisted",
            "qdrant and neo4j projection intents queued",
        ],
        status,
    })
}

fn reset_review_fixture_at(path: &Path, enabled: bool) -> Result<PersistenceStatus, TypedError> {
    if !path.exists() {
        return Ok(empty_status(enabled));
    }
    let mut connection = open_and_migrate(path)?;
    let transaction = connection
        .transaction()
        .map_err(|error| database_error("exocore.persistence.reset-proof.v1", &error))?;
    transaction
        .execute(
            "DELETE FROM workflow_runs WHERE workflow_run_id = ?1",
            [PROOF_WORKFLOW_ID],
        )
        .map_err(|error| database_error("exocore.persistence.reset-proof.v1", &error))?;
    transaction
        .execute(
            "DELETE FROM records WHERE namespace = ?1",
            [REVIEW_NAMESPACE],
        )
        .map_err(|error| database_error("exocore.persistence.reset-proof.v1", &error))?;
    transaction
        .commit()
        .map_err(|error| database_error("exocore.persistence.reset-proof.v1", &error))?;
    status_at(path, enabled)
}

fn open_and_migrate(path: &Path) -> Result<Connection, TypedError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|_| {
            persistence_error(
                "exocore.persistence.open.v1",
                "local persistence directory could not be created",
                false,
            )
        })?;
    }
    let connection = Connection::open(path)
        .map_err(|error| database_error("exocore.persistence.open.v1", &error))?;
    connection
        .execute_batch(
            "PRAGMA foreign_keys = ON;
             PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA busy_timeout = 5000;",
        )
        .map_err(|error| database_error("exocore.persistence.configure.v1", &error))?;
    connection
        .execute_batch(MIGRATION)
        .map_err(|error| database_error("exocore.persistence.migrate.v1", &error))?;
    let checksum = digest(MIGRATION.as_bytes());
    let existing: Option<String> = connection
        .query_row(
            "SELECT checksum FROM schema_migrations WHERE version = 1",
            [],
            |row| row.get(0),
        )
        .optional()
        .map_err(|error| database_error("exocore.persistence.migrate.v1", &error))?;
    match existing {
        Some(value) if value != checksum => {
            return Err(persistence_error(
                "exocore.persistence.migrate.v1",
                "migration checksum differs from the applied local schema",
                false,
            ));
        }
        Some(_) => {}
        None => {
            connection
                .execute(
                    "INSERT INTO schema_migrations(version, name, applied_at, checksum) VALUES (1, 'initial', '2026-08-09T00:00:00Z', ?1)",
                    [&checksum],
                )
                .map_err(|error| database_error("exocore.persistence.migrate.v1", &error))?;
        }
    }
    Ok(connection)
}

fn read_status(
    connection: &Connection,
    enabled: bool,
    initialized: bool,
) -> Result<PersistenceStatus, TypedError> {
    let count = |table: &str| -> Result<i64, TypedError> {
        connection
            .query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |row| {
                row.get(0)
            })
            .map_err(|error| database_error("exocore.persistence.status.v1", &error))
    };
    let schema_version = connection
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
            [],
            |row| row.get(0),
        )
        .map_err(|error| database_error("exocore.persistence.status.v1", &error))?;
    let pending_projection_count = connection
        .query_row(
            "SELECT COUNT(*) FROM projection_outbox WHERE status = 'pending'",
            [],
            |row| row.get(0),
        )
        .map_err(|error| database_error("exocore.persistence.status.v1", &error))?;
    Ok(PersistenceStatus {
        schema: "exocore.persistence.status.v1",
        adapter: "sqlite-local-transitory",
        authority_role: "local-transitory",
        enabled,
        initialized,
        schema_version,
        data_boundary: "tauri-app-data",
        database_name: DATABASE_NAME,
        record_count: count("records")?,
        relation_count: count("relations")?,
        event_count: count("events")?,
        workflow_run_count: count("workflow_runs")?,
        pending_projection_count,
        migration_target: "postgresql-durable-authority",
        projection_targets: ["qdrant", "neo4j"],
        verification_state: false,
    })
}

fn empty_status(enabled: bool) -> PersistenceStatus {
    PersistenceStatus {
        schema: "exocore.persistence.status.v1",
        adapter: "sqlite-local-transitory",
        authority_role: "local-transitory",
        enabled,
        initialized: false,
        schema_version: 0,
        data_boundary: "tauri-app-data",
        database_name: DATABASE_NAME,
        record_count: 0,
        relation_count: 0,
        event_count: 0,
        workflow_run_count: 0,
        pending_projection_count: 0,
        migration_target: "postgresql-durable-authority",
        projection_targets: ["qdrant", "neo4j"],
        verification_state: false,
    }
}

fn digest(bytes: &[u8]) -> String {
    format!("sha256:{:x}", Sha256::digest(bytes))
}

fn database_error(operation: &str, error: &rusqlite::Error) -> TypedError {
    persistence_error(
        operation,
        &format!("local persistence operation failed: {error}"),
        true,
    )
}

fn persistence_error(operation: &str, message: &str, recoverable: bool) -> TypedError {
    TypedError::new(
        ErrorCode::Internal,
        operation,
        message,
        recoverable,
        "inspect the local persistence proof and retry or reset its namespace",
        "persistence-boundary",
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn test_path(label: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock")
            .as_nanos();
        std::env::temp_dir().join(format!(
            "exocore-{label}-{}-{nonce}.sqlite3",
            std::process::id()
        ))
    }

    #[test]
    fn disabled_status_does_not_create_a_database() {
        let path = test_path("disabled");
        let status = status_at(&path, false).expect("status");
        assert!(!status.initialized);
        assert_eq!(status.schema_version, 0);
        assert!(!path.exists());
    }

    #[test]
    fn migration_proof_is_idempotent_and_reset_is_scoped() {
        let path = test_path("proof");
        let first = run_review_fixture_at(&path).expect("first proof");
        let second = run_review_fixture_at(&path).expect("second proof");
        assert_eq!(first.status.record_count, 2);
        assert_eq!(second.status.record_count, 2);
        assert_eq!(second.status.relation_count, 1);
        assert_eq!(second.status.event_count, 1);
        assert_eq!(second.status.workflow_run_count, 1);
        assert_eq!(second.status.pending_projection_count, 2);
        let reset = reset_review_fixture_at(&path, true).expect("reset");
        assert_eq!(reset.record_count, 0);
        assert_eq!(reset.relation_count, 0);
        assert_eq!(reset.event_count, 0);
        assert_eq!(reset.workflow_run_count, 0);
        assert_eq!(reset.schema_version, 1);
        fs::remove_file(path).ok();
    }

    #[test]
    fn migration_enforces_foreign_keys() {
        let path = test_path("foreign-key");
        let connection = open_and_migrate(&path).expect("database");
        let result = connection.execute(
            "INSERT INTO relations(relation_id, source_id, target_id, relation_kind, properties_json, created_at) VALUES ('invalid', 'missing', 'missing', 'contains', '{}', 'now')",
            [],
        );
        assert!(result.is_err());
        fs::remove_file(path).ok();
    }
}
