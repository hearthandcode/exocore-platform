# ADR-FOUNDATION-001: Modular-monolith foundation and mount boundary

- **Status:** proposed
- **Date:** 2026-08-08
- **Decision owner:** Scott
- **Implementation branch:** `feat/exocore-foundation-structure`
- **Governing ecosystem decision:** ADR-ECO-001 revision 2 (`accepted`, `approved-for-design`, `verified: false`)

## Context

The v0.0.1 profile-evaluation proof is a working vertical slice, but the repository has no general module-registration boundary, shared configuration and flag machinery, actor-supervision pattern, or presentation package boundary. Future features must mount without moving business logic into the kernel or weakening the existing Rust/TypeScript authority split.

## Decision

Use one Tauri deployable with two explicit layers:

1. `src-tauri/src/foundation/` is the Rust governance foundation. Its modules are `authority`, `source`, `identity`, `config`, `flags`, `module_registry`, `ipc`, `actor`, and `telemetry`.
2. `src/foundation/` is the browser-compatible presentation foundation. Its modules are `app-shell`, `routes`, `ui`, `store`, `machine`, `ipc`, and `contracts`.
3. `contracts/foundation/` contains transport-neutral, versioned schemas and the machine-readable boundary manifest.
4. Existing profile-evaluation paths remain an admitted canary. They are not moved into the foundation during this slice.

A feature joins the monolith by supplying `exocore.module-mount.v1`. Registration is atomic: validate the manifest, config namespace, flag declaration, contract namespaces, routes, and commands; reject any collision; then commit the module registration. No feature reads another feature's private state or tables. Domain modules own repository ports; future infrastructure implements them.

## Dependency rules

- Contracts depend on nothing.
- Rust foundation modules may depend on contracts and Rust standard/library dependencies, but not on feature modules or presentation code.
- Rust feature modules may depend on foundation public APIs and their own contracts, never another feature's internals.
- Presentation foundation may depend on contracts and browser-compatible libraries.
- Presentation feature modules may depend on presentation foundation and their own contracts.
- Infrastructure implements ports; it does not own domain semantics.
- Projections consume committed state and cannot mutate canonical sources.
- The existing `harness` canary remains beside the foundation until a separate migration decision.

## Public extension points

Only these extension points are admitted:

- versioned module mount manifests;
- namespaced contract registration;
- typed config keys and feature-flag declarations;
- typed IPC commands with the shared error envelope;
- actor message types behind bounded supervisors.

A new extension point requires an ADR amendment. Dynamic plug-in loading is deferred.

## Alternatives rejected

- **Microservices:** introduces distributed failure and deployment complexity before extraction pressure exists.
- **One unrestricted Tauri command surface:** violates the concept-shaped, deny-by-default boundary.
- **Ambient global registries:** hide ownership and make tests order-dependent.
- **Immediate canary migration:** risks the working proof without producing additional foundation evidence.
- **PostgreSQL now:** conflicts with this lane's explicit exclusion; repository ports are sufficient.

## Consequences

Positive: features gain a stable mount contract, collisions fail closed, dependencies are legible, and future extraction remains possible. Cost: the canary and foundation coexist temporarily, and adapters are initially in-memory proofs rather than durable infrastructure.

## Reversal and amendment

Reversal is branch rollback because no migration or external state is introduced. Additive v1 contract changes require a minor contract revision; breaking changes require `exocore.module-mount.v2`, migration posture, and a reviewed ADR amendment. This proposal is not accepted merely because its tests pass.
