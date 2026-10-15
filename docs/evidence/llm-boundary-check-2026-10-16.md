# B7 LLM boundary verification — 2026-10-16

## Verified behavior

- A complete Turkish preference is converted to the versioned canonical `RiskPolicy` schema.
- Missing or vague fields return `NEEDS_CONFIRMATION`; no financial default is invented.
- Extra provider keys such as an injected `decision: ACCEPT` invalidate the output.
- The Responses request uses strict JSON Schema, contains no tool definition and does not place the API key in its JSON body.
- Provider errors and timeouts leave the structured controls and deterministic explanation available.
- A canonical report is validated before provider invocation.
- Canonical decimal strings are inserted only by the template. Invented model numbers discard model prose.
- The numeric-diff test finds exactly the report's net-edge bounds, implied probability, worst stress loss and data-quality score, with no extra number.

## Test matrix

Nine B7 tests cover Turkish policy parsing, incomplete language, adversarial prompt injection, invalid provider shape, provider timeout, deterministic fallback, invented numbers, accepted number-free prose and pre-provider canonical report validation.

`pnpm check` passed: lint, all workspace TypeScript checks, 91 tests and all package/Next.js production builds completed successfully. The sandbox's Node 24.19.0 produced an engine warning because the repository remains pinned to Node 22.20.0.

## Source

- [OpenAI Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
