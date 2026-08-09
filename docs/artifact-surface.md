# Artifact Surface v0.1

## Status

This directory contains an unmounted, public-safe implementation candidate for displaying validated `ArtifactReference` projections in Exocore. It is bound to the accepted Intake Form Grammar v0.2 source-candidate digest set, but it is a derived projection and is not canonical.

## What this slice proves

- a closed TypeScript contract for artifact identity, path, digest, class, lifecycle, review state, sensitivity, provenance, bounded content, and graph relations;
- fail-closed validation of unknown values, unsafe paths, duplicate identities, unresolved graph targets, authority inflation, and incomplete effect denial;
- a credential-free, cache-disabled fetch loader;
- an accessible renderer seam using semantic navigation, native buttons, visible state labels, bounded content, and escaped projection strings;
- a deterministic synthetic fixture and adversarial validator that require every consequential effect to remain denied.

## What this slice does not prove

- live Hub discovery or filesystem policy;
- private or internal artifact display;
- a native Tauri command or Rust adapter;
- CoreStore persistence, graph retrieval, or restart recovery;
- mounted application accessibility or usability;
- canonical write-back, ingestion, workflow transitions, HumanGate decisions, providers, scheduling, migration, publication, deployment, or Git release behavior.

The synthetic paths are repository-relative examples. They are not private Hub paths and do not assert that corresponding files exist.

## Source, projection, and application boundary

The private Hub remains the source plane. `public/artifact-surface/artifact-surface.v0.1.json` is a synthetic non-authoritative projection. `src/artifact-surface/` is browser-compatible presentation code. It contains no filesystem, process, network-provider, policy, persistence, credential, or canonical-write capability.

The projection contract records the SHA-256 identity of the accepted IFG final digest set. A changed source-set identity requires explicit rebinding and revalidation.

## Files

- `public/artifact-surface/artifact-surface.v0.1.schema.json`: closed projection schema.
- `public/artifact-surface/artifact-surface.v0.1.json`: two synthetic representative records.
- `src/artifact-surface/contracts.ts`: strong application types.
- `src/artifact-surface/validate.ts`: fail-closed runtime validator.
- `src/artifact-surface/api.ts`: read-only fetch loader.
- `src/artifact-surface/render.ts`: accessible unmounted renderer seam.
- `scripts/validate-artifact-surface-projection.mjs`: positive and adversarial fixture checks.

## Verification

Run without installing dependencies:

```text
node scripts/validate-artifact-surface-projection.mjs
node scripts/validate-intake-registry-projection.mjs
tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --lib ES2022,DOM src/artifact-surface/index.ts src/artifact-surface/contracts.ts src/artifact-surface/validate.ts src/artifact-surface/api.ts src/artifact-surface/render.ts
```

A repository-wide Vite build still requires the repository dependency tree. Dependency installation is not part of this slice.

## Mounting gate

`src/main.ts` and `src/style.css` are intentionally unchanged. The primary Exocore checkout has unrelated modifications to those shared entrypoints. A later reconciliation must compare the active shell, review the renderer output, and authorize the smallest mount change. Until then this is a compiled, validated, unmounted application seam.
