import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";
import currentFixture from "../../../fixtures/form-intake-registry/synthetic-export.json?raw";
import mutatedFixture from "../../../fixtures/form-intake-registry/synthetic-export-mutated.json?raw";
import proofWorkflowSource from "../../../contracts/form-intake-registry/v1/proof.workflow.json?raw";
import {
  FormIntakeRegistryModule,
  InMemoryRegistryStore,
  typedError,
  type AdapterDescriptor,
  type Result,
  type SourceAdapter,
  type SourceBytes,
  type TypedError,
} from "../../form-intake-registry";
import { setFeatureModuleEnabled } from "../../foundation";

export type ProofLifecycle = "idle" | "running" | "passed" | "failed";

export interface ProofStep {
  id: string;
  outcome: "passed";
  evidence: string;
}

export interface FormIntakeProofResult {
  schema: "exocore.form-intake-proof.v1";
  module_id: "form-intake-registry";
  module_version: "0.1.0";
  fixture_mode: "synthetic-only";
  store_adapter: "memory";
  steps: ProofStep[];
  first_registry_id: string;
  successor_registry_id: string;
  projection_id: string;
  candidate_count: number;
  answered_count: number;
  raw_answers_exposed: false;
  verification_state: false;
}

export interface FormIntakeProofState {
  lifecycle: ProofLifecycle;
  result: FormIntakeProofResult | null;
  error: string | null;
}

const proofWorkflow = parseWorkflow(proofWorkflowSource);

export const formIntakeProofState: FormIntakeProofState = {
  lifecycle: "idle",
  result: null,
  error: null,
};

export async function runFormIntakeProof(onChange: () => void): Promise<void> {
  if (formIntakeProofState.lifecycle === "running") return;
  formIntakeProofState.lifecycle = "running";
  formIntakeProofState.result = null;
  formIntakeProofState.error = null;
  onChange();

  const store = new InMemoryRegistryStore();
  const adapter = new MemoryFormExportAdapter(currentFixture);
  const disabledModule = new FormIntakeRegistryModule({
    enabled: false,
    store,
  });
  const disabled = disabledModule.ingest(adapter, "input.json", "public-safe");

  try {
    requireCondition(
      !disabled.ok &&
        disabled.error.code === "E_DISABLED" &&
        store.count() === 0,
      "disabled module must return E_DISABLED without writing state",
    );

    await setFeatureModuleEnabled("form-intake-registry", true);
    const module = new FormIntakeRegistryModule({
      enabled: true,
      store,
      now: deterministicClock(),
    });

    const first = requireOk(
      module.ingest(adapter, "input.json", "public-safe"),
      "first synthetic ingest",
    );
    requireCondition(first.action === "inserted", "first ingest must insert");

    const duplicate = requireOk(
      module.ingest(adapter, "input.json", "public-safe"),
      "duplicate synthetic ingest",
    );
    requireCondition(
      duplicate.action === "seen" &&
        duplicate.record.registry_id === first.record.registry_id &&
        store.count() === 1,
      "equivalent input must deduplicate to one record",
    );

    const projection = requireOk(
      module.project(first.record.registry_id),
      "initial projection",
    );
    const current = requireOk(
      module.verify(projection.projection_id, adapter),
      "current projection verification",
    );
    requireCondition(
      current.matches && current.projection.freshness_state === "current",
      "initial projection must verify current",
    );

    adapter.replace(mutatedFixture);
    const stale = requireOk(
      module.verify(projection.projection_id, adapter),
      "stale projection verification",
    );
    requireCondition(
      !stale.matches && stale.projection.freshness_state === "stale",
      "source mutation must make the previous projection stale",
    );

    const successor = requireOk(
      module.ingest(adapter, "input.json", "public-safe"),
      "successor synthetic ingest",
    );
    requireCondition(
      successor.action === "superseded" &&
        successor.previous_registry_id === first.record.registry_id &&
        store.count() === 2,
      "changed input must create a linked successor",
    );

    const firstAfterSupersession = requireOk(
      module.inspect(first.record.registry_id),
      "supersession inspection",
    );
    requireCondition(
      firstAfterSupersession.record.superseded_by ===
        successor.record.registry_id,
      "the first record must point to its successor",
    );

    const successorProjection = requireOk(
      module.project(successor.record.registry_id),
      "successor projection",
    );
    const successorVerification = requireOk(
      module.verify(successorProjection.projection_id, adapter),
      "successor verification",
    );
    requireCondition(
      successorVerification.matches &&
        successorVerification.projection.freshness_state === "current",
      "successor projection must verify current",
    );

    const steps = [
      step("disabled", "E_DISABLED and zero records"),
      step("enable", "native module flag enabled deliberately"),
      step("ingest", `${first.candidate_count} candidates inserted`),
      step("dedupe", "equivalent input retained one registry identity"),
      step("project", "metadata-only projection built"),
      step("verify", "source and rendered digests matched"),
      step("stale", "changed source digest marked the projection stale"),
      step("supersede", "changed input created a linked successor"),
    ];
    requireCondition(
      steps.map(({ id }) => id).join(",") ===
        proofWorkflow.steps.map(({ step_id }) => step_id).join(","),
      "implementation steps must match the versioned workflow contract",
    );

    formIntakeProofState.result = {
      schema: "exocore.form-intake-proof.v1",
      module_id: "form-intake-registry",
      module_version: "0.1.0",
      fixture_mode: "synthetic-only",
      store_adapter: "memory",
      steps,
      first_registry_id: first.record.registry_id,
      successor_registry_id: successor.record.registry_id,
      projection_id: successorProjection.projection_id,
      candidate_count: successorProjection.view.candidate_count,
      answered_count: successorProjection.view.answered_count,
      raw_answers_exposed: false,
      verification_state: false,
    };
    formIntakeProofState.lifecycle = "passed";
  } catch (error) {
    formIntakeProofState.lifecycle = "failed";
    formIntakeProofState.error =
      error instanceof Error ? error.message : "form-intake proof failed";
    await setFeatureModuleEnabled("form-intake-registry", false).catch(
      () => undefined,
    );
  }
  onChange();
}

export async function resetFormIntakeProof(
  onChange: () => void,
): Promise<void> {
  await setFeatureModuleEnabled("form-intake-registry", false);
  formIntakeProofState.lifecycle = "idle";
  formIntakeProofState.result = null;
  formIntakeProofState.error = null;
  onChange();
}

class MemoryFormExportAdapter implements SourceAdapter {
  readonly id = "form-intake-proof-memory";
  readonly kind = "form-export" as const;
  private source: string;

  constructor(source: string) {
    this.source = source;
  }

  replace(source: string): void {
    this.source = source;
  }

  describe(): AdapterDescriptor {
    return {
      id: this.id,
      kind: this.kind,
      root_policy: "single synthetic in-memory fixture",
      size_bound: 1_048_576,
      utf8_policy: "strict",
    };
  }

  read(locator: string): Result<SourceBytes, TypedError> {
    if (locator !== "input.json") {
      return {
        ok: false,
        error: typedError(
          "E_NOT_FOUND",
          "proof.read",
          "Synthetic proof exposes only input.json.",
          { path: locator },
        ),
      };
    }
    const bytes = utf8ToBytes(this.source);
    return {
      ok: true,
      value: {
        bytes,
        locator,
        digest: `sha256:${bytesToHex(sha256(bytes))}`,
        read_at: "2026-08-09T12:00:00.000Z",
      },
    };
  }
}

function deterministicClock(): () => string {
  let tick = 0;
  return () => {
    const value = new Date(Date.UTC(2026, 7, 9, 12, 0, tick));
    tick += 1;
    return value.toISOString();
  };
}

function requireOk<T>(result: Result<T, TypedError>, operation: string): T {
  if (result.ok) return result.value;
  throw new Error(`${operation}: ${result.error.code} ${result.error.message}`);
}

function requireCondition(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message);
}

function step(id: string, evidence: string): ProofStep {
  return { id, outcome: "passed", evidence };
}

function parseWorkflow(source: string): {
  schema: "exocore.workflow.v1";
  steps: Array<{ step_id: string }>;
} {
  const value = JSON.parse(source) as {
    schema?: string;
    steps?: Array<{ step_id?: string }>;
  };
  if (
    value.schema !== "exocore.workflow.v1" ||
    !Array.isArray(value.steps) ||
    value.steps.some((step) => !step.step_id)
  ) {
    throw new Error("E_WORKFLOW: invalid form-intake proof workflow contract");
  }
  return value as {
    schema: "exocore.workflow.v1";
    steps: Array<{ step_id: string }>;
  };
}
