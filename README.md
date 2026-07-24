# OXY Trace Auditor

A self-contained browser tool for comparing recorded CSV flow traces with the intended flow profile encoded in an OXY program.

The application reconstructs the intended OXY timeline, maps flow channels by Flowboard serial number and port, aligns recorded data to program time, and separates two different sources of deviation:

- **Profile agreement:** recorded controller setpoint vs. intended OXY target.
- **Tracking error:** measured flow vs. intended OXY target.

All input files are processed locally in the browser. No upload service, backend, installation, or external JavaScript library is required.

## Live application

`https://matteobroketa.github.io/OXY-Trace-Auditor/`

## Run locally

Clone or download the repository, then open `index.html` in a modern browser.

1. Load one `.oxy` flow profile.
2. Load one or more recorded `.csv` traces.
3. Review automatic channel mapping and time alignment.
4. Inspect traces, deviations, phase behavior, and channel metrics.
5. Export analysis results as CSV or JSON.

No local web server is required.

## Core analysis

The OXY parser recursively interprets supported program blocks including `Group`, `For`, `SetValue`, `Wait`, and `ResetAll`. Timed intervals are reconstructed into phases with a target state for every mapped flow channel.

The application then estimates an offset between CSV elapsed time and OXY program time by comparing recorded controller setpoints with the reconstructed OXY target across mapped channels. Where a recorded setpoint is unavailable, measured flow can be used as a fallback signal.

Per-channel analysis includes metrics such as MAE, RMSE, bias, percentile/max absolute error, tolerance compliance, integrated volume error, profile/setpoint agreement, and transition settling behavior.

## Privacy and data handling

OXY and CSV files are read with browser APIs and analyzed in memory on the user's device. The application does not transmit loaded experimental files to a server.


## Repository structure

```text
.
├── index.html                     # Complete browser application
├── assets/
│   └── favicon.svg
├── scripts/
│   └── smoke_check.py             # Static deployment/syntax checks
├── docs/
│   ├── ANALYTICAL_METHOD.md
│   └── VALIDATION_PROTOCOL.md
├── .github/
│   ├── workflows/
│   │   ├── pages.yml              # Deploy GitHub Pages on main
│   │   └── validate.yml           # Validate changes on pushes/PRs
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
├── DEPLOYMENT.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── SECURITY.md
└── LICENSE
```

## Disclaimer

This software is an analytical and visualization aid. Results should be reviewed in the context of instrument configuration, calibration, acquisition settings, and experimental design. It is not a substitute for instrument qualification or validated quality-control procedures.

## License

MIT. See [LICENSE](LICENSE).
