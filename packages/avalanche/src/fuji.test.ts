import { describe, expect, it } from "vitest";

import {
  AVALANCHE_FUJI,
  assertFujiUsdcDomain,
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
      usdcName: "USD Coin",
      usdcVersion: "2",
      facilitatorUrl: "https://facilitator.payai.network",
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
      extra: { name: "USD Coin", version: "2" },
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
    expect(
      isAllowedFujiPayment(
        { ...allowed, extra: { name: "USDC Coin", version: "2" } },
        VALID_TEST_ADDRESS,
      ),
    ).toBe(false);
  });

  it("fails before signing when live token domain differs from the advertised domain", () => {
    expect(() => assertFujiUsdcDomain("USD Coin", "2")).not.toThrow();
    expect(() => assertFujiUsdcDomain("USDC Coin", "2")).toThrow(
      "Fuji test USDC EIP-712 domain mismatch",
    );
    expect(() => assertFujiUsdcDomain("USD Coin", "1")).toThrow(
      "Fuji test USDC EIP-712 domain mismatch",
    );
  });
});
