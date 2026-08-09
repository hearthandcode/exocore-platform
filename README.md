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

The integration proof also carries an exercised modular-monolith foundation: deny-by-default authority and source boundaries, typed configuration and feature flags, an atomic module mount registry, typed IPC errors, a supervised Rust actor, local structured traces, and explicit Zustand/XState presentation boundaries. The Form Intake Registry is registered through `exocore.module-mount.v1` but disabled by default. A deliberate synthetic-only workflow can enable it, prove ingest/dedupe/projection/freshness/supersession behavior in memory, and reset it without exposing raw answers. This structure is not a released feature and does not change the canary's authority.

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

See [Foundation and Form Intake Registry Proof of Concept](docs/integration/FOUNDATION-INTAKE-POC.md) for the expected module inventory, workflow, reset route, and evaluation checklist.

For a production-style local package:

```bash
npm run build
npm run tauri build -- --debug --bundles deb
```

## Current boundaries

This pre-alpha intentionally does **not** implement:

- general work items, a CoreStore, or a database
- access to local Library files or Hub material
- live agents, tool calls, models, provider accounts, or network adapters
- automatic classification, adaptation, workflow changes, or telemetry
- ContextPack indexing, semantic retrieval, networking, or cloud sync
- credential entry, keychain access, OAuth, signing, updates, or release automation

A successful fixture run is evidence that this mock-only contract, scoring, persistence, and receipt-verification path executed. It is not evidence of model quality, truth, safety, cognitive benefit, or the future platform's full governance architecture.

## Repository map

```text
contracts/              Versioned public interchange and foundation mount contracts
fixtures/               Synthetic public-safe evaluation fixtures
src/foundation/          TypeScript app-shell, route, store, machine, UI, and typed IPC boundaries
src/form-intake-registry/ Isolated form intake domain, ports, adapters, projections, and validation
src/integration/          Public-port-only proof compositions
src/harness/             Existing browser-compatible profile-evaluation canary
src-tauri/src/foundation/ Rust authority, source, identity, config, flags, mount, IPC, actor, and telemetry modules
src-tauri/src/harness/   Existing Rust profile-evaluation canary
workers/                 Optional development-only Python protocol worker
docs/foundation/         Foundation ADR, operating contracts, checkpoints, and review evidence
docs/integration/        Locally runnable integration proofs and limits
```

- [Architecture posture](docs/ARCHITECTURE.md)
- [Operational architecture charter](docs/architecture/EXOCORE-OPERATIONAL-CHARTER.md)
- [Foundation and Intake proof](docs/integration/FOUNDATION-INTAKE-POC.md)
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
