# Foundation feature-flag registry

Flags are typed declarations with stable id, owner, safe default, enabled behavior, disabled behavior, and lifecycle. Registration rejects duplicate ids. Reads of unknown flags return `E_UNREGISTERED`; they never guess `true`. Overrides may change only a registered flag and are held in local process state for this structural proof.

| Flag                     | Owner        | Default | Lifecycle     | Enabled                                   | Disabled                                           |
| ------------------------ | ------------ | ------- | ------------- | ----------------------------------------- | -------------------------------------------------- |
| `foundation.skeleton_ui` | `foundation` | `false` | demonstration | exposes the local foundation status route | route is absent and native status reports disabled |

A mounted feature supplies its own declaration through `exocore.module-mount.v1`; the kernel adopts it only after the entire mount validates. Flag registration does not authorize a feature, migrate data, or imply release. Persistent overrides, cohorts, remote flags, and canary deployment are deferred.
