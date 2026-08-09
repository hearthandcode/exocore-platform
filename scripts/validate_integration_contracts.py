#!/usr/bin/env python3
"""Fail-closed validation for the foundation/intake integration proof contracts."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]


def load(path: str) -> dict:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def validate(instance_path: str, schema_path: str) -> None:
    instance = load(instance_path)
    schema = load(schema_path)
    Draft202012Validator.check_schema(schema)
    Draft202012Validator(schema).validate(instance)


def main() -> None:
    pairs = [
        (
            "contracts/form-intake-registry/v1/module-manifest.json",
            "contracts/foundation/exocore.module-mount.v1.schema.json",
        ),
        (
            "contracts/form-intake-registry/v1/default.config.json",
            "contracts/form-intake-registry/v1/config.schema.json",
        ),
        (
            "contracts/foundation/identifier-policy.json",
            "contracts/foundation/identifier-policy.schema.json",
        ),
        (
            "contracts/form-intake-registry/v1/proof.workflow.json",
            "contracts/foundation/exocore.workflow.v1.schema.json",
        ),
    ]
    for instance, schema in pairs:
        validate(instance, schema)

    manifest = load("contracts/form-intake-registry/v1/module-manifest.json")
    identifiers = load("contracts/foundation/identifier-policy.json")
    workflow = load("contracts/form-intake-registry/v1/proof.workflow.json")

    patterns = {name: re.compile(pattern) for name, pattern in identifiers["patterns"].items()}
    assert patterns["module_id"].fullmatch(manifest["module_id"])
    assert patterns["namespaced_id"].fullmatch(manifest["config_schema"])
    for value in manifest["routes"] + manifest["commands"] + manifest["contracts"]:
        assert patterns["namespaced_id"].fullmatch(value), value
    for value in manifest["config_keys"]:
        assert patterns["config_key"].fullmatch(value), value
        assert value.startswith(f"{manifest['module_id']}.")
    assert manifest["flag_declaration"]["default"] is False
    assert manifest["flag_declaration"]["owner"] == manifest["module_id"]

    states = set(workflow["states"])
    assert workflow["failure_state"] in states
    assert len({step["step_id"] for step in workflow["steps"]}) == len(workflow["steps"])
    for transition in workflow["transitions"]:
        assert transition["from"] in states
        assert transition["to"] in states
        assert patterns["namespaced_id"].fullmatch(transition["event"])
    for step in workflow["steps"]:
        assert patterns["namespaced_id"].fullmatch(step["operation"])

    module_source = (ROOT / "src/form-intake-registry/module.ts").read_text(encoding="utf-8")
    for literal in (
        'id: "form-intake-registry.enabled"',
        'default: false',
        'owner: "form-intake-registry"',
    ):
        assert literal in module_source, f"module declaration drift: {literal}"

    digests = {
        Path(path).name: hashlib.sha256((ROOT / path).read_bytes()).hexdigest()
        for path, _ in pairs
    }
    print(
        "integration contracts valid: "
        f"{len(pairs)} schema instances, {len(workflow['steps'])} workflow steps, "
        f"manifest_sha256={digests['module-manifest.json']}"
    )


if __name__ == "__main__":
    main()
