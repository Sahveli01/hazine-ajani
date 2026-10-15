import { describe, expect, it } from "vitest";

import {
  createDcdWriteAdapter,
  OkxWriteError,
  renderDcdSubscriptionRequest,
  type OkxWriteRequest,
} from "./write-adapter.js";

const command = {
  confirmationId: "confirm_1234567890abcdef",
  analysisId: "ana_1234567890abcdef",
  productId: "BTC-USDT-261017-82000-P",
  amount: { value: "100", scale: 0, currency: "USDT" },
  notionalCurrency: "USDT",
  minimumAnnualizedYield: { value: "0.0745", scale: 4 },
};

describe("DCD write adapter", () => {
  it("stays analysis-only when execution is disabled", async () => {
    let calls = 0;
    const adapter = createDcdWriteAdapter({
      executionEnabled: false,
      writeProfile: "okx-tr-write",
      maximumLiveAmount: { value: "100", scale: 0, currency: "USDT" },
      transport: {
        execute: () => {
          calls += 1;
          return Promise.resolve({});
        },
      },
    });

    await expect(adapter.submit(command)).rejects.toMatchObject({
      code: "EXECUTION_DISABLED",
    });
    expect(calls).toBe(0);
  });

  it("renders the confirmed command with a stable idempotency id and percent yield floor", () => {
    expect(renderDcdSubscriptionRequest(command)).toEqual({
      args: [
        "earn",
        "dcd",
        "quote-and-buy",
        "--productId",
        "BTC-USDT-261017-82000-P",
        "--sz",
        "100",
        "--notionalCcy",
        "USDT",
        "--clOrdId",
        "802defe0ee81ecf7ecc1b71f1a588bea",
        "--minAnnualizedYield",
        "7.45",
      ],
      profile: "",
      write: true,
    });
  });

  it("submits once and requires an order-state read before confirmation", async () => {
    const requests: OkxWriteRequest[] = [];
    const adapter = createDcdWriteAdapter({
      executionEnabled: true,
      writeProfile: "okx-tr-write",
      maximumLiveAmount: { value: "100", scale: 0, currency: "USDT" },
      transport: {
        execute: (request) => {
          requests.push(request);
          if (request.args.includes("quote-and-buy")) {
            return Promise.resolve({
              env: "live",
              profile: "okx-tr-write",
              data: [{ ordId: "12345" }],
            });
          }
          return Promise.resolve({
            env: "live",
            profile: "okx-tr-write",
            data: [{ ordId: "12345", state: "live" }],
          });
        },
      },
    });

    await expect(adapter.submit(command)).resolves.toEqual({
      submissionId: "12345",
    });
    await expect(adapter.reconcile("12345")).resolves.toEqual({
      status: "CONFIRMED",
      orderId: "12345",
      okxState: "live",
    });
    expect(requests).toHaveLength(2);
    expect(requests[0]).toMatchObject({ profile: "okx-tr-write", write: true });
    expect(requests[1]?.args).toEqual([
      "earn",
      "dcd",
      "order",
      "--ordId",
      "12345",
    ]);
  });

  it("keeps initial orders pending and rejected orders failed", async () => {
    let state: "initial" | "rejected" = "initial";
    const adapter = createDcdWriteAdapter({
      executionEnabled: true,
      writeProfile: "okx-tr-write",
      maximumLiveAmount: { value: "100", scale: 0, currency: "USDT" },
      transport: {
        execute: () =>
          Promise.resolve({
            env: "live",
            profile: "okx-tr-write",
            data: [{ ordId: "12345", state }],
          }),
      },
    });
    await expect(adapter.reconcile("12345")).resolves.toMatchObject({
      status: "PENDING",
    });
    state = "rejected";
    await expect(adapter.reconcile("12345")).resolves.toMatchObject({
      status: "FAILED",
    });
  });

  it("never retries an uncertain write and never treats a malformed response as success", async () => {
    let calls = 0;
    const adapter = createDcdWriteAdapter({
      executionEnabled: true,
      writeProfile: "okx-tr-write",
      maximumLiveAmount: { value: "100", scale: 0, currency: "USDT" },
      transport: {
        execute: () => {
          calls += 1;
          return Promise.reject(new Error("timeout with secret"));
        },
      },
    });
    await expect(adapter.submit(command)).rejects.toEqual(
      expect.objectContaining({
        code: "SUBMISSION_UNKNOWN",
        message: "OKX write outcome is unknown",
      }),
    );
    expect(calls).toBe(1);

    const malformed = createDcdWriteAdapter({
      executionEnabled: true,
      writeProfile: "okx-tr-write",
      maximumLiveAmount: { value: "100", scale: 0, currency: "USDT" },
      transport: { execute: () => Promise.resolve({ env: "live", data: [] }) },
    });
    await expect(malformed.submit(command)).rejects.toBeInstanceOf(
      OkxWriteError,
    );
  });

  it("blocks an approved command above the server-side live amount cap", async () => {
    let calls = 0;
    const adapter = createDcdWriteAdapter({
      executionEnabled: true,
      writeProfile: "okx-tr-write",
      maximumLiveAmount: { value: "25", scale: 0, currency: "USDT" },
      transport: {
        execute: () => {
          calls += 1;
          return Promise.resolve({});
        },
      },
    });
    await expect(adapter.submit(command)).rejects.toMatchObject({
      code: "AMOUNT_LIMIT_EXCEEDED",
    });
    expect(calls).toBe(0);
  });
});
