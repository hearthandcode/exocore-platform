# Hearth & Code Workbench

> **v0.0.1 pre-alpha.** This repository contains one bounded, working Workbench slice: a local desktop profile-evaluation workroom with a deterministic mock adapter, task-scoped scoring, and append-only application receipts checked for internal consistency.

Hearth & Code Workbench is exploring a local-first software workroom for people who want durable context, visible agency, and a calmer route back into complex work.

## Product and architecture names

**Hearth & Code Workbench** is the provisional public product name. **Exocore** remains the internal architecture, compatibility namespace, and historical name used by this repository. To preserve working contracts and development continuity, the `exocore-platform` repository and package names, Rust crate, Tauri identifier, schema IDs, fixture IDs, worker namespace, and runtime paths remain unchanged in this initial display-name transition.

The name transition does not change what the current proof can do. It has no live model or agent runtime, no provider call, no access to private Library or Hub material, and no authority over a person's files, credentials, profiles, or workflows.

## What runs today

A [Tauri v2](https://v2.tauri.app/) desktop application renders a TypeScript profile-evaluation workroom and invokes a Rust Harness module through typed commands. The application can:

- load a bundled public-safe profile fixture;
- preview its exact adapter, endpoint, network, credential, and attempt policy;
- run a deterministic in-process Rust mock adapter;
- compute a deterministic 1000-point fixture score;
- normalize estimated token evidence;
- write an append-only application JSON receipt with SHA-256 identities;
- reopen the latest receipt after restart; and
- verify output, score, token, reproducibility, and full-receipt internal consistency.

A standard-library Python worker provides a development-only protocol-conformance proof. It is not required by the packaged desktop path and has no policy or release authority.

The current checkpoint also carries an exercised modular-monolith foundation and Persistence & Language Lab: deny-by-default authority and source boundaries, typed configuration and feature flags, an atomic module mount registry, generated taxonomy types, a transitory Tauri-app-data SQLite adapter, ordered migrations, generic records/events/relations/workflows, and a deliberate transactional proof with scoped reset. SQLite is not the forward authority: the contracts designate PostgreSQL for durable operational state and Qdrant/Neo4j as rebuildable projections. The retired one-off architecture form and its form-specific runtime proof are absent from the active surface.

## Run it locally

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- [Rust](https://www.rust-lang.org/tools/install), including Cargo
- Python 3 with `pip`, for contract and worker validation
- Linux desktop prerequisites for Tauri, if you are on Linux. See the [Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/).

```bash
python3 -m pip install --user -r requirements-dev.txt
npm ci --include=dev
npm run proof
npm run tauri dev
```

See the [Persistence Desktop Checkpoint](docs/integration/PERSISTENCE-DESKTOP-CHECKPOINT.md) for the module inventory, language/schema contracts, run/reset route, local stack, and evaluation checklist.

For a production-style local package:

```bash
npm run build
npm run tauri build -- --debug --bundles deb
```

## Current boundaries

This pre-alpha intentionally does **not** implement:

- general work items or a production CoreStore
- PostgreSQL cutover, synchronization, or production database authority
- active vector/graph projectors, semantic retrieval, or automatic graph mutation
- access to local Library files or Hub material
- live agents, tool calls, models, provider accounts, or network adapters
- automatic classification, adaptation, workflow changes, or telemetry
- ContextPack indexing, semantic retrieval, networking, or cloud sync
- credential entry, keychain access, OAuth, signing, updates, or release automation

A successful fixture run is evidence that this mock-only contract, scoring, persistence, and receipt-verification path executed. It is not evidence of model quality, truth, safety, cognitive benefit, or the future platform's full governance architecture.

## Repository map

```text
contracts/language/      Canonical vocabulary, taxonomy, and expression grammar
contracts/persistence/   Logical model, SQLite/PostgreSQL DDL, module declarations, projection contracts
contracts/foundation/    Module, workflow, identifier, and dependency contracts
fixtures/                Synthetic public-safe evaluation fixtures
src/foundation/          TypeScript app-shell, route, store, machine, UI, and typed IPC boundaries
src/persistence/         Public TypeScript persistence contracts and client
src/integration/         Human-reviewable proof compositions
src/harness/             Existing browser-compatible profile-evaluation canary
src-tauri/src/foundation/ Rust authority, flags, registry, IPC, actors, and telemetry
src-tauri/src/persistence/ Rust SQLite boundary, migrations, transactions, status, and reset
src-tauri/src/harness/   Existing Rust profile-evaluation canary
deploy/compose/          Dedicated local PostgreSQL/Qdrant/Neo4j proof stack
workers/                 Optional development-only Python protocol worker
docs/archive/            Historical accepted/deprecated proof records
docs/integration/        Current runnable checkpoint and limits
```

- [Architecture posture](docs/ARCHITECTURE.md)
- [Operational architecture charter](docs/architecture/EXOCORE-OPERATIONAL-CHARTER.md)
- [Persistence and projection topology](docs/architecture/PERSISTENCE-AND-PROJECTION-TOPOLOGY.md)
- [Exocore language reference](docs/architecture/EXOCORE-LANGUAGE-REFERENCE.md)
- [Persistence desktop checkpoint](docs/integration/PERSISTENCE-DESKTOP-CHECKPOINT.md)
- [Foundation topology ADR](docs/foundation/adr/ADR-FOUNDATION-001-modular-monolith-foundation.md)
- [Module mount contract](docs/foundation/MOUNT-CONTRACT.md)
- [Governance posture](docs/GOVERNANCE.md)
- [Public/private boundary](docs/PUBLIC-PRIVATE-BOUNDARY.md)
- [Roadmap](docs/ROADMAP.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## Contributing

The useful first contributions are boundary questions, plain-language documentation corrections, reproducibility improvements, and small interface suggestions. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change.

## License

[MIT](LICENSE). See [NOTICE](NOTICE.md) for authorship and tooling disclosure.
