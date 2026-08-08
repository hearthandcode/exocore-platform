# Typed IPC conventions

## Command shape

Commands are narrow, concept-shaped Tauri handlers. The foundation proof admits `foundation_status` and `foundation_echo`; the existing profile-evaluation commands remain unchanged. There is no generic file, process, network, SQL, or shell command.

Requests and responses use versioned Rust/TypeScript types. Executing Rust structs deny unknown fields where payloads are deserialized. Unknown commands and capabilities fail closed.

## Error envelope

Every foundation boundary error serializes:

```json
{
  "schema": "exocore.typed-error.v1",
  "code": "E_VALIDATION",
  "message": "operator-safe explanation",
  "operation": "exocore.echo.v1",
  "recoverable": true,
  "suggested_action": "correct the request and retry",
  "correlation_id": "local-correlation-id"
}
```

Stable initial codes are `E_VALIDATION`, `E_DENIED`, `E_TRAVERSAL`, `E_TOO_LARGE`, `E_ENCODING`, `E_UNREGISTERED`, `E_DISABLED`, `E_CONFIG`, `E_ACTOR`, and `E_INTERNAL`. Internal details and payloads do not cross the boundary.

## Registration and tests

The Tauri invoke handler registers explicit functions. The module registry separately reserves versioned command identifiers to detect collisions before feature mount. Contract tests cover valid echo, denied capabilities, unknown registration, disabled flags, and serialized error shape. A transport adapter may change later; domain and mount contracts do not depend on Tauri types.
