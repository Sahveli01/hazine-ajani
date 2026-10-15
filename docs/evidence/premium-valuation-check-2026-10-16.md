# B5 premium valuation verification — 2026-10-16

## Live-derived replay input

The golden case replays the redacted A4 live snapshot rather than a production fixture:

- DCD: BTC/USDT Buy Low, strike 79,000 USDT, expiry 2026-11-06 08:00 UTC, term yield 0.01580509.
- Option: `BTC-USD-261106-79000-P`, bid 0.0195 BTC, ask 0.0200 BTC, mark IV 0.54, BTC contract multiplier 0.01.
- BTC-USD index: 82,002 USD.
- Simple Earn/carry proxy: 0.0279 annual rate.
- Account option fee input used by the case: 0.0003. Runtime must supply the authenticated account's current rate; it is not a production default.

At eight decimal places, the deterministic output is:

- fee-adjusted proxy yield band: 0.01992960–0.02044860;
- Simple Earn term opportunity cost: 0.00168164;
- net DCD edge band: -0.00632515–-0.00580615;
- three scenarios: index -20%, flat, index +20%, each with settlement currency, USDT portfolio value and loss ratio;
- confidence below the supplied threshold produces `INSUFFICIENT_MARKET_DATA` even though numeric valuation can still be inspected.

## Formula checks

- No midpoint is computed or returned.
- Option proxy yield is `(premium - trading fee) × index / strike`; the BTC option contract multiplier cancels from premium proceeds and cash-secured strike collateral.
- Trading fee per premium unit is `min(account fee rate, 7% × premium)`, following OKX's published May 2025 option-fee parameter update.
- Net edge lower bound uses the option ask; upper bound uses the bid.
- Risk-neutral put exercise probability uses `N(-d2)` and is labeled as a model estimate, with OKX Simple Earn explicitly identified as the carry proxy.
- Invalid IV/time/carry, crossed books and incompatible markets fail closed.

## Automated verification

`pnpm check` passed on 2026-10-16:

- lint passed;
- all workspace TypeScript checks passed;
- 68 tests passed, including 8 B5 golden/property/edge tests;
- all package builds and the Next.js production build passed.

The sandbox exposed Node 24.19.0 while the repository pins Node 22.20.0; this produced an engine warning only. The same exact pnpm 11.25.0 lockfile and repository checks completed successfully.

## Sources

- [OKX: What's Options trading?](https://www.okx.com/en-gb/help/whats-options-trading)
- [OKX: Trading Fee Rules FAQ](https://www.okx.com/en-gb/help/trading-fee-rules-faq)
- [OKX: Options fee calculation parameters](https://www.okx.com/en-eu/help/okx-to-adjust-parameters-for-options-fee-calculation)
