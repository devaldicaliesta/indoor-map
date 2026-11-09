"""Keluar 0 bila graf hasil build sama dengan versi di HEAD, mengabaikan built_at_commit.

Dipakai .github/workflows/graphify.yml agar tidak membuat commit yang hanya mengganti hash commit.
"""

import json
import subprocess
import sys

try:
    committed = json.loads(
        subprocess.run(
            ["git", "show", "HEAD:graphify-out/graph.json"], capture_output=True, check=True
        ).stdout
    )
except (subprocess.CalledProcessError, ValueError):
    sys.exit(1)

with open("graphify-out/graph.json", encoding="utf-8") as f:
    current = json.load(f)

committed.pop("built_at_commit", None)
current.pop("built_at_commit", None)
sys.exit(0 if committed == current else 1)
