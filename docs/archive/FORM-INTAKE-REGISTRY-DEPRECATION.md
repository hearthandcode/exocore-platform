# Form Intake Registry Deprecation

Status: deprecated and removed from the active tree after operator acceptance of the integration proof. Historical bytes remain recoverable from Git; `verified: false`.

## Recognition

- **Purpose:** Preserve why the form-specific module was removed without deleting its evaluated history.
- **Accepted proof:** `integration/foundation-intake-poc@c913352b25b06deff99d0d5fcf3a0c2dbe3e33d5`.
- **Original feature source:** `feature/ifg11-intake-registry@ae9a02c183253023b8789d54992a862dde466f9e`.
- **Retirement instruction:** Scott confirmed the one-off architecture form had served its purpose and requested archive, deprecation, and removal from the working surface.
- **Replacement route:** source-neutral persistence and future intake adapter contracts; no active replacement form UI.

## Disposition

The Form Intake Registry successfully proved that a real isolated feature could mount through the foundation, retain a private implementation boundary, execute a typed workflow, deduplicate input, track lineage/freshness, produce a metadata-only projection, and reset safely. Scott accepted that proof as architecture evidence.

The module was nevertheless coupled to the one-off `exocore-architecture-form-v3` export. Keeping it in the active tree after the questionnaire's retirement would turn a completed elicitation tool into accidental product scope. The final main candidate therefore removes its runtime registration, desktop panel, source, fixtures, contracts, and active tests.

## Historical recovery

Use Git rather than copying historical source into an active namespace:

```text
accepted integration tree: c913352b25b06deff99d0d5fcf3a0c2dbe3e33d5
feature source tree: ae9a02c183253023b8789d54992a862dde466f9e
paths: contracts/form-intake-registry/, fixtures/form-intake-registry/,
       src/form-intake-registry/, tests/form-intake-registry/,
       docs/form-intake-registry/, src/integration/form-intake-proof/
```

The original private form application and responses are not in Git. They are retained in the restricted local archive named by the governed Hub archive receipt.

## Future intake rule

A future intake capability must be source-neutral:

- declare an adapter contract rather than a form schema as module identity;
- ingest only after sensitivity, consent, and authority checks;
- preserve source bytes outside projections;
- use generic records/events/relations through the persistence port;
- expose no raw restricted values by default; and
- enter through module v2 with a new HumanGate.

The old `form-intake-registry` identifier must not be reused for a different meaning.
