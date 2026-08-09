# Presentation state boundaries

The browser-compatible foundation applies the development report's hybrid state decision without transferring authority into the WebView.

## Zustand vanilla store

`src/foundation/store.ts` owns cross-cutting presentation state: active route, local foundation-status projection, loading state, and safe error projection. It stores no canonical record, filesystem path authority, secret, capability grant, receipt acceptance, or review decision. Actions are explicit and tested through TypeScript compilation and the demonstration flow.

## XState lifecycle machine

`src/foundation/machine.ts` owns the bounded status-request lifecycle: `idle → loading → ready | failed`, with retry returning to `loading`. Impossible transitions are ignored by the machine rather than inferred from view state. Business workflows and human gates are not implemented here.

## Component-local state

Ephemeral input text for the echo demonstration remains local to the rendering function. It is not promoted to the store.

## Native authority

Rust remains authoritative for capability denial, config and flag validation, module registration, correlation/error consistency, source boundaries, and any future durable effects. Presentation state is a rebuildable projection of typed IPC results.
