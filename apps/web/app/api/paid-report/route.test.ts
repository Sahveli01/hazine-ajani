import { describe, expect, it, vi } from "vitest";
import { encodePaymentResponseHeader } from "@x402/core/http";

import { forwardPaidReportRequest } from "./route.js";
import { validAnalysisReport } from "../../test-fixtures/analysis-report.js";

describe("paid report proxy", () => {
  it("forwards the wallet signature and returns x402 protocol headers", async () => {
    const settlement = {
      success: true,
      payer: "0x2222222222222222222222222222222222222222",
      transaction: `0x${"a".repeat(64)}`,
      network: "eip155:43113" as const,
      amount: "10000",
    };
    const store = { save: vi.fn(() => Promise.resolve()) };
    const upstream = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(validAnalysisReport()), {
        status: 200,
        headers: {
          "payment-response": encodePaymentResponseHeader(settlement),
          "content-type": "application/json",
        },
      }),
    );
    const request = new Request("http://localhost/api/paid-report", {
      headers: { "payment-signature": "authorization" },
    });

    const response = await forwardPaidReportRequest(
      upstream,
      "http://api/paid",
      request,
      store,
    );

    expect(upstream).toHaveBeenCalledOnce();
    expect(upstream.mock.calls[0]?.[0]).toBe("http://api/paid");
    const init = upstream.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get("payment-signature")).toBe(
      "authorization",
    );
    expect(response.headers.get("payment-response")).toBe(
      encodePaymentResponseHeader(settlement),
    );
    expect(store.save).toHaveBeenCalledWith(
      settlement.transaction,
      expect.objectContaining({ analysisId: validAnalysisReport().analysisId }),
    );
  });

  it("preserves the initial HTTP 402 challenge", async () => {
    const upstream = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("{}", {
        status: 402,
        headers: { "payment-required": "challenge" },
      }),
    );
    const response = await forwardPaidReportRequest(
      upstream,
      "http://api/paid",
      new Request("http://localhost/api/paid-report"),
      { save: vi.fn(() => Promise.resolve()) },
    );
    expect(response.status).toBe(402);
    expect(response.headers.get("payment-required")).toBe("challenge");
  });
});
