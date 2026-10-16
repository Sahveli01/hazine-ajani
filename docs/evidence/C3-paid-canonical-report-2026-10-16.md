# C3 — Paid canonical AnalysisReport evidence

Date: 2026-10-16 (Europe/Istanbul)

## Result

The paid agent path produced a real Avalanche Fuji settlement and the client
validated a fresh live OKX canonical report against the same strict
`AnalysisReport` contract used by the UI.

- Network: Avalanche Fuji Testnet (`eip155:43113`)
- Token: Fuji test USDC (`0x5425890298aed601595a70AB815c96711a31Bc65`)
- Amount: `0.01` test USDC (`10000` base units)
- Payer: `0x65e257B601b9545a6575801B967C527B35E2720d`
- Recipient: `0x9a2b5BdFd3CA23456957882695Bbf81510430853`
- Transaction: `0xcfd137603bc6583db0a1fa94486ca667af8bfb2d11846d24a0a9c1621375c46e`
- Explorer: <https://testnet.snowtrace.io/tx/0xcfd137603bc6583db0a1fa94486ca667af8bfb2d11846d24a0a9c1621375c46e>
- Confirmed block time: `2026-10-16T14:07:06.000Z`
- Post-settlement balances: payer `0.98`, recipient `0.02` test USDC

## Canonical report proof

The no-payment route returned the expected HTTP 402 challenge before signing.
After the authorized settlement, RPC verification required all of the following
before adding `x402Payment` to the report:

1. Successful Fuji transaction receipt.
2. Transaction hash equality.
3. Test USDC contract address equality.
4. Exact payer and recipient equality.
5. Exact `10000` base-unit `Transfer` event.
6. Confirmed block timestamp.

The recovered paid report was validated by `parseAnalysisReport` and returned:

- `schemaVersion`: `1.0.0`
- `analysisId`: `ana_df4ca801de55416fa6b05f05a90f4a82`
- `decision`: `REJECT`
- `reasonCodes`: `PREMIUM_BELOW_MARKET_BAND`
- The complete `x402Payment` object with the transaction and explorer URL above.

A one-time recovery check used only the public transaction, payer and recipient
values. It performed no second payment and fetched a new live OKX analysis
before attaching the already confirmed receipt.

## Failure-path proof

Automated tests cover invalid report schema, wrong chain, missing or reverted
receipt, wrong token, payer, recipient or amount, missing transfer, transaction
replay, insufficient balance response and facilitator failure. The client does
not mark a response paid until RPC verification succeeds.

The official x402 `SettleResponse.amount` field is optional. The local
facilitator omitted it even though settlement succeeded. The client now checks
the field when present and always treats the on-chain exact transfer event as
the authoritative amount proof.

## Clean repeat run after the fix

The complete command was run again after the optional-amount fix and finished
without recovery or manual intervention:

- Resource status: `PAID_REPORT_RPC_CONFIRMED`
- Live analysis: `ana_29d34ebcbfb04db4b8e38e7da6b540f4`
- Exact live proxy: `BTC-USD-261017-80750-P`
- Decision: `REJECT — PREMIUM_BELOW_MARKET_BAND`
- Transaction: `0x101a0e12ef4cf2f8ca25c7aa2bc014ac3119a32db648bd9ff2306abf93403ce1`
- Explorer: <https://testnet.snowtrace.io/tx/0x101a0e12ef4cf2f8ca25c7aa2bc014ac3119a32db648bd9ff2306abf93403ce1>
- Confirmed at: `2026-10-16T14:23:56.000Z`

The returned JSON carried `schemaVersion: 1.0.0`, four live OKX sources,
`proxyMatch.quality: EXACT`, the deterministic valuation and policy decision,
and the RPC-confirmed `x402Payment` object in one response.
