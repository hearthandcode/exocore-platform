import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = readJson("contracts/foundation/module-boundary-manifest.json");
const identifiers = readJson("contracts/foundation/identifier-policy.json");

if (manifest.schema !== "exocore.module-boundaries.v1") {
  throw new Error("E_SCHEMA: unsupported boundary manifest");
}
if (identifiers.schema !== "exocore.identifier-policy.v2") {
  throw new Error("E_SCHEMA: unsupported identifier policy");
}

const moduleIdPattern = new RegExp(identifiers.patterns.module_id);
const ids = new Set(manifest.modules.map((module) => module.id));
if (ids.size !== manifest.modules.length) {
  throw new Error("E_DUPLICATE: module ids must be unique");
}

for (const module of manifest.modules) {
  if (!moduleIdPattern.test(module.id)) {
    throw new Error(`E_IDENTIFIER: invalid module id ${module.id}`);
  }
  statSync(resolve(root, module.path));
  for (const dependency of module.may_depend_on) {
    if (!ids.has(dependency)) {
      throw new Error(`E_UNREGISTERED: ${module.id} depends on ${dependency}`);
    }
    if (dependency === module.id) {
      throw new Error(`E_CYCLE: ${module.id} depends on itself`);
    }
  }
}

const visiting = new Set();
const visited = new Set();
const byId = new Map(manifest.modules.map((module) => [module.id, module]));
function visit(id) {
  if (visiting.has(id)) throw new Error(`E_CYCLE: dependency cycle at ${id}`);
  if (visited.has(id)) return;
  visiting.add(id);
  for (const dependency of byId.get(id).may_depend_on) visit(dependency);
  visiting.delete(id);
  visited.add(id);
}
for (const id of ids) visit(id);

const sourceFiles = walk(resolve(root, "src")).filter((path) =>
  [".ts", ".tsx"].includes(extname(path)),
);
for (const path of sourceFiles) {
  const source = readFileSync(path, "utf8");
  const local = relative(root, path).split("\\").join("/");
  if (
    !local.startsWith("src/persistence/") &&
    /(?:\.\.\/)+persistence\/(?:ipc|contracts)/.test(source)
  ) {
    throw new Error(
      `E_PRIVATE_IMPORT: ${local} imports a persistence private boundary`,
    );
  }
  if (
    (local === "src/main.ts" ||
      local.startsWith("src/foundation/") ||
      local.startsWith("src/integration/") ||
      local.startsWith("src/persistence/") ||
      local.startsWith("src/intake-registry/") ||
      local.startsWith("src/artifact-surface/")) &&
    /from\s+["']node:/.test(source)
  ) {
    throw new Error(`E_NATIVE_EFFECT: ${local} imports a Node native effect`);
  }
}

console.log(
  `boundary manifest valid: ${ids.size} modules, acyclic dependencies, ${sourceFiles.length} TypeScript files scanned`,
);

function readJson(path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}

function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) return walk(child);
    return [child];
  });
}
