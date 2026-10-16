import { describe, expect, it } from "vitest";
import type { FacilitatorClient } from "@x402/core/server";
import { pathToFileURL } from "node:url";

import { createApp, isDirectExecution, resolvePort } from "./index.js";

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
  it("accepts a valid dynamic local port and rejects invalid values", () => {
    expect(resolvePort("34123", 3001)).toBe(34123);
    expect(resolvePort(undefined, 3001)).toBe(3001);
    expect(() => resolvePort("0", 3001)).toThrow("port");
    expect(() => resolvePort("not-a-port", 3001)).toThrow("port");
  });
  it("recognizes the current platform entry path as direct execution", () => {
    const entryPoint = process.platform === "win32"
      ? "C:\\workspace\\apps\\api\\src\\index.ts"
      : "/workspace/apps/api/src/index.ts";
    expect(isDirectExecution(pathToFileURL(entryPoint).href, entryPoint)).toBe(
      true,
    );
  });

  it("keeps health checks public", async () => {
    const app = await createApp({
      payTo: PAY_TO,
      facilitatorClient,
      deployment: { commit: "9e3d8ca" },
    });
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "hazine-ajani-api",
      commit: "9e3d8ca",
    });
  });

  it("reports readiness only when live analysis is configured", async () => {
    const unavailable = await createApp({ payTo: PAY_TO, facilitatorClient });
    expect((await unavailable.request("/ready")).status).toBe(503);

    const ready = await createApp({
      payTo: PAY_TO,
      facilitatorClient,
      analysis: {
        request: {} as never,
        run: () => Promise.reject(new Error("not called by readiness")),
      },
    });
    const response = await ready.request("/ready");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ready" });
  });

  it("adds a correlation id and emits one structured request log", async () => {
    const logs: unknown[] = [];
    const app = await createApp({
      payTo: PAY_TO,
      facilitatorClient,
      requestId: () => "req_1234567890abcdef",
      log: (entry) => logs.push(entry),
    });
    const response = await app.request("/health");

    expect(response.headers.get("x-correlation-id")).toBe(
      "req_1234567890abcdef",
    );
    expect(logs).toEqual([
      expect.objectContaining({
        type: "HTTP_REQUEST",
        correlationId: "req_1234567890abcdef",
        method: "GET",
        path: "/health",
        status: 200,
      }),
    ]);
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
