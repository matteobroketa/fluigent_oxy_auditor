#!/usr/bin/env python3
"""Lightweight checks for the self-contained GitHub Pages application."""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    if not INDEX.is_file():
        fail("index.html is missing")

    text = INDEX.read_text(encoding="utf-8")

    required = [
        "<!doctype html>",
        "<title>OXY Trace Auditor</title>",
        'id="oxyInput"',
        'id="csvInput"',
        "parseOxy",
        "parseCSV",
        "calcMetrics",
    ]
    for marker in required:
        if marker not in text:
            fail(f"required application marker missing: {marker}")

    if re.search(r"https?://", text, flags=re.IGNORECASE):
        # External links can be legitimate in documentation/help, but executable
        # external resources would violate the current self-contained model.
        resource_patterns = [
            r'<script[^>]+src=["\']https?://',
            r'<link[^>]+href=["\']https?://[^>]+rel=["\'](?:stylesheet|modulepreload|preload)',
        ]
        for pattern in resource_patterns:
            if re.search(pattern, text, flags=re.IGNORECASE):
                fail("external executable/style dependency detected in index.html")

    favicon = ROOT / "assets" / "favicon.svg"
    if not favicon.is_file():
        fail("assets/favicon.svg is missing")

    scripts = re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>", text, flags=re.DOTALL | re.IGNORECASE)
    if not scripts:
        fail("no inline JavaScript found")

    node = shutil.which("node")
    if node:
        with tempfile.TemporaryDirectory() as temp_dir:
            for i, script in enumerate(scripts, start=1):
                path = Path(temp_dir) / f"inline-{i}.js"
                path.write_text(script, encoding="utf-8")
                result = subprocess.run(
                    [node, "--check", str(path)],
                    text=True,
                    capture_output=True,
                )
                if result.returncode:
                    print(result.stdout)
                    print(result.stderr, file=sys.stderr)
                    fail(f"JavaScript syntax check failed for inline script {i}")
    else:
        print("NOTE: node not found; skipped JavaScript syntax check")

    forbidden_extensions = {".oxy", ".csv", ".tsv", ".xlsx", ".xls"}
    accidental_data = [
        p.relative_to(ROOT)
        for p in ROOT.rglob("*")
        if p.is_file()
        and p.suffix.lower() in forbidden_extensions
        and "examples" not in p.relative_to(ROOT).parts
    ]
    if accidental_data:
        fail("experimental data files found in repository: " + ", ".join(map(str, accidental_data)))

    print("OXY Trace Auditor static smoke checks passed.")


if __name__ == "__main__":
    main()
