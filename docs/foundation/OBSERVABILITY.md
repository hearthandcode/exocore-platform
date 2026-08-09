# Local observability guide

Foundation observability is traces-first in shape and local-only in effect. `foundation::telemetry` emits serializable structured events with schema, level, event name, operation, correlation id, outcome, and redacted detail.

## Rules

- Correlation ids join request, actor, mount, and error evidence.
- Event names are stable identifiers, not prose.
- Payload content, secrets, credentials, raw config, private paths, and source bodies are never event fields.
- Detail passes mechanical redaction for credential-like key/value forms.
- Default level is `info`; default sink is local stdout.
- No network telemetry, analytics, remote collector, user tracking, or durable log store is introduced.
- A successful event proves only that the named local operation reported success; it does not establish human approval or verification.

## Initial events

`foundation.status.read`, `foundation.echo.completed`, `foundation.actor.started`, `foundation.actor.stopped`, `foundation.module.mounted`, `foundation.module.rejected`, and `foundation.flag.changed`.

Metrics such as mount count or actor failures are future derived local projections. They may not mutate authority or become release gates without a separate decision.
