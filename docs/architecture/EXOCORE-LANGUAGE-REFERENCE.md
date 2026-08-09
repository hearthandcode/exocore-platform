# Exocore Language Reference v1

Status: executable language baseline for this checkpoint; amend through versioned contracts, not prose-only convention.

## Recognition

- **Purpose:** Align Exocore vocabulary, taxonomy, grammar, identifiers, module lifecycle, extension points, schemas, diagnostics, and Rust/TypeScript types.
- **Canonical sources:** `contracts/language/`, `contracts/foundation/exocore.module.v2.schema.json`, and generated types.
- **Proof:** `python3 scripts/validate_language_persistence.py`.
- **Limit:** This is an implementation language, not a claim that every Hub concept or natural-language expression belongs in runtime storage.

## Distinctions

| Layer       | Meaning                                                             | Canonical source                     |
| ----------- | ------------------------------------------------------------------- | ------------------------------------ |
| Vocabulary  | stable term and definition                                          | `exocore.vocabulary.v1.json`         |
| Taxonomy    | controlled values grouped by classification dimension               | `exocore.taxonomy.v1.json`           |
| Grammar     | legal expression/module shapes and compositions                     | JSON Schemas                         |
| Language    | expressions formed from vocabulary + taxonomy + grammar             | `exocore.language.v1` instances      |
| Types       | Rust/TypeScript representations generated from canonical taxonomies | `scripts/generate_contract_types.py` |
| Diagnostics | stable rejection reasons owned by a module namespace                | typed error contracts                |

## Primitive vocabulary

The v1 language recognizes 18 primitives: adapter, capability, checkpoint, command, event, extension, identifier, migration, module, policy, port, projection, query, receipt, record, relation, transition, and workflow.

A new primitive requires a gap that cannot be expressed by composition. Synonyms in prose do not create new runtime kinds.

## Identifier grammar

| Family             | Grammar                                     | Example                         |
| ------------------ | ------------------------------------------- | ------------------------------- |
| Module             | `^[a-z][a-z0-9-]{1,62}$`                    | `persistence`                   |
| Contract/operation | `^exocore\.[a-z][a-z0-9.-]*\.v[1-9][0-9]*$` | `exocore.persistence.status.v1` |
| Flag               | `^[a-z][a-z0-9-]*\.[a-z][a-z0-9_-]*$`       | `persistence.enabled`           |
| Extension key      | `^x-[a-z][a-z0-9-]{1,62}$`                  | `x-postgres-copy`               |
| Version            | semantic version `major.minor.patch`        | `1.0.0`                         |

One canonical owner controls each namespace. Unknown required identifiers fail closed.

## Expression grammar

An `exocore.language.v1` expression declares:

- identity and version;
- canonical term and operation kind;
- owning module;
- authority class;
- effect class;
- input/output contracts;
- diagnostic namespace; and
- optional `x-*` extensions.

Effects are explicit: `none`, `local-read`, `local-write`, `external-read`, or `external-write`. A type signature alone never grants the effect.

## Module lifecycle grammar

`exocore.module.v2` adds what mount v1 could not express:

- `experimental -> active -> deprecated -> archived` lifecycle;
- semantic owner and record scope;
- inbound/outbound ports;
- typed operations and effects;
- dependency declarations;
- namespace ownership;
- explicit extension points;
- migration strategy and rollback posture;
- deprecation replacement/removal gate; and
- proof/reset contract.

Mount v1 remains the current native registration envelope. Module v2 is the richer design/admission source and is additive until a native mount-v2 migration is reviewed.

## Extension and modularity law

Extensions are declared contracts, not deep imports or arbitrary JSON escape hatches. An extension names cardinality and compatibility (`exact` or `same-major`). Unknown optional `x-*` data remains inert. Unknown required behavior fails closed.

Adapters implement domain-owned ports. Projectors consume committed source records. Workflows call public operations. Presentation renders typed projections. None may acquire another layer's semantic authority.

## Type alignment

Run:

```bash
python3 scripts/generate_contract_types.py
python3 scripts/generate_contract_types.py --check
```

The generator produces:

- `src/contracts/generated/exocore-language.ts`;
- `src-tauri/src/contracts/generated.rs`.

CI/proof runs `--check`, so taxonomy changes without regenerated types fail. Schema instances, module operations, SQL entities/columns, and language expressions are checked together by `validate_language_persistence.py`.

## Evolution rules

- additive optional fields may remain in the same major version;
- changed meaning, authority, required fields, identifier grammar, or legal transition requires a new major contract or reviewed amendment;
- deprecation names replacement, compatibility window, and removal gate;
- migration and removal are separate transitions;
- generated types never replace the source JSON contracts; and
- a passing validator is evidence of alignment, not human acceptance or production fitness.
