import { describe, expect, it, vi } from "vitest";

import { encodePaymentResponseHeader } from "@x402/core/http";

import {
  createFujiPaidFetch,
  executeFujiPaidRequest,
  executeFujiPaidRequestWithRetry,
} from "./index.js";
import type { PaidResourceError } from "./index.js";

const TEST_ONLY_PRIVATE_KEY =
  "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const EXPECTED_PAY_TO = "0x1111111111111111111111111111111111111111";

describe("Fuji x402 agent client", () => {
  it("builds a payment-capable fetch with strict Fuji policy", () => {
    expect(
      createFujiPaidFetch({
        privateKey: TEST_ONLY_PRIVATE_KEY,
        expectedPayTo: EXPECTED_PAY_TO,
      }),
    ).toEqual(expect.any(Function));
  });

  it.each([
    { privateKey: "", expectedPayTo: EXPECTED_PAY_TO },
    { privateKey: "0x1234", expectedPayTo: EXPECTED_PAY_TO },
    { privateKey: TEST_ONLY_PRIVATE_KEY, expectedPayTo: "" },
  ])("fails closed for invalid wallet configuration", (configuration) => {
    expect(() => createFujiPaidFetch(configuration)).toThrow();
  });

  it("returns only a successful Fuji settlement receipt and response body", async () => {
    const settlement = {
      success: true,
      payer: "0x2222222222222222222222222222222222222222",
      transaction: `0x${"a".repeat(64)}`,
      network: "eip155:43113" as const,
      amount: "10000",
    };
    const paidFetch = () =>
      Promise.resolve(
        new Response(JSON.stringify({ status: "paid" }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "payment-response": encodePaymentResponseHeader(settlement),
          },
        }),
      );

    await expect(
      executeFujiPaidRequest(paidFetch, "http://127.0.0.1:3001/paid"),
    ).resolves.toEqual({ settlement, body: { status: "paid" } });
  });

  it.each([
    new Response("missing receipt", { status: 200 }),
    new Response("upstream error", { status: 503 }),
  ])("fails closed without paid access evidence", async (response) => {
    await expect(
      executeFujiPaidRequest(
        () => Promise.resolve(response),
        "http://127.0.0.1:3001/paid",
      ),
    ).rejects.toThrow();
  });

  it("retries an unpaid 422 but stops after a successful settlement", async () => {
    const settlement = {
      success: true,
      payer: "0x2222222222222222222222222222222222222222",
      transaction: `0x${"b".repeat(64)}`,
      network: "eip155:43113" as const,
      amount: "10000",
    };
    const responses = [
      new Response(JSON.stringify({ status: "NO_SUITABLE_PROXY" }), {
        status: 422,
        headers: { "content-type": "application/json" },
      }),
      new Response(JSON.stringify({ status: "paid" }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "payment-response": encodePaymentResponseHeader(settlement),
        },
      }),
    ];
    const paidFetch = vi.fn(() => Promise.resolve(responses.shift()!));

    await expect(
      executeFujiPaidRequestWithRetry(
        paidFetch,
        "http://127.0.0.1:3001/paid",
        2,
        () => Promise.resolve(),
      ),
    ).resolves.toEqual({ settlement, body: { status: "paid" } });
    expect(paidFetch).toHaveBeenCalledTimes(2);
  });

  it("never retries a non-success response with settlement evidence", async () => {
    const settlement = {
      success: true,
      payer: "0x2222222222222222222222222222222222222222",
      transaction: `0x${"c".repeat(64)}`,
      network: "eip155:43113" as const,
      amount: "10000",
    };
    const paidFetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ status: "late failure" }), {
          status: 503,
          headers: {
            "content-type": "application/json",
            "payment-response": encodePaymentResponseHeader(settlement),
          },
        }),
      ),
    );

    await expect(
      executeFujiPaidRequestWithRetry(
        paidFetch,
        "http://127.0.0.1:3001/paid",
        3,
        () => Promise.resolve(),
      ),
    ).rejects.toMatchObject<Partial<PaidResourceError>>({
      status: 503,
      settled: true,
    });
    expect(paidFetch).toHaveBeenCalledTimes(1);
  });

  it.each(["invalid_exact_evm_payload", "insufficient_balance"])(
    "surfaces facilitator failure %s without marking it paid",
    async (errorReason) => {
      const settlement = {
        success: false,
        errorReason,
        transaction: "",
        network: "eip155:43113" as const,
      };
      const paidFetch = vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ status: "payment required" }), {
            status: 402,
            headers: {
              "content-type": "application/json",
              "payment-response": encodePaymentResponseHeader(settlement),
            },
          }),
        ),
      );

      await expect(
        executeFujiPaidRequestWithRetry(
          paidFetch,
          "http://127.0.0.1:3001/paid",
          3,
          () => Promise.resolve(),
        ),
      ).rejects.toMatchObject<Partial<PaidResourceError>>({
        message: `Paid resource returned HTTP 402: ${errorReason}`,
        status: 402,
        settled: false,
        settlement,
      });
      expect(paidFetch).toHaveBeenCalledTimes(1);
    },
  );
});
