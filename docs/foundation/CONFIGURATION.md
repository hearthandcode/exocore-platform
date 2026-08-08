# Foundation configuration guide

## Load and authority order

The foundation uses typed configuration, not scattered environment branches. The initial proof loads:

1. compiled safe defaults;
2. one explicitly supplied JSON object from the native caller;
3. validated feature-local config at mount.

No environment overlay is executed in this slice. A future environment adapter must map named values into the same typed loader and receive separate security review. Unknown fields, invalid types, and invalid enum values return `E_CONFIG`; startup or mount halts closed.

## Initial keys

| Key                         | Owner                    | Default             | Rule                                            |
| --------------------------- | ------------------------ | ------------------- | ----------------------------------------------- |
| `authority.default_posture` | `kernel/authority`       | `deny`              | only `deny` is admitted in this proof           |
| `authority.fallback_class`  | `kernel/authority`       | `unknown`           | missing classification never broadens authority |
| `source.allowed_roots`      | `kernel/source`          | `[]`                | no native reads are admitted by default         |
| `source.max_bytes`          | `kernel/source`          | `1048576`           | oversized requests fail before a read           |
| `source.utf8_policy`        | `kernel/source`          | `strict`            | malformed text fails closed                     |
| `flags.<flag_id>`           | `kernel/flags`           | declaration default | unknown ids are rejected                        |
| `telemetry.level`           | `kernel/telemetry`       | `info`              | local structured events only                    |
| `telemetry.sink`            | `kernel/telemetry`       | `stdout`            | no network sink exists                          |
| `foundation.skeleton_ui`    | `presentation/app-shell` | `false`             | demonstration route is absent when disabled     |

Secrets are not configuration values in this foundation. Logs and errors never echo raw config objects. No key grants filesystem, process, network, credential, deployment, or Hub-write authority.
