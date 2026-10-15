# ADR 0001 — TypeScript workspace and verified toolchain

Status: Accepted

Date: 2026-10-15

## Decision

- Runtime: Node.js `22.20.0`.
- Package manager: pnpm `11.25.0` with a committed lockfile and exact versions.
- Workspace: one TypeScript monorepo with `apps/*` and `packages/*` boundaries from `PROJECT.md`.
- Web: Next.js `16.4.1` + React `19.3.1`.
- API: Hono `4.13.13` on the Node server adapter `2.1.5`.
- Validation: Zod `4.6.7`.
- Chain client: viem `2.57.7`.
- x402: official `@x402/core`, `@x402/hono`, and `@x402/fetch` packages at `2.28.0`.
- Tests: Node's built-in runner for workspace invariants and Vitest `5.0.4` for TypeScript domain/application tests.
- Quality: TypeScript `5.9.3`, ESLint `10.12.0`, typescript-eslint `8.71.2`, Prettier `3.9.10`.
- Task orchestration: Turborepo `2.11.8`.
- OKX tooling: stable `@okx_ai/okx-trade-cli` and `@okx_ai/okx-trade-mcp` `1.4.8`. Beta `1.4.9-beta.2` is explicitly excluded.

## Why

One language and one lockfile reduce cross-agent drift. Next.js supplies the user-facing surface, Hono keeps the paid agent API small and portable, and the official x402 Hono/fetch packages match the server/client split in the product. Exact pins ensure another agent installs the same graph instead of inheriting a newer registry state.

## OKX integration boundary

The application starts with the `okx` CLI in JSON mode because the event guide recommends it as the shortest auditable path and credentials remain in the user's local OKX config. Commands are never guessed: every command used by the product must be captured from installed `okx ... --help` output. MCP remains available at the same pinned version for later agent-tool autonomy, but adopting MCP instead of CLI requires an ADR after the DCD capability spike.

## Operational constraints

- `OKX_SITE` must resolve to `tr`; regional fallback is forbidden.
- Credentials stay in `~/.okx/config.toml` or an approved server-side secret store, never the repository.
- The x402 packages are pinned now but exercised only in roadmap A5.
- Next.js and API packages contain no financial behavior in A2; this step establishes a reproducible baseline only.

## Dependency risk register

- pnpm's install-script policy explicitly permits only `esbuild` and the two pinned official OKX packages. The OKX `postinstall` downloads checksum-verified `okx-auth` and Pilot binaries; changing either package version requires reviewing its published scripts again.
- The OKX tools install executables under the user's `~/.okx/bin` directory. Those files and `~/.okx/config.toml` are outside the repository and must never be committed.
- `minimumReleaseAgeExclude` contains only the exact versions already reviewed and pinned in this ADR. New packages are not silently exempted from the local supply-chain age policy.
- x402 packages expand the network and payment attack surface. They remain inactive until A5 adds replay protection, idempotency, bounded price/expiry rules and end-to-end tests.
- `pnpm audit --prod --audit-level high` reported no known vulnerabilities on 2026-10-15. This is a dated registry check, not a permanent safety guarantee.

## Verification sources

- [OKX Agent Trade Kit changelog](https://raw.githubusercontent.com/okx/agent-trade-kit/github-main/CHANGELOG.md) — `1.4.8` stable on 2026-09-23; published package metadata synchronized.
- [OKX Agent Trade Kit repository](https://github.com/okx/agent-trade-kit)
- [Avalanche x402 facilitators](https://docs.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators)
- npm registry metadata was queried on 2026-10-15 for every pinned third-party package.

## Consequences

Node `22.20.0` is stricter than the OKX minimum Node 18, but it satisfies Next.js, Vitest and ESLint engine requirements and matches the verified local runtime. Contributors without that exact runtime must switch before installation; package-manager and engine checks intentionally fail otherwise.
