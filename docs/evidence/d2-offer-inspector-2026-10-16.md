# D2 offer inspector verification — 2026-10-16

## Live runtime proof

The production Next build requested its normal `/api/analysis` route, which
forwarded server-side to the live Hono analysis service. The service used the
read-only `okx-tr-read` profile and returned canonical report
`ana_95220aa44c1d4b04b727a0060a0636ae` for live OKX TR product
`BTC-USDT-261017-80000-P` with deterministic decision `REJECT`.

The complete strict `AnalysisReport` payload is preserved in
`docs/evidence/d2-live-analysis-report-2026-10-16.json`. It contains the DCD
offer, selected executable option proxy, bid/ask, Simple Earn result, policy,
data quality, sources and timestamps. It contains no credential or private
account value.

The final visual pass replayed that captured real report through Chrome DevTools
request interception. Production code and its live endpoint remained unchanged;
only the external verification harness controlled state and viewport.

Final responsive screenshots:

- `d2-screens/d2-review-reject-1280x720.png`: decision, five evidence fields,
  policy and disclosure control in one no-scroll projector viewport.
- `d2-screens/d2-review-reject-1024x720.png`: decision and all five evidence fields in
  the first viewport; policy continues below without horizontal overflow.
- `d2-screens/d2-review-reject-390x844.png`: preserved reading order with no horizontal
  overflow.

Measured viewport results:

| Viewport | Document width | Document height | Decision | Product                 |
| -------- | -------------: | --------------: | -------- | ----------------------- |
| 1280×720 |           1280 |             720 | REJECT   | BTC-USDT-261017-80000-P |
| 1024×720 |           1016 |             763 | REJECT   | BTC-USDT-261017-80000-P |
| 390×844  |            390 |            1492 | REJECT   | BTC-USDT-261017-80000-P |

## State harness

The visual harness used Chrome DevTools request interception. It did not add a
fixture path, query flag or fallback to production code. The captured live
report above supplied the market fields; the harness changed only the decision,
reason and validity envelope required to exercise each UI state.

- `d2-review-accept-1280x720.png`
- `d2-review-ask-1280x720.png`
- `d2-review-reject-1280x720.png`
- `d2-review-stale-1280x720.png`

The stale state blocks the offer inspector and asks for a new analysis. An
insufficient-data view-model test separately proves valuation bands are hidden
when `dataQuality.status` is `INSUFFICIENT`.

## Product and safety behavior

- The dominant decision and plain-language primary reason are visible together.
- The source time and valid-through time are visible together; machine reason
  codes are kept in the expandable evidence region.
- DCD yield, executable option band, net edge band, Simple Earn availability and
  risk-neutral conversion probability remain distinct.
- Risk-neutral probability is explicitly labeled as an option-price-derived
  model measure, not a real-world event probability.
- Verified policy inputs are displayed as structured deterministic inputs.
- The disclosure exposes proxy quality, strike/expiry differences, bid/ask,
  data confidence, index price, source references and observed times.
- Production imports no test fixture and continues to call the live endpoint.
- ACCEPT and ASK expose a working jump to the structured policy conditions;
  REJECT remains actionless.

## Automated verification

- Impeccable mechanical detector: `[]`.
- Focused web tests: 12/12 passed, including ACCEPT/ASK/REJECT and insufficient
  market-data behavior.
- Repository tests: 137/137 Vitest tests and 4/4 workspace invariant tests.
- ESLint and every workspace TypeScript check passed.
- All workspace builds passed, including the optimized Next production build.
