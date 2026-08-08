import { invoke } from "@tauri-apps/api/core";
import type { FoundationEchoResponse, FoundationStatus } from "./contracts";

export function getFoundationStatus(): Promise<FoundationStatus> {
  return invoke<FoundationStatus>("foundation_status");
}

export function setSkeletonUi(enabled: boolean): Promise<FoundationStatus> {
  return invoke<FoundationStatus>("foundation_set_skeleton_ui", { enabled });
}

export function echoThroughFoundation(
  message: string,
): Promise<FoundationEchoResponse> {
  return invoke<FoundationEchoResponse>("foundation_echo", {
    request: { schema: "exocore.echo-request.v1", message },
  });
}
