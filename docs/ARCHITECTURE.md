# Architecture posture

## Status

Exocore Platform is at a pre-alpha orientation-shell stage. The source in this repository currently consists of a static browser-compatible TypeScript interface hosted by a minimal Tauri v2 application.

The window is intentionally not a miniature version of a future product. It does not store records, make decisions, or receive authority over a person's files or workflow.

## Direction

The project is exploring a local-first cognitive workbench with five connected concerns:

1. **A readable workroom:** a place to orient around one active thread, its next meaningful action, and its recovery route after interruption.
2. **Visible agency:** assistance may generate a proposal, but a human must be able to see its reason, scope, and reversal path before it becomes durable.
3. **Durable provenance:** useful artifacts need a legible relationship to their sources, decisions, and changes.
4. **Class-specific authority:** user-facing Library work should remain where people can inspect and version it, while dynamic operational facts require a separately designed local authority and recovery contract.
5. **Rebuildable views:** indexes and interfaces should not silently become the authority they render.

## What is not decided here

This repository does not select a database, define a runtime CoreStore schema, establish an adapter protocol, publish a provider policy, or authorize background automation. Those are future design and proof tasks.

A future native proof must demonstrate at least a denied capability path, governed state changes, explicit human gates, and recoverable close/reopen behaviour. A static window cannot supply that evidence.

## Technology boundary

Tauri v2 is the current shell candidate because it can pair a browser-compatible TypeScript interface with a Rust host. If its named capability or packaging criteria fail, the presentation shell can change without turning the host process into an unchecked authority. Any alternative shell would need its own threat model and enforcement proof.
