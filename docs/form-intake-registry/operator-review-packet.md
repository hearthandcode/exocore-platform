# Form Intake Registry operator review packet

Evaluation outcome: **pass-with-followups** for the isolated, unmounted slice. Human acceptance remains pending. `verified: false`.

## Recognition

- **Purpose:** give Scott one reproducible review surface for the implemented form-intake pipeline.
- **Location:** `docs/form-intake-registry/operator-review-packet.md`.
- **Papertrail:** Orientation, Contract, and Implementation checkpoints; feature packet; test output; mount-readiness record.
- **Verification state:** local implementation evidence, not release or mount authority.
- **Next action:** choose one HumanGate disposition; no mount or further feature work is implied.

## 1. What now works

The current form-v3 export can be read from a bounded root, validated, normalized into explicit per-question candidates, registered with stable identity and provenance, deduplicated, superseded after an answer change, projected without raw answer bodies, and verified against its current source bytes. The `n3` absent-value pattern becomes an explicit `answered: false` candidate. Restricted payloads use digest-plus-locator storage.

## 2. How to run it

From the feature worktree:

```text
npm ci
npm run test:form-intake-registry
npm run check
npm run build
```

The test command is the synthetic demonstration. No real export, network, provider, Hub write, or mounted route is needed.

## 3. Demonstration trace

Fixture: `fixtures/form-intake-registry/synthetic-export.json`.

1. Adapter reads `input.json` under a disposable canonical root and computes exact SHA-256.
2. Validator accepts the actual form-v3 response-array shape and warns that `fixtureNote` is an inert extension.
3. Normalizer creates five deterministic candidates; `n3` is unanswered with `answer_value: null`; duplicate multi-choice values are removed and sorted.
4. First registration inserts one `exocore.intake-registry.v1` record.
5. Fifty identical ingests retain one record and one registry ID.
6. Reordered questions and reordered multi-choice values still deduplicate.
7. Projection carries identity, digest, freshness, authority, review/disposition, and answered-state metadata, but no answer body.
8. Verify reports `current` while source and rendered digests match.
9. Replacing the same locator with `synthetic-export-mutated.json` makes the prior projection `stale` on `source_digest`.
10. Re-ingestion creates a new record and links the old record through `superseded_by`; the new projection verifies current.
11. With the flag off, calls return `E_DISABLED` and store count remains zero.

## 4. What changed and did not change

Changed only the feature-owned contracts, fixtures, TypeScript module, tests, documentation, and the package manifest/lock needed for Vitest and Node types.

Did not change: `src/main.ts`, `src/style.css`, `index.html`, `src-tauri/`, the existing `src/intake-registry/` grammar projection, Artifact Surface, public projection files, the form app, any Hub source, or the foundation worktree.

## 5. Verification results and limits

- `npm run test`: 5 files, 33 tests passed. Proves only the declared synthetic assertions.
- `npm run check`: passed. Proves TypeScript type-checking.
- `npm run build`: passed; eight mounted modules transformed. Proves the existing unmounted app build, not a form-intake mount.
- Existing Intake Registry projection: 34/34 passed.
- Existing Artifact Surface: 43/43 passed.
- Draft 2020-12 meta-schema check: both new contracts passed.
- `npm audit --audit-level=moderate`: zero known vulnerabilities after bounded transitive fixes.
- Rust format/check/clippy/test offline: passed. Rust source was not changed.
- Python worker unittest/compileall: passed. Python source was not changed.
- `git diff --check`: passed.
- Pi LSP and session diagnostics: clean after final source edits.

Not run because the repository has no configured command: Prettier, ESLint, TypeScript coverage, browser accessibility, performance benchmark, cargo-audit, SBOM generation, E2E desktop launch, or a real-data/manual operator trial. These are not implied by the passing checks.

## 6. Security and privacy findings

1. **Classification and scope:** internal form intake; real payloads may be personal or strategic; fixtures are synthetic.
2. **Assets and boundaries:** source bytes, payload, identity, digests, review/disposition, and projection. Adapter root and store root are separate.
3. **Threats:** traversal, symlink escape, oversize input, invalid UTF-8, malformed schema, invisible controls, prompt injection, duplicate storm, source tamper, disabled-call writes, store failure, and projection leakage.
4. **Controls:** canonical path checks, fatal UTF-8, size bound, typed errors, schema/version checks, deterministic hashes, feature-local storage, restricted locator mode, metadata-only projection, default-off flag.
5. **Implementation review:** no network, credentials, provider, OAuth, telemetry, remote embed, shell mount, native capability, or Hub write exists.
6. **Adversarial tests:** traversal/symlink/size/encoding/schema/invisible-control/prompt text/50-run duplicate/tamper/disabled/store-failure cases pass.
7. **Residual risk:** file-store transaction and crash recovery, source authenticity, real-data classification, mounted accessibility, and real Hub-candidate shape remain unproven.
8. **Detection:** local JSONL store events contain event plus non-secret ID; no payload bodies or external telemetry.
9. **Recovery:** remove disposable projections/store, rebuild from source, or delete the unmounted lane. Source bytes remain unchanged.

Fixture review found no private paths, credentials, real personal response, or Hub locator. Dependency licenses: Vitest MIT; `@types/node` MIT.

## 7. Mount posture

The module is isolated and unmounted. The foundation worktree had no attributed mount-contract handoff at Gate 0. This lane consumed no inferred interface and built no competing flag registry, config system, IPC machinery, or kernel registration. `docs/form-intake-registry/mount-readiness.md` states the handoff fields required later.

## 8. Known limitations

- Hub candidate ingestion is intentionally held at `E_CONFLICT`; the v0.2 direct source binds grammar projection files, not runtime candidate records.
- The file store is a v0 implementation seam, not a PostgreSQL or concurrent-transaction proof.
- Disposition writes do not exist.
- Restricted projections redact all candidate detail, including counts derived only from the hidden payload.
- No UI is mounted, so accessibility and operator experience remain specifications rather than implementation evidence.
- No real private data was used.

## 9. Improvement candidates by disposition

- **blocked:** IC-FIR-002 Hub candidate-record shape; IC-FIR-004 attributed mount handoff.
- **queue-next-phase:** IC-FIR-001 form-export schema adoption; IC-FIR-005 transactional store adapter.
- **defer:** IC-FIR-003 disposition-write feature; IC-FIR-006 additional source adapters.

No candidate authorizes work.

## 10. Decisions for Scott

HumanGate options:

1. **Accept the unmounted slice:** retain it for later mount reconciliation.
2. **Accept with queued improvements:** retain it and queue named candidates only.
3. **Request revision:** name an acceptance-blocking defect inside the current slice.
4. **Adapt the contract:** open a reviewed amendment before implementation changes.
5. **Park:** preserve branch and checkpoints without further action.
6. **Reject and revert:** remove this lane's owned paths and manifest/lock changes.

Separate later decisions: attributed mount timing, form-export schema adoption, Hub candidate shape, real-export sensitivity defaults, disposition writes, and storage migration.

## Rollback and recommended next step

Rollback is path-scoped: revert this lane's commit on `feature/ifg11-intake-registry` or remove only the exact owned paths and package changes. No Hub, shell, native, provider, database, or deployment rollback is required.

Recommended next step: **accept the unmounted slice with IC-FIR-001 and IC-FIR-005 queued, then wait for an attributed foundation mount-contract handoff.**
