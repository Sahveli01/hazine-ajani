# D4 agent payment UI evidence — 2026-10-16

## Runtime boundary

The production component accepts only a canonical `AnalysisReport`. The live
controller requests Avalanche Fuji in the injected EIP-1193 wallet, uses the
official x402 client for the EIP-712 payment authorization and derives a
confirmed state only after the server sees the exact test-USDC `Transfer` in a
successful Fuji receipt. No fixture is imported by production and no missing
receipt becomes paid.

The confirmation route binds `payTo` to server-side
`X402_PAY_TO_ADDRESS`, verifies payer, recipient, token and `10000` base-unit
amount, and consumes each transaction hash once. A browser-supplied recipient
or replayed transaction cannot create another paid report.

The screen displays the HTTP 402 price, Avalanche Fuji chain ID, explicit
`test USDC` label, wallet/transaction lifecycle, shortened full-title hash,
copy control, Snowtrace link, report ID and JSON receipt preview. User rejection
is neutral; wrong chain, insufficient balance, facilitator failure and reverted
receipt remain distinct states.

## Real settlement evidence

The confirmed capture uses the already completed C3 Fuji settlement evidence;
no second payment was made for D4:

- transaction: `0x101a0e12ef4cf2f8ca25c7aa2bc014ac3119a32db648bd9ff2306abf93403ce1`
- network: Avalanche Fuji Testnet (`eip155:43113`)
- amount: `0.01` test USDC
- RPC-confirmed at: `2026-10-16T14:23:56.000Z`
- source proof: `docs/evidence/C3-paid-canonical-report-2026-10-16.md`

The screenshot route was a temporary visual harness and was removed before the
final production build. It used test-only market report data for layout while
the payment identifiers above are the real C3 receipt; it is not runtime data.

## Visual evidence

- `d4-screens/d4-confirmed-1280x720.png`
- `d4-screens/d4-wrong-chain-1280x720.png`
- `d4-screens/d4-rejected-1280x720.png`
- `d4-screens/d4-confirmed-mobile.png`

## Verification

- 21 focused D4 tests cover lifecycle copy, Fuji network configuration,
  wallet failure classification, x402 proxy headers, server validation and
  transaction replay protection.
- 47 web tests and 177 Vitest tests across the workspace passed, plus 4 Node
  workspace invariant tests.
- Full `pnpm check` passed: lint, typecheck, tests and production build. The
  final route table contains only `/`, `/api/analysis`, `/api/paid-report` and
  `/api/paid-report/confirm` (plus the framework not-found route).
- Impeccable detector returned no findings for the changed UI targets.
- Impeccable finish review returned `disposition: ship` after the security and
  mobile corrections.
