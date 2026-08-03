# Exocore profile-evaluation Python worker

This is a development-only protocol-conformance worker for Exocore Platform v0.0.1. It proves that a Rust-supervised process can consume and return the same public, versioned fixture semantics without becoming the desktop control plane.

It uses only the Python standard library. It accepts newline-delimited JSON on standard input and emits one result envelope per input line on standard output. Input is capped at 65,536 encoded bytes. Unknown fields, malformed values, and unsupported protocol versions fail closed.

Run the tests from the repository root:

```text
python3 -m unittest discover -s workers/profile-evaluation-python/tests -v
```

Run the worker manually:

```text
PYTHONPATH=workers/profile-evaluation-python/src python3 -m exocore_profile_worker
```

The worker has no provider, network, credential, filesystem, profile-promotion, or release authority. Rust remains responsible for process supervision and accepting or rejecting any result.
