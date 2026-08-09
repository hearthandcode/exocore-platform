export { typedError } from "./errors";
export { FormIntakeRegistryModule, flagDeclaration } from "./module";
export { InMemoryRegistryStore } from "./adapters/in-memory-registry-store";
export { buildProjection } from "./projection";
export { validateFormExport } from "./validation";
export type { RegistryStore } from "./ports/registry-store";
export type { TypedError, ErrorCode } from "./errors";
export type * from "./types";

// Adapters, stores, dedupe, and normalization remain private implementation details.
// No kernel or shell registration occurs here.
