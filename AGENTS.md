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

## Verification

Before handing off a source change, run the applicable checks:

```text
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