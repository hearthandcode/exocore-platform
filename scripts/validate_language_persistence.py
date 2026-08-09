#!/usr/bin/env python3
"""Validate Exocore language, module-v2, persistence, and SQL parity contracts."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]


def load(relative: str):
    return json.loads((ROOT / relative).read_text())


def validate(instance: str, schema: str) -> None:
    validator = Draft202012Validator(load(schema))
    errors = sorted(validator.iter_errors(load(instance)), key=lambda error: list(error.path))
    if errors:
        rendered = "; ".join(f"{'.'.join(map(str, error.path)) or '$'}: {error.message}" for error in errors)
        raise AssertionError(f"{instance} invalid: {rendered}")


def sql_shape(relative: str) -> dict[str, set[str]]:
    source = (ROOT / relative).read_text()
    shape: dict[str, set[str]] = {}
    pattern = re.compile(r"CREATE TABLE IF NOT EXISTS (?:exocore\.)?([a-z_]+)\s*\((.*?)\n\)(?: STRICT)?;", re.S)
    for table, body in pattern.findall(source):
        columns: set[str] = set()
        for raw in body.splitlines():
            line = raw.strip().rstrip(",")
            if not line or line.startswith(("PRIMARY ", "UNIQUE ", "FOREIGN ", "CHECK ")):
                continue
            name = line.split()[0].strip('"')
            if re.fullmatch(r"[a-z][a-z0-9_]+", name):
                columns.add(name)
        shape[table] = columns
    return shape


def main() -> None:
    validate("contracts/persistence/exocore.persistence.v1.json", "contracts/persistence/exocore.persistence.v1.schema.json")
    validate("contracts/persistence/module.v2.json", "contracts/foundation/exocore.module.v2.schema.json")
    validate("contracts/persistence/module-mount.v1.json", "contracts/foundation/exocore.module-mount.v1.schema.json")
    validate("contracts/persistence/default.config.json", "contracts/persistence/config.schema.json")
    validate("contracts/foundation/identifier-policy.json", "contracts/foundation/identifier-policy.schema.json")
    for operation in sorted((ROOT / "contracts/persistence/operations").glob("*.json")):
        validate(str(operation.relative_to(ROOT)), "contracts/language/exocore.language.v1.schema.json")

    vocabulary = load("contracts/language/exocore.vocabulary.v1.json")
    terms = [term["id"] for term in vocabulary["terms"]]
    assert terms == sorted(set(terms)), "vocabulary terms must be sorted and unique"
    assert all(term["definition"].endswith(".") for term in vocabulary["terms"]), "definitions must be sentences"

    identifier_policy = load("contracts/foundation/identifier-policy.json")
    assert identifier_policy["primitive_vocabulary"] == terms, "identifier policy and canonical vocabulary differ"
    module_catalog = load("contracts/foundation/module-catalog.v1.json")
    assert module_catalog["schema"] == "exocore.module-catalog.v1"
    active_module_ids = {module["module_id"] for module in module_catalog["modules"]}
    deprecated_module_ids = {module["module_id"] for module in module_catalog["deprecated_modules"]}
    assert set(identifier_policy["namespace_owners"].values()) <= active_module_ids, "active namespace owner is not a declared semantic module"
    assert {entry["former_owner"] for entry in identifier_policy["deprecated_namespaces"].values()} <= deprecated_module_ids, "deprecated namespace owner is not archived in the module catalog"
    assert not (set(identifier_policy["namespace_owners"]) & set(identifier_policy["deprecated_namespaces"])), "namespace cannot be active and deprecated"

    taxonomy = load("contracts/language/exocore.taxonomy.v1.json")
    for name, values in taxonomy["dimensions"].items():
        assert values == list(dict.fromkeys(values)), f"taxonomy {name} contains duplicates"

    model = load("contracts/persistence/exocore.persistence.v1.json")
    logical = {entity["name"]: {column[0] for column in entity["columns"]} for entity in model["entities"]}
    sqlite = sql_shape("contracts/persistence/sqlite/0001_initial.sql")
    postgres = sql_shape("contracts/persistence/postgres/0001_initial.sql")
    assert set(logical) == set(sqlite) == set(postgres), "logical/SQLite/PostgreSQL entity sets differ"
    for table, columns in logical.items():
        assert columns == sqlite[table], f"SQLite columns differ for {table}: {columns ^ sqlite[table]}"
        assert columns == postgres[table], f"PostgreSQL columns differ for {table}: {columns ^ postgres[table]}"

    module = load("contracts/persistence/module.v2.json")
    operation_ids = {operation["id"] for operation in module["operations"]}
    expression_ids = {load(str(path.relative_to(ROOT)))["expression_id"] for path in (ROOT / "contracts/persistence/operations").glob("*.json")}
    assert operation_ids == expression_ids, "module operations and language expressions differ"
    assert module["dependencies"] == ["foundation"]
    assert model["authority_model"] == {
        "sqlite": "local-transitory",
        "postgresql": "durable-authority",
        "qdrant": "vector-projection",
        "neo4j": "graph-projection",
    }

    subprocess.run([sys.executable, str(ROOT / "scripts/generate_contract_types.py"), "--check"], check=True)
    print(f"language/persistence contracts valid: terms={len(terms)} dimensions={len(taxonomy['dimensions'])} entities={len(logical)} operations={len(operation_ids)} sql_parity=sqlite+postgres")


if __name__ == "__main__":
    main()
