import { createActor, createMachine } from "xstate";

export const foundationLifecycleMachine = createMachine({
  id: "foundation-status-lifecycle",
  initial: "idle",
  states: {
    idle: { on: { LOAD: "loading" } },
    loading: { on: { RESOLVE: "ready", REJECT: "failed" } },
    ready: { on: { LOAD: "loading" } },
    failed: { on: { RETRY: "loading" } },
  },
});

export const foundationLifecycle = createActor(foundationLifecycleMachine);
foundationLifecycle.start();
