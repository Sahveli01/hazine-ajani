import { describe, expect, it } from "vitest";
import type { FacilitatorClient } from "@x402/core/server";

import { createApp } from "./index.js";

const PAY_TO = "0x1111111111111111111111111111111111111111";
const facilitatorClient: FacilitatorClient = {
  getSupported() {
    return Promise.resolve({
      kinds: [
        {
          x402Version: 2,
          scheme: "exact",
          network: "eip155:43113",
        },
      ],
      extensions: [],
      signers: { "eip155:*": ["0x2222222222222222222222222222222222222222"] },
    });
  },
  settle() {
    return Promise.reject(
      new Error("settle is not called for an unpaid request"),
    );
  },
  verify() {
    return Promise.reject(
      new Error("verify is not called for an unpaid request"),
    );
  },
};

describe("x402 paid risk report route", () => {
  it("keeps health checks public", async () => {
    const app = await createApp({ payTo: PAY_TO, facilitatorClient });
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });

  it("returns a Fuji-labelled 402 challenge without a payment", async () => {
    const app = await createApp({ payTo: PAY_TO, facilitatorClient });
    const response = await app.request("/api/agent/risk-report");

    expect(response.status).toBe(402);

    const paymentRequired = response.headers.get("PAYMENT-REQUIRED");
    expect(paymentRequired).toBeTruthy();

    const decoded = JSON.parse(
      Buffer.from(paymentRequired!, "base64").toString("utf8"),
    ) as {
      accepts: Array<{
        network: string;
        asset: string;
        payTo: string;
        amount: string;
      }>;
    };

    expect(decoded.accepts).toContainEqual(
      expect.objectContaining({
        network: "eip155:43113",
        asset: "0x5425890298aed601595a70AB815c96711a31Bc65",
        payTo: PAY_TO,
        amount: "10000",
      }),
    );
  });

  it("does not start a paid route without a valid recipient", async () => {
    await expect(createApp({ payTo: "", facilitatorClient })).rejects.toThrow(
      "X402_PAY_TO_ADDRESS",
    );
  });
});
