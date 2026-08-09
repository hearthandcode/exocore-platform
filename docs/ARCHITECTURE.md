# Architecture posture

## Status

Exocore Platform is at version `0.0.1` pre-alpha. The repository contains one complete profile-evaluation path in a Tauri v2 desktop application. It uses a browser-compatible TypeScript workroom, Rust control plane, and optional development-only Python worker protocol.

The app stores only synthetic run receipts and Persistence Lab records in its operating-system application-data directory. It has no authority over a person's Library, Hub, provider accounts, credentials, profiles, or workflow.

## Direction

The project is exploring a local-first cognitive workbench with five connected concerns:

1. **A readable workroom:** a place to orient around one active thread, its next meaningful action, and its recovery route after interruption.
2. **Visible agency:** assistance may generate a proposal, but a human must be able to see its reason, scope, and reversal path before it becomes durable.
3. **Durable provenance:** useful artifacts need a legible relationship to their sources, decisions, and changes.
4. **Class-specific authority:** user-facing Library work should remain where people can inspect and version it, while dynamic operational facts require a separately designed local authority and recovery contract.
5. **Rebuildable views:** indexes and interfaces should not silently become the authority they render.

## Executing boundary

| Layer               | Owns                                                                                                                                                                                            | Does not own                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Rust Harness        | policy, fixture validation, deterministic adapter, scoring, token normalization, SHA-256 identities, append-only application receipt writing, internal consistency verification, Tauri commands | private sources, live-provider authority, profile promotion, public release decisions           |
| Rust persistence    | SQLite migrations, transactions, generic record/event/relation/workflow mechanics, scoped proof reset, typed commands                                                                           | Hub authority, domain meaning, PostgreSQL cutover, vector/graph truth, or private form material |
| TypeScript workroom | visible fixture selection, policy preview, progress, score and receipt projections                                                                                                              | filesystem, process, network, scoring, policy, or secret effects                                |
| Python worker       | a versioned development protocol-conformance response                                                                                                                                           | desktop lifecycle, receipt acceptance, policy, credentials, baseline changes, or release state  |

The default desktop execution path uses the Rust mock adapter. Python is not required to run the app.

## Modular-monolith foundation

The initial foundation is additive to the canary. Rust modules under `src-tauri/src/foundation/` own conservative authority, source-locator validation, identities, validated configuration, deny-by-default flags, atomic module registration, typed IPC, actor supervision, and local redacted trace events. TypeScript modules under `src/foundation/` own only the app-shell projection, route declarations, shared UI rendering, a Zustand vanilla projection store, an XState lifecycle machine, and typed IPC clients.

Features mount through `exocore.module-mount.v1`; duplicate module, flag, config, route, command, or contract namespaces reject the entire mount. Module v2 adds lifecycle, ports, effects, migrations, extension points, deprecation, and proof declarations. No feature reads another feature's private state. The foundation and persistence modules register disabled. Status causes no database creation; a deliberate local action enables and runs the transactional SQLite proof, and reset removes only its namespace before disabling the module.

The [operational architecture charter](architecture/EXOCORE-OPERATIONAL-CHARTER.md) defines the composability, computability, modularity, adaptability, evolvability, language/type, workflow, and proof constraints. The [language reference](architecture/EXOCORE-LANGUAGE-REFERENCE.md), [persistence topology](architecture/PERSISTENCE-AND-PROJECTION-TOPOLOGY.md), and [checkpoint guide](integration/PERSISTENCE-DESKTOP-CHECKPOINT.md) define the current executable direction. See also [ADR-FOUNDATION-001](foundation/adr/ADR-FOUNDATION-001-modular-monolith-foundation.md) and the [mount contract](foundation/MOUNT-CONTRACT.md).

## Contract and receipt model

Public JSON Schemas define the fixture and worker interchange boundary. Rust structs reject unknown fields for executing fixture and receipt records. The current canonical JSON subset accepts nulls, booleans, integers, strings, arrays, and sorted-key objects; floating-point values fail closed. SHA-256 hashes identify fixture, profile, output, reproducibility inputs, and the full receipt.

Run IDs and timestamps are runtime metadata. The reproducibility hash excludes runtime path and time so two equivalent mock runs can be compared without pretending they are the same event.

## What is not decided here

This repository now selects SQLite only as a transitory embedded adapter and formalizes PostgreSQL as the future durable operational authority with Qdrant/Neo4j projections. It does not claim a production CoreStore, synchronization, conflict resolution, PostgreSQL cutover, live-provider policy, credentials, or background automation. Those remain separately gated design and proof tasks.

The current native proof demonstrates a denied external-capability policy, bounded local receipt creation, integrity verification, and recoverable close/reopen behavior for one synthetic fixture. It does not prove provider isolation or general agent behavior because no live provider or agent runtime is present.

## Technology boundary

Tauri v2 pairs the browser-compatible TypeScript interface with the Rust control plane. Custom commands expose the bounded profile-evaluation, foundation, and persistence operations used by the workroom. Persistence resolves only the Tauri application-data directory through Rust; browser code receives counts and typed evidence, not a filesystem path or database handle. The current capability file grants Tauri core defaults but no filesystem, shell, HTTP, updater, or credential plugin permission. Any future plugin or sidecar requires an explicit capability and threat-model amendment.
