# Mount-contract handoff to the form-intake lane

- **Handoff id:** HH-20260808-FOUNDATION-001
- **From:** Foundation lane, current Codex model, branch `feat/exocore-foundation-structure`
- **To:** Form-intake registry lane
- **Authority class:** attributed implementation handoff; not integration or release authority
- **Foundation checkpoint:** `EXO-FOUNDATION-20260808-E1`, lane disposition `pass-with-followups`; Human-Gate pending

## Exact contract packet

| Record                                                                  | SHA-256                                                            |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `contracts/foundation/exocore.module-mount.v1.schema.json`              | `c8ff2451fe5e66c953616d07bdf5be0dd0085bec3fee47aacea61161210f3a6d` |
| `docs/foundation/MOUNT-CONTRACT.md`                                     | `fda30ff35341439ec0e1ab4702a6abfe3ec789fd35b060a578c0b7bf62567703` |
| `contracts/foundation/module-boundary-manifest.json`                    | `f70c903f3017a2d0a1244834e64bd217e43c37177046cc6cfdd490a476ae72b7` |
| `contracts/foundation/default.config.json`                              | `7f0ff58400afda8738a6ce85e74a6e1b59ede1c84fafda994f11e53a542a18fa` |
| `docs/foundation/adr/ADR-FOUNDATION-001-modular-monolith-foundation.md` | `8b0c0534c7c66f2c20b8a8886c948b8273d8d1454571e7f189d0dfaf54fe2214` |

## Consumer declaration

The intake module may prepare an isolated manifest with:

- `module_id: form-intake-registry`
- `module_version: 0.1.0`
- `config_schema: exocore.intake-registry.config.v1`
- `flag_id: form-intake-registry.enabled`, owner `form-intake-registry`, default `false`
- contract `exocore.intake-registry.v1`
- feature-local config keys prefixed `form-intake-registry.`
- only versioned route and command ids

The lane owns its manifest and may report a mismatch. It must not edit foundation registry, config, flags, IPC, or topology paths. If the contract cannot express a requirement, record a conflict or improvement candidate; do not work around it.

## What the foundation proves

Atomic generic mount/unmount, duplicate rejection, invalid config namespace and feature-config rejection, flag and contract collision rejection, disabled-export denial, typed health, and safe-default flag behavior have executable Rust tests. The boundary manifest validates 12 existing acyclic module declarations. The Tauri build registers status, flag-toggle, and echo commands.

## What this handoff does not authorize

It does not mount the intake module, merge branches, change main, resolve a contract conflict, accept ADR-FOUNDATION-001, use real form data, or release Track A. Integration waits for both Evaluation Checkpoints and Scott's explicit Integration Checkpoint release.

## Return route

The intake lane returns a mount-readiness report naming the exact contract digests above, its module manifest digest, deviations, conflicts, and independent verification results. Source drift in any packet digest makes this handoff stale.
