# Foundation Evaluation review packet

## Evaluation identity

- **Evaluation checkpoint:** `EXO-FOUNDATION-20260808-E1`
- **Implementation commits:** `fb8c608987b00b976acabee1c0363bc1ea55bb64` and completion commit `e66908977d295382d272333d8a72e917d54fdc3e`
- **Final implementation tree:** `c685c3e71ec0f4828c840c9afb91f2ede04eb89a`
- **Branch:** `feat/exocore-foundation-structure`
- **Review type:** executing-model self-review and deterministic-tool review; same-model, not independent
- **Outcome proposed to Scott:** `pass-with-followups`

## 1. What now exists

Exocore has an exercised modular-monolith foundation beside the unchanged v0.0.1 profile-evaluation canary. Rust owns conservative authority, source validation, identity, config, flags, atomic module registration, typed IPC, actor supervision, and redacted local traces. TypeScript owns only the app-shell projection, route declaration, UI, Zustand store, XState lifecycle, and typed clients.

A future feature can declare `exocore.module-mount.v1` without editing kernel internals. The form-intake lane has an attributed, digest-bound handoff, but its feature remains unmounted.

## 2. How to run it

```text
npm ci --include=dev
npm run format:check
npm run lint
npm run check
npm test
npm run check:boundaries
npm run build
npm audit --audit-level=low
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo check --manifest-path src-tauri/Cargo.toml --offline
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --offline -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --offline
python3 -m unittest discover -s workers/profile-evaluation-python/tests -v
python3 -m compileall -q workers/profile-evaluation-python/src workers/profile-evaluation-python/tests
npm run tauri build -- --debug --no-bundle
```

For manual inspection use `npm run tauri dev`. The foundation card starts with its skeleton route disabled. The operator can exercise the process-local flag and typed actor echo; neither operation grants external authority.

## 3. What to inspect

1. `docs/foundation/adr/ADR-FOUNDATION-001-modular-monolith-foundation.md`
2. `contracts/foundation/module-boundary-manifest.json`
3. `docs/foundation/MOUNT-CONTRACT.md`
4. `src-tauri/src/foundation/module_registry.rs`
5. `src-tauri/src/foundation/ipc.rs`
6. `src/foundation/app-shell.ts`
7. `docs/foundation/MOUNT-HANDOFF-FORM-INTAKE.md`
8. `docs/foundation/FOUNDATION-FEATURE-PACKET.md`
9. `docs/foundation/ROUND-NEXT-READINESS.md`

## 4. Change groups

- **Kernel:** 11 Rust foundation files plus explicit Tauri registration/state management.
- **Presentation:** 9 TypeScript foundation files plus additive rendering/binding in `src/main.ts`.
- **Contracts:** mount JSON Schema, 12-module boundary manifest, and deterministic acyclic/path validator.
- **Tooling:** Vitest, XState, Zustand, Prettier, ESLint, expanded CI, zero-vulnerability lockfile resolution.
- **Documentation:** topology ADR, config/flag/IPC/state/actor/observability/mount guides, 14-part feature packet, four checkpoint records including this Evaluation, candidates, handoff, review packet, and receipt.

## 5. What did not change

- No file under `src/harness/`, `src-tauri/src/harness/`, `contracts/profile-evaluation/`, `fixtures/profile-evaluation/`, or `workers/profile-evaluation-python/` changed.
- No `form/` or intake-branch path changed.
- No Hub file changed.
- No database, provider, credential, network feature, OAuth, telemetry service, updater, signing, deployment, Track A route, form runtime, memory, workflow engine, or agent dispatch was added.
- `main` retains its pre-existing untracked report and form material untouched.
- No push, merge, tag, publication, deployment, or verification seal occurred.

## 6. Verification evidence

| Check                                      | Result                                                  | Bounded claim                                                          |
| ------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Prettier check                             | pass                                                    | owned formatting scope conforms                                        |
| ESLint                                     | pass                                                    | owned TypeScript integration scope has no configured lint errors       |
| `tsc --noEmit`                             | pass                                                    | TypeScript types resolve                                               |
| Vitest                                     | 3/3 pass                                                | safe route default, projection store, XState lifecycle assertions pass |
| Boundary validator                         | 12 modules, acyclic                                     | declared paths exist and declared graph has no cycle                   |
| Vite build                                 | 23 modules                                              | browser bundle compiles                                                |
| npm audit                                  | 0 vulnerabilities                                       | current lockfile audit reported zero at Evaluation time                |
| rustfmt                                    | pass                                                    | Rust source is formatted                                               |
| cargo check                                | pass                                                    | Rust library/application compile offline                               |
| clippy `-D warnings`                       | pass                                                    | all Rust targets satisfy configured lint strictness                    |
| cargo test                                 | 29/29 pass                                              | 22 foundation and 7 unchanged canary tests pass                        |
| Python unittest/compile                    | pass                                                    | existing development worker protocol remains healthy                   |
| Tauri debug no-bundle build                | pass                                                    | native application builds and command registration compiles            |
| Native launch                              | 15 seconds, timeout 124, zero log bytes, no panic/error | built desktop process remained alive for the observation window        |
| `git diff --check`                         | pass                                                    | no whitespace errors                                                   |
| High-confidence staged secret-pattern scan | no matches                                              | staged diff contains no matched private-key/token signature            |
| pi-lens gitleaks runner                    | no finding reported                                     | auxiliary project scan found no secret issue in the scanned scope      |

Pi-lens reported two module-resolution errors in pre-existing `src/harness/api.ts` and `vite.config.ts` because its language server remained rooted in the Hub rather than this external worktree. They were recorded as false positives only after worktree-local `tsc`, ESLint, Vite, Vitest, and Tauri builds resolved the same packages successfully.

## 7. Posture review

- Dependency directions are explicit and machine-readable.
- A feature can mount generically without kernel edits when the v1 contract is sufficient.
- Configuration replaces branching in the new foundation; package defaults and a named overlay share one typed validator, while no process-environment adapter is introduced.
- Safe defaults are `deny`, empty source roots, strict UTF-8, local stdout events, and flags off.
- The operator can inspect the structural proof without gaining filesystem, process, network, secret, provider, or Hub authority.
- Foundation modules contain no intake, workroom-projection, memory, provider, or other feature logic.

## 8. Known limitations and residual risks

- ADR-FOUNDATION-001 remains proposed until Scott decides.
- Config and flag overrides are process-local demonstration state.
- The actor proof uses one standard-library thread; it does not prove restart budgets or durable mailboxes.
- The boundary validator checks declared paths and graph cycles; it does not parse every source import.
- Commitlint and a local pre-commit hook runner are not configured; the two task commits were manually checked as Conventional Commits and CI runs the underlying checks.
- Visual and accessibility behavior was compiled and structurally reviewed but not inspected with an automated browser accessibility tree.
- No real feature, real data, durable store, provider, or production package was exercised.
- The mount handoff becomes stale if any listed contract digest changes.

## 9. Improvement candidates

Eight complete 21-field candidates are in `IMPROVEMENT-CANDIDATES.yaml`: dependency policy, durable config adapter, authorization seam, contract generation, checkpoint automation, Context7 documentation integration assessment, a separately gated Hub downstream record, and local hook/commitlint tooling. None authorizes follow-on work.

## 10. Approval gates

| Gate                        | Evaluation state            | Evidence or residual condition                                                           |
| --------------------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| Scope and Requirements      | passed by lane              | Gate 0 ownership, exclusions, and no-touch diff                                          |
| Architecture                | pending Scott               | proposed ADR and mount contract; no human acceptance claimed                             |
| Security                    | passed by lane              | deny/traversal/size/encoding/config/disabled/bidi/redaction tests; residual limits above |
| Test and Evaluation         | passed by lane              | complete command table above                                                             |
| Governance and Provenance   | passed by lane              | source digests, branch/commit/tree, checkpoints, no Hub write                            |
| Human Approval              | pending Scott               | only Scott chooses an outcome                                                            |
| Release Readiness           | not-applicable              | lane stops before release-readiness stage                                                |
| Dependency and Supply Chain | passed by lane              | direct additions MIT; current npm audit zero; no SBOM route yet                          |
| Data Integrity              | passed by lane              | synthetic/no-data foundation; canary receipts remain green                               |
| Operational Readiness       | passed for structural proof | local launch/build/rollback evidence; no production claim                                |

## 11. Decisions for Scott

Choose one; this packet does not choose for you:

1. **Accept foundation:** preserve commit and release only the separately defined next gate. Rollback remains branch reversion.
2. **Accept with queued improvements:** accept foundation while keeping selected candidates pending and non-authorizing.
3. **Request revision:** name acceptance-blocking defects; resume at the Evaluation checkpoint and rerun the full suite.
4. **Adapt the contract:** open an ADR/contract amendment with evidence and preserve v1 papertrail.
5. **Park:** preserve branch, commit, packet, and handoff; no integration follows.
6. **Reject and revert:** discard the task worktree/branch; main and external state are unchanged.

## Stop statement

The foundation lane stops at this Evaluation Checkpoint. Intake mounting, branch integration, main merge, push, Track A, release-readiness, deployment, and publication remain unreleased.
