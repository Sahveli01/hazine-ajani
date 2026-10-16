import { describe, expect, it, vi } from "vitest";

import { parseAnalysisReport } from "@hazine-ajani/report-schema";
import { validReport } from "../../../packages/report-schema/src/__test-fixtures__/valid-report.js";

import {
  SettlementReplayGuard,
  finalizeFujiPaidReport,
  type FujiSettlementConfirmation,
} from "./paid-report.js";

const PAY_TO = "0x1111111111111111111111111111111111111111";
const PAYER = "0x2222222222222222222222222222222222222222";
const TRANSACTION = `0x${"a".repeat(64)}` as const;
const settlement = {
  success: true as const,
  payer: PAYER,
  transaction: TRANSACTION,
  network: "eip155:43113" as const,
  amount: "10000",
};
const confirmation: FujiSettlementConfirmation = {
  transactionHash: TRANSACTION,
  confirmedAt: "2026-10-16T13:31:13.000Z",
};

describe("confirmed x402 AnalysisReport", () => {
  it("adds a verified Fuji test USDC receipt to the canonical report", async () => {
    const confirmSettlement = vi.fn(() => Promise.resolve(confirmation));

    const report = await finalizeFujiPaidReport({
      body: validReport(),
      settlement,
      expectedPayTo: PAY_TO,
      confirmSettlement,
      replayGuard: new SettlementReplayGuard(),
    });

    expect(parseAnalysisReport(report)).toEqual(report);
    expect(report.x402Payment).toEqual({
      network: "eip155:43113",
      chainId: 43113,
      testnet: true,
      token: "USDC",
      amount: { value: "0.01", scale: 6, currency: "USDC" },
      payer: PAYER,
      payTo: PAY_TO,
      transactionHash: TRANSACTION,
      explorerUrl: `https://testnet.snowtrace.io/tx/${TRANSACTION}`,
      confirmedAt: confirmation.confirmedAt,
    });
    expect(confirmSettlement).toHaveBeenCalledWith({
      transactionHash: TRANSACTION,
      payer: PAYER,
      payTo: PAY_TO,
      amount: 10000n,
    });
  });

  it("accepts an official receipt with omitted optional amount after exact RPC transfer verification", async () => {
    const settlementWithoutAmount = {
      success: settlement.success,
      payer: settlement.payer,
      transaction: settlement.transaction,
      network: settlement.network,
    };

    await expect(
      finalizeFujiPaidReport({
        body: validReport(),
        settlement: settlementWithoutAmount,
        expectedPayTo: PAY_TO,
        confirmSettlement: () => Promise.resolve(confirmation),
        replayGuard: new SettlementReplayGuard(),
      }),
    ).resolves.toMatchObject({
      x402Payment: {
        amount: { value: "0.01", scale: 6, currency: "USDC" },
        transactionHash: TRANSACTION,
      },
    });
  });

  it("never treats an invalid response body as a paid report", async () => {
    const confirmSettlement = vi.fn(() => Promise.resolve(confirmation));

    await expect(
      finalizeFujiPaidReport({
        body: { status: "paid" },
        settlement,
        expectedPayTo: PAY_TO,
        confirmSettlement,
        replayGuard: new SettlementReplayGuard(),
      }),
    ).rejects.toThrow();
    expect(confirmSettlement).not.toHaveBeenCalled();
  });

  it("rejects wrong-chain and unconfirmed settlement evidence", async () => {
    await expect(
      finalizeFujiPaidReport({
        body: validReport(),
        settlement: { ...settlement, network: "eip155:43114" },
        expectedPayTo: PAY_TO,
        confirmSettlement: () => Promise.resolve(confirmation),
        replayGuard: new SettlementReplayGuard(),
      }),
    ).rejects.toThrow("Fuji");

    await expect(
      finalizeFujiPaidReport({
        body: validReport(),
        settlement,
        expectedPayTo: PAY_TO,
        confirmSettlement: () =>
          Promise.reject(new Error("RPC receipt missing")),
        replayGuard: new SettlementReplayGuard(),
      }),
    ).rejects.toThrow("RPC receipt missing");
  });

  it("rejects replay of a transaction already consumed by this client", async () => {
    const replayGuard = new SettlementReplayGuard();
    const input = {
      body: validReport(),
      settlement,
      expectedPayTo: PAY_TO,
      confirmSettlement: () => Promise.resolve(confirmation),
      replayGuard,
    };

    await finalizeFujiPaidReport(input);
    await expect(finalizeFujiPaidReport(input)).rejects.toThrow("replay");
  });
});
