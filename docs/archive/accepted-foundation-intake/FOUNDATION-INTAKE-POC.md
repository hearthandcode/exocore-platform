# Foundation and Form Intake Registry Proof of Concept

Status: integration candidate, local synthetic proof, `verified: false`.

## Recognition

- **Purpose:** Demonstrate that the foundation kernel and an isolated feature can compose through a versioned manifest, generic module controls, public ports, a typed workflow, and one local proof command.
- **Source lineage:** foundation `25142857bbeb878bd353d0e5a570e2bc280ca9de`; form intake `ae9a02c183253023b8789d54992a862dde466f9e`; integration merge `738250be430028548ee9257b8e6f6b3f93d6045e`.
- **Authority:** implementation evidence only. No real data, review promotion, disposition, release, deployment, or publication.
- **Next action:** run the proof and desktop demonstration, inspect the boundaries, then choose retain, revise, park, or discard.

## Composition

```text
Rust foundation runtime
  -> parses and atomically mounts module-manifest.json
  -> registers flag, route, commands, contracts, and config keys
  -> reports module inventory and health
  -> controls the default-off module flag through typed IPC

TypeScript integration adapter
  -> consumes only the public form-intake barrel
  -> supplies a browser-safe in-memory store
  -> loads public-safe synthetic fixtures
  -> executes proof.workflow.json
  -> renders metadata-only evidence
```

The Form Intake Registry continues to own validation, normalization, identity, dedupe, supersession, projection, and freshness semantics. The foundation owns registration and local flag state. The integration adapter owns only the proof composition.

## Contracts

| Contract                                                   | Role                                        |
| ---------------------------------------------------------- | ------------------------------------------- |
| `contracts/foundation/exocore.module-mount.v1.schema.json` | Module admission shape                      |
| `contracts/form-intake-registry/v1/module-manifest.json`   | Intake registration declaration             |
| `contracts/form-intake-registry/v1/config.schema.json`     | Synthetic-memory proof configuration        |
| `contracts/foundation/identifier-policy.json`              | Identifier grammar and primitive vocabulary |
| `contracts/foundation/exocore.workflow.v1.schema.json`     | Typed workflow shape                        |
| `contracts/form-intake-registry/v1/proof.workflow.json`    | Eight-step proof workflow                   |
| `contracts/foundation/module-boundary-manifest.json`       | Sixteen-module dependency graph             |

## Run the deterministic proof

```bash
python3 -m pip install --user -r requirements-dev.txt
npm ci --include=dev
npm run proof
```

For a faster TypeScript/contracts/build loop:

```bash
npm run proof:quick
```

The full proof composes formatting, lint, TypeScript, Vitest, module boundaries, schema and workflow checks, adjacent projection validators, web build, Rust format/check/Clippy/tests, Python tests/compile, npm audit, and a Tauri debug build. It exits on the first failure and emits one `PROOF_SUMMARY` line.

## Run the desktop demonstration

```bash
npm run tauri dev
```

Expected initial state:

1. Foundation inventory lists `foundation` and `form-intake-registry`.
2. Both module flags are disabled.
3. No Form Intake Registry state exists.
4. The proof card states synthetic-only, in-memory, and projection evidence.

Choose **Run mounted intake proof**. The application then:

1. proves the disabled domain module returns `E_DISABLED` and writes zero records;
2. deliberately enables the native module flag;
3. ingests the synthetic export;
4. deduplicates equivalent input;
5. builds and verifies a metadata-only projection;
6. changes the synthetic source and detects staleness;
7. registers a linked successor; and
8. reports IDs, counts, and typed evidence without raw answers.

Choose **Reset and disable** to clear the in-memory proof state and return the native module flag to false.

## Evaluate the result

Inspect:

- module inventory and safe defaults;
- absence of Node native imports in presentation/integration paths;
- public barrel use by the integration adapter;
- manifest/config/workflow validation;
- deterministic IDs across repeat runs;
- no raw answer bodies in rendered HTML;
- disabled zero-write and reset behavior;
- proof command output and final summary;
- exact branch diff and dependency additions.

## Limits

- Fixtures are fabricated public-safe data.
- Store and flag state are process-local and resettable.
- The browser workflow mirrors the native registration state but native Rust does not execute intake domain logic.
- There is no real form import, durable storage, UI accessibility audit, provider, network, deployment, signing, release, or publication.
- A successful proof does not accept the foundation or intake candidate, set `verified: true`, or authorize merge to main.
