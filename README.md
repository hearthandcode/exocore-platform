# Exocore Platform

> **Pre-alpha orientation shell.** This repository is the first visible public artifact for Exocore Platform. It launches a local desktop window that holds the project's direction in view. It is not yet a working agent harness or knowledge-management product.

Exocore Platform is exploring a local-first cognitive workbench for people who want durable context, visible agency, and a calmer route back into complex work.

## What runs today

A minimal [Tauri v2](https://v2.tauri.app/) desktop shell renders a static orientation screen. It makes no custom Rust commands and has no database, filesystem integration, model provider, telemetry, adapter, ContextPack, or network service.

The boundary is deliberate. The platform's governance, persistence, adapter, and recovery contracts need separate reviewable design records and proof criteria before they become code.

## Run it locally

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- [Rust](https://www.rust-lang.org/tools/install), including Cargo
- Linux desktop prerequisites for Tauri, if you are on Linux. See the [Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/).

```bash
npm install --include=dev
npm run tauri dev
```

For a production-style local package:

```bash
npm run build
npm run tauri build -- --debug --bundles deb
```

## Current boundaries

This seed intentionally does **not** implement:

- stored work items, receipts, or a CoreStore
- access to local Library files or Hub material
- agent execution, adapters, tool calls, models, or provider accounts
- automatic classification, adaptation, workflow changes, or telemetry
- ContextPack indexing, semantic retrieval, networking, or cloud sync

A successful window launch is evidence only of this small desktop orientation surface. It is not evidence that the future platform's governance or persistence architecture has been implemented.

## Repository map

```text
src/        Browser-compatible TypeScript orientation screen
docs/       Public project posture, boundaries, and roadmap
src-tauri/  Minimal native Tauri host with no custom commands
```

- [Architecture posture](docs/ARCHITECTURE.md)
- [Governance posture](docs/GOVERNANCE.md)
- [Public/private boundary](docs/PUBLIC-PRIVATE-BOUNDARY.md)
- [Roadmap](docs/ROADMAP.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## Contributing

The useful first contributions are boundary questions, plain-language documentation corrections, reproducibility improvements, and small interface suggestions. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change.

## License

[MIT](LICENSE). See [NOTICE](NOTICE.md) for authorship and tooling disclosure.
