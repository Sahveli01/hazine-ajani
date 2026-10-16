import { describe, expect, it } from "vitest";

import { validAnalysisReport } from "./test-fixtures/analysis-report.js";
import { buildOfferInspectorView } from "./offer-inspector-model.js";

function render(decision: "ACCEPT" | "ASK" | "REJECT") {
  const report = validAnalysisReport();
  return buildOfferInspectorView({
    ...report,
    decision,
    reasonCodes:
      decision === "ACCEPT"
        ? ["POLICY_CHECKS_PASSED"]
        : decision === "ASK"
          ? ["WRITE_REQUIRES_CONFIRMATION"]
          : ["PREMIUM_BELOW_MARKET_BAND"],
  });
}

describe("offer inspector", () => {
  it.each(["ACCEPT", "ASK", "REJECT"] as const)(
    "makes the deterministic %s decision and its reason visible",
    (decision) => {
      const view = render(decision);
      expect(view.decision).toBe(decision);
      expect(view.reason).toBe(
        decision === "ACCEPT"
          ? "Politika kontrolleri geçti"
          : decision === "ASK"
            ? "Açık kullanıcı onayı gerekiyor"
            : "Prim, piyasa bandının altında",
      );
      expect(view.nextStep).toBe(
        decision === "ACCEPT"
          ? "Koşulları gözden geçir"
          : decision === "ASK"
            ? "Politika koşulunu incele"
            : undefined,
      );
    },
  );

  it("shows live offer, executable proxy evidence and the parsed policy", () => {
    const view = render("REJECT");
    expect(view).toMatchObject({
      dcdProductId: "BTC-USDT-261017-82000-P",
      optionInstrumentId: "BTC-USD-261017-82000-P",
      policyVersion: "1.0.0",
      blocksValuation: false,
      expiresAt: "2026-10-16T10:01:00.000Z",
    });
  });

  it("blocks valuation language when market data is insufficient", () => {
    const report = validAnalysisReport();
    const view = buildOfferInspectorView({
      ...report,
      dataQuality: {
        ...report.dataQuality,
        status: "INSUFFICIENT",
        liquidity: "EMPTY",
      },
      decision: "REJECT",
      reasonCodes: ["INSUFFICIENT_MARKET_DATA"],
    });
    expect(view.blocksValuation).toBe(true);
  });
});
