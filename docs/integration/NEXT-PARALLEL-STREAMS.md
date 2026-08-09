# Next Parallel Development Streams

Status: proposed execution contract after the persistence desktop checkpoint reaches local `main`; no stream is launched by this document.

## Shared starting checkpoint

Both streams branch from the same reviewed main-integration commit and record that exact SHA. They do not branch from each other. Each uses a task-scoped Git worktree and task-branch commits only. One named integration owner controls shared contracts, package files, canonical main, merge order, and push decisions.

## Stream A — Persistence and Projection Infrastructure

**Goal:** Replace proof-only mechanics with a PostgreSQL adapter and supervised, idempotent Qdrant/Neo4j projectors while preserving SQLite migration/recovery.

**Owned paths:**

```text
contracts/persistence/
deploy/compose/
src-tauri/src/persistence/
workers/persistence-projectors/
tests/persistence/
docs/persistence/
```

**No-touch:** presentation, profile-evaluation canary, shared language/module schemas, root package files, `src/main.ts`, canonical main.

**Checkpoint evidence:** PostgreSQL conformance, export/import digest parity, outbox retry/idempotency, Qdrant rebuild, Neo4j rebuild, failure recovery, restricted-data exclusion, resource limits, and local-stack teardown.

## Stream B — Workbench and Application Workflows

**Goal:** Build useful human-reviewable workroom operations over public persistence ports without acquiring native or storage authority.

**Owned paths:**

```text
src/workbench/
src/integration/workbench-review/
tests/workbench/
docs/workbench/
```

**No-touch:** native persistence implementation, Compose, migrations, projector workers, shared language/module schemas, root package files, canonical main.

**Checkpoint evidence:** typed workflow declarations, keyboard/focus/accessibility review, proposal-versus-decision separation, restart/re-entry behavior, metadata disclosure, failure/recovery UI, and deterministic browser tests.

## Integration lane — Shared Contracts and Main

Only the integration owner changes:

```text
contracts/foundation/
contracts/language/
src/contracts/generated/
src-tauri/src/lib.rs
src/main.ts
package.json
package-lock.json
.github/workflows/
```

The owner:

1. accepts each stream only at its declared checkpoint;
2. fetches exact commits and changed-path manifests;
3. verifies no ownership overlap;
4. runs generation and schema compatibility before implementation merges;
5. merges infrastructure before application only when Stream B's public-port version is compatible;
6. runs the full proof and local stack from the composed tree;
7. records conflicts, residual risks, and rollback; and
8. stops for a separate push/release decision.

## Fan-in contract

A stream handoff must provide base SHA, head SHA, exact changed paths, contract versions consumed/provided, commands run, results, unresolved gates, migration effect, rollback, and one requested integration action. A summary is not proof.

Shared-contract change discovered by either stream becomes a proposal to the integration lane. The stream must not edit shared paths opportunistically. Unknown version, namespace, migration, effect, or authority conflicts fail closed.
