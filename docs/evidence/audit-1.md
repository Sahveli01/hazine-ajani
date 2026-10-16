# E2 ara hack audit — 2026-10-16

## Static scan

The first `hack-audit` scan reported three blockers and one information item.
All three blockers were intentionally invalid values in test-only files: a
deterministic private key used only to exercise signing policy, an LLM key used
to prove it is omitted from the request body, and an unknown report field used
to prove strict rejection. Each line now has an explicit `hack-audit-ok`
justification. The second scan reports zero blockers and zero warnings.

The remaining information item is that README has no live deployment or demo
video link. Those artifacts do not exist yet and must not be invented; E3 and
the delivery steps own them.

## Manual runtime pass

- Production code imports no `test-fixtures`, mock or fixture module.
- The browser loads `/api/analysis`; the API orchestrates authenticated live
  OKX DCD/Simple Earn and public spot/options sources. Missing runtime config
  fails closed rather than returning sample data.
- Every displayed market number comes from the canonical report with source
  references and observed timestamps. Fixed UI numbers are protocol terms:
  HTTP 402, Fuji chain 43113 and the configured 0.01 test-USDC price.
- Payment success requires the exact upstream canonical report, facilitator
  settlement and RPC-verified Fuji transfer. No static transaction is present
  in runtime code.
- All rendered buttons have handlers. The disabled OKX execution state renders
  no action button, so unavailable live write capability is not hidden behind
  a dead control. Retry links reload a real request.
- Async analysis covers loading, unavailable, insufficient, stale and success.
  Wallet/payment states distinguish missing network, rejection, insufficient
  balance, pending, facilitator failure, revert and confirmation.
- Component styles contain no raw color or pixel bypass; tokens remain in
  `tokens.css`. No gradient, emoji heading, placeholder copy or static chart is
  present.
- Temporary proof routes were removed; the production build exposes only the
  product and API routes.

## Verification

- Re-scan: 0 blockers, 0 warnings, 1 delivery info item.
- E1 full `pnpm check` immediately before this audit passed 179 Vitest tests,
  four invariant tests, lint, typecheck and production build.
- The E2 source changes are scanner annotations in tests plus this evidence and
  roadmap state; runtime behavior is unchanged.
