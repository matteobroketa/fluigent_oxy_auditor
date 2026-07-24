# Validation protocol

Use this protocol before tagged releases that modify parsing, alignment, filtering, metrics, or export behavior.

## Static checks

Run:

```bash
python scripts/smoke_check.py
```

This checks required application markers, inline JavaScript syntax when Node is available, the favicon, external executable dependencies, and accidental experimental-data files.

## Known-run regression

Maintain at least one private, non-public validation OXY/CSV pair with expected results recorded outside the repository.

For each release, verify:

- OXY program duration and phase count;
- number of flow channels discovered;
- CSV sample count and duration;
- channel mapping identities;
- automatic alignment offset;
- selected global metrics;
- selected per-channel metrics;
- selected phase metrics;
- exported CSV/JSON fields and values.

Use numerical tolerances appropriate to sampling resolution and floating-point behavior. Do not rely only on visual inspection.

## Synthetic tests

Create small synthetic cases where the correct answer is known.

Minimum useful cases:

1. Exact target tracking with zero error.
2. Constant known bias.
3. Known time offset.
4. Nested OXY loop/group reconstruction.
5. Repeated phase labels with distinct phase identities.
6. A phase boundary where one channel changes target and another does not.
7. Transition-grace windows at 0 s and nonzero values.
8. Non-contiguous excluded phases.
9. Missing recorded setpoint columns.
10. Near-zero target values exercising the absolute tolerance floor.

## UI/browser checks

Test current Chrome/Chromium and at least one additional browser where practical.

Verify:

- local `file://` opening;
- GitHub Pages deployment;
- drag/drop and file-picker loading;
- theme switching;
- responsive layout at laptop and large-monitor widths;
- chart resizing and device-pixel-ratio sharpness;
- zoom/pan/reset after interactive charts are added;
- phase toggles after phase filtering is added;
- CSV and JSON downloads.

## Privacy check

Before release:

```bash
git status
git ls-files | grep -Ei '\.(oxy|csv|tsv|xlsx?|xls)$' || true
```

No confidential run data should be present unless intentionally published and documented.
