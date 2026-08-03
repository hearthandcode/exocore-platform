from __future__ import annotations

import sys

from .protocol import run_stream


def main() -> int:
    return run_stream(sys.stdin, sys.stdout)


if __name__ == "__main__":
    raise SystemExit(main())
