import { describe, expect, it } from "vitest";

import {
  AVALANCHE_FUJI,
  createFujiPaymentRequirements,
  isAllowedFujiPayment,
} from "./index.js";

const VALID_TEST_ADDRESS = "0x1111111111111111111111111111111111111111";

describe("Avalanche Fuji x402 configuration", () => {
  it("pins the official Fuji network and test USDC identifiers", () => {
    expect(AVALANCHE_FUJI).toEqual({
      label: "Avalanche Fuji Testnet",
      network: "eip155:43113",
      chainId: 43_113,
      rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
      explorerUrl: "https://testnet.snowtrace.io",
      usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
      facilitatorUrl: "https://facilitator.ultravioletadao.xyz",
    });
  });

  it("creates a bounded testnet-only payment requirement", () => {
    expect(createFujiPaymentRequirements(VALID_TEST_ADDRESS)).toEqual({
      scheme: "exact",
      network: "eip155:43113",
      payTo: VALID_TEST_ADDRESS,
      price: {
        asset: "0x5425890298aed601595a70AB815c96711a31Bc65",
        amount: "10000",
        extra: { name: "USD Coin", version: "2" },
      },
      maxTimeoutSeconds: 60,
    });
  });

  it.each(["", "not-an-address", "0x1234"])(
    "fails closed for an invalid recipient: %s",
    (payTo) => {
      expect(() => createFujiPaymentRequirements(payTo)).toThrow(
        "X402_PAY_TO_ADDRESS",
      );
    },
  );

  it("allows only the expected recipient, Fuji test USDC and bounded amount", () => {
    const allowed = {
      scheme: "exact",
      network: AVALANCHE_FUJI.network,
      asset: AVALANCHE_FUJI.usdcAddress,
      amount: "10000",
      payTo: VALID_TEST_ADDRESS,
      maxTimeoutSeconds: 60,
      extra: {},
    };

    expect(isAllowedFujiPayment(allowed, VALID_TEST_ADDRESS)).toBe(true);
    expect(
      isAllowedFujiPayment(
        { ...allowed, network: "eip155:43114" },
        VALID_TEST_ADDRESS,
      ),
    ).toBe(false);
    expect(
      isAllowedFujiPayment({ ...allowed, amount: "10001" }, VALID_TEST_ADDRESS),
    ).toBe(false);
    expect(
      isAllowedFujiPayment(
        { ...allowed, payTo: "0x2222222222222222222222222222222222222222" },
        VALID_TEST_ADDRESS,
      ),
    ).toBe(false);
  });
});
