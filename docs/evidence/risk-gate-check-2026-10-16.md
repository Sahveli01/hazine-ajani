# B6 deterministic risk-gate verification — 2026-10-16

## Real snapshot differentiation

The gate replay test uses two real OKX market observations with the same explicit policy tolerance (`minNetEdgeLowerBound = -0.002`, maximum risk-neutral conversion probability `0.50`):

1. The saved A4 2026-10-15 snapshot for `BTC-USDT-261106-79000-P` has a net-edge band of `-0.00632515` to `-0.00580615`; it is rejected for `PREMIUM_BELOW_MARKET_BAND`.
2. A read-only live snapshot taken at 2026-10-15 22:06 UTC paired the real DCD product `BTC-USDT-261017-82000-P` (`absYield 0.00449156`) with public option `BTC-USD-261017-82000-P` (bid `0.0055 BTC`, ask `0.006 BTC`, index `82392.5 USD`, mark IV `0.31803477835800703`). Its fee/opportunity-cost-adjusted net-edge band is approximately `-0.00135` to `-0.00085`, so it passes that stated tolerance and the gate returns `ACCEPT` when the remaining policy inputs pass.

This tolerance is recorded as user policy data rather than embedded in the decision code. The comparison proves the engine does not route every market observation to one result.

## Automated coverage

Fourteen B6 tests cover:

- exact threshold boundaries;
- `ACCEPT` and confirmation-only `ASK`;
- every rejection reason available to the gate;
- multiple failure ordering;
- missing, malformed and out-of-range policy;
- competing allocation and reserve constraints;
- two real snapshot valuation replays with different decisions.

The canonical report schema now validates the two previously missing policy dimensions: minimum net-edge lower bound and allowed settlement currencies. It also contains explicit success, invalid-policy and disallowed-settlement reason codes.

`pnpm check` completed successfully: lint, all workspace TypeScript checks, 82 tests and every package/Next.js production build passed. The sandbox exposed Node 24.19.0 while the repository remains pinned to Node 22.20.0, so pnpm printed an engine warning without affecting the checks.
