# ADR 0007: Deterministic risk-gate precedence

- Status: Accepted
- Date: 2026-10-16

## Decision

The risk gate accepts only the canonical versioned policy schema and evaluates it with decimal-string arithmetic. The policy contains maximum allocation, minimum liquid reserve, maximum risk-neutral conversion probability, maximum stress loss, minimum data-quality score, minimum net-edge lower bound and allowed settlement currencies.

The result is determined in this stable order:

1. regional product availability;
2. suitable proxy availability;
3. quote freshness;
4. market-data quality and two-sided liquidity;
5. net-edge lower bound;
6. worst stress loss;
7. risk-neutral conversion probability;
8. allocation and post-investment liquid reserve;
9. allowed settlement currencies.

All failures are returned in that order. Any failure produces `REJECT`. A fully compliant analysis produces `ACCEPT`; if execution has been requested, the same compliant analysis produces `ASK` with `WRITE_REQUIRES_CONFIRMATION`. This preserves the separate, per-transaction human confirmation boundary.

An absent, unknown, out-of-range or otherwise invalid policy fails closed as `REJECT: INVALID_POLICY`. The decision function accepts no LLM explanation or override field.

## Consequences

- Exact threshold equality passes; exceeding a maximum or falling below a minimum fails.
- Multiple failures remain visible and deterministic instead of being hidden behind the first one.
- A policy that excludes BTC rejects a Buy Low offer whose downside scenario can settle in BTC.
- The same live market input can produce a different decision under a different explicit user policy, but prose cannot alter a decision.
