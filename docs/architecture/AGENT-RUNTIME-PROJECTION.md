# Agent Runtime Source Projection

Status: experimental public-safe projection; `verified: false`; runtime inactive.

## Recognition

- **Purpose:** Orient implementation work to the projected Exocore agent-runtime contract without treating this repository as canonical architecture authority.
- **Location:** `docs/architecture/AGENT-RUNTIME-PROJECTION.md`.
- **Papertrail:** public source identifier `hub-exocore-agent-runtime-v1`, source revision `1`, package SHA-256 `7666dd8a71589f9fc404f89619675c541b3c59a2c1753eada2ed3912c6ebe59b`.
- **Verification state:** Contract projection validation is deterministic; semantic acceptance and runtime fitness remain unverified.
- **Next action:** Run `python3 scripts/validate_agent_runtime.py`, then implement only the local synthetic default-off proof declared by the projection.

## Authority warning

Generated from a private Hub source digest. This projection is non-authoritative and may be stale. It contains no private Hub source body or locator. Runtime observations return as Evidence or a Receipt; they do not amend the source automatically.

## Projected surface

The projection defines:

- eight candidate semantic modules;
- eight context layers and source types;
- sixteen lifecycle scopes;
- immutable events and typed hook interventions;
- eight orchestration strategies with child capability attenuation;
- provider-neutral structured model, tool, memory, and receipt boundaries;
- sixteen provider capabilities and candidate provider modules; and
- one deterministic supervisor/worker/critic fixture.

The first implementation is provider-free, credential-free, network-free, public-safe, synthetic, and disabled by default. Live provider, private context, OAuth, subscription, spend, tool effect, persistence, deployment, and release work require separate gates.

## Entry points

- `contracts/agent-runtime/source-projection.v1.json`
- `contracts/agent-runtime/exocore.agent-runtime.v1.json`
- `contracts/agent-runtime/exocore.agent-runtime.run.v1.schema.json`
- `contracts/agent-runtime/module.v2.json`
- `scripts/validate_agent_runtime.py`
- generated Rust and TypeScript enums under `src-tauri/src/contracts/` and `src/contracts/generated/`
