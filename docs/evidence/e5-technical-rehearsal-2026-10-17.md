# E5 technical rehearsal — 2026-10-17

## Live runs

Both rehearsals used the public HTTPS deployment at
`https://stuff-angle-cap-obituaries.trycloudflare.com` with a 1280×720 Edge
viewport. They waited for a fresh live analysis rather than injecting a report.

| Run | HTTP | Decision | Technical route | Result |
| --- | ---: | -------- | --------------: | ------ |
| 1   |  200 | `REJECT` |         16.98 s | Passed |
| 2   |  200 | `REJECT` |         17.64 s | Passed |

Each run asserted the visible OKX TR source, Avalanche Fuji and `TESTNET`
labels, risk-neutral model label and paid-agent action. It then traversed the
valuation band, opened source/proxy details and reached the x402 panel. No
fixture, cached market response or payment simulation was used.

## Fallback recording

- Artifact: `outputs/demo/demo-backup.webm`
- Codec container: WebM, browser-playable
- Duration: 25.04 seconds
- Resolution: 1280×720
- Playback readiness: browser `readyState = 4`
- Content: fresh public OKX analysis, evidence/proxy details, x402 terms and the
  public GitHub E3 evidence containing the real confirmed Fuji transaction.

The recording does not perform another payment. Its transaction segment shows
the already completed E3 settlement
`0x51bf626c7590c3f4feb1d70af831428fa9c576135fc6ab8d5e5f04ad69d77165`,
which was independently confirmed through Fuji RPC.

## Remaining physical check

The automated technical route and artifact checks cannot prove that a human
speaker delivered the route aloud in the venue or that a person four metres
from the projector could read it. The final E5 gate therefore remains open
until the operator performs two narrated runs using `docs/DEMO.md` and records
their durations and readability result below.

| Narrated run | Duration | Critical error | Four-metre readability |
| ------------ | -------- | -------------- | ---------------------- |
| 1            | pending  | pending        | pending                |
| 2            | pending  | pending        | pending                |
