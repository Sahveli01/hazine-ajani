# D5 accessibility, responsive and motion evidence — 2026-10-16

## Automated accessibility scan

`axe-core` 4.11.0 ran in Edge against both the real application shell and a
temporary full offer/payment proof route. WCAG 2 A, AA and 2.1 AA returned zero
violations at 1280, 1024 and 390 CSS pixels. The temporary route imported only
the existing test fixture and was removed before the production build.

Raw results: `docs/evidence/d5-accessibility-audit-2026-10-16.json`.

## Keyboard and motion

CDP Tab traversal reached the offer evidence `summary` first and the payment
button second. Both reported a solid 3 px focus outline. With
`prefers-reduced-motion: reduce`, all six shell/proof viewport runs reported
zero running animations while preserving every state label and control.

## Responsive pass

The same CDP run compared `documentElement.scrollWidth` with `innerWidth`:

- 1280 px: no horizontal overflow.
- 1024 px: no horizontal overflow.
- 390 px mobile emulation: `scrollWidth === innerWidth`.

Visual evidence:

- `docs/evidence/d5-screens/d5-1280.png`
- `docs/evidence/d5-screens/d5-1024.png`
- `docs/evidence/d5-screens/d5-390.png`

## Numeric precision

Visible percentages remain localized and concise. Their `aria-label` values
are now produced with deterministic BigInt decimal arithmetic, preserving the
report scale instead of converting through floating point. The unit test covers
a nine-decimal input.

## Repository verification

`pnpm check` passed: ESLint, every workspace typecheck, 178 Vitest tests, four
Node workspace invariant tests and the production Next.js build. The final
route table contains no proof route.
