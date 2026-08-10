# AGENTS: Exocore Platform public implementation

## Scope

This repository is the public, runnable Exocore Platform implementation. The private Hearth & Code Hub remains the source home for research records, private profiles, architecture deliberation, and release decisions.

## Current lane

The current implementation target is a local-first Tauri desktop pre-alpha at version `0.0.1`. Rust owns native effects, policy, adapter supervision, deterministic scoring, and receipt consistency verification. Browser-compatible TypeScript owns presentation. Python is optional worker code behind a versioned Rust-supervised protocol.

## Required boundaries

- Do not copy private Hub paths, profiles, fixtures, research data, credentials, or autobiographical material into this repository.
- Do not add live providers, network access, credential storage, OAuth, analytics, telemetry, auto-update, signing, or deployment without a separate reviewed plan and explicit release.
- The WebView must not own filesystem, process, network, scoring, policy, or secret effects.
- Python workers must not own desktop lifecycle, policy, receipt acceptance, baseline changes, profile promotion, or release state.
- Schemas and public fixtures are versioned contracts. Unknown required fields and unknown capabilities fail closed.
- A score is task-bounded evidence. It is not a claim of truth, safety, intelligence, or general effectiveness.
- Preserve unrelated changes. Stop on concurrent ownership of the same path.
- Do not stage, commit, push, tag, publish, deploy, or rewrite history unless explicitly requested.

## Modularity and file boundaries

- Read `docs/development/implementation-checklist.md` before feature implementation and `docs/development/modularity-standard.md` before adding an extension point, shared type, or source file above the configured threshold.
- Prefer many small, single-purpose files and modules over consolidated implementation files. Add a focused file when behavior has an independent reason to change.
- Treat 200 logical lines as a review threshold, not a substitute for architectural judgment. Split the file or add a dated, owned exception in `config/modularity-policy.json`.
- Keep types owned by the narrowest domain. A cohesive module `types.ts` is allowed; global type aggregation must be versioned, additive, and free of feature implementation dependencies.
- Use explicit named exports and meaningful boundary barrels. Keep implementation out of `index.ts`, `mod.rs`, and `__init__.py` files.
- Extend through versioned contracts, interfaces or traits, events, dependency injection, config, hooks, and reviewed mount points. Never reach into another feature's private internals.
- Existing policy exceptions are visible refactor debt, not patterns for new work. Adding unrelated behavior to an excepted file requires decomposition first.

## Verification

Before handing off a source change, run the applicable checks:

```text
npm run check:modularity
npm run test:modularity
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo check --manifest-path src-tauri/Cargo.toml --offline
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --offline -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --offline
python3 -m unittest discover -s workers/profile-evaluation-python/tests -v
python3 -m compileall -q workers/profile-evaluation-python/src workers/profile-evaluation-python/tests
git diff --check
```

A local build or test does not authorize a release.