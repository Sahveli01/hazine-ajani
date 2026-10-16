import { describe, expect, it } from "vitest";

import { confirmPaidReport } from "./route.js";

describe("paid report server confirmation", () => {
  it("rejects facilitator claims before any RPC call when the network is wrong", async () => {
    let rpcCalled = false;
    const client = {
      getTransactionReceipt() {
        rpcCalled = true;
        return Promise.reject(new Error("unexpected"));
      },
      getBlock() {
        return Promise.reject(new Error("unexpected"));
      },
    };
    await expect(
      confirmPaidReport(
        {
          report: {},
          settlement: {
            success: true,
            network: "eip155:1",
            transaction: `0x${"a".repeat(64)}`,
            payer: "0x65e257B601b9545a6575801B967C527B35E2720d",
          },
          payTo: "0x9a2b5BdFd3CA23456957882695Bbf81510430853",
        },
        "0x9a2b5BdFd3CA23456957882695Bbf81510430853",
        client as never,
      ),
    ).rejects.toThrow("INVALID_SETTLEMENT");
    expect(rpcCalled).toBe(false);
  });
});
