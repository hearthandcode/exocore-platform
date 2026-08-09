# Exocore foundation feature packet

## 1. Feature brief

The foundation gives Exocore one structural place for future features to mount without redesigning the Tauri shell or placing business logic in shared kernel code. It supplies a versioned mount contract, conservative Rust machinery, explicit TypeScript presentation boundaries, and an exercised structural demonstration. It is foundation, not a user feature or release.

## 2. Problem and opportunity

The v0.0.1 profile-evaluation proof is healthy but vertically coupled. Without a named module boundary, the next feature could create duplicate config, flags, IPC, state, and registration conventions. The opportunity is to freeze the smallest shared foundation while preserving the proof as a canary.

## 3. Specification and acceptance

| Capability                         | Acceptance evidence                                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Module topology                    | Proposed ADR plus 12-module acyclic boundary manifest                                                             |
| Rust governance foundation         | authority, source, identity, config, flags, module registry, IPC, actor, telemetry modules compile and have tests |
| TypeScript presentation foundation | app shell, routes, UI, Zustand store, XState machine, IPC client, and contracts compile and have tests            |
| Mount contract                     | v1 JSON Schema, atomic registry, duplicate/config/flag/contract rejection, unmount, disabled-export tests         |
| Config                             | unknown fields and unsafe defaults return `E_CONFIG`                                                              |
| Feature flags                      | registered, owned, false by default; demonstration flag toggles only local route state                            |
| Typed IPC                          | foundation status and echo commands use versioned payloads and stable safe errors                                 |
| Actor proof                        | bounded request/reply, health, and clean shutdown                                                                 |
| Observability                      | local structured trace with correlation id and mechanical credential-like redaction                               |
| Canary parity                      | all original Rust, TypeScript build, and Python checks remain green                                               |

## 4. Experience and interaction

The existing profile-evaluation workroom remains primary. A separate foundation boundary card reports mount contract, default authority, module count, actor health, and skeleton-route state. At the safe default the route is absent. The operator can explicitly exercise the local flag, then run a bounded actor echo. Text labels carry every state; no color-only signal or hidden native effect exists.

## 5. Domain and concept model

- **Foundation:** shared structural machinery with no business feature semantics.
- **Module manifest:** a versioned declaration of module identity, config, flag, commands, routes, contracts, and health.
- **Module registry:** atomic in-process owner of admitted namespaces.
- **Safe default:** `false` for feature behavior and `deny` for native authority.
- **Typed command:** a concept-shaped IPC operation with versioned input/output and a typed error.
- **Actor supervisor:** owner of a bounded worker thread and its lifecycle.
- **Presentation projection:** rebuildable UI state derived from native results, never canonical authority.
- **Canary:** the unchanged profile-evaluation proof used for regression evidence.

## 6. Technical design

ADR-FOUNDATION-001 and `module-boundary-manifest.json` own topology. `exocore.module-mount.v1` owns registration. Rust validates all native boundaries, loading package defaults from `default.config.json`, applying any explicitly named overlay through the same validator, and invoking feature-local config validation before atomic mount. TypeScript uses `zustand/vanilla` for cross-cutting projections and XState for request lifecycle. One Tauri `Mutex<FoundationRuntime>` holds process-local registry/flag state; it has no external adapter. Contracts remain transport-neutral.

## 7. Data, schema, and contract posture

This slice adds no database and no authoritative runtime records. JSON Schema defines module manifests. Rust structs deny unknown configuration and command fields. Stable SHA-256 correlation material is local diagnostic identity, not user or source identity. Future repositories are ports owned by their domain module; PostgreSQL remains a separately gated infrastructure implementation.

## 8. AI and agent behavior

No application path calls an LLM, model, agent, tool provider, or network. The executing Codex model authored a candidate implementation under Scott's explicit override, but model output has no runtime authority. Same-model review is labelled as such. Future agent dispatch is excluded.

## 9. Threat, safety, and failure analysis

| Threat or failure                | Control and evidence                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| Capability broadening            | authority allows status/echo only; source, process, network, and secret capabilities deny |
| Traversal                        | parent/root locators return `E_TRAVERSAL` before any adapter                              |
| Oversized source                 | configured byte bound returns `E_TOO_LARGE`                                               |
| Invalid encoding                 | strict UTF-8 validation returns `E_ENCODING`                                              |
| Unsafe/unknown config            | deny-unknown deserialization and invariant validation return `E_CONFIG`                   |
| Namespace collision              | entire mount rejects before registry mutation                                             |
| Disabled feature invoked         | registry returns `E_DISABLED` until reviewed flag is enabled                              |
| Malformed/oversized/bidi command | echo validation returns `E_VALIDATION`                                                    |
| Credential-like log detail       | mechanical redaction removes value                                                        |
| Actor failure                    | closed mailbox/timeout uses `E_ACTOR`; no panic path                                      |
| Poisoned runtime lock            | operator-safe `E_INTERNAL`; no internal data crosses IPC                                  |
| Canary regression                | full original verification suite is mandatory at Evaluation                               |

Residual risk: the structural proof does not establish durable config recovery, real feature load, real-data safety, provider isolation, or production deployment fitness.

## 10. Test and evaluation plan

- **Unit:** Rust module behavior and TypeScript state/route/machine behavior.
- **Contract:** module schema, atomic mount collision cases, typed errors, and typed echo.
- **Integration:** native runtime construction, Tauri command registration/build, UI compilation, demonstration flag and actor flow.
- **Parity:** original build, 7 canary Rust tests, Python protocol tests, and receipt behavior.
- **Adversarial:** traversal, size, encoding, unknown config, unsafe default, duplicate ids, disabled export, invalid command, bidi input, and trace redaction.
- **Manual runtime:** debug executable remains alive for 15 seconds without panic or error log. This proves startup stability only, not visual correctness or accessibility.

## 11. Observability and measurement

See `OBSERVABILITY.md`. Events are local and redacted. Test counts, build exits, and checkpoint evidence are receipts, not remote telemetry.

## 12. Rollout, migration, and release

No rollout, migration, merge, push, or release occurs in this lane. Evaluation returns the task branch and review packet. Scott may accept, revise, reject, park, or queue improvements. Intake mounting requires both lane Evaluation records and a separately released Integration Checkpoint. Rollback is branch/worktree removal; main and external state remain untouched.

## 13. Operational guide

From a clean task-branch checkout:

```text
npm ci --include=dev
npm run check
npm test
npm run check:boundaries
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo check --manifest-path src-tauri/Cargo.toml --offline
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --offline -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --offline
npm run tauri build -- --debug --no-bundle
```

Run `npm run tauri dev` to inspect the workroom. The foundation card begins disabled. Exercising its route changes process-local demonstration state only. Do not use this branch with real private data, providers, or Hub write access.

## 14. Decision and change log

The durable log is `DECISION-AND-CHANGE-LOG.md`. It records the Codex substitution, worktree isolation, topology, dependency selection, actor posture, and unmounted intake boundary.
