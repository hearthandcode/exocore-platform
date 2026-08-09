# Intake Registry projection module

Status: unmounted candidate on `feature/ifg11-intake-registry`.

The Intake Registry module is an application-facing projection of a separately governed grammar. The generated JSON and its schema are public-safe, synthetic-only, and non-authoritative. They can be rebuilt from digest-bound Hub sources, but the public Exocore repository does not contain or depend on private Hub paths at runtime.

## Ownership boundary

| Plane | Owns | Must not own |
|---|---|---|
| Harness | intake grammar, category/profile/facet semantics, legal workflow transitions, HumanGates, review routes | retrieval truth, application-shell composition, provider authority |
| Cortex | provenance-qualified evidence candidates and bounded retrieval context | intake classification, workflow advancement, approval, publication |
| Exocore application shell | composition, presentation mounting, health aggregation | Harness policy, Cortex evidence truth, canonical Hub writes |
| Projection runtime | rebuildable views and freshness observations | source authority, silent write-back, provider mutation |

A future `intake.evidence-context.query` port may connect Harness to Cortex. Its result is a cited candidate bundle only. The port cannot classify an intake item or advance its workflow.

## Current implementation seam

- `public/intake-registry/intake-registry.v0.2.json` is the deterministic projection.
- `public/intake-registry/intake-registry.v0.2.schema.json` is its public contract.
- `src/intake-registry/contracts.ts` supplies strong application types.
- `src/intake-registry/validate.ts` rejects authority inflation, workflow drift, incomplete crosswalks, or active effects.
- `src/intake-registry/api.ts` loads the packaged projection with credentials omitted.
- `scripts/validate-intake-registry-projection.mjs` provides a dependency-free application-side check.

The module is intentionally not imported by `src/main.ts`. Mounting a UI route, adding native commands, enabling filesystem or network access, connecting Notion, or creating task/calendar records requires a later review and explicit release.

## Reconciliation

The branch is based on `10a0a0614c1809294b74b2fba5c41757f5507e61`. It deliberately does not modify the concurrently edited `README.md`, `index.html`, `src/main.ts`, or `src/style.css`. Reconcile those shell changes first, then review this module as an additive branch. Do not treat a clean merge as evidence that the product semantics or public release have been approved.
