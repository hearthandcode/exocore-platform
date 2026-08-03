from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, TextIO

MAX_LINE_BYTES = 65_536
EXPECTED_FIELDS = {
    "schema_version",
    "request_id",
    "adapter_id",
    "fixture_id",
    "prompt",
    "expected_output",
}


@dataclass(frozen=True)
class ProtocolError(Exception):
    message: str
    request_id: str = "unknown"

    def __str__(self) -> str:
        return self.message


def process_envelope(envelope: dict[str, Any]) -> dict[str, Any]:
    request_id = envelope.get("request_id", "unknown")
    if not isinstance(request_id, str) or not request_id:
        request_id = "unknown"
    unknown = set(envelope) - EXPECTED_FIELDS
    missing = EXPECTED_FIELDS - set(envelope)
    if unknown:
        raise ProtocolError(f"unknown fields: {', '.join(sorted(unknown))}", request_id)
    if missing:
        raise ProtocolError(f"missing fields: {', '.join(sorted(missing))}", request_id)
    if envelope["schema_version"] != "1.0":
        raise ProtocolError("unsupported schema version", request_id)
    if envelope["adapter_id"] != "python-mock-v1":
        raise ProtocolError("unsupported adapter", request_id)
    for field in ("request_id", "fixture_id", "prompt", "expected_output"):
        value = envelope[field]
        if not isinstance(value, str) or not value:
            raise ProtocolError(f"{field} must be a non-empty string", request_id)
    if len(envelope["request_id"]) > 128 or len(envelope["fixture_id"]) > 64:
        raise ProtocolError("identifier exceeds protocol limit", request_id)
    if len(envelope["prompt"]) > 4096 or len(envelope["expected_output"]) > 4096:
        raise ProtocolError("content exceeds protocol limit", request_id)

    output = envelope["expected_output"]
    input_tokens = _estimated_tokens(envelope["prompt"])
    output_tokens = _estimated_tokens(output)
    return {
        "schema_version": "1.0",
        "request_id": request_id,
        "adapter_id": "python-mock-v1",
        "status": "completed",
        "normalized_output": output,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "measurement_source": "derived-estimate",
        "error": None,
    }


def run_stream(stdin: TextIO, stdout: TextIO) -> int:
    for line in stdin:
        request_id = "unknown"
        try:
            if len(line.encode("utf-8")) > MAX_LINE_BYTES:
                raise ProtocolError("input line exceeds 65536-byte limit")
            parsed = json.loads(line)
            if not isinstance(parsed, dict):
                raise ProtocolError("input envelope must be a JSON object")
            request_id_value = parsed.get("request_id")
            if isinstance(request_id_value, str) and request_id_value:
                request_id = request_id_value
            result = process_envelope(parsed)
        except (json.JSONDecodeError, ProtocolError) as error:
            if isinstance(error, ProtocolError):
                request_id = error.request_id
            result = {
                "schema_version": "1.0",
                "request_id": request_id,
                "adapter_id": "python-mock-v1",
                "status": "rejected",
                "normalized_output": "",
                "input_tokens": 0,
                "output_tokens": 0,
                "measurement_source": "derived-estimate",
                "error": str(error),
            }
        stdout.write(json.dumps(result, separators=(",", ":"), sort_keys=True) + "\n")
        stdout.flush()
    return 0


def _estimated_tokens(text: str) -> int:
    return len(text.split())
