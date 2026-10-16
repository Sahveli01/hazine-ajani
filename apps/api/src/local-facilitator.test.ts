import type { x402Facilitator } from "@x402/core/facilitator";
import { describe, expect, it, vi } from "vitest";

import { createFacilitatorHttpApp } from "./local-facilitator.js";

describe("local x402 facilitator HTTP surface", () => {
  it("exposes supported, verify and settle using the official facilitator core", async () => {
    const verify = vi.fn(() =>
      Promise.resolve({
        isValid: true,
        payer: "0x2222222222222222222222222222222222222222",
      }),
    );
    const settle = vi.fn(() =>
      Promise.resolve({
        success: true,
        payer: "0x2222222222222222222222222222222222222222",
        transaction: `0x${"a".repeat(64)}`,
        network: "eip155:43113",
      }),
    );
    const facilitator = {
      getSupported: vi.fn(() => ({
        kinds: [{ x402Version: 2, scheme: "exact", network: "eip155:43113" }],
        extensions: [],
        signers: { "eip155:*": ["0x1111111111111111111111111111111111111111"] },
      })),
      verify,
      settle,
    } as unknown as x402Facilitator;
    const app = createFacilitatorHttpApp(facilitator);

    const supported = await app.request("/supported");
    expect(supported.status).toBe(200);
    await expect(supported.json()).resolves.toMatchObject({
      kinds: [{ network: "eip155:43113" }],
    });

    const paymentRequirements = {
      scheme: "exact",
      network: "eip155:43113",
      amount: "10000",
      asset: "0x5425890298aed601595a70AB815c96711a31Bc65",
      payTo: "0x3333333333333333333333333333333333333333",
      maxTimeoutSeconds: 60,
      extra: { name: "USD Coin", version: "2" },
    };
    const request = {
      x402Version: 2,
      paymentPayload: {
        x402Version: 2,
        payload: {},
        accepted: paymentRequirements,
      },
      paymentRequirements,
    };

    expect(
      (
        await app.request("/verify", {
          method: "POST",
          body: JSON.stringify(request),
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await app.request("/settle", {
          method: "POST",
          body: JSON.stringify(request),
        })
      ).status,
    ).toBe(200);
    expect(verify).toHaveBeenCalledOnce();
    expect(settle).toHaveBeenCalledOnce();
  });

  it("rejects malformed facilitator requests without calling settlement", async () => {
    const settle = vi.fn();
    const facilitator = {
      getSupported: vi.fn(),
      verify: vi.fn(),
      settle,
    } as unknown as x402Facilitator;
    const app = createFacilitatorHttpApp(facilitator);

    const response = await app.request("/settle", {
      method: "POST",
      body: JSON.stringify({ x402Version: 2 }),
    });

    expect(response.status).toBe(400);
    expect(settle).not.toHaveBeenCalled();
  });
});
