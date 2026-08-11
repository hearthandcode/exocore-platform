#!/usr/bin/env python3
"""Validate the public-safe Exocore agent-runtime source projection."""
from __future__ import annotations

import copy
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
CONTRACTS = ROOT / "contracts/agent-runtime"
EXPECTED_SOURCE_ID = "hub-exocore-agent-runtime-v1"
EXPECTED_SOURCE_DIGEST = "7666dd8a71589f9fc404f89619675c541b3c59a2c1753eada2ed3912c6ebe59b"
FORBIDDEN_PUBLIC_TEXT = (
    "/home/",
    "hearthandcode-hub",
    "04-workspace--scriptorium",
    "05-mechanism-annex--forge",
    "12-restricted-archive--vault",
    "session:019",
)
DIAGNOSTICS: list[str] = []


def fail(code: str, message: str) -> None:
    DIAGNOSTICS.append(f"{code}: {message}")


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text())
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"cannot load JSON {path}: {exc}") from exc


def validate(instance: Any, schema: Any, label: str) -> None:
    errors = sorted(Draft202012Validator(schema).iter_errors(instance), key=lambda error: list(error.path))
    for error in errors:
        location = ".".join(map(str, error.path)) or "$"
        fail("E_SCHEMA", f"{label}:{location}:{error.message}")


def assert_dag(nodes: set[str], dependencies: dict[str, list[str]], label: str) -> None:
    visiting: set[str] = set()
    visited: set[str] = set()
    for owner, required in dependencies.items():
        unknown = set(required) - nodes
        if unknown:
            fail("E_UNKNOWN_DEPENDENCY", f"{label}:{owner}:{sorted(unknown)}")

    def visit(node: str) -> None:
        if node in visiting:
            fail("E_DEPENDENCY_CYCLE", f"{label}:{node}")
            return
        if node in visited:
            return
        visiting.add(node)
        for dependency in dependencies.get(node, []):
            if dependency in nodes:
                visit(dependency)
        visiting.remove(node)
        visited.add(node)

    for node in sorted(nodes):
        visit(node)


def semantic_run_diagnostic(run: dict[str, Any]) -> str | None:
    allowed_capabilities = set(run["model"]["required_capabilities"])
    allowed_tools = set(run["tools"]["allow"])
    allowed_effects = set(run["tools"]["effects"])
    disclosure_rank = {"public-safe": 0, "internal": 1, "restricted": 2}
    maximum_disclosure = disclosure_rank[run["context"]["disclosure"]]
    nodes = run["agent"]["orchestration"]["nodes"]
    node_ids = {node["node_id"] for node in nodes}
    if len(node_ids) != len(nodes):
        return "E_DUPLICATE_NODE"
    before = len(DIAGNOSTICS)
    assert_dag(node_ids, {node["node_id"]: node["depends_on"] for node in nodes}, "orchestration")
    if len(DIAGNOSTICS) != before:
        return DIAGNOSTICS[-1].split(":", 1)[0]
    for node in nodes:
        if not set(node["capabilities"]) <= allowed_capabilities:
            return "E_CHILD_CAPABILITY_ESCALATION"
        if not set(node["tools"]) <= allowed_tools:
            return "E_CHILD_TOOL_ESCALATION"
        if not set(node["effects"]) <= allowed_effects:
            return "E_CHILD_EFFECT_ESCALATION"
        if disclosure_rank[node["disclosure"]] > maximum_disclosure:
            return "E_CHILD_DISCLOSURE_ESCALATION"
    if run["session"]["root_run_id"] != run["run_id"]:
        return "E_ROOT_RUN_MISMATCH"
    if run["model"]["provider"] == "deterministic-synthetic" and any(run["model"]["provider_constraints"].values()):
        return "E_SYNTHETIC_PROVIDER_EFFECT"
    return None


def apply_mutation(document: dict[str, Any], mutation: dict[str, Any]) -> None:
    try:
        parts = [part.replace("~1", "/").replace("~0", "~") for part in mutation["path"].split("/")[1:]]
        target: Any = document
        for part in parts[:-1]:
            target = target[int(part)] if isinstance(target, list) else target[part]
        leaf = parts[-1]
        if mutation["operation"] != "append":
            raise ValueError("unsupported mutation")
        destination = target[int(leaf)] if isinstance(target, list) else target[leaf]
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise ValueError(f"invalid fixture mutation: {mutation}") from exc
    if not isinstance(destination, list):
        raise ValueError(f"append destination is not a list: {mutation['path']}")
    destination.append(mutation["value"])


def schema_diagnostic(document: dict[str, Any], schema: dict[str, Any]) -> str | None:
    errors = list(Draft202012Validator(schema).iter_errors(document))
    if errors:
        return "E_UNKNOWN_HOOK_OUTCOME" if any("mutate-anything" in error.message for error in errors) else "E_SCHEMA"
    return semantic_run_diagnostic(document)


def validate_projection_lineage(projection: dict[str, Any], runtime: dict[str, Any]) -> None:
    source = projection["source"]
    runtime_source = runtime["source_projection"]
    if source["source_id"] != EXPECTED_SOURCE_ID or runtime_source["source_id"] != EXPECTED_SOURCE_ID:
        fail("E_SOURCE_ID", "projection source id mismatch")
    if source["package_digest"] != EXPECTED_SOURCE_DIGEST or runtime_source["source_package_digest"] != EXPECTED_SOURCE_DIGEST:
        fail("E_SOURCE_DRIFT", "projection source digest mismatch")
    if source["verified"] or runtime["verified"]:
        fail("E_VERIFICATION_PROMOTION", "projection cannot be verified")
    if projection["projection"]["automatic_writeback"]:
        fail("E_AUTOMATIC_WRITEBACK", "must remain false")
    if projection["runtime"]["status"] != "inactive":
        fail("E_RUNTIME_ACTIVATION", projection["runtime"]["status"])


def validate_public_boundary() -> int:
    checked = 0
    roots = [CONTRACTS, ROOT / "docs/architecture"]
    for directory in roots:
        if not directory.exists():
            continue
        for path in directory.rglob("*"):
            if not path.is_file() or path.suffix not in {".json", ".md", ".ts", ".rs"}:
                continue
            text = path.read_text(errors="ignore")
            for forbidden in FORBIDDEN_PUBLIC_TEXT:
                if forbidden in text:
                    fail("E_PRIVATE_PROJECTION_LEAK", f"{path.relative_to(ROOT)}:{forbidden}")
            checked += 1
    return checked


def main() -> None:
    source_projection = load_json(CONTRACTS / "source-projection.v1.json")
    runtime = load_json(CONTRACTS / "exocore.agent-runtime.v1.json")
    run_schema = load_json(CONTRACTS / "exocore.agent-runtime.run.v1.schema.json")
    module_schema = load_json(ROOT / "contracts/foundation/exocore.module.v2.schema.json")
    module = load_json(CONTRACTS / "module.v2.json")
    config_schema = load_json(CONTRACTS / "config.schema.json")
    config = load_json(CONTRACTS / "default.config.json")
    run = load_json(CONTRACTS / "fixtures/valid/synthetic-supervisor-run.json")

    validate_projection_lineage(source_projection, runtime)
    validate(module, module_schema, "module.v2.json")
    validate(config, config_schema, "default.config.json")
    validate(run, run_schema, "synthetic-supervisor-run.json")

    modules = runtime["modules"]
    module_ids = {module_entry["id"] for module_entry in modules}
    assert_dag(module_ids | {"foundation", "persistence"}, {entry["id"]: entry["dependencies"] for entry in modules}, "modules")

    diagnostic = semantic_run_diagnostic(run)
    if diagnostic:
        fail(diagnostic, "valid fixture")

    invalid_checked = 0
    for path in sorted((CONTRACTS / "fixtures/invalid").glob("*.json")):
        fixture = load_json(path)
        mutated = copy.deepcopy(run)
        apply_mutation(mutated, fixture["mutation"])
        actual = schema_diagnostic(mutated, run_schema)
        if actual != fixture["expected_diagnostic"]:
            fail("E_INVALID_FIXTURE", f"{path.name}:expected={fixture['expected_diagnostic']}:actual={actual}")
        invalid_checked += 1

    catalog = load_json(ROOT / "contracts/foundation/module-catalog.v1.json")
    declared = {entry["module_id"]: entry for entry in catalog["modules"]}
    if declared.get("agent-runtime", {}).get("declaration") != "contracts/agent-runtime/module.v2.json":
        fail("E_MODULE_CATALOG", "agent-runtime declaration missing")
    identifiers = load_json(ROOT / "contracts/foundation/identifier-policy.json")
    if identifiers["namespace_owners"].get("exocore.agent-runtime") != "agent-runtime":
        fail("E_NAMESPACE_OWNER", "agent-runtime namespace owner missing")
    boundaries = load_json(ROOT / "contracts/foundation/module-boundary-manifest.json")
    if not any(entry["id"] == "native-agent-runtime" for entry in boundaries["modules"]):
        fail("E_BOUNDARY_ENTRY", "native-agent-runtime missing")

    generated = subprocess.run(
        [sys.executable, str(ROOT / "scripts/generate_agent_runtime_types.py"), "--check"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if generated.returncode != 0:
        fail("E_GENERATED_TYPES", (generated.stdout + generated.stderr).strip())

    public_files = validate_public_boundary()
    if config["enabled"]:
        fail("E_DEFAULT_ENABLED", "agent-runtime must remain disabled")
    if any(gate["status"] != "pending" for gate in runtime["human_gates"]):
        fail("E_GATE_PROMOTION", "all projected gates must remain pending")

    if DIAGNOSTICS:
        for diagnostic in DIAGNOSTICS:
            print(diagnostic)
        raise SystemExit(f"agent-runtime projection invalid: errors={len(DIAGNOSTICS)}")

    print(
        "AGENT_RUNTIME_PROJECTION_VALID "
        f"source_digest={EXPECTED_SOURCE_DIGEST} "
        f"modules={len(modules)} "
        f"context_layers={len(runtime['context']['layers'])} "
        f"lifecycle_scopes={len(runtime['lifecycle']['scopes'])} "
        f"hook_outcomes={len(runtime['hooks']['outcomes'])} "
        f"strategies={len(runtime['orchestration']['strategies'])} "
        f"provider_capabilities={len(runtime['providers']['capabilities'])} "
        f"invalid_fixtures={invalid_checked} "
        f"public_files={public_files} "
        "errors=0"
    )


if __name__ == "__main__":
    main()
