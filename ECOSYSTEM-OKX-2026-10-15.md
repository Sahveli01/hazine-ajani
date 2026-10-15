# OKX + Avalanche — 2026-10-15

## En üstteki bulgular
- Avalanche C-Chain is supported by OKX Wallet, Trade, Market and DApp Connect, but NOT OKX Payments; Fuji is not listed. [Network matrix](https://web3.okx.com/pt-br/onchainos/dev-docs/home/supported-chain)
- OKX exactOut does not support Avalanche; a fixed-amount obligation needs bounded exactIn and final balance verification. [Quote reference](https://web3.okx.com/zh-hans/onchainos/dev-docs/trade/dex-intent-get-quote)
- Agent TradeKit already supplies a broad trading lifecycle, bot management, market analytics and audit logs; generic trading assistants are weak differentiation. [Repository](https://github.com/okx/agent-trade-kit)
- Stable CLI is 1.4.8, beta 1.4.9-beta.2; use a pinned stable install. [npm](https://www.npmjs.com/package/%40okx_ai/okx-trade-cli?activeTab=versions)
- OKX Outcomes was removed with 1.4.5 on September 1, with no replacement; avoid designs depending on it. [Changelog](https://raw.githubusercontent.com/okx/agent-trade-kit/github-main/CHANGELOG.md)
- Treasury-liability demand is evidenced by actual DAO decisions, but generic payment conversion is already shipped elsewhere. [Badger decision](https://forum.badger.finance/t/tcd-95-sell-instead-of-borrowing-for-runway-close-compound-position/6578), [Request conversion](https://docs.request.network/advanced/request-network-sdk/sdk-guides/payment/swap-to-conversion-request)

## Tazelik
Collected October 15, 2026, Europe/Istanbul. Web retrieval only; authenticated endpoint functionality was not exercised. Registry and source snapshots can change. Event is October 17 according to parallel event researcher. No complete scheduled-maintenance assurance was obtainable.

## Hazır dev skill'ler
Official `npx skills add okx/agent-skills` supplies CEX agent instructions. Official CLI/MCP are Node >=18, install `npm install -g @okx_ai/okx-trade-mcp @okx_ai/okx-trade-cli`. Latest source changelog dated September 23. Source repo observed 478 stars/77 forks; this indicates interest, not production use. [Repo](https://github.com/okx/agent-trade-kit), [Skills](https://github.com/okx/agent-skills)

OnchainOS uses `npx -y @okxweb3/onchainos-installer install`; wallet key generation/signing is inside TEE and risk detection is already supplied. Independent exact adoption counts unavailable. [Install](https://web3.okx.com/nb/onchainos/dev-docs/home/install-your-agentic-wallet)

## Başlangıç noktası
CEX TradeKit: TypeScript core, CLI and local stdio MCP; 167 tools across market/spot/swap/futures/options/account/event/earn/bot/news/smartmoney. Separate profiles for demo and live. Market module is public. This is exchange execution, not the DEX aggregator. [Repo](https://github.com/okx/agent-trade-kit)

Registry: `@okx_ai/okx-trade-cli` stable 1.4.8 (source date September 23), 1,726 weekly downloads observed, latest-version portion 1,323. Beta 1.4.9-beta.2 exists. npm relative publish dates vary by cached snapshot; use changelog date for stable, do not manufacture exact beta timestamp. Other current official language SDK package versions were not exhaustively verified; non-TypeScript direct REST integrations remain possible but unnecessary for this MVP. [Registry](https://www.npmjs.com/package/%40okx_ai/okx-trade-cli?activeTab=versions)

Avalanche: C-Chain mainnet 43114; Fuji 43113. Mainnet RPC `https://api.avax.network/ext/bc/C/rpc`; Fuji `https://api.avax-test.network/ext/bc/C/rpc`. Standard Solidity deployment; Foundry guide and faucet are available. [Network](https://build.avax.network/docs/dapps), [Deployment](https://build.avax.network/blog/deploy-a-dapp-on-c-chain-with-foundry)

## Protokol durumu
CEX has no blockchain protocol version. Avalanche network IDs/RPC verified above; latest AvalancheGo/Coreth versions, upcoming ACP activation and Fuji reset schedule bulunamadı. No new L1 needed for this event.

## Etkinlik riskleri
TR is a separate site. An account must use its own regional API. OAuth's login site also selects public market datasets. Therefore derivative/instrument availability must be probed on the actual event account. Demo needs a separate demo API key. [Configuration](https://raw.githubusercontent.com/okx/agent-trade-kit/github-main/docs/configuration.md)

Fuji is not in OKX's network support table. Do not present live mainnet quotes as testnet liquidity, or describe test tokens as real USDC. Either a genuine small mainnet route or explicitly labelled Fuji settlement + separate live data is required. [Network matrix](https://web3.okx.com/pt-br/onchainos/dev-docs/home/supported-chain)

## Yeni gelenler
September 23: 1.4.8 fixes DCA pagination. September 1: Outcomes removal. August 21: AI Builder attribution. August 20: OAuth regional routing. July 21: contract-grid position/liquidation estimate/close-position tools. June 25: TR site support. These have source release entries and installable stable package evidence; per-feature use counts bulunamadı, so no thin-adoption claim. [Changelog](https://raw.githubusercontent.com/okx/agent-trade-kit/github-main/CHANGELOG.md)

## Kırılanlar
Outcomes removal is a hard breaking change. Scoped `@okx_ai` packages are current; older unscoped aliases expose old versions. [Changelog](https://raw.githubusercontent.com/okx/agent-trade-kit/github-main/CHANGELOG.md), [Publisher packages](https://www.npmjs.com/~oker_steve?activeTab=packages)

## Ajan araçları
Read-only mode, module filtering, rate limiting, local audit logging, algo TP/SL/OCO/trailing orders are existing capabilities. Skills marketplace already security-scans listed skills and ranks by usage/downloads. Do not pitch these alone as innovation. [Repository](https://github.com/okx/agent-trade-kit), [Marketplace announcement](https://www.okx.com/en-us/learn/agent-trade-kit-skills)

## Standartlar
Avalanche C-Chain is EVM. A custom contract can enforce its own escrow, recipient, amount, deadline, nonce and reserve balances. Inference: it cannot directly verify private CEX fills without a trusted reporter or additional proof mechanism; an onchain hash alone cannot make exchange execution trustless. OKX OnchainOS payments support is distinct from generic x402 implementation on Avalanche. [C-Chain RPC](https://build.avax.network/docs/rpcs/c-chain), [OKX matrix](https://web3.okx.com/pt-br/onchainos/dev-docs/home/supported-chain)

## Veri katmanı
TradeKit market ticker/orderbook/candles/instruments, funding, technical indicators are available. Account balances/positions/bills/fills support reconciliation. [Market overview](https://github.com/okx/agent-trade-kit), [Account reference](https://raw.githubusercontent.com/okx/agent-trade-kit/github-main/docs/modules/account.md)

OKX DEX quote v6 supports exactIn and exactOut, but exactOut is limited to Ethereum/Base/BSC/Arbitrum and Uni v2/v3. For Avalanche liability conversion, use bounded exactIn, reject stale/insufficient output, and check actual token balance before settlement. This is a design inference, not a shipped OKX feature. [Quote](https://web3.okx.com/zh-hans/onchainos/dev-docs/trade/dex-intent-get-quote)

## Vakfın istedikleri
OKX explicitly wants shareable, security-reviewed trading skills; marketplace is already live. Avalanche provides x402 tutorials and agent-payment examples. No event-specific sponsor RFP beyond supplied sheet was verified. [OKX](https://www.okx.com/en-us/learn/agent-trade-kit-skills), [Avalanche x402](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/02-introduction/04-use-cases)

## Boşluklar
Open issue #20 requests grid endpoints, triggerParams, DCA amendment; #28 reports regional EEA indicator 405. These are narrow tool/documentation gaps, not automatically strong standalone products. [#20](https://github.com/okx/agent-trade-kit/issues/20), [#28](https://github.com/okx/agent-trade-kit/issues/28)

Product inference worth testing: committed-obligation reserve planning can connect volatile holdings to dated payment needs, with ring-fenced funds and bounded conversion. This must be differentiated from both treasury managers and payment processors; absence from a tool list is not evidence of an unserved market.

## Ekosistemin sesi
Direct user evidence: Badger treasury council proposed selling ETH/BTC as needed to maintain three-month stablecoin runway instead of borrowing. CoW's KPK annual review reports separate stablecoin runway and volatile allocation. These support the problem's existence, not willingness to use our proposed agent. [Badger](https://forum.badger.finance/t/tcd-95-sell-instead-of-borrowing-for-runway-close-compound-position/6578), [CoW](https://forum.cow.fi/t/cow-dao-treasury-2025-annual-review/3356)

Core developer calls, private Discord, maintainer roadmap interviews, meaningful fork divergence and authenticated GitHub merged-PR analysis bulunamadı. Public source changelog and two issues were inspected instead; no invented consensus.

## Zaten var olanlar
- DARWIN: local OKX risk-first trading governance. [Repo](https://github.com/Wxiaobai123/DARWIN)
- PreflightX: OKX hackathon execution checks, remediation and signed onchain plans. [Repo](https://github.com/Ridwannurudeen/preflightx)
- Tars: trading audit/risk and onchain transparency. [Repo](https://github.com/Henoch4/Tars/blob/main/README.md)
- Request: invoices, payroll, swap-conversion, cross-chain batch payouts, payment locks and MCP. [Swap conversion](https://docs.request.network/advanced/request-network-sdk/sdk-guides/payment/swap-to-conversion-request), [Payouts](https://request.network/stablecoin-disbursements/)
- Agent escrow/delivery receipts already crowded: SwarmSync, BasedAgents, Railent describe these exact building blocks. [SwarmSync](https://swarmsync.ai/docs/agent-payments), [BasedAgents](https://basedagents.ai/), [Railent](https://railent.io/)

## Çelişkiler
Configuration says grid bot demo endpoints unsupported, while later changelog mentions live/demo pending grid suborders. Treat capability as endpoint-specific and probe, not blanket support. [Config](https://raw.githubusercontent.com/okx/agent-trade-kit/github-main/docs/configuration.md), [Changelog](https://raw.githubusercontent.com/okx/agent-trade-kit/github-main/CHANGELOG.md)

Config has stale 128-tool discussion while README lists 167. API docs explicitly defer to repository for latest capabilities. [API guide](https://app.okx.com/docs-v5/agent_en/)

## Bulunamayanlar
Exact beta publish date, all SDK language versions, mainnet/Fuji protocol versions, ACP schedule, maintenance/reset notices, per-feature adoption, production user counts, live endpoint credentials, Fuji DEX support, and event-specific API quotas were not verified. OnchainOS registry pin and full release delta not verified. Protocol/indexer/oracle deep sweep nonapplicable to CEX and deferred for Avalanche until an actual contract use case requires them. No uniqueness guarantee.

## Kaynaklar
All sources linked inline; retrieved October 15, 2026.
