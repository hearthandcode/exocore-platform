import { invoke } from "@tauri-apps/api/core";
import type { FoundationEchoResponse, FoundationStatus } from "./contracts";

export function getFoundationStatus(): Promise<FoundationStatus> {
  return invoke<FoundationStatus>("foundation_status");
}

export function setSkeletonUi(enabled: boolean): Promise<FoundationStatus> {
  return invoke<FoundationStatus>("foundation_set_skeleton_ui", { enabled });
}

export function setModuleEnabled(
  moduleId: string,
  enabled: boolean,
): Promise<FoundationStatus> {
  return invoke<FoundationStatus>("foundation_set_module_enabled", {
    request: {
      schema: "exocore.foundation-module-flag-request.v1",
      module_id: moduleId,
      enabled,
    },
  });
}

export function echoThroughFoundation(
  message: string,
): Promise<FoundationEchoResponse> {
  return invoke<FoundationEchoResponse>("foundation_echo", {
    request: { schema: "exocore.echo-request.v1", message },
  });
}
