# Analytical method

This document describes the intended analytical model behind OXY Trace Auditor. Keep it synchronized with `index.html` whenever analysis semantics change.

## 1. Reconstruct the intended OXY profile

The OXY program is parsed recursively. Supported control structures include:

- `Group`
- `For`
- `SetValue`
- `Wait`
- `ResetAll`

The parser tracks the active setpoint state for each OXY flow unit. Each timed `Wait` interval becomes a phase/segment with:

- program start time;
- program end time;
- phase label;
- intended target for each flow channel.

Flow values are normalized to µL/min.

Channels are identified using the OXY instrument hierarchy, principally Flowboard serial number plus flow-unit port. CSV columns are mapped to the same identity rather than relying on column order.

## 2. Align CSV elapsed time to OXY program time

A recording can begin after the OXY program has already started. The analysis therefore estimates an offset `delta`:

```text
OXY program time = CSV elapsed time + delta
```

Alignment compares the CSV's recorded controller setpoint signal with the reconstructed OXY target across mapped channels. If a recorded setpoint signal is unavailable, measured flow may be used as a fallback.

The objective should remain multi-channel and normalized so high-flow channels do not dominate solely because of scale.

Automatic alignment is an interpretation of timing, not an analysis filter. User choices such as phase inclusion/exclusion should not silently change the alignment solution.

## 3. Separate command agreement from physical tracking

Two errors have different meanings and must remain separate.

### Profile agreement error

```text
recorded CSV controller setpoint - intended OXY target
```

This tests whether the recorded command/setpoint sequence matches the intended OXY program.

### Tracking error

```text
measured flow - intended OXY target
```

This captures physical response including lag, settling, overshoot, undershoot, regulation, and measurement behavior.

A run can therefore have excellent profile agreement but poor physical tracking, or vice versa.

## 4. Accuracy metrics

Typical per-channel metrics include:

- mean absolute error (MAE);
- root mean squared error (RMSE);
- mean signed error / bias;
- 95th percentile absolute error;
- maximum absolute error;
- percentage within tolerance;
- profile/setpoint agreement MAE;
- signed integrated volume error;
- absolute integrated volume error;
- transition settling metrics where measurable.

### Volume conversion

Flow is represented in µL/min and time in seconds. Integrated volume error therefore uses the conversion:

```text
volume [µL] = integral(flow error [µL/min] * dt [s]) / 60
```

Never integrate across an interval that has been excluded from active analysis. Each continuous included interval must integrate independently.

## 5. Tolerance

A useful default sample-level tolerance rule is:

```text
absolute tracking error <= max(
    absolute tolerance,
    relative tolerance * absolute target
)
```

An absolute floor is necessary near zero-flow targets, where percentage-only tolerances become unstable or unrealistically strict.

## 6. Transition grace

Transition grace excludes a configurable interval immediately following a genuine target change for the relevant channel.

Grace must be channel-aware. A phase boundary alone should not trigger grace exclusion when that channel's target does not change.

Maintain two clearly distinguished metric scopes:

- **Full run / raw:** all otherwise valid samples in enabled phases.
- **Active analysis:** samples in enabled phases that also pass transition-grace filtering.

Primary accuracy metrics should use the active-analysis scope. Raw/full-run values can remain available as diagnostic references.

At zero grace, active-analysis and full-run metrics should be identical, aside from metrics whose definition is inherently transition-specific.

## 7. Phase filtering

Each reconstructed phase should have a stable identity independent of its label because labels can repeat.

When phase inclusion controls are implemented, the canonical active-sample rule should be equivalent to:

```text
sample is valid
AND sample belongs to an enabled phase
AND sample is outside channel-specific transition grace
```

The same inclusion logic must be shared by:

- global metrics;
- per-channel metrics;
- phase metrics;
- volume integration;
- heatmaps;
- active chart rendering;
- exports.

Do not collapse time when a phase is excluded. Preserve the real timeline and represent excluded intervals as gaps or clearly muted regions.

## 8. Visualization semantics

Measured traces, intended targets, and optional recorded setpoints should remain visually distinguishable.

Interactive zoom/pan changes only the visible viewport. It must not recompute or redefine full-run analysis metrics.

When drawing excluded intervals, never connect line segments across gaps in a way that implies continuous included data.

## 9. Export reproducibility

Exports should record enough analysis configuration to reproduce results, including where applicable:

- OXY/CSV filenames or non-sensitive identifiers;
- alignment offset;
- absolute tolerance;
- relative tolerance;
- transition grace;
- enabled/excluded phases;
- metric scope names;
- sample counts / analyzed duration.

Avoid ambiguous column names when both active-analysis and full-run metrics exist.

## 10. Validation principles

For analytical changes, test invariants as well as example outputs.

Examples:

- zero transition grace makes analysis metrics equal raw metrics;
- increasing grace never increases included sample count;
- excluding then re-enabling a phase restores the original metrics exactly;
- phase selection does not change automatic alignment;
- no integration bridges excluded intervals;
- duplicate phase labels remain independently selectable;
- no-sample states produce explicit unavailable values rather than misleading zeroes or `NaN`;
- synthetic data with a known timing offset recovers that offset within expected sampling resolution.
