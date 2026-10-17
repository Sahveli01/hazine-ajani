# E5 PayAI hosted facilitator settlement — 2026-10-17

## Result

The public Hazine Ajani x402 route completed a real Avalanche Fuji TESTNET
settlement through the hosted PayAI facilitator and returned the canonical live
OKX report.

- Network: `eip155:43113` — Avalanche Fuji TESTNET
- Scheme: x402 v2 `exact`
- Asset: Fuji test USDC `0x5425890298aed601595a70AB815c96711a31Bc65`
- Amount: `10000` base units = `0.01` test USDC
- Payer: `0x65e257B601b9545a6575801B967C527B35E2720d`
- Recipient: `0x9a2b5BdFd3CA23456957882695Bbf81510430853`
- Transaction: `0xa85d9055dc7d1ad0440d7f02c327ce3050718c87640fc8e69a40021263a68531`
- Explorer: https://testnet.snowtrace.io/tx/0xa85d9055dc7d1ad0440d7f02c327ce3050718c87640fc8e69a40021263a68531
- Paid resource result: `PAID_REPORT_RPC_CONFIRMED`
- Canonical analysis: `ana_20688f1e1e3d48f0972f71bca655d498`

## Independent verification

Avalanche Fuji RPC returned receipt status `success` at block `59588740`.
The test-USDC `Transfer` event contained exactly this transfer:

```text
from  0x65e257B601b9545a6575801B967C527B35E2720d
to    0x9a2b5BdFd3CA23456957882695Bbf81510430853
value 10000
```

The report used live OKX TR DCD, Simple Earn, spot/index and option market
sources. No runtime fixture or mock settlement was used.

## Payment-ordering safeguard

An earlier attempt stopped with `OKX_OPTION_MARKET / CLI_FAILURE` and returned
no settlement evidence. The paid route now prepares a successful live report
before issuing HTTP 402 and retains it for 30 seconds for the signed retry. If
analysis is unavailable, the route returns `422` or `503` without a challenge.
