import type {
  IntakeRegistryProjection,
  ProjectionDiagnostic,
  ProjectionValidation,
} from "./contracts";

const REQUIRED_LIMITS = new Set([
  "no-network",
  "no-credentials",
  "no-runtime-effects",
  "no-canonical-write",
  "no-approval",
  "no-scheduling",
]);

const REQUIRED_TASK_PROHIBITIONS = new Set([
  "create-task",
  "modify-task",
  "create-calendar-event",
  "modify-calendar-event",
  "schedule-agent",
  "activate-webhook",
  "activate-poller",
  "infer-urgency-from-personal-state",
  "convert-due-window-to-obligation",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function add(
  diagnostics: ProjectionDiagnostic[],
  condition: boolean,
  code: string,
  message: string,
): void {
  if (!condition) {
    diagnostics.push({ code, message });
  }
}

function hasEvery(values: unknown, required: Set<string>): boolean {
  return (
    Array.isArray(values) &&
    [...required].every((item) => values.includes(item))
  );
}

export function validateIntakeRegistryProjection(
  value: unknown,
): ProjectionValidation {
  const diagnostics: ProjectionDiagnostic[] = [];
  if (!isRecord(value)) {
    return {
      valid: false,
      diagnostics: [
        { code: "EXO-INTAKE-E001", message: "Projection must be an object." },
      ],
    };
  }

  const contract = value.contract;
  const taxonomy = value.taxonomy;
  const workflow = value.workflow;
  const projection = value.projection;
  const modules = value.modules;
  const taskCalendar = value.taskCalendar;

  add(diagnostics, isRecord(contract), "EXO-INTAKE-E002", "Contract is required.");
  add(diagnostics, isRecord(taxonomy), "EXO-INTAKE-E003", "Taxonomy is required.");
  add(diagnostics, Array.isArray(value.forms) && value.forms.length === 10, "EXO-INTAKE-E004", "Exactly ten projected forms are required.");
  add(diagnostics, Array.isArray(value.definitions) && value.definitions.length === 16, "EXO-INTAKE-E005", "Exactly sixteen representative definitions are required.");
  add(diagnostics, isRecord(workflow), "EXO-INTAKE-E006", "Workflow is required.");
  add(diagnostics, isRecord(projection), "EXO-INTAKE-E007", "Projection map is required.");
  add(diagnostics, isRecord(modules), "EXO-INTAKE-E008", "Module boundary is required.");
  add(diagnostics, isRecord(taskCalendar), "EXO-INTAKE-E009", "Task and calendar boundary is required.");

  if (isRecord(contract)) {
    add(diagnostics, contract.authorityEffect === "derived-non-authoritative", "EXO-INTAKE-E010", "Projection cannot claim source authority.");
    add(diagnostics, contract.canonical === false, "EXO-INTAKE-E011", "Projection must remain noncanonical.");
    add(diagnostics, contract.syntheticOnly === true, "EXO-INTAKE-E012", "Projection must remain synthetic-only.");
    add(diagnostics, typeof contract.sourceDigest === "string" && /^[0-9a-f]{64}$/.test(contract.sourceDigest), "EXO-INTAKE-E013", "Source digest must be SHA-256.");
    add(diagnostics, hasEvery(contract.limits, REQUIRED_LIMITS), "EXO-INTAKE-E014", "Projection limits are incomplete.");
  }

  if (isRecord(taxonomy)) {
    add(diagnostics, Array.isArray(taxonomy.cores) && taxonomy.cores.length === 16, "EXO-INTAKE-E015", "Exactly sixteen cores are required.");
    add(diagnostics, Array.isArray(taxonomy.profiles) && taxonomy.profiles.length >= 5, "EXO-INTAKE-E016", "Profile projection is incomplete.");
    add(diagnostics, Array.isArray(taxonomy.facets) && taxonomy.facets.length >= 7, "EXO-INTAKE-E017", "Facet projection is incomplete.");
  }

  if (isRecord(workflow)) {
    const statuses = workflow.statuses;
    const transitions = workflow.transitions;
    const gates = workflow.consequentialGates;
    add(diagnostics, Array.isArray(statuses) && statuses.length === 8 && statuses.includes("ready-for-route") && !statuses.includes("accepted"), "EXO-INTAKE-E018", "Active workflow must use ready-for-route and exclude accepted.");
    add(diagnostics, Array.isArray(transitions) && transitions.length === 11 && transitions.every((item) => isRecord(item) && item.unknownEffect === "block"), "EXO-INTAKE-E019", "Transitions must be closed and fail unknown behavior.");
    add(diagnostics, Array.isArray(gates) && gates.length === 8 && gates.every((item) => isRecord(item) && item.automatic === false), "EXO-INTAKE-E020", "Consequential gates cannot run automatically.");
  }

  if (isRecord(projection)) {
    add(diagnostics, Array.isArray(projection.databases) && projection.databases.length === 4, "EXO-INTAKE-E021", "Exactly four projection databases are required.");
    add(diagnostics, Array.isArray(projection.crosswalk) && projection.crosswalk.length === 9, "EXO-INTAKE-E022", "The nine-to-four crosswalk must close.");
    add(diagnostics, projection.automaticWriteBack === false && projection.silentOverwrite === false, "EXO-INTAKE-E023", "Projection cannot write back or silently overwrite.");
  }

  if (isRecord(modules)) {
    add(diagnostics, modules.mountState === "unmounted-candidate", "EXO-INTAKE-E024", "Module must remain unmounted during reconciliation.");
    add(diagnostics, Array.isArray(modules.items) && modules.items.length === 5 && modules.items.every((item) => isRecord(item) && item.writesAuthority === false), "EXO-INTAKE-E025", "Five non-authoritative modules are required.");
    const port = modules.futureCortexPort;
    add(diagnostics, isRecord(port) && port.mayAdvanceWorkflow === false && port.mayClassifyIntake === false, "EXO-INTAKE-E026", "Cortex port cannot classify or advance workflow.");
  }

  if (isRecord(taskCalendar)) {
    add(diagnostics, taskCalendar.posture === "metadata-only-derived-view", "EXO-INTAKE-E027", "Task and calendar view must remain metadata-only.");
    add(diagnostics, hasEvery(taskCalendar.prohibitedEffects, REQUIRED_TASK_PROHIBITIONS), "EXO-INTAKE-E028", "Task and calendar prohibitions are incomplete.");
  }

  return { valid: diagnostics.length === 0, diagnostics };
}

export function assertIntakeRegistryProjection(
  value: unknown,
): IntakeRegistryProjection {
  const result = validateIntakeRegistryProjection(value);
  if (!result.valid) {
    throw new Error(
      result.diagnostics.map((item) => `${item.code}: ${item.message}`).join("\n"),
    );
  }
  return value as unknown as IntakeRegistryProjection;
}
