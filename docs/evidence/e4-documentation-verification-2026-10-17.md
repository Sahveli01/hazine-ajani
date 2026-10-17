# E4 documentation verification — 2026-10-17

## Coverage

The root README provides the problem, differentiator, live demo story,
architecture boundary, pinned prerequisites, clean install, validation commands,
deployment path, public paid-agent proof command, security limits, prior art,
official sources and MIT license.

The public x402 proof links to the confirmed E3 transaction and records the
ephemeral nature of the Cloudflare Quick Tunnel URL. `docs/DEPLOYMENT.md`
explains the live process boundary, health/readiness checks, explicit approval
requirement for each new 0.01 Fuji test-USDC payment, hidden key entry and the
RPC confirmation gates.

## Verification

- Every relative Markdown link in `README.md` and `docs/DEPLOYMENT.md` resolved
  to a tracked workspace file.
- Prettier passed for both changed Markdown files.
- All ordinary external links in those files returned HTTP 200 on 2026-10-17.
- Snowtrace transaction links returned HTTP 403 to the automated checker because
  the explorer blocks this client. Both hashes were independently verified
  through Avalanche Fuji RPC; E3 records the exact successful Transfer.
- The previously stale OKX terms URL returned HTTP 404 and was replaced with the
  current official product-terms URL, which returned HTTP 200.
- GitHub Actions provides the clean-runner install and full `pnpm check` proof.
- Local `pnpm check` passed after E3 with lint, typecheck, 4 invariant tests,
  179 Vitest tests and the production build.

## Important limits retained

- The option is an executable benchmark, not the same product as DCD.
- Risk-neutral conversion probability is not a real-world forecast.
- Fuji AVAX and test USDC have no monetary value.
- The public demo URL changes when the launcher restarts.
- Every OKX write and every new x402 payment needs separate explicit approval.
