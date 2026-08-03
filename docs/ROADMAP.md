# Roadmap

This is a direction of travel, not a delivery promise.

## Completed: v0.0.1 profile-evaluation workroom

- [x] A Tauri v2 desktop app presents one keyboard-operable profile-evaluation flow.
- [x] Rust owns fixture validation, policy, deterministic mock execution, scoring, hashing, and append-only application receipts.
- [x] TypeScript presents the contract and receipt without direct native effects.
- [x] A standard-library Python worker proves the versioned development protocol independently.
- [x] The first slice uses no network, provider, model, credential, private source, database, telemetry, or cloud service.

## Next: harden the local proof

- [ ] Add browser-level interaction and accessibility tests.
- [ ] Prove interruption and cancellation on a deliberately long local adapter.
- [ ] Validate every public schema through a reviewed Rust JSON Schema implementation.
- [ ] Package the Python worker only if a measured use case justifies the added lifecycle surface.
- [ ] Add a human-reviewed export path without exposing private app-data paths.

## Later: governed adapter experiments

- [ ] Evaluate whether a local record store can prove integrity, backup, restore, and export without turning derived views into hidden authorities.
- [ ] Prove a loopback-only adapter against an already available local endpoint.
- [ ] Add credential storage only after OS-keychain threat-model and failure-mode tests.
- [ ] Explore hosted providers only through provider-specific capability, provenance, data, and cost gates.
- [ ] Let evolution agents propose fixture or profile candidates without access to hidden baselines or promotion authority.

## Not on the immediate roadmap

Ambient computer use, automatic workflow change, cloud-first data storage, mobile clients, and unmanaged provider integrations are not part of this early seed.
