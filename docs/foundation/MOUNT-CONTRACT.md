# Exocore module mount contract v1

## Purpose

`exocore.module-mount.v1` is the only admitted feature-registration boundary for this foundation. It lets a feature declare what it needs without editing kernel internals. The machine contract is `contracts/foundation/exocore.module-mount.v1.schema.json`.

## Required declaration

A module supplies:

- stable `module_id` and semantic `module_version`;
- `register` and `health` public operations;
- one versioned config schema;
- one deny-by-default flag owned by the module;
- zero or more versioned route and command identifiers;
- one or more versioned contract namespaces;
- namespaced config keys.

The intake lane's expected declaration is `form-intake-registry`, flag `form-intake-registry.enabled` with default `false`, config namespace `exocore.intake-registry.config.v1`, and contract namespace `exocore.intake-registry.v1`. This is a compatibility example, not an implementation or mount authorization.

## Foundation guarantees

`ModuleRegistry` validates all declarations before changing registry state. It rejects duplicate module ids, flag ids, config keys, contract namespaces, command ids, and route ids. Invalid config or an unsupported mount-contract version fails closed. Registration is atomic: a rejection leaves the prior registry unchanged.

Disabled modules are inert. Their exported commands return `E_DISABLED`; no module state is written. Health reports registration and enabled posture without promoting review or verification state.

## Versioning

Readers accept exactly v1. Unknown required fields and unknown contract versions fail closed. Additive schema changes require an explicit minor release note. Breaking changes create `exocore.module-mount.v2`; v1 remains readable and any migration is separately gated.

## Rollback

Unmount removes the module-owned registry entries atomically. It does not delete feature data. Mount and unmount do not change canonical sources, Hub records, deployment state, or Git state.

## Required contract tests

1. Valid mount succeeds and emits a local receipt.
2. Duplicate module id is rejected without partial state.
3. Invalid config namespace is rejected.
4. Flag-id or contract-namespace collision is rejected.
5. Unmount makes the module inert and leaves the canary unaffected.
6. Disabling the flag returns `E_DISABLED`.

The Foundation Evaluation Checkpoint proves the generic registry cases. Mounting the intake module remains a separately released Integration Checkpoint.
