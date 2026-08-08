# Form Intake Registry feature packet

Status: implementation candidate, unmounted, `verified: false`.

## Recognition

- **Purpose:** turn the Exocore Architecture and Development Form's current JSON exports into deterministic, provenance-carrying runtime registry records and public-safe projections.
- **Location:** `docs/form-intake-registry/`, with contracts, fixtures, code, and tests in the Gate 0 owned paths.
- **Papertrail:** the Gate 0 source manifest, the Intake Registry v0.2 projection contract, the accepted-for-design desktop boundary, the form-v3 export source, and the initial-implementation checkpoint plan.
- **Verification state:** implementation evidence only. No source, decision, review state, or `verified` field is promoted.
- **Next action:** complete the Evaluation Checkpoint, then stop for Scott's HumanGate decision.

## 1. Feature brief

Form exports currently have no runtime identity, dedupe, supersession, or freshness path. This feature supplies that intake spine without building a form runtime, a second workbench, a provider bridge, or a disposition-write surface. Exocore remains the projection surface; the Hub remains canonical for human-facing knowledge.

**Authority class:** proposal and implementation evidence. The registry is a runtime record-store role, not canonical knowledge. Its projection is derived and non-authoritative.

## 2. Problem and opportunity

The form app exports a self-describing `exocore-architecture-form-v3` object with section response arrays, per-question IDs and answer types, answered-state flags, and `rawResponses`. Re-ingesting those bytes without a governed registry would lose identity and provenance or duplicate the same logical submission. A deterministic registry lets later work inspect provenance and freshness while keeping source bytes read-only.

## 3. Feature specification

The feature must:

1. read only through a bounded `SourceAdapter`;
2. parse the actual form-v3 export shape;
3. accept unanswered response entries with no `value`, including `n3`;
4. preserve unknown optional fields as inert extensions and fail on unknown declared-required extensions;
5. normalize answer values by their declared type;
6. compute exact source, normalized payload, dedupe, lineage, registry, and projection digests;
7. make identical re-ingestion idempotent and changed answers superseding;
8. store restricted payloads as digest plus feature-local locator;
9. project metadata and answer-state only, never raw answer bodies;
10. expose stable typed errors and a default-off feature flag;
11. remain isolated and unmounted; and
12. never mutate the form export or any Hub source.

Non-goals: form rendering, Tally, Notion migration, network access, providers, OAuth, telemetry, canonical Hub writes, disposition writes, foundation config/IPC/flag machinery, deployment, publication, and shell mounting.

## 4. Experience and interaction note

At v0 an operator inspects a record through the module API, not a mounted UI. The read-only view exposes registry identity, source kind and digest, timestamps, sensitivity, review state, disposition state, recovery route, and supersession. The projection exposes textual state only: candidate count, answered count, per-question answered flags, freshness, authority class, and verification state. No color-only or icon-only semantics are required. A mounted accessible surface is a later gate.

## 5. Domain and concept model

- **Source export:** immutable bytes read under an adapter root.
- **Intake candidate:** one normalized question response, including explicit unanswered state.
- **Registry record:** `exocore.intake-registry.v1`, the runtime identity and provenance envelope for one logical form export.
- **Dedupe key:** SHA-256 of form ID, actual form revision, and canonical normalized answer state.
- **Lineage key:** SHA-256 of form ID and actual form revision; a new dedupe key in the same lineage supersedes the latest record.
- **Projection:** a rebuildable, public-safe metadata view. It never carries raw answer values.
- **Freshness:** current when both exact source digest and rendered digest match; stale with named mismatched fields otherwise.
- **Sensitivity:** `public-safe`, `internal`, or `restricted`. Restricted payloads use digest-plus-locator storage.
- **Human states:** review and disposition remain independent; the pipeline initializes but never upgrades them.

## 6. Technical design

The module is `src/form-intake-registry/` and is not imported by `src/main.ts`.

Pipeline:

```text
bounded adapter read
  -> strict UTF-8 + exact source digest
  -> form-v3 parse and typed validation
  -> typed answer normalization
  -> deterministic candidates and dedupe identity
  -> feature-local registry store
  -> metadata-only projection
  -> source and rendered-digest verification
```

`FormIntakeRegistryModule` owns the public operations `ingest`, `validate`, `register`, `project`, `verify`, and `inspect`. `index.ts` exports the public boundary. Adapters, stores, hashing, and normalization remain under `internal/` and are not re-exported.

The v0 file store uses `records/`, `indexes/dedupe/`, `payloads/`, `projections/`, and `LOG.jsonl` below an injected root. Tests use disposable roots or an in-memory implementation. This is an explicit v0 seam, not PostgreSQL theater.

## 7. Data, schema, and contract specification

- `contracts/form-intake-registry/v1/form-export.schema.json` is `exocore.form-export.v1`, a validating contract over the current `exocore-architecture-form-v3` bytes. It does not change the form app.
- `contracts/form-intake-registry/v1/registry-record.schema.json` is `exocore.intake-registry.v1`.
- Exact form schema version is recorded verbatim as `exocore-architecture-form-v3`.
- Source and normalized payload digests use `sha256:<hex>`.
- Registry IDs are deterministic `ir-<26 hex>` identifiers.
- Unknown optional properties are retained but inert. The optional `meta.requiredFields` extension is the explicit fail-closed mechanism; the current form app does not emit it.

The current Hub Intake Registry v0.2 projection contract binds three grammar sources, not an on-disk runtime candidate-record family. The Hub adapter is therefore read-only and digest-capable, while Hub-candidate ingestion returns `E_CONFLICT` until an attributed, reviewed shape handoff exists. Synthetic fixtures are used for all writable tests.

## 8. AI and agent behavior note

There is no LLM in the application pipeline. Form content is data, never instructions. The executing session substituted the current Codex model for MiniMax M3 at Gate 0, but all application parsing, identity, validation, storage, projection, and verification are deterministic code. Future agent-assisted disposition is out of scope and requires a separate HumanGate.

## 9. Threat, safety, and failure analysis

Security classification: local internal intake; payloads may be personal or strategic.

Controls:

- canonical root plus post-symlink realpath check;
- relative locators only;
- configurable byte limit before read;
- fatal UTF-8 decoding;
- typed `E_NOT_FOUND`, `E_TOO_LARGE`, `E_ENCODING`, and `E_TRAVERSAL` errors;
- closed form schema version and answer-type checks;
- invisible bidi controls removed with diagnostics;
- no content-driven behavior;
- restricted payload digest-plus-locator mode;
- metadata-only projections;
- no external network, credentials, providers, or telemetry;
- disabled feature calls create no registry state.

Residual risks: file storage does not prove concurrent transaction safety or crash recovery; source authenticity is not established by SHA-256; a form-v3 export has no explicit submission/actor identity; real-data sensitivity defaults need Scott's later decision; accessibility is unproven until a UI is mounted.

## 10. Test and evaluation plan

Unit and integration tests use Vitest, Arrange-Act-Assert, and synthetic fixtures. Coverage includes:

- valid, partial, malformed, unknown optional, unknown declared-required, wrong answer shape, and unknown version parsing;
- unanswered `n3` preservation and all eight current answer-type normalization rules;
- missing, traversal, symlink escape, oversize, and invalid UTF-8 reads;
- first ingest, identical 50-run storm, source mutation, supersession, restricted payload redaction, prompt-injection text, and disabled behavior;
- projection rebuild and stale-source detection;
- contract parse checks and fixture-governance scans.

A passing test proves its assertions against these fixtures only. It does not prove global uniqueness, real-data fitness, human acceptance, or mounted behavior.

## 11. Observability and measurement plan

The file store emits local JSONL events with event name and non-secret record/projection identity. It does not log payload bodies. Candidate future counters are ingest attempts, inserted records, dedupe hits, supersessions, projection builds, verify mismatches, and typed failures. No external telemetry exists or is authorized.

## 12. Rollout, migration, and release plan

Current state: isolated and unmounted. Mounting may occur only after an attributed foundation mount-contract handoff is reviewed and Scott releases the integration. The feature flag declaration is `form-intake-registry.enabled`, default off. It is a feature-local declaration for later foundation adoption, not competing global flag machinery.

Rollback before mount: remove the declared owned paths and revert only this lane's package manifest/lock changes. No database migration, shell route, native command, Hub record, or external system needs reversal.

## 13. Operational guide

Development-only synthetic demonstration:

```text
npm run test:form-intake-registry
npm run check
npm run build
```

The end-to-end test copies `fixtures/form-intake-registry/synthetic-export.json` to a disposable input root, ingests it, re-ingests it, projects it, verifies it, replaces the same locator with `synthetic-export-mutated.json`, observes stale source state, registers a superseding record, and verifies the new projection.

Real form exports are not authorized for this Evaluation Checkpoint. When separately released, an operator supplies a relative locator under a configured adapter root, classifies sensitivity, and inspects the resulting typed report. The adapter never writes to that root.

## 14. Decision and change log

| Decision | Trigger and evidence | Reversal condition |
|---|---|---|
| Use current Codex model operationally | explicit goal override; Gate 0 records `openai-codex/gpt-5.6-sol` | a later explicit model instruction |
| Reconcile to form-v3 response arrays | direct `form/src/utils/export.ts` source | a reviewed form export version |
| Keep the IFG grammar projection separate | existing `src/intake-registry/` has a distinct source/authority role | a reviewed consolidation contract |
| Keep Hub candidate ingestion held | v0.2 contract exposes grammar projection sources, not runtime candidate records | attributed reviewed Hub-shape handoff |
| Use injected file/in-memory stores at v0 | bounded implementation and no PostgreSQL foundation handoff | accepted storage-adapter integration |
| Project no raw answer bodies | public-safe and sensitivity requirements | a narrower reviewed local-view contract |
| Remain unmounted | no attributed foundation mount-contract handoff | attributed handoff plus Scott integration release |

No entry in this log is human acceptance or release authority.
