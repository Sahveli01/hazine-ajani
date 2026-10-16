# Demo and pitch package

## 90-second pitch

Dual Investment advertises a high APR, but the user cannot see whether that return fairly compensates conversion risk. Hazine Ajanı reads a live OKX TR Buy Low offer, matches it deterministically with the nearest executable OKX option market, subtracts the Simple Earn opportunity cost and applies the user's liquidity and loss limits. It returns `ACCEPT`, `ASK` or `REJECT`; an LLM may explain the result but cannot change it. Every OKX write still requires a separate human confirmation. The same canonical report is sold to another agent for 0.01 Fuji test USDC through x402, with the real transaction verified on Avalanche Fuji.

## Ten-minute demo route

1. Open the HTTPS demo URL and point out `OKX TR · server-side`, source timestamps and Fuji `TESTNET` labels.
2. Refresh analysis. Identify the live DCD product, exact/nearest option proxy and executable bid/ask band.
3. Explain the opportunity cost, model probability and three stress scenarios without calling them real-world probability or guaranteed fair value.
4. Show the deterministic policy reason codes and the `ACCEPT / ASK / REJECT` result.
5. Open the confirmation state. Explain that no write occurs without a fresh, single-use approval; do not execute a money-moving OKX operation unless the user separately approves it at that moment.
6. Open the agent payment flow, switch MetaMask to Avalanche Fuji and pay 0.01 **test** USDC.
7. Show the returned canonical report, transaction hash and explorer receipt.
8. Close with the reuse case: another treasury agent can buy the same auditable risk gate instead of inventing financial logic.

## Judge Q&A

- **Why is this agentic?** It gathers four live sources, chooses an auditable proxy, computes the decision and exposes the result to another agent. Safety-critical decisions remain deterministic.
- **Why Avalanche?** x402 gives the service machine-verifiable pay-per-use access with fast Fuji settlement. The payment is central to agent-to-agent consumption.
- **Why OKX?** DCD, Simple Earn, spot and option order-book/Greeks data all come from OKX. The tool is designed around OKX's product semantics.
- **Is the option a perfect hedge?** No. It is an observable benchmark with explicit strike, expiry, liquidity and settlement-comparability limits.
- **Does the LLM trade?** No. It can parse policy language and explain a completed deterministic result; it cannot calculate, approve or execute.
- **Are test assets money?** No. Fuji AVAX and test USDC have no monetary value and are labeled testnet everywhere.

## Rehearsal checklist

- Run `pnpm check` and start `scripts/start-hackathon-demo.ps1`.
- Confirm `/health`, `/ready`, the public URL and a fresh live report.
- Test 1280×720 projection and MetaMask Fuji network selection.
- Time the route twice; target 7 minutes for the product flow and 3 minutes for questions.
- Record the second successful run as `demo-backup.mp4`; do not edit in simulated values.
- Verify the public repository and explorer URL in a logged-out browser.
