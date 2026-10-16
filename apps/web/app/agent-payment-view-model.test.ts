import { describe, expect, it } from "vitest";

import { validAnalysisReport } from "./test-fixtures/analysis-report.js";
import {
  agentPaymentView,
  agentPaymentStateFromReport,
  type AgentPaymentState,
} from "./agent-payment-view-model.js";

describe("agent payment lifecycle view", () => {
  it.each([
    ["IDLE", "Ödeme isteği hazır"],
    ["AWAITING_SIGNATURE", "Cüzdan onayı bekleniyor"],
    ["USER_REJECTED", "İstek iptal edildi"],
    ["WRONG_CHAIN", "Fuji ağına geç"],
    ["INSUFFICIENT_BALANCE", "Test bakiyesi yetersiz"],
    ["SUBMITTED", "İşlem gönderildi"],
    ["PENDING", "Fuji onayı bekleniyor"],
    ["CONFIRMED", "Ücretli rapor doğrulandı"],
    ["FACILITATOR_ERROR", "Ödeme servisine ulaşılamadı"],
    ["REVERTED", "Testnet işlemi geri döndü"],
  ] as const)("maps %s to plain Turkish copy", (status, title) => {
    expect(agentPaymentView({ status } as AgentPaymentState)).toMatchObject({
      title,
    });
  });

  it("derives confirmed state only from a canonical RPC-confirmed receipt", () => {
    const report = validAnalysisReport();
    const paid = {
      ...report,
      x402Payment: {
        network: "eip155:43113",
        chainId: 43113,
        testnet: true,
        token: "USDC",
        amount: { value: "0.01", scale: 6, currency: "USDC" },
        payer: "0x65e257B601b9545a6575801B967C527B35E2720d",
        payTo: "0x9a2b5BdFd3CA23456957882695Bbf81510430853",
        transactionHash:
          "0x101a0e12ef4cf2f8ca25c7aa2bc014ac3119a32db648bd9ff2306abf93403ce1",
        explorerUrl:
          "https://testnet.snowtrace.io/tx/0x101a0e12ef4cf2f8ca25c7aa2bc014ac3119a32db648bd9ff2306abf93403ce1",
        confirmedAt: "2026-10-16T14:23:56.000Z",
      },
    };
    expect(agentPaymentStateFromReport(paid)).toMatchObject({
      status: "CONFIRMED",
      reportId: report.analysisId,
      transactionHash: paid.x402Payment.transactionHash,
      explorerUrl: paid.x402Payment.explorerUrl,
    });
    expect(agentPaymentStateFromReport(report)).toEqual({ status: "IDLE" });
  });

  it("never presents user rejection as an error or retryable payment", () => {
    expect(agentPaymentView({ status: "USER_REJECTED" })).toMatchObject({
      tone: "neutral",
      canRetry: false,
    });
  });
});
