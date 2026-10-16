# Security policy

## Scope and threat model

Hazine Ajanı reads live OKX market and account product data, can prepare an
explicitly confirmed Dual Investment subscription, and sells a canonical
analysis report for Avalanche Fuji test USDC. The primary threats are leaked
exchange credentials, an unconfirmed or duplicated write, stale market data,
LLM instruction injection, forged paid reports, replayed Fuji settlements and
logs or error responses that expose secrets.

The application fails closed when required credentials, durable payment
storage, market freshness, proxy quality, user confirmation or chain receipt
evidence is missing.

## Credential boundaries

- The first OKX profile is read-only. Live writes use a separate profile with
  the minimum trading permission.
- Withdrawal permission is prohibited. No withdrawal command is present in the
  write adapter.
- API keys, secrets, passphrases and wallet private keys are server/CLI process
  inputs. They never use a `NEXT_PUBLIC_*` variable, enter an analysis report or
  appear in `.env.example` values.
- Browser x402 payment uses the user's injected wallet and EIP-712 signature;
  the application never requests or stores the wallet private key.
- During the official local-first hackathon deployment, secrets remain only in
  the local OKX profile or the hidden facilitator process input. The HTTPS
  tunnel receives no credential value. A later cloud deployment must use its
  platform secret store and stable-egress IP allowlisting where available.

## Money movement controls

OKX execution defaults off. A fresh deterministic `ACCEPT` report may prepare
one confirmation. The confirmation is consumed before the writer runs, so
double submit and concurrent submit fail. The server enforces a notional cap,
does not retry an uncertain write and reconciles the returned order state.
Every new money-moving operation requires a new explicit user confirmation.

Fuji is always labeled testnet. The paid-report proxy stores the exact
server-returned canonical report against the settlement transaction before it
reaches the browser. Confirmation reloads that server copy, checks the
configured recipient, exact USDC token, payer, 10,000 base-unit transfer and
successful Fuji receipt. An atomic durable claim file prevents transaction
reuse across restarts and concurrent processes that share the configured
volume.

`X402_REPLAY_STORE_DIR` must point to the persistent local demo directory (or
a shared persistent volume in a future cloud deployment). The paid flow
returns unavailable rather than falling back to memory or an ephemeral path
when this setting is absent.

## LLM, logging and errors

The LLM can only parse a policy schema and explain an already-computed result.
It cannot call tools, perform financial arithmetic, change `ACCEPT / ASK /
REJECT`, authorize execution or provide runtime market numbers. Invalid shape,
prompt injection and bypass attempts fail to deterministic fallback behavior.

Analysis traces contain correlation metadata and allowlisted error codes only.
They reject request payloads, provider messages, credentials and personal
account data. Public payment confirmation errors use an allowlist and never
return raw RPC, Zod, filesystem or provider messages.

## Known limits

- Dual Investment and the option proxy are different products with different
  settlement mechanics; the proxy is a benchmark band, not a guaranteed fair
  value.
- Risk-neutral conversion probability is a model measure, not a real-world
  forecast.
- Fuji AVAX and test USDC have no monetary value.
- Durable replay safety depends on all production instances sharing the same
  persistent `X402_REPLAY_STORE_DIR`. Deployment verification must prove this
  before the paid endpoint is advertised.

## Reporting a vulnerability

Do not open a public issue containing credentials, account identifiers or an
unpatched exploit. Use GitHub's private vulnerability reporting for the
repository. If that channel is unavailable, contact the repository owner
privately and include the affected commit, reproduction steps and impact. Never
include live API secrets or wallet keys in the report.
