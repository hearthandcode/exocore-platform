import { beforeEach, describe, expect, it, vi } from "vitest";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({ invoke }));

import {
  initializePersistenceReview,
  persistenceReviewPanelHtml,
  persistenceReviewState,
  resetPersistenceProof,
  runPersistenceProof,
} from "../../src/integration/persistence-review";

const emptyStatus = {
  schema: "exocore.persistence.status.v1",
  adapter: "sqlite-local-transitory",
  authority_role: "local-transitory",
  enabled: false,
  initialized: false,
  schema_version: 0,
  data_boundary: "tauri-app-data",
  database_name: "exocore-local-v1.sqlite3",
  record_count: 0,
  relation_count: 0,
  event_count: 0,
  workflow_run_count: 0,
  pending_projection_count: 0,
  migration_target: "postgresql-durable-authority",
  projection_targets: ["qdrant", "neo4j"],
  verification_state: false,
} as const;

const populatedStatus = {
  ...emptyStatus,
  enabled: true,
  initialized: true,
  schema_version: 1,
  record_count: 2,
  relation_count: 1,
  event_count: 1,
  workflow_run_count: 1,
  pending_projection_count: 2,
} as const;

describe("persistence and language desktop review surface", () => {
  beforeEach(() => {
    invoke.mockReset();
    persistenceReviewState.lifecycle = "loading";
    persistenceReviewState.status = null;
    persistenceReviewState.proof = null;
    persistenceReviewState.error = null;
  });

  it("observes an uninitialized disabled boundary without a write", async () => {
    invoke.mockResolvedValueOnce(emptyStatus);
    await initializePersistenceReview(() => undefined);
    expect(invoke).toHaveBeenCalledWith("persistence_status");
    expect(persistenceReviewState.status?.initialized).toBe(false);
    expect(persistenceReviewState.status?.enabled).toBe(false);
    expect(persistenceReviewPanelHtml()).toContain("no · zero-write status");
  });

  it("runs one deliberate transactional proof through typed IPC", async () => {
    invoke.mockResolvedValueOnce({ modules: [] }).mockResolvedValueOnce({
      schema: "exocore.persistence.proof.v1",
      fixture: "exocore.persistence.review-fixture.v1",
      operation: "exocore.persistence.run-proof.v1",
      idempotent: true,
      evidence: [
        "migration v1 applied with checksum",
        "two canonical records committed transactionally",
      ],
      status: populatedStatus,
    });
    await runPersistenceProof(() => undefined);
    expect(invoke).toHaveBeenNthCalledWith(1, "foundation_set_module_enabled", {
      request: {
        schema: "exocore.foundation-module-flag-request.v1",
        module_id: "persistence",
        enabled: true,
      },
    });
    expect(invoke).toHaveBeenNthCalledWith(2, "persistence_run_review_fixture");
    expect(persistenceReviewState.lifecycle).toBe("passed");
    expect(persistenceReviewState.status?.record_count).toBe(2);
    expect(persistenceReviewState.status?.pending_projection_count).toBe(2);
  });

  it("renders semantic review controls and no retired form surface", () => {
    persistenceReviewState.lifecycle = "passed";
    persistenceReviewState.status = populatedStatus;
    const html = persistenceReviewPanelHtml();
    expect(html).toContain(
      'section class="boundary-card persistence-lab" aria-labelledby=',
    );
    expect(html).toContain(
      'role="group" aria-label="Persistence proof controls"',
    );
    expect(html).toContain("<fieldset");
    expect(html).toContain("Operator review prompts");
    expect(html.match(/type="checkbox"/g)).toHaveLength(4);
    expect(html).toContain("PostgreSQL is the forward durable authority");
    expect(html).not.toContain("Form Intake Registry");
    expect(html).not.toContain("rawResponses");
  });

  it("resets only the proof namespace and returns to disabled state", async () => {
    persistenceReviewState.lifecycle = "passed";
    persistenceReviewState.status = populatedStatus;
    invoke
      .mockResolvedValueOnce({ modules: [] })
      .mockResolvedValueOnce({
        ...emptyStatus,
        enabled: true,
        initialized: true,
        schema_version: 1,
      })
      .mockResolvedValueOnce({ modules: [] })
      .mockResolvedValueOnce({
        ...emptyStatus,
        initialized: true,
        schema_version: 1,
      });
    await resetPersistenceProof(() => undefined);
    expect(invoke.mock.calls.map(([command]) => command)).toEqual([
      "foundation_set_module_enabled",
      "persistence_reset_review_fixture",
      "foundation_set_module_enabled",
      "persistence_status",
    ]);
    expect(persistenceReviewState.lifecycle).toBe("idle");
    expect(persistenceReviewState.status?.record_count).toBe(0);
    expect(persistenceReviewState.status?.enabled).toBe(false);
  });
});
