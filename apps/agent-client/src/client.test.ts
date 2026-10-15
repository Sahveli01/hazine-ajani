import { describe, expect, it } from "vitest";

import { createFujiPaidFetch } from "./index.js";

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
});
