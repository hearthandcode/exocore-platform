import type { TypedError } from "./contracts";
import {
  echoThroughFoundation,
  getFoundationStatus,
  setSkeletonUi,
} from "./ipc";
import { foundationLifecycle } from "./machine";
import { foundationStore } from "./store";
import { renderFoundationPanel } from "./ui";

export async function initializeFoundation(
  onChange: () => void,
): Promise<void> {
  foundationStore.getState().begin();
  const state = foundationLifecycle.getSnapshot().value;
  foundationLifecycle.send({ type: state === "failed" ? "RETRY" : "LOAD" });
  onChange();
  try {
    foundationStore.getState().receiveStatus(await getFoundationStatus());
    foundationLifecycle.send({ type: "RESOLVE" });
  } catch (error) {
    foundationStore
      .getState()
      .fail(toTypedError(error, "exocore.foundation-status.v1"));
    foundationLifecycle.send({ type: "REJECT" });
  }
  onChange();
}

export function foundationPanelHtml(): string {
  return renderFoundationPanel(foundationStore.getState());
}

export function bindFoundationInteractions(onChange: () => void): void {
  document
    .querySelector<HTMLButtonElement>("#toggle-foundation")
    ?.addEventListener("click", () => {
      void toggle(onChange);
    });
  document
    .querySelector<HTMLButtonElement>("#run-foundation-echo")
    ?.addEventListener("click", () => {
      const input =
        document.querySelector<HTMLInputElement>("#foundation-echo");
      if (input) void runEcho(input.value, onChange);
    });
}

async function toggle(onChange: () => void): Promise<void> {
  const current = foundationStore.getState().status;
  if (!current) return;
  foundationStore.getState().begin();
  foundationLifecycle.send({ type: "LOAD" });
  onChange();
  try {
    foundationStore
      .getState()
      .receiveStatus(await setSkeletonUi(!current.skeleton_ui_enabled));
    foundationLifecycle.send({ type: "RESOLVE" });
  } catch (error) {
    foundationStore
      .getState()
      .fail(toTypedError(error, "exocore.foundation-flag.v1"));
    foundationLifecycle.send({ type: "REJECT" });
  }
  onChange();
}

async function runEcho(message: string, onChange: () => void): Promise<void> {
  foundationStore.getState().begin();
  foundationLifecycle.send({ type: "LOAD" });
  onChange();
  try {
    foundationStore
      .getState()
      .receiveEcho(await echoThroughFoundation(message));
    foundationLifecycle.send({ type: "RESOLVE" });
  } catch (error) {
    foundationStore.getState().fail(toTypedError(error, "exocore.echo.v1"));
    foundationLifecycle.send({ type: "REJECT" });
  }
  onChange();
}

function toTypedError(error: unknown, operation: string): TypedError {
  if (
    typeof error === "object" &&
    error !== null &&
    "schema" in error &&
    "code" in error
  ) {
    return error as TypedError;
  }
  return {
    schema: "exocore.typed-error.v1",
    code: "E_INTERNAL",
    message:
      error instanceof Error ? error.message : "foundation operation failed",
    operation,
    recoverable: true,
    suggested_action: "retry and inspect local diagnostics",
    correlation_id: "presentation-boundary",
  };
}
