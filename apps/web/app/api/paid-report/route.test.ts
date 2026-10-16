import { describe, expect, it, vi } from "vitest";

import { forwardPaidReportRequest } from "./route.js";

describe("paid report proxy", () => {
  it("forwards the wallet signature and returns x402 protocol headers", async () => {
    const upstream = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: {
          "payment-response": "settlement",
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
    );

    expect(upstream).toHaveBeenCalledOnce();
    expect(upstream.mock.calls[0]?.[0]).toBe("http://api/paid");
    const init = upstream.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get("payment-signature")).toBe(
      "authorization",
    );
    expect(response.headers.get("payment-response")).toBe("settlement");
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
    );
    expect(response.status).toBe(402);
    expect(response.headers.get("payment-required")).toBe("challenge");
  });
});
