from __future__ import annotations

import io
import json
import pathlib
import sys
import unittest

WORKER_ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(WORKER_ROOT / "src"))

from exocore_profile_worker.protocol import MAX_LINE_BYTES, process_envelope, run_stream


def valid_envelope() -> dict[str, object]:
    return {
        "schema_version": "1.0",
        "request_id": "request-001",
        "adapter_id": "python-mock-v1",
        "fixture_id": "profile-contract-smoke",
        "prompt": "State the profile and receipt boundary.",
        "expected_output": "A profile is a versioned contract. A run is evidence, not authority.",
    }


class ProtocolTests(unittest.TestCase):
    def test_valid_envelope_is_deterministic(self) -> None:
        first = process_envelope(valid_envelope())
        second = process_envelope(valid_envelope())
        self.assertEqual(first, second)
        self.assertEqual(first["status"], "completed")
        self.assertEqual(first["adapter_id"], "python-mock-v1")
        self.assertEqual(first["normalized_output"], valid_envelope()["expected_output"])
        self.assertEqual(
            first["input_tokens"], len(str(valid_envelope()["prompt"]).split())
        )

    def test_unknown_field_fails_closed(self) -> None:
        envelope = valid_envelope()
        envelope["network"] = "allow"
        stdin = io.StringIO(json.dumps(envelope) + "\n")
        stdout = io.StringIO()
        self.assertEqual(run_stream(stdin, stdout), 0)
        result = json.loads(stdout.getvalue())
        self.assertEqual(result["status"], "rejected")
        self.assertIn("unknown fields", result["error"])

    def test_malformed_json_is_rejected_without_crashing(self) -> None:
        stdout = io.StringIO()
        self.assertEqual(run_stream(io.StringIO("{not-json}\n"), stdout), 0)
        result = json.loads(stdout.getvalue())
        self.assertEqual(result["status"], "rejected")
        self.assertEqual(result["request_id"], "unknown")

    def test_oversized_line_is_rejected(self) -> None:
        oversized = "x" * MAX_LINE_BYTES + "\n"
        stdout = io.StringIO()
        self.assertEqual(run_stream(io.StringIO(oversized), stdout), 0)
        result = json.loads(stdout.getvalue())
        self.assertEqual(result["status"], "rejected")
        self.assertIn("65536-byte", result["error"])

    def test_stream_handles_multiple_requests(self) -> None:
        payload = json.dumps(valid_envelope()) + "\n" + json.dumps(valid_envelope()) + "\n"
        stdout = io.StringIO()
        self.assertEqual(run_stream(io.StringIO(payload), stdout), 0)
        results = [json.loads(line) for line in stdout.getvalue().splitlines()]
        self.assertEqual([result["status"] for result in results], ["completed", "completed"])


if __name__ == "__main__":
    unittest.main()
