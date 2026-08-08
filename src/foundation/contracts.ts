export interface FoundationStatus {
  schema: "exocore.foundation-status.v1";
  version: string;
  default_authority: "deny";
  source_roots: number;
  registered_modules: number;
  skeleton_ui_enabled: boolean;
  actor_healthy: boolean;
  mount_contract: "exocore.module-mount.v1";
}

export interface TraceEvent {
  schema: "exocore.trace-event.v1";
  level: string;
  event: string;
  operation: string;
  correlation_id: string;
  outcome: string;
  detail: string;
}

export interface FoundationEchoResponse {
  schema: "exocore.echo-response.v1";
  message: string;
  correlation_id: string;
  trace: TraceEvent;
}

export interface TypedError {
  schema: "exocore.typed-error.v1";
  code: string;
  message: string;
  operation: string;
  recoverable: boolean;
  suggested_action: string;
  correlation_id: string;
}
