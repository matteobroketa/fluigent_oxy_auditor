# OXY Trace Auditor

OXY Trace Auditor is a single-file browser application for comparing recorded OxySoft CSV traces with the flow profile encoded in an OXY program. It runs entirely in the browser and is suitable for static hosting, including GitHub Pages.

It reconstructs the OXY timeline, maps recorded flow channels, aligns CSV elapsed time with OXY program time, and separates command agreement from physical flow tracking.

## Live application

<https://matteobroketa.github.io/OXY-Trace-Auditor/>

## Features

- Parse OXY `Group`, `For`, `SetValue`, `Wait`, and `ResetAll` blocks into timed flow phases.
- Map measured-flow and CSV setpoint columns to OXY flow units by Flowboard serial number and port.
- Estimate and adjust the CSV-to-OXY time offset without using pressure data.
- Inspect flow traces, deviation traces, phase summaries, channel mappings, and interactive hover values.
- Pan and zoom charts; phase enablement and transition-grace filtering are applied consistently to analysis views.
- Report profile MAE, tracking MAE/RMSE, bias, P95 and maximum absolute error, tolerance compliance, signed and absolute volume error, and settling time.
- Use a versioned manufacturer-aware tracking model with documented, piecewise Fluigent water accuracy profiles; process acceptance and measurement accuracy remain separate.
- Explain metrics in the interface, including the distinction between profile agreement and tracking accuracy.
- Export flow analysis as CSV and JSON.
- Use accessible keyboard-navigable analysis tabs, reduced-motion support,
  system-aware light/dark themes, and a print-ready active report view.
- Clear and replace loaded files without reloading; all bundled fonts and
  interface assets remain local.

## Pressure analysis

The Pressure tab is optional. Flow-only CSV files continue to work without pressure data.

Supported pressure headers include explicit pressure fields with recognized units and OxySoft MFCS fields such as:

```text
MFCS (6065) #1
MFCS (6065) #1 - Setpoint
```

MFCS headers are recognized by controller serial number and channel even when the header does not include the word `pressure`. Because those headers do not identify a pressure unit, the application retains their raw values and requires explicit unit confirmation before producing pressure-dependent charts or metrics. Available units are mbar, bar, kPa, Pa, and psi; confirmed values are normalized internally to mbar and the selected source unit is retained for audit/export.

Pressure-to-flow mappings are reviewable and editable. Automatic mapping prefers exact metadata and may offer a unique port match as probable; ambiguous channels remain unmapped. MFCS controller serials are not assumed to match Flowboard serials.

For mapped and unit-confirmed pairs, the Pressure tab provides:

- a synchronized dual-axis flow/pressure chart;
- pressure mapping and data-quality audit information;
- channel and phase pressure-flow summaries;
- pressure-to-flow ratio indicators, with near-zero/reversed flows excluded;
- transition-response records and cautious diagnostic observations; and
- pressure-analysis CSV and JSON export data.

Pressure-flow observations are diagnostic indicators only. They do not identify a specific fluidic or hardware fault.

## Run locally

No installation or local web server is required. Clone or download the repository and open `index.html` in a current browser.

1. Load an `.oxy` profile.
2. Load one or more recorded `.csv` traces.
3. Review the channel mapping and automatic time alignment.
4. Use the Overview, Traces, Deviation, Pressure, Phases, and Profile & mapping tabs as needed.
5. Confirm pressure units and mappings before interpreting Pressure results.
6. Export the relevant analysis CSV or JSON.

CSV time columns can contain numeric elapsed seconds (including decimal commas in semicolon-delimited files) or date/time stamps. The first sample determines the time format for the column; all times are normalized to seconds since that sample.

OXY loops require non-negative whole-number iteration counts. Import is limited to 100 nesting levels and 100,000 expanded steps, counting both functions and loop iterations, so an oversized or malformed profile cannot lock the browser. Split larger profiles into smaller runs. Theme switching remains available when browser storage is disabled; the preference then lasts only for the current session.

## Validate changes

With Python 3 and Node.js 22 or newer available:

```bash
python scripts/smoke_check.py
python scripts/tolerance_model_test.py
node --test scripts/core.test.cjs
```

The checks cover static structure and inline JavaScript syntax, documented tolerance profiles, elapsed-time parsing, and bounded OXY loop expansion. They do not require runtime or test package dependencies.

## Analysis scope

The primary **analysis** scope includes valid samples in enabled OXY phases, excluding the configured grace period after a genuine target change for that channel. The **full-run** reference retains valid samples in enabled phases, including those transition samples. Disabled phases are excluded from both scopes.

- **Profile agreement** compares CSV setpoint with OXY target.
- **Tracking accuracy** compares measured flow with OXY target.
- Pressure metrics additionally require a mapped, unit-confirmed pressure value at the synchronized sample.

Volume integration does not bridge disabled phases, transition windows, missing values, or time gaps of five seconds or more. Pressure-to-flow ratio is a relative indicator, not a direct hydraulic-resistance measurement unless the relevant downstream pressure is known.

For a fuller description of the flow analysis model, see [docs/ANALYTICAL_METHOD.md](docs/ANALYTICAL_METHOD.md).

## Privacy and data handling

OXY and CSV files are read with browser APIs and analyzed in memory on the device. The application does not upload experimental files or require a backend, native SDK, build process, or external JavaScript dependency.

## Repository structure

```text
.
├── index.html                  # Complete static browser application
├── assets/                     # Site assets
├── docs/                       # Analysis and validation notes
├── scripts/                    # Static checks
├── .github/workflows/          # GitHub Pages and validation workflows
├── README.md
└── LICENSE
```

## Disclaimer

This software is an analysis and visualization aid. Interpret results with instrument configuration, calibration, acquisition settings, tubing geometry, fluid properties, sensor placement, and experimental design in mind. It is not a substitute for instrument qualification or validated quality-control procedures.

## License

MIT. See [LICENSE](LICENSE).
