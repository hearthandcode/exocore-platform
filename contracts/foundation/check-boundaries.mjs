import { readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(
  readFileSync(
    resolve(root, "contracts/foundation/module-boundary-manifest.json"),
    "utf8",
  ),
);

if (manifest.schema !== "exocore.module-boundaries.v1") {
  throw new Error("E_SCHEMA: unsupported boundary manifest");
}

const ids = new Set(manifest.modules.map((module) => module.id));
if (ids.size !== manifest.modules.length) {
  throw new Error("E_DUPLICATE: module ids must be unique");
}

for (const module of manifest.modules) {
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

console.log(
  `boundary manifest valid: ${ids.size} modules, acyclic dependencies`,
);
