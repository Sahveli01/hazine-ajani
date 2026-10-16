import { describe, expect, it, vi } from "vitest";

import {
  ensureFujiNetwork,
  paymentFailureState,
  type Eip1193Provider,
} from "./browser-payment-controller.js";

describe("browser payment controller", () => {
  it("switches an existing wallet network to Avalanche Fuji", async () => {
    const request = vi
      .fn<Eip1193Provider["request"]>()
      .mockResolvedValueOnce("0x1")
      .mockResolvedValueOnce(null);

    await ensureFujiNetwork({ request });

    expect(request).toHaveBeenNthCalledWith(2, {
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xa869" }],
    });
  });

  it("adds Fuji with its real RPC and explorer when the wallet lacks it", async () => {
    const missingChain = Object.assign(new Error("unknown chain"), {
      code: 4902,
    });
    const request = vi
      .fn<Eip1193Provider["request"]>()
      .mockResolvedValueOnce("0x1")
      .mockRejectedValueOnce(missingChain)
      .mockResolvedValueOnce(null);

    await ensureFujiNetwork({ request });

    expect(request).toHaveBeenNthCalledWith(3, {
      method: "wallet_addEthereumChain",
      params: [
        expect.objectContaining({
          chainId: "0xa869",
          rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
          blockExplorerUrls: ["https://testnet.snowtrace.io"],
        }),
      ],
    });
  });

  it("classifies wallet rejection as a calm cancellation", () => {
    expect(paymentFailureState({ code: 4001 })).toEqual({
      status: "USER_REJECTED",
    });
  });

  it("keeps insufficient balance, reverted receipt and facilitator errors distinct", () => {
    expect(paymentFailureState(new Error("insufficient funds"))).toEqual({
      status: "INSUFFICIENT_BALANCE",
    });
    expect(paymentFailureState(new Error("receipt reverted"))).toEqual({
      status: "REVERTED",
    });
    expect(paymentFailureState(new Error("facilitator unavailable"))).toEqual({
      status: "FACILITATOR_ERROR",
    });
  });
});
