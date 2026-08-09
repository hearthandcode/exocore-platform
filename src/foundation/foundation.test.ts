import { describe, expect, it } from "vitest";
import { createActor } from "xstate";
import type { FoundationStatus } from "./contracts";
import { foundationLifecycleMachine } from "./machine";
import { availableFoundationRoutes } from "./routes";
import { foundationStore } from "./store";

const status: FoundationStatus = {
  schema: "exocore.foundation-status.v1",
  version: "0.1.0",
  default_authority: "deny",
  source_roots: 0,
  registered_modules: 2,
  modules: [
    { module_id: "foundation", registered: true, enabled: false },
    {
      module_id: "form-intake-registry",
      registered: true,
      enabled: false,
    },
  ],
  skeleton_ui_enabled: false,
  actor_healthy: true,
  mount_contract: "exocore.module-mount.v1",
};

describe("foundation presentation boundary", () => {
  it("does not expose the demonstration route at the safe default", () => {
    expect(availableFoundationRoutes(status)).toEqual([]);
    expect(
      availableFoundationRoutes({ ...status, skeleton_ui_enabled: true }),
    ).toHaveLength(1);
  });

  it("keeps native status as a rebuildable projection", () => {
    foundationStore.getState().receiveStatus(status);
    const state = foundationStore.getState();
    expect(state.status?.default_authority).toBe("deny");
    expect(state.status?.source_roots).toBe(0);
  });

  it("uses an explicit lifecycle machine for loading and failure", () => {
    const actor = createActor(foundationLifecycleMachine).start();
    expect(actor.getSnapshot().value).toBe("idle");
    actor.send({ type: "LOAD" });
    expect(actor.getSnapshot().value).toBe("loading");
    actor.send({ type: "REJECT" });
    expect(actor.getSnapshot().value).toBe("failed");
    actor.send({ type: "RETRY" });
    expect(actor.getSnapshot().value).toBe("loading");
    actor.stop();
  });
});
