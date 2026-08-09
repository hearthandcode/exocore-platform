# Persistence Desktop Checkpoint

Status: local synthetic integration candidate; prior foundation/intake integration accepted; current checkpoint `verified: false` pending final receipt.

## Recognition

- **Purpose:** Let a human inspect the local persistence boundary, language contracts, migration posture, and reversible proof in the desktop application.
- **Accepted base:** `c913352b25b06deff99d0d5fcf3a0c2dbe3e33d5`.
- **Current scope:** transitory SQLite plus a dedicated local PostgreSQL/Qdrant/Neo4j conformance stack.
- **Retired scope:** the one-off architecture form and Form Intake Registry are not active surfaces.

## Install and prove

```bash
python3 -m pip install --user -r requirements-dev.txt
npm ci --include=dev
npm run proof:quick
```

The full proof also runs Rust, Python, audit, and Tauri build checks:

```bash
npm run proof
```

## Run the desktop review surface

```bash
npm run tauri dev
```

Scroll below the existing deterministic profile-evaluation canary to **Persistence & Language Lab**.

Expected initial state on a fresh application-data directory:

- modules `foundation` and `persistence` are registered and disabled;
- persistence adapter is `sqlite-local-transitory`;
- initialized is `no · zero-write status`;
- schema version and all counts are zero;
- forward authority is `postgresql-durable-authority`;
- projection targets are `qdrant + neo4j`;
- verification seal remains false.

Choose **Initialize and run persistence proof**. Expected result:

- schema migration v1 applies with a SHA-256 checksum;
- two canonical public-safe records commit in one transaction;
- one relation and one immutable event commit;
- one workflow and five ordered steps persist;
- two pending outbox intents target Qdrant and Neo4j;
- repeating the action is idempotent and does not increase counts.

Choose **Reset proof namespace and disable**. Expected result:

- proof records, relation, event, workflow, steps, and outbox entries are removed;
- schema migration v1 and the database remain;
- module returns to disabled;
- unrelated namespaces would remain untouched.

Use the four ephemeral operator checkboxes to assess clarity and behavior. They intentionally do not persist or create a review decision.

## Run the broader local stack

The stack is independent of the existing Cortex pilot:

```bash
scripts/local-stack.sh init-env
scripts/local-stack.sh verify
scripts/local-stack.sh status
```

Expected summary:

```text
LOCAL_STACK_SUMMARY schema=exocore.local-stack.v1 postgres_tables=8 qdrant_collections=1 neo4j_constraints=2 authority=postgresql projections=qdrant+neo4j
```

Services use dedicated volumes and loopback ports:

- PostgreSQL `127.0.0.1:25432`;
- Qdrant `127.0.0.1:26333`;
- Neo4j HTTP `127.0.0.1:27474`;
- Neo4j Bolt `127.0.0.1:27687`.

Credentials live only in ignored `deploy/compose/.env.local`. Stop without deleting data:

```bash
scripts/local-stack.sh down
```

Destroy only this proof's volumes after an explicit decision:

```bash
scripts/local-stack.sh destroy
```

## Contract review route

Read:

1. `docs/architecture/EXOCORE-OPERATIONAL-CHARTER.md`;
2. `docs/architecture/EXOCORE-LANGUAGE-REFERENCE.md`;
3. `docs/architecture/PERSISTENCE-AND-PROJECTION-TOPOLOGY.md`;
4. `contracts/language/exocore.vocabulary.v1.json`;
5. `contracts/language/exocore.taxonomy.v1.json`;
6. `contracts/foundation/exocore.module.v2.schema.json`;
7. `contracts/persistence/exocore.persistence.v1.json`;
8. SQLite and PostgreSQL migration `0001_initial.sql` files.

Run alignment directly:

```bash
python3 scripts/generate_contract_types.py --check
python3 scripts/validate_language_persistence.py
```

## Limits

- SQLite is a transitory single-desktop adapter, not future multi-process authority.
- The desktop does not yet connect to PostgreSQL or dispatch outbox records to Qdrant/Neo4j.
- The Compose stack proves schema and service readiness only; it contains synthetic/no application data.
- No private form response, Hub source, credential, provider data, or external network service is ingested.
- Persistence does not authorize a human decision, publish a projection, or set `verified: true`.
- Kubernetes is deferred because no kube context is configured and the current checkpoint is local-first.
