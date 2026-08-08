# Foundation Orientation Checkpoint

```yaml
schema: exocore.feature-checkpoint.v1
checkpoint_id: EXO-FOUNDATION-20260808-O1
feature_id: exocore-foundation
feature_version: 0.1.0
lifecycle_state: orientation
checkpoint_type: Orientation
model_assignment:
  prompt_assignment: Kimi K3
  executing_assignment: current Codex model
  substitution_authority: Scott's explicit 2026-08-08 goal override
  review_posture: same-model unless a separately identified reviewer is used
  effect: model label only; foundation scope, gates, checkpoints, and exclusions are unchanged
governing_sources:
  - Hub AGENTS.md v6 and Exocore Platform AGENTS.md
  - Exocore Orientation and Development Report revision 1
  - Projection Layer is Exocore decision revision 1
  - ADR-ECO-001 revision 2
  - Checkpoint and Stage Plan revision 1
  - Downstream Work Map revision 1
  - Exocore foundation goal prompt dated 2026-08-08
source_digests:
  orientation_report: f859fe4c5f2f59819b4a7f073afb0825218acfe4396c81e9559b207a46c10b65
  projection_decision: 72022feaff0daf242a815cb5723e86acc8699595fc59bf75931c4479ba57005e
  adr_eco_001: 15b15a99ca87f1d4e3ab40c78e05b6bfb7d921e0c87454ca1f71e68273fac732
  checkpoint_plan: c190b1f3e7d13c1b29ef3704e08aaba60f6c0bdc1e8eba13f280f5f2608ee8e3
  downstream_work_map: 1b07cefadd5321192f9ac25457e77308836ede90e5d550ebfad956a1086ea0bc
  foundation_goal_prompt: 6af859127323f32ba0a47d723099dfb5f947f29a6c4fa00a0baf2d4f78a6c360
owned_paths:
  - docs/foundation/**
  - contracts/foundation/**
  - src/foundation/**
  - src-tauri/src/foundation/**
  - src-tauri/src/lib.rs
  - src/main.ts
  - package.json
  - package-lock.json
  - src-tauri/Cargo.toml
  - src-tauri/Cargo.lock
  - README.md
  - docs/ARCHITECTURE.md
  - .github/workflows/ci.yml
excluded_paths:
  - form/**
  - contracts/profile-evaluation/**
  - fixtures/profile-evaluation/**
  - src/harness/**
  - src-tauri/src/harness/**
  - src-tauri/src/commands/profile_evaluation.rs
  - workers/profile-evaluation-python/**
  - the canonical Hub checkout
  - the ifg11-intake-registry worktree and branch
  - main and all remote branches
entry_criteria:
  - explicit goal release received with Codex substitution
  - isolated task worktree created from main at 0a827ca1ce3d3458d924996661ad49191233bce0
  - platform and Hub authority chains read
  - baseline parity commands completed
acceptance_criteria:
  - repository and concurrent ownership are legible
  - governing source revisions and digests are recorded
  - existing v0.0.1 proof passes its complete documented verification set
  - one bounded foundation slice and its exclusions are declared
verification_runs:
  - command: npm run build
    exit_status: 0
    proves: TypeScript and Vite baseline build succeeds
  - command: npm run check
    exit_status: 0
    proves: TypeScript baseline typecheck succeeds
  - command: cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
    exit_status: 0
    proves: Rust baseline formatting passes
  - command: cargo check --manifest-path src-tauri/Cargo.toml --offline
    exit_status: 0
    proves: Rust baseline compiles with cached dependencies
  - command: cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --offline -- -D warnings
    exit_status: 0
    proves: Rust baseline is warning-free under configured lint scope
  - command: cargo test --manifest-path src-tauri/Cargo.toml --offline
    exit_status: 0
    proves: 7 existing Rust canary tests pass
  - command: python3 -m unittest discover -s workers/profile-evaluation-python/tests -v
    exit_status: 0
    proves: development worker protocol baseline passes
  - command: python3 -m compileall -q workers/profile-evaluation-python/src workers/profile-evaluation-python/tests
    exit_status: 0
    proves: development worker Python compiles
  - command: git diff --check
    exit_status: 0
    proves: baseline has no whitespace errors
artifacts:
  - docs/foundation/checkpoints/2026-08-08-orientation.md
observations:
  - main contains untracked docs/exocore-orientation-and-development-report.md and form/ material; this worktree neither contains nor owns it
  - feature/ifg11-intake-registry exists in a separate worktree at commit 4ac9d0c and is treated as read-only adjacent evidence
  - no foundation checkpoint or mount-contract implementation existed at the base commit
  - the accepted ecosystem topology ADR supplies design authority while draft sources remain direction and evidence, not verification seals
risks:
  - repository display name still says Hearth & Code Workbench while Exocore remains the architecture namespace
  - package installation reports two dependency advisories; no audit fix is authorized because it could change the selected toolchain
  - both implementation lanes may eventually need additive files under contracts; foundation ownership is restricted to contracts/foundation
improvement_candidates:
  - id: EXO-FOUNDATION-IC-001
    disposition: queue-next-phase
    summary: add a separately reviewed dependency and vulnerability-management policy
    owner: future release/security slice
decision_required: none for foundation implementation through Evaluation
disposition: constrained-go
rollback_route: discard the isolated foundation worktree or revert bounded task-branch commits; main is untouched
resume_route: read this checkpoint, then freeze the topology and mount contracts before implementation
```

## Reconciliation matrix

| Source statement                     | Repository observation                                                         | Classification         | Foundation response                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Preserve the v0.0.1 proof            | The profile-evaluation canary builds and all seven Rust tests pass             | aligned                | Keep canary implementation paths no-touch and rerun parity at integration and Evaluation                |
| Rust owns effects and policy         | Existing Rust harness owns fixture reads, scoring, hashing, and receipt writes | aligned                | Add foundation kernel modules beside the harness, not inside it                                         |
| Typed Tauri IPC                      | Five concept-shaped canary commands already exist                              | aligned                | Add one typed foundation demonstration command and shared error envelope; never add generic file access |
| Modular monolith                     | Current repo has one harness module but no general module registry or manifest | gap                    | Add a versioned mount contract, registry, boundary manifest, and dependency rules                       |
| Declarative config and feature flags | No foundation configuration or flag registry exists                            | gap                    | Add validated, deny-by-default in-memory foundations without environment scattering                     |
| Zustand plus XState boundaries       | Current presentation is one local TypeScript state object                      | gap                    | Introduce explicit store and lifecycle-machine homes while leaving the canary behavior intact           |
| Actor-oriented concurrency           | No actor/supervisor skeleton exists                                            | gap                    | Add and exercise a bounded standard-library Rust actor with supervision evidence                        |
| Traces-first local observability     | Existing proof has no shared correlation/error envelope                        | gap                    | Add redacted structured event and correlation primitives with no external sink                          |
| PostgreSQL is planned                | No database dependency exists                                                  | aligned with exclusion | Preserve repository ports only; do not add PostgreSQL                                                   |
| Intake lane runs separately          | IFG11 branch/worktree exists and main has untracked form material              | ownership constraint   | Do not read-write either lane; publish the mount contract as an attributed handoff only                 |

## Gate 0 result

**Constrained go.** Foundation implementation may proceed in `feat/exocore-foundation-structure` inside this isolated worktree. The Codex substitution is explicit and bounded to the executing model assignment. It does not alter scope, authority, gates, checkpoint vocabulary, exclusions, Git limits, or the requirement to stop at the Foundation Evaluation Checkpoint.
