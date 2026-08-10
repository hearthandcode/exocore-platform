# Exocore implementation checklist

Status: active planning and review checklist; it does not authorize a dependency, migration, provider, capability, or release.

## Why this exists

The questionnaire-derived development direction is broader than a stack list. Future Exocore work must show how a feature preserves module boundaries, authority, contracts, tests, security, provenance, operations, and reversibility. A missing capability is recorded as a gap or explicit deferral, not silently treated as implemented.

## Before implementation

- [ ] Name the user outcome, scope, non-goals, owner, source authority, and acceptance criteria.
- [ ] Identify the current ADR or create an amendment when architecture, authority, persistence, public API, or an extension point changes.
- [ ] Draw the vertical slice: public boundary, private internals, contracts, adapters, state owner, projection, and external effects.
- [ ] Apply `modularity-standard.md`: focused files, domain-owned types, dependency direction, and extension seams.
- [ ] Define consumed and emitted data, schema versions, compatibility, migration, provenance, and source/projection status.
- [ ] Classify security/privacy scope, assets, trust boundaries, abuse cases, controls, residual risks, detection, and recovery.
- [ ] Select only the feature-package documents that carry real decisions; explicitly mark inapplicable intelligent-component sections rather than inventing content.
- [ ] Record deviations from the current standards with owner, reason, consequence, review date, and reversal route.

## During implementation

- [ ] Keep browser code free of filesystem, process, network, policy, scoring, and secret effects.
- [ ] Keep domain semantics behind typed public interfaces; infrastructure implements domain-owned ports.
- [ ] Use result types and typed error envelopes across boundaries.
- [ ] Keep flags deny-by-default and feature-scoped.
- [ ] Add new behavior through a focused module or admitted extension point, not an ambient registry or cross-feature private import.
- [ ] Keep fixtures synthetic and public-safe unless a separately governed real-data release exists.
- [ ] Write deterministic unit tests with table-driven boundary cases and regression tests for defects.
- [ ] Add integration tests for real adjacent boundaries when the feature introduces persistence, IPC, serialization, authorization, or external adapters.
- [ ] Add E2E, accessibility, visual, performance, or security tests when the acceptance criteria make those claims.
- [ ] Update operator docs, decisions, contracts, and change history alongside code.

## Before handoff

- [ ] Run `npm run check:modularity` and `npm run test:modularity`.
- [ ] Run every applicable repository command listed in `AGENTS.md`.
- [ ] Run dependency/advisory checks and report actual results; do not imply SBOM, cargo-audit, browser, performance, or accessibility coverage when no configured check exists.
- [ ] Confirm no private path, source, fixture, credential, or autobiographical material crossed into the public repository.
- [ ] Record exact changed paths, commands, results, unrun checks, residual risks, rollback, and one bounded next decision.
- [ ] Keep implementation, human review, verification, merge, deployment, and publication as distinct states.

## Current adoption matrix

This matrix describes the public baseline at the time this checklist was introduced. Candidate branches do not count as merged capability.

| Questionnaire-derived direction | Current evidence | State |
| --- | --- | --- |
| Tauri desktop with Rust authority and TypeScript presentation | runnable pre-alpha canary | implemented, bounded |
| Vite, TypeScript check, GitHub Actions | package scripts and CI | implemented |
| Modular monolith, explicit mounts, actor supervision, Zustand/XState, built-in flags | isolated foundation candidate | candidate; not baseline authority |
| Per-feature vertical slices and versioned contracts | canary modules and isolated feature lanes | partial and improving |
| Small focused files and modular type ownership | standard, policy, checker, tests, CI candidate | operationalized in this change; incorporation pending |
| React presentation | no React dependency in baseline | not implemented; requires an architecture/migration decision |
| Bun package manager | npm lock and npm CI are current | divergent; do not switch opportunistically |
| Prettier, ESLint, commitlint, pre-commit hooks | no baseline configuration | not implemented |
| Vitest | used in isolated feature lanes, absent from baseline package | partial/candidate |
| PostgreSQL authoritative runtime store | explicitly deferred by current public proof | not implemented; requires reviewed data-authority design |
| OAuth, ABAC/scopes/containers | prohibited in current public lane without separate review | not implemented |
| Turborepo, release-please, Astro, OpenAPI | no baseline configuration | not implemented |
| visual, performance, security, accessibility, coverage suites | no baseline commands | not implemented |
| cargo-audit, Dependabot, SBOM | npm audit can run; remaining controls are absent | partial |
| fourteen-document feature package and nine-stage security review | used selectively in isolated feature evidence | partial; must be declared per feature |

## Deviation rule

A difference between this matrix and the questionnaire is not permission to add tooling. Record it as one of:

- **implemented**: direct current evidence exists;
- **candidate**: isolated, review-pending evidence exists;
- **deferred**: the governing plan intentionally excludes it;
- **divergent**: current implementation uses another choice and needs a decision before migration;
- **not implemented**: no current evidence exists.

Only a current instruction or reviewed decision authorizes movement between those states.
