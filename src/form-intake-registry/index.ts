export { FormIntakeRegistryModule, flagDeclaration } from "./module";
export { buildProjection } from "./projection";
export { validateFormExport } from "./validation";
export type { TypedError, ErrorCode } from "./errors";
export type * from "./types";

// Adapters, stores, dedupe, and normalization remain private implementation details.
// No kernel or shell registration occurs here.
