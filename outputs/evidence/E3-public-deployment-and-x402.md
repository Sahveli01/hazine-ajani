# E3 — public deployment and x402 evidence

Verified at 2026-10-17 08:12 Europe/Istanbul.

## Public runtime

- Public HTTPS demo: `https://stuff-angle-cap-obituaries.trycloudflare.com`
- Runtime commit: `812ba23`
- Local health: `GET http://127.0.0.1:3001/health` returned `status: ok` and commit `812ba23`.
- Local readiness: `GET http://127.0.0.1:3001/ready` returned `status: ready` after the live OKX gate passed.
- Public home returned HTTP 200.
- Public paid-report endpoint returned a real HTTP 402 challenge before payment.
- The local launcher kept the OKX profile and Fuji facilitator key outside the public tunnel environment. The key was entered through a hidden PowerShell prompt and was not written to a file or log.

The `trycloudflare.com` address is an ephemeral hackathon demo URL. Restarting the launcher creates a new URL; the operator copies the printed URL into the submission/demo materials for that session.

## Live paid request

- Resource: `https://stuff-angle-cap-obituaries.trycloudflare.com/api/paid-report`
- Analysis: `ana_b4d94ad65e024a4b920b2d8f339a51b9`
- Sources: live OKX TR DCD, Simple Earn, public index and public option market.
- Decision: `REJECT`
- Reason: `PREMIUM_BELOW_MARKET_BAND`
- Proxy: exact `BTC-USD-261018-80250-P`
- Data quality: `0.9777`, sufficient.

## Avalanche Fuji settlement

- Network: Avalanche Fuji Testnet, chain ID `43113`
- Token contract: Fuji test USDC `0x5425890298aed601595a70AB815c96711a31Bc65`
- Amount: `10000` base units = `0.01` test USDC
- Payer: `0x65e257B601b9545a6575801B967C527B35E2720d`
- Recipient: `0x9a2b5BdFd3CA23456957882695Bbf81510430853`
- Transaction: `0x51bf626c7590c3f4feb1d70af831428fa9c576135fc6ab8d5e5f04ad69d77165`
- Explorer: <https://testnet.snowtrace.io/tx/0x51bf626c7590c3f4feb1d70af831428fa9c576135fc6ab8d5e5f04ad69d77165>
- Block: `59585564`
- Confirmation time: `2026-10-17T05:12:29.000Z`

An independent Fuji RPC read returned transaction status `success` and decoded an exact test-USDC `Transfer` from the payer to the recipient for `10000` base units. The paid client also rejected any response without a successful settlement header, exact token/recipient/amount and RPC-confirmed transfer.

