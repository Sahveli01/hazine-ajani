import { describe, expect, it } from "vitest";

import { SettlementGuard } from "./settlement-guard.js";

describe("settlement replay guard", () => {
  it("allows a Fuji transaction to finalize only once", async () => {
    const guard = new SettlementGuard();
    await expect(guard.consume("0xabc", "ana_1", () => Promise.resolve("ok"))).resolves.toBe("ok");
    await expect(guard.consume("0xabc", "ana_2", () => Promise.resolve("bad"))).rejects.toThrow(
      "SETTLEMENT_REPLAY",
    );
  });

  it("releases a claim after failed RPC confirmation", async () => {
    const guard = new SettlementGuard();
    await expect(
      guard.consume("0xdef", "ana_1", async () => Promise.reject(new Error("RPC"))),
    ).rejects.toThrow("RPC");
    await expect(guard.consume("0xdef", "ana_1", () => Promise.resolve("ok"))).resolves.toBe("ok");
  });
});
