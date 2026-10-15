import { describe, expect, it, vi } from "vitest";

import { createAnalysisTrace } from "./index.js";

describe("analysis trace", () => {
  it("links calls without accepting payloads, secrets or PII", async () => {
    const clock = vi
      .fn<() => Date>()
      .mockReturnValueOnce(new Date("2026-10-16T10:00:00.000Z"))
      .mockReturnValueOnce(new Date("2026-10-16T10:00:00.025Z"))
      .mockReturnValueOnce(new Date("2026-10-16T10:00:00.030Z"));
    const trace = createAnalysisTrace({
      analysisId: "ana_1234567890abcdef",
      correlationId: "cor_1234567890abcdef",
      now: clock,
    });

    await expect(
      trace.run("OKX_DCD_PRODUCTS", () => Promise.resolve("ok")),
    ).resolves.toBe("ok");
    trace.recordDecision("REJECT", ["STALE_QUOTE"]);

    expect(trace.snapshot()).toEqual({
      analysisId: "ana_1234567890abcdef",
      correlationId: "cor_1234567890abcdef",
      events: [
        {
          type: "TOOL_CALL",
          tool: "OKX_DCD_PRODUCTS",
          status: "OK",
          startedAt: "2026-10-16T10:00:00.000Z",
          finishedAt: "2026-10-16T10:00:00.025Z",
          latencyMs: 25,
        },
        {
          type: "DECISION",
          decision: "REJECT",
          reasonCodes: ["STALE_QUOTE"],
          recordedAt: "2026-10-16T10:00:00.030Z",
        },
      ],
    });
    expect(JSON.stringify(trace.snapshot())).not.toMatch(
      /api.?key|passphrase|authorization|email|address/i,
    );
  });

  it("records only a typed failure code when a tool fails", async () => {
    const trace = createAnalysisTrace({
      analysisId: "ana_1234567890abcdef",
      correlationId: "cor_1234567890abcdef",
      now: () => new Date("2026-10-16T10:00:00.000Z"),
    });

    await expect(
      trace.run("OKX_SPOT_TICKER", () =>
        Promise.reject(
          Object.assign(new Error("secret=must-not-appear"), {
            code: "TIMEOUT",
          }),
        ),
      ),
    ).rejects.toThrow("must-not-appear");

    expect(trace.snapshot().events[0]).toMatchObject({
      status: "ERROR",
      errorCode: "TIMEOUT",
    });
    expect(JSON.stringify(trace.snapshot())).not.toContain("must-not-appear");
  });
});
