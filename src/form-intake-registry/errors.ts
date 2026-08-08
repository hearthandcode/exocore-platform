export type ErrorCode =
  | "E_NOT_FOUND"
  | "E_TOO_LARGE"
  | "E_ENCODING"
  | "E_TRAVERSAL"
  | "E_SCHEMA"
  | "E_VERSION"
  | "E_NORMALIZE"
  | "E_STORE"
  | "E_PROJECTION"
  | "E_VERIFY"
  | "E_DISABLED"
  | "E_CONFLICT";

export interface TypedError {
  code: ErrorCode;
  message: string;
  operation: string;
  path: string | null;
  recoverable: boolean;
  suggested_action: string;
  correlation_id: string;
  diagnostics?: Array<{ path: string; code: string; message: string }>;
}

export function typedError(
  code: ErrorCode,
  operation: string,
  message: string,
  options: {
    path?: string;
    recoverable?: boolean;
    suggestedAction?: string;
    correlationId?: string;
    diagnostics?: TypedError["diagnostics"];
  } = {},
): TypedError {
  return {
    code,
    message,
    operation,
    path: options.path ?? null,
    recoverable: options.recoverable ?? code !== "E_TRAVERSAL",
    suggested_action: options.suggestedAction ?? "Inspect the diagnostic and retry after correction.",
    correlation_id: options.correlationId ?? `fir-${operation}`,
    ...(options.diagnostics ? { diagnostics: options.diagnostics } : {}),
  };
}
