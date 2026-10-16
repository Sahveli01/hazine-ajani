# D1 application shell verification — 2026-10-16

## Runtime boundary

- The browser starts in `loading` and requests `/api/analysis`.
- The Next route forwards that request server-side to `ANALYSIS_API_URL`; the upstream URL and any future credentials stay outside the browser bundle.
- Missing, invalid, expired and unavailable live responses become `empty`, `error` or `stale`; the UI does not substitute fixture or sample market data.
- The production default is the real local API boundary at `http://127.0.0.1:3001/api/analysis`.

## Automated behavior

The focused D1 run passed 10/10 tests across the browser state model, strict shared `AnalysisReport` validation, Next-to-Hono proxy integration and environment-driven live-analysis runtime wiring. The tests also prevent loading/error headers from claiming a verified live private source. The final repository run passed 113/113 Vitest tests and 4/4 workspace invariant tests; TypeScript, ESLint and the Next production build also passed.

## Visual and accessibility pass

The screenshots were captured from the production Next build with Playwright Chromium. The slow/offline pass delayed `/api/analysis` for 1.5 seconds and then aborted it in the browser test harness; this produced a real loading-to-network-error transition without changing the production endpoint or injecting market values.

- `d1-shell-loading-1280x720.png`: content-shaped loading surface.
- `d1-shell-error-1280x720.png`: explicit offline recovery surface.
- `d1-shell-error-1024x720.png`: compact layout with network, testnet and data-time context intact.
- `d1-shell-error-390x844.png`: functional mobile flow.
- Desktop metrics: viewport `1280×720`, document `1280×720` — no scroll or overflow.
- Compact metrics: viewport width `1024`, document width `1024` — no horizontal overflow; all four connection/account groups remain visible.
- Mobile metrics: viewport width `390`, document width `390` — no horizontal overflow; vertical reading flow remains available.
- The loading live region exposes its state `h2` and explanatory text to assistive technology while the visual skeleton is active. The error state exposes the retry action and explicitly says the account could not be verified.
- Measured WCAG contrast ratios: body/canvas `17.25:1`, secondary copy/canvas `7.73:1`, primary action text/action background `6.91:1`.

The first mobile review found a missing space where the desktop-only line break collapses. A subsequent review found hidden network/time context and an unverified header presented as live/read-only. Both were corrected before these production screenshots were captured.
