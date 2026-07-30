#!/usr/bin/env python3
"""Regression checks for the documented piecewise Fluigent water profiles.

The application is a dependency-free single HTML file; this test guards the
profile registry values and the central-model hooks without requiring a browser.
"""
from pathlib import Path
import re

text = (Path(__file__).resolve().parents[1] / "index.html").read_text(encoding="utf-8")
rows = re.findall(r'\["([a-z]+)", "FLOW UNIT\+?", "([A-Z]+\+?)", ([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+)\]', text)
profiles = {model: tuple(map(float, values)) for _, model, *values in rows}

expected = {
    "M+": (2000, .5, 10, 5), "S": (7, .021, .42, 5),
    "XS": (1.5, .0075, .075, 10), "L+": (40000, 50, 1000, 5),
}
assert {k: profiles[k] for k in expected} == expected

def envelope(model, measured):
    _, absolute, crossover, percent = profiles[model]
    return absolute if abs(measured) <= crossover else abs(measured) * percent / 100

for model, samples in {
    "M+": [(5, .5), (10, .5), (20, 1)],
    "S": [(.2, .021), (.42, .021), (1, .05)],
    "XS": [(.05, .0075), (.075, .0075), (.1, .01)],
    "L+": [(500, 50), (1000, 50), (2000, 100)],
}.items():
    for measured, value in samples:
        assert abs(envelope(model, measured) - value) < 1e-12
        assert abs(envelope(model, -measured) - value) < 1e-12
assert envelope("M+", 0) == .5

for marker in ("function processTolerance", "function manufacturerAccuracy", "function effectiveTrackingTolerance", "function profileAgreementTolerance", "trackingDecision(flow, x.actual, x.target)"):
    assert marker in text, marker
print("Tolerance-model regression checks passed.")
