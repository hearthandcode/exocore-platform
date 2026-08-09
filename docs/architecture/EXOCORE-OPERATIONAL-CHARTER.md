# Exocore Operational Architecture Charter

Status: operator-directed implementation law for this repository. `verified: false`. This charter does not authorize release, deployment, providers, private data, merge to main, or publication.

## Purpose

Exocore is implemented as a language of small, typed, deterministic primitives that compose into modules and workflows. Features remain isolated, default-off, locally runnable, reversible, and independently testable. Repository code is implementation source; private deliberation and release authority remain outside this public repository.

## Resume orientation

Every resumed Exocore session must re-establish the system as **typed primitives -> isolated modules -> declared workflows -> applications and rebuildable projections**. Before editing, record or inspect:

1. the current purpose, thread/work item, bounded outcome, and governing HumanGate;
2. exact repository, branch, HEAD, source commits/digests, workspace owner, Git authority, and concurrent writers;
3. owned paths, no-touch paths, implementation authority, projection boundaries, and stop conditions;
4. affected primitives, semantic owners, module manifests, public ports, adapters, dependency direction, namespaces, and lifecycle;
5. canonical schema, grammar, vocabulary, identifier policy, diagnostic codes, and Rust/TypeScript type sources;
6. safe defaults, capability/authority limits, disclosure class, reversibility, and failure behavior;
7. active workflow version, current state, legal next transition, idempotency/correlation identity, recovery, receipt, and human-gated transitions;
8. the exact local proof command, last directly observed result, synthetic/unproven limits, rollback or reset route, and source drift since that observation; and
9. one smallest composable next action.

If any item that changes route or effect is unknown or conflicting, stop and re-orient rather than inventing a default. A prior summary is a lead only; inspect current files, Git state, contracts, tests, and runtime evidence.

## Required qualities

1. **Composability:** modules interact through versioned public contracts and typed ports, never another feature's private implementation.
2. **Computability:** behavioral rules are schemas, grammars, transition tables, deterministic code, or explicit human gates. Unknown required input fails closed.
3. **Modularity:** every module names one semantic owner, record scope, dependencies, lifecycle, failure behavior, and proof.
4. **Adaptability:** validated configuration, flags, and adapters vary behavior without feature-specific kernel branches.
5. **Evolvability:** contracts, schemas, workflows, diagnostics, deprecations, and migrations are versioned and compatibility-tested.
6. **Language discipline:** identifiers, vocabulary, grammar, schema, Rust types, TypeScript types, and diagnostics align to canonical machine-readable sources.
7. **Workflow support:** workflows compose typed commands, queries, events, guards, idempotency, recovery, and human gates. They are not ambient agent loops.
8. **Proof orientation:** `npm run proof` must fail on any contract, boundary, test, build, security, or native integration failure and emit one bounded summary.

## Primitive vocabulary

Use the smallest accurate unit:

- identifier;
- value;
- record;
- command;
- query;
- event;
- port;
- adapter;
- policy;
- transition;
- projection;
- workflow; and
- receipt.

New primitive classes require a documented gap. Larger behavior should be explainable as compositions of these primitives.

## Module admission

Every module must provide:

- a versioned manifest conforming to the active mount schema;
- one owner and public boundary;
- an owned default-off flag;
- configuration schema or explicit no-config declaration;
- declared route, command, event, contract, and config namespaces;
- a dependency-graph entry;
- typed health, disabled, failure, reset, and unmount behavior;
- synthetic public-safe fixtures; and
- unit and conformance tests.

Registration is atomic. A namespace conflict leaves no partial state. Unmount removes registrations without deleting module-owned data unless a separate deletion decision exists.

## Layering

```text
presentation
  -> typed clients and rebuildable projections
application workflows
  -> public module ports
modules
  -> domain-owned contracts and repository ports
infrastructure adapters
  -> local mechanics and reviewed external effects
workers
  -> bounded jobs under supervision
```

Presentation and infrastructure do not acquire domain authority. Projections cannot mutate authority. Browser code cannot own native effects.

## Contract and language enforcement

- `contracts/foundation/exocore.module-mount.v1.schema.json` governs module admission.
- `contracts/foundation/identifier-policy.json` owns the implementation identifier and primitive vocabulary.
- `contracts/foundation/exocore.workflow.v1.schema.json` governs workflow declarations.
- `contracts/foundation/module-boundary-manifest.json` owns dependency direction.
- `scripts/validate_integration_contracts.py` checks schemas, identifier grammar, workflow references, and source declaration alignment.
- `contracts/foundation/check-boundaries.mjs` checks paths, graph cycles, private imports, and presentation-native effects.

Duplicated patterns or enums require generation or a digest-bound conformance check. Nullable, absent, unanswered, declined, and redacted values remain distinct when their meanings differ.

## Workflow law

A consequential workflow declares its input/output contracts, owner, states, transitions, correlation and idempotency identity, authority at each step, timeout/retry/cancellation policy, failure state, recovery, receipt, and human-gated transitions.

The initial form-intake proof is declared at `contracts/form-intake-registry/v1/proof.workflow.json`. Its user-start and reset transitions are deliberate human actions. Internal synthetic transformations do not promote review, disposition, publication, or verification state.

## Local proof standard

The proof may use synthetic data, in-memory adapters, process-local flags, and local traces. It must:

- start with no network, provider, credential, or private-data requirement;
- inventory mounted modules and health;
- leave feature behavior disabled by default;
- enable only after a deliberate local action;
- exercise one versioned workflow end to end;
- expose metadata-only projections;
- demonstrate deterministic identity, dedupe, freshness, supersession, and reset; and
- state what remains synthetic or unproven.

Run:

```text
npm ci --include=dev
npm run proof
npm run tauri dev
```

The desktop card can then run and reset the mounted Form Intake Registry proof. A passing proof is evidence only. It does not set `verified: true` or authorize release.

## Change protocol

Before substantive work:

1. read `AGENTS.md`, this charter, direct contracts, and the nearest feature documentation;
2. declare scope, owned paths, no-touch paths, proof, rollback, and stop conditions;
3. change contracts and invalid/boundary fixtures before implementation when semantics change;
4. preserve private feature boundaries and canonical source authority;
5. run `npm run proof`; and
6. stop at the named human decision.

Stop if a contract or digest conflicts, ownership is ambiguous, the safe default has effects, a feature needs kernel-private bypasses, a workflow transition is unknown, private data appears, or the composed proof fails.

## Context7

Context7 may retrieve current public dependency documentation. Queries must omit private source, credentials, personal data, proprietary snippets, and local paths. Context7 output is retrieval assistance; upstream documentation, lockfiles, installed types, source, and tests remain authority. Context7 is not a runtime dependency.
