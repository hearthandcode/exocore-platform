# Persistence Desktop Checkpoint Receipt

Status: candidate for local main integration; `verified: false`; no push, deployment, publication, or production cutover.

## Recognition

- **Purpose:** Record the accepted-baseline continuation that retires the form-specific runtime, adds local persistence and forward-stack contracts, and establishes a human-reviewable desktop lab.
- **Accepted base:** `c913352b25b06deff99d0d5fcf3a0c2dbe3e33d5`.
- **Implementation commit:** `8cd9cef` (`feat(persistence): add local-first data checkpoint`).
- **Exact path manifest:** `docs/integration/PERSISTENCE-DESKTOP-CHANGED-PATHS.txt` (99 paths with status).
- **Verification state:** direct checks below passed; production and human verification remain separate.

## Delivered

- Integration acceptance preserved as a distinct historical checkpoint.
- One-off architecture form archived privately and removed from canonical-main working surface.
- Form Intake Registry source, contracts, fixtures, mounted runtime, desktop panel, and active tests removed from the final candidate; historical Git and archived receipts preserved.
- Canonical 18-term vocabulary, 9-dimension taxonomy, language expression grammar, identifier policy v2, semantic module catalog, and module v2 lifecycle/port/operation/extension/migration grammar.
- Generated Rust and TypeScript taxonomy types with stale-generation failure.
- Eight-entity logical persistence model and executable SQLite/PostgreSQL DDL parity.
- Rust `rusqlite` adapter under Tauri application data with foreign keys, WAL, checksummed migration, transactional/idempotent proof, typed status, and scoped reset.
- Dedicated pinned, loopback-only `exocore-local` PostgreSQL/Qdrant/Neo4j Compose project with ignored generated credentials and isolated volumes.
- Persistence & Language Lab with textual status, deliberate run/reset, migration/projection explanation, semantic controls, live region, and ephemeral operator checklist.
- Two disjoint future stream contracts with one shared integration lane.

## Proof results

```text
PROOF_SUMMARY schema=exocore.local-proof.v1 mode=full passed=17 failed=0 boundary=local-synthetic-default-off
LOCAL_STACK_SUMMARY schema=exocore.local-stack.v1 postgres_tables=8 qdrant_collections=1 neo4j_constraints=2 authority=postgresql projections=qdrant+neo4j
NATIVE_REVIEW_SURFACE alive=15s exit=124 log_bytes=0 no_panic_error_failure=true disabled_database_files=0
```

Constituent evidence:

- formatting, ESLint, TypeScript, Vite: pass;
- Vitest: 2 files / 7 persistence-foundation tests passed;
- Rust: 33 tests passed, including zero-write disabled status, migration checksum, restart/idempotency, foreign keys, scoped reset, and module flag behavior;
- Cargo format/check/Clippy warnings denied: pass;
- Python worker: 5 tests and compileall passed;
- module graph: 17 modules, acyclic, 29 TypeScript files scanned;
- language/persistence: 18 terms, 9 dimensions, 8 entities, 3 operations, generated types current, SQLite/PostgreSQL parity passed;
- Intake Grammar projection remains a separate general source projection: 34/34 checks passed;
- Artifact Surface projection: 43/43 checks passed;
- npm audit: zero vulnerabilities;
- Tauri debug build: pass;
- local stack verification repeated idempotently with all three containers healthy;
- archive tar SHA-256 and 18/18 internal file digests verified;
- source branches and accepted integration worktree remained clean.

## Data and authority boundaries

- SQLite role: `local-transitory`; the disabled status query does not create a database.
- PostgreSQL role: forward `durable-authority` for operational records only after a later cutover.
- Qdrant/Neo4j role: rebuildable projections; the current desktop queues intent but does not dispatch it.
- Hub role: governed documents, human decisions, review state, and authored records remain canonical.
- Private form responses: restricted local archive only; not Git, ordinary Hub content, runtime input, or projection source.

## Broader-stack location decision

A dedicated local Compose project was selected instead of the existing Cortex pilot or Kubernetes:

- Cortex containers/volumes/credentials have separate ownership and were not mutated.
- The Exocore project uses ports 25432, 26333, 27474, and 27687 with separate volumes.
- Kubernetes has no configured current context and adds unnecessary secret/storage/recovery scope for this local checkpoint.

## Residual risks

- PostgreSQL adapter/cutover and SQLite export/import are contracts, not implemented synchronization.
- Outbox workers do not yet deliver Qdrant or Neo4j data.
- The desktop review surface has deterministic semantic/interaction tests and native launch proof, but no full assistive-technology or visual-regression suite.
- SQLite contains synthetic proof data only and has no encryption/keychain policy.
- Profile-evaluation canary remains the most functional app slice; Persistence Lab is an architecture proof.
- Local Compose credentials are generated and ignored, but production secret management is undecided.

## Next gate

Fingerprint the clean candidate, repeat the full proof and local-stack verification, then create one no-push local main merge checkpoint if canonical main has no overlapping tracked or untracked paths. After that, branch two independent streams from the exact main SHA using `NEXT-PARALLEL-STREAMS.md`.
