import type { FacilitatorClient } from "@x402/core/server";
import { describe, expect, it } from "vitest";

import { createApp } from "../../../../api/src/index.js";
import { validAnalysisReport } from "../../test-fixtures/analysis-report.js";
import { loadLiveAnalysis } from "../../live-analysis.js";
import { forwardAnalysisRequest } from "./route.js";

const facilitatorClient: FacilitatorClient = {
  getSupported: () =>
    Promise.resolve({
      kinds: [{ x402Version: 2, scheme: "exact", network: "eip155:43113" }],
      extensions: [],
      signers: { "eip155:*": ["0x2222222222222222222222222222222222222222"] },
    }),
  settle: () => Promise.reject(new Error("not called")),
  verify: () => Promise.reject(new Error("not called")),
};

describe("web analysis proxy", () => {
  it("forwards the configured API's canonical report into the strict browser state", async () => {
    const report = validAnalysisReport();
    const api = await createApp({
      payTo: "0x1111111111111111111111111111111111111111",
      facilitatorClient,
      analysis: {
        request: {} as never,
        run: () =>
          Promise.resolve({
            status: "SUCCESS",
            report,
            trace: {
              analysisId: report.analysisId,
              correlationId: "cor_1234567890abcdef",
              startedAt: report.createdAt,
              events: [],
            },
          }),
      },
    });
    const response = await forwardAnalysisRequest(
      (url, init) => Promise.resolve(api.request(new URL(url).pathname, init)),
      "http://api.local/api/analysis",
    );
    await expect(
      loadLiveAnalysis(
        () => Promise.resolve(response),
        new Date("2026-10-16T10:00:30.000Z"),
      ),
    ).resolves.toMatchObject({ status: "success", report });
  });
});
