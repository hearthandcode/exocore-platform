# Modularity and file-boundary standard

Status: active development standard; human verification remains separate.

## Purpose

Exocore is a modular monolith, not a monolithic codebase. A single deployable may contain many small, well-scoped modules. The default is to add a focused file, adapter, extension, or module rather than expand a mixed-purpose file.

Line count is a drift detector, not an architecture. Cohesion, dependency direction, authority, and reasons to change remain the governing tests.

## Required rules

1. A source file has one primary responsibility and one primary reason to change.
2. A feature is a vertical slice with an explicit public surface and private internals.
3. New behavior goes in a new focused file when adding it to an existing file would mix responsibilities, layers, authorities, or independent test seams.
4. Source files should remain at or below 200 logical lines. Crossing 200 lines requires a split or a dated policy exception with an owner, reason, and split plan.
5. Boundary barrels (`index.ts`, `mod.rs`, `__init__.py`) contain exports and minimal registration only; their threshold is 80 lines.
6. Public APIs use named exports. A barrel may reveal a boundary but must not hide business logic.
7. Features do not import another feature's private files, state, or storage. Shared behavior moves to an admitted foundation contract or a separately owned module.
8. Extension points use versioned contracts, interfaces or Rust traits, events, dependency injection, config, hooks, or the reviewed mount contract. They do not use ambient globals.
9. Configuration selects admitted behavior; it does not become an untyped scripting backdoor.
10. Exceptions expose debt. They never redefine an oversized file as compliant.

## Split triggers

Split a file before adding more behavior when any of these is true:

- two sections have independent reasons to change;
- domain logic is mixed with filesystem, network, process, database, UI, or framework glue;
- validation, normalization, persistence, projection, and orchestration are combined without testable seams;
- public contracts and private implementation are interleaved;
- a unit cannot be tested without constructing unrelated behavior;
- an extension requires editing a central switch instead of registering through an admitted interface;
- the file crosses its configured line threshold.

A cohesive parser or state machine may justify an exception. The exception must name why splitting would reduce clarity, who owns the debt, what change triggers a split, and when the exception is reviewed.

## Type ownership and extensibility

A single `types.ts` file is allowed when it represents one cohesive module vocabulary. “One type file” is not permission for a global catch-all.

Use this ownership order:

1. private implementation types stay beside the implementation that owns them;
2. feature-level domain types live in that feature and are exported only when consumers need them;
3. cross-process or cross-package types derive from a versioned schema or contract;
4. foundation types contain only genuinely shared primitives and must not import feature internals.

Types evolve additively where compatibility permits. Breaking contract changes receive a new version and migration route. Extension interfaces should accept new implementations without requiring edits to unrelated modules. Closed discriminated unions are appropriate only when the set is intentionally governed and versioned.

## Recommended feature shape

```text
src/<feature>/
  index.ts                 named public exports only
  module.ts                composition and public operations
  types.ts                 cohesive feature vocabulary
  errors.ts                typed failure contract
  validation.ts            input validation
  projection.ts            rebuildable view generation
  internal/
    adapters/              external boundary implementations
    stores/                persistence implementations
    normalization/         deterministic transformations
```

This is a pattern, not a mandatory empty scaffold. Create only files that own real behavior. Further split an internal directory when one file would collect unrelated adapters, stores, or transformations.

## Dependency direction

```text
versioned contracts
  ↑
foundation public APIs ← feature public boundary ← feature private internals
  ↑                               ↑
infrastructure adapters       presentation adapter
```

Infrastructure implements domain-owned ports. Presentation projects state. Neither owns domain semantics. Cross-feature composition occurs through the foundation registry or another reviewed contract, never a private import.

## Automated policy

Run:

```text
npm run check:modularity
npm run test:modularity
```

`config/modularity-policy.json` defines thresholds and temporary exceptions. The checker scans TypeScript, TSX, Rust, and Python source; an unapproved oversized file fails. Existing oversized canary files remain visible as warnings and must be split before unrelated behavior is added.

The checker cannot determine cohesion, coupling, authority, or whether an interface is useful. Reviewers must still apply this document.

## Review checklist

- [ ] Can each changed file be described with one responsibility?
- [ ] Did new behavior create or use a focused module instead of enlarging a mixed file?
- [ ] Are public exports explicit and private internals unreachable through the boundary?
- [ ] Are types owned by the narrowest correct domain and extendable through a versioned seam?
- [ ] Does dependency direction avoid feature-to-feature private imports?
- [ ] Are adapters, storage, projection, validation, and orchestration separable where they change independently?
- [ ] Does `npm run check:modularity` pass without adding an unjustified exception?
- [ ] If an exception exists, are owner, reason, split plan, and review date still current?
- [ ] Do tests exercise the public boundary rather than coupled internals?
- [ ] Is any new extension point documented and versioned?

## Current visible debt

The initial canary predates this standard. `src/main.ts` and `src-tauri/src/harness/service.rs` have dated exceptions. They are not templates for new code. Adding unrelated behavior to either file triggers decomposition first.
