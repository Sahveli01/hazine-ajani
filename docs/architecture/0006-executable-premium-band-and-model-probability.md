# ADR 0006: Executable premium band and model probability

- Status: Accepted
- Date: 2026-10-16

## Decision

For a BTC/USDT Buy Low offer, compare the DCD term yield with the selected OKX BTC/USD put's visible bid and ask after the caller supplies the live account option fee rate. OKX quotes BTC option premium in BTC and defines one contract as 0.01 BTC. Converting either side to a cash-secured yield gives `premiumBTC × BTC-USD index / strike`; the contract multiplier cancels from numerator and collateral denominator.

For each side, the trading fee in BTC-equivalent yield uses OKX's published formula: the lower of the account fee rate and 7% of that side's option premium. The engine never hard-codes an account tier and never substitutes the midpoint. Net edge is `DCD term yield - option proxy yield - Simple Earn term opportunity cost`; the lower net edge uses the option ask and the upper net edge uses the bid.

The conversion metric is explicitly `RISK_NEUTRAL_MODEL_ESTIMATE`. It uses put exercise probability `N(-d2)` from spot/index, strike, remaining Actual/365 time, OKX mark IV and an explicitly sourced annual carry proxy. For the MVP the live OKX Simple Earn annual rate is the disclosed carry proxy; the number is not presented as a real-world forecast. Missing or invalid IV, time, spot, strike, or carry blocks the theoretical number.

Three deterministic scenarios re-use the canonical Buy Low settlement function. Portfolio value is reported in USDT at each scenario price, while settlement currency remains visible. Their loss ratios are compared with the supplied maximum stress-loss policy input, ready for the B6 decision gate.

## Consequences

- The market comparison is auditable from two executable book sides and an account-specific fee input.
- A missing live Simple Earn rate cannot silently become a zero opportunity cost.
- The 30-minute DCD settlement average and one-hour option settlement average remain disclosed as a basis mismatch.
- Early redemption/secondary-market and visible-book liquidity limitations remain attached to every result.

## Official references

- [OKX: What's Options trading?](https://www.okx.com/en-gb/help/whats-options-trading)
- [OKX: Trading Fee Rules FAQ](https://www.okx.com/en-gb/help/trading-fee-rules-faq)
- [OKX: Options fee calculation parameters](https://www.okx.com/en-eu/help/okx-to-adjust-parameters-for-options-fee-calculation)
