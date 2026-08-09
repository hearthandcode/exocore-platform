#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const projectionUrl = new URL(
  "../public/intake-registry/intake-registry.v0.2.json",
  import.meta.url,
);
const projection = JSON.parse(await readFile(projectionUrl, "utf8"));
const failures = [];
let checks = 0;

function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

check(projection.contract.authorityEffect === "derived-non-authoritative", "authority effect");
check(projection.contract.canonical === false, "canonical false");
check(projection.contract.syntheticOnly === true, "synthetic only");
check(/^[0-9a-f]{64}$/.test(projection.contract.sourceDigest), "source digest");
check(projection.taxonomy.cores.length === 16, "sixteen cores");
check(projection.forms.length === 10, "ten forms");
check(projection.definitions.length === 16, "sixteen definitions");
check(projection.workflow.statuses.length === 8, "eight statuses");
check(projection.workflow.statuses.includes("ready-for-route"), "ready-for-route present");
check(!projection.workflow.statuses.includes("accepted"), "accepted absent");
check(projection.workflow.transitions.length === 11, "eleven transitions");
check(projection.workflow.transitions.every((item) => item.unknownEffect === "block"), "unknown transitions block");
check(projection.workflow.consequentialGates.length === 8, "eight consequential gates");
check(projection.workflow.consequentialGates.every((item) => item.automatic === false), "consequential gates held");
check(projection.projection.databases.length === 4, "four databases");
check(projection.projection.crosswalk.length === 9, "nine-to-four crosswalk");
check(projection.projection.automaticWriteBack === false, "no automatic write-back");
check(projection.projection.silentOverwrite === false, "no silent overwrite");
check(projection.modules.mountState === "unmounted-candidate", "unmounted candidate");
check(projection.modules.items.length === 5, "five modules");
check(projection.modules.items.every((item) => item.writesAuthority === false), "modules do not write authority");
check(projection.modules.futureCortexPort.mayAdvanceWorkflow === false, "Cortex cannot advance workflow");
check(projection.modules.futureCortexPort.mayClassifyIntake === false, "Cortex cannot classify intake");
check(projection.taskCalendar.posture === "metadata-only-derived-view", "task and calendar metadata-only");

const serialized = JSON.stringify(projection);
for (const forbidden of [
  "/home/",
  "hearthandcode-hub",
  '"source_refs"',
  '"source_locator"',
  '"private_body"',
  '"restricted_body"',
  '"credentials"',
  '"provider_state"',
  '"raw_response"',
  '"personal_profile"',
]) {
  check(!serialized.includes(forbidden), `forbidden output: ${forbidden}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  console.error(
    `validate-intake-registry-projection: ${checks - failures.length} / ${checks} checks passed`,
  );
  process.exit(1);
}

console.log(
  `validate-intake-registry-projection: all ${checks} / ${checks} checks passed`,
);
console.log(`projection file: ${fileURLToPath(projectionUrl)}`);
