# ADR 0008: LLM policy and explanation boundary

- Status: Accepted
- Date: 2026-10-16

## Decision

The language model has two narrowly defined operations and no tools:

1. Convert Turkish user preferences into a strict, versioned policy candidate.
2. Add short, number-free Turkish prose to a canonical analysis explanation.

The OpenAI adapter uses the Responses API with `text.format.type = json_schema` and `strict = true`, as documented by OpenAI. The model name is runtime configuration rather than a hard-coded product assumption. Provider output is always validated again locally.

Policy extraction never supplies defaults. Every null, missing, vague or conflicting field returns `NEEDS_CONFIRMATION` with the exact structured field names. Extra keys, including invented decisions or bypass instructions, invalidate the complete model result. Provider failure returns `UNAVAILABLE`; users can continue with structured policy controls.

Explanation begins only after `parseAnalysisReport` accepts the complete canonical report. Code creates the decision and numeric sentence from the report. The model receives a small projection derived from that validated report and may return only number-free narrative. Any digit, contradictory decision language, invalid shape, timeout or refusal discards the model prose and uses the deterministic reason-code template.

## Consequences

- The model cannot calculate a financial value, create a reason code or override `ACCEPT / ASK / REJECT`.
- Numeric difference between the report and displayed explanation is zero because code copies the original decimal strings.
- Prompt text and canonical report fields remain untrusted data, never system instructions.
- The financial result remains usable without an LLM provider or API key.

## Official reference

- [OpenAI Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [OpenAI Responses create reference](https://developers.openai.com/api/reference/resources/responses/methods/create)
