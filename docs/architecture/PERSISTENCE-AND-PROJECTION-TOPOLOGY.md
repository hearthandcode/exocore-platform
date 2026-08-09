# Persistence and Projection Topology

Status: accepted implementation direction for the local checkpoint; production deployment remains unapproved and `verified: false`.

## Recognition

- **Purpose:** Define one portable logical record model across transitory SQLite, forward PostgreSQL authority, and rebuildable Qdrant/Neo4j projections.
- **Source:** `contracts/persistence/exocore.persistence.v1.json` and its versioned adapter artifacts.
- **Current proof:** local synthetic records only.
- **Next gate:** prove SQLite lifecycle and dedicated local Compose schema before a main-integration checkpoint.

## Authority topology

```text
Tauri desktop
  -> persistence port
      -> SQLite local adapter (transitory/offline proof)
      -> PostgreSQL adapter (future durable authority)
           -> transactional projection outbox
                -> Qdrant vector projection
                -> Neo4j graph projection
```

| Store      | Role                | May decide                                                      | Must not become                                 |
| ---------- | ------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| SQLite     | `local-transitory`  | local transaction success and migration state                   | permanent multi-process authority               |
| PostgreSQL | `durable-authority` | committed operational record/event/relation state after cutover | Hub knowledge authority or human decision-maker |
| Qdrant     | `vector-projection` | nearest-neighbor retrieval over admitted projection fields      | source record store                             |
| Neo4j      | `graph-projection`  | graph traversal over admitted projected relations               | source relation authority                       |

The Hub remains canonical for governed documents, human decisions, review state, and authored records. PostgreSQL is future authority only for Exocore's operational records. External services remain authority for their own native state.

## Logical schema

The canonical v1 model declares eight entities:

1. `schema_migrations` — ordered migration ledger;
2. `records` — stable typed records with owner, authority class, lifecycle, sensitivity, canonical JSON, digest, and supersession;
3. `relations` — typed directed edges between records;
4. `events` — immutable per-record sequence;
5. `workflow_runs` — workflow identity and terminal state;
6. `workflow_steps` — ordered step evidence;
7. `projection_outbox` — transactional delivery intent for Qdrant/Neo4j; and
8. `projection_checkpoints` — rebuild/resume position per projector and target.

SQLite and PostgreSQL DDL must expose the same entity and column set. `scripts/validate_language_persistence.py` enforces that parity. Adapter-specific types differ only where mechanics require it: SQLite stores canonical JSON/timestamps as validated text; PostgreSQL uses `JSONB` and `TIMESTAMPTZ`.

## Migration and cutover contract

Stable text identifiers, schema IDs, positive schema versions, canonical JSON, SHA-256 content digests, and event sequences are portable across adapters.

SQLite is explicitly transitory:

- database file: Tauri application-data directory, never repository state;
- one writer per desktop process;
- foreign keys on, WAL mode, bounded busy timeout;
- ordered SQL migrations with checksums;
- synthetic proof namespace reset without deleting unrelated records;
- no automatic synchronization or conflict resolution claim.

PostgreSQL cutover requires a later reviewed migration checkpoint that proves export/import counts, identities, digests, relations, event sequences, workflow state, and rollback. After cutover, SQLite becomes cache/offline replica or is retired; dual authority is prohibited.

## Projection contract

`projection_outbox` is committed in the same transaction as source changes. Projectors may retry idempotently. Qdrant points use `record_id` as stable identity and carry only allowed metadata plus reviewed vector inputs. Neo4j nodes use `record_id`; projected relationships retain `relation_id`.

Restricted payloads are excluded by default. Projection failure never rolls back committed PostgreSQL authority. Rebuild starts from records/relations/events and records a checkpoint; direct projection edits are non-authoritative drift.

## Hosting decision

Use the repository's dedicated `exocore-local` Docker Compose project for the current broader-stack proof:

- pinned PostgreSQL 17, Qdrant 1.18, and Neo4j 5.26 images;
- separate Exocore volumes and network;
- loopback-only host ports;
- ignored local credentials generated for this stack only;
- no dependency on or mutation of the existing `cortex-pilot` services.

Kubernetes is deferred: the machine has no configured kube context, the current scope is a single-operator local desktop proof, and introducing cluster secrets/storage would add authority and recovery concerns without improving this checkpoint.

## Extension routes

Module v2 declares adapter and projector extension points. A future adapter must provide:

- exact contract and supported schema-major versions;
- capability/effect declaration;
- migration/cutover behavior;
- conformance suite;
- health and typed failure;
- reset/rollback limits; and
- disclosure policy.

No adapter may inspect another module's private state or introduce a second authority silently.
