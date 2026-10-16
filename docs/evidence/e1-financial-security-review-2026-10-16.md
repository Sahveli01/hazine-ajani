# E1 financial correctness and security review — 2026-10-16

## Independent review result

The independent reviewer recomputed the Actual/365 yield, settlement payoff,
executable premium band, Simple Earn opportunity cost, risk-neutral `N(-d2)`
label and three stress scenarios. No arithmetic or labeling defect was found.

OKX write controls passed: execution defaults off, only fresh `ACCEPT` reports
can prepare, confirmation is single-use, amount is server-capped, uncertain
writes are not retried, errors are redacted and no withdrawal command exists.
Prompt-injection, stale data and trace-redaction tests also passed.

## Findings closed

The initial review found four issues, all closed before completion:

1. Paid confirmation accepted a client-supplied report. The paid proxy now
   parses and stores the exact upstream canonical report by settlement hash;
   confirmation accepts no report body and reloads only that server copy.
2. Replay state was process-local. `FilePaidReportStore` now uses atomic `wx`
   claims on a required shared persistent `X402_REPLAY_STORE_DIR`, surviving
   process recreation and concurrent instances on the same volume.
3. Raw provider/validation errors could be returned. Public confirmation codes
   are now allowlisted; secret-bearing messages become
   `CONFIRMATION_FAILED`.
4. The repository lacked a security policy. `SECURITY.md` now records the
   threat model, key permissions, withdrawal prohibition, payment/storage
   requirements, known limitations and private disclosure path.

The reviewer rechecked the fixes and reported that the security design findings
were closed. A missing strict-parser import found during that pass was restored.

## Verification

- `pnpm audit --prod --audit-level high`: no known vulnerabilities.
- Focused paid-report/store/confirmation tests passed.
- Full `pnpm check` passed: lint, all workspace typechecks, 179 Vitest tests,
  four Node invariant tests and production build.
- Production route table contains no test or proof route.
