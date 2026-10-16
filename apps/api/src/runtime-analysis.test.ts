import { describe, expect, it } from "vitest";

import { createRuntimeAnalysis } from "./runtime-analysis.js";

const request = {
  policy: {
    policyVersion: "1.0.0",
    maxAllocationRatio: { value: "0.25", scale: 2 },
    minimumLiquidReserveRatio: { value: "0.50", scale: 2 },
    maxRiskNeutralConversionProbability: { value: "0.50", scale: 2 },
    maxStressLossRatio: { value: "0.15", scale: 2 },
    minDataQualityScore: { value: "0.50", scale: 2 },
    minNetEdgeLowerBound: { value: "0", scale: 0 },
    allowedSettlementCurrencies: ["BTC", "USDT"],
  },
  portfolio: {
    totalValue: { value: "10000", currency: "USDT", scale: 0 },
    liquidValue: { value: "9000", currency: "USDT", scale: 0 },
    proposedInvestment: { value: "1000", currency: "USDT", scale: 0 },
  },
  investmentAmount: { value: "1000", currency: "USDT", scale: 0 },
  optionFeeRate: { value: "0.0003", scale: 4 },
  proxyPolicy: {
    maxAgeMs: 60000,
    minBidSizeContracts: { value: "0.01", scale: 2 },
    minAskSizeContracts: { value: "0.01", scale: 2 },
    maxStrikeDistance: { value: "1000", currency: "USDT", scale: 0 },
    maxExpiryDistanceMs: 86400000,
    minConfidenceScore: { value: "0.50", scale: 2 },
  },
  downsideMove: { value: "0.10", scale: 2 },
  upsideMove: { value: "0.10", scale: 2 },
  outputScale: 8,
  executionRequested: false,
};

describe("runtime live-analysis configuration", () => {
  it("wires the live reader only when profile and a validated request exist", () => {
    const configured = createRuntimeAnalysis(
      {
        OKX_READ_PROFILE: "readonly-live",
        ANALYSIS_REQUEST_JSON: JSON.stringify(request),
      },
      { transport: { execute: () => Promise.reject(new Error("not called")) } },
    );
    expect(configured).toBeDefined();
    if (!configured) return;
    expect(configured.request).toEqual(request);
    expect(typeof configured.run).toBe("function");
  });

  it("stays explicitly unconfigured when both inputs are absent", () => {
    expect(
      createRuntimeAnalysis(
        {},
        {
          transport: { execute: () => Promise.reject(new Error("not called")) },
        },
      ),
    ).toBeUndefined();
  });

  it("fails startup for partial or write-enabled analysis configuration", () => {
    expect(() =>
      createRuntimeAnalysis({ OKX_READ_PROFILE: "readonly-live" }),
    ).toThrow("ANALYSIS_REQUEST_JSON");
    expect(() =>
      createRuntimeAnalysis({
        OKX_READ_PROFILE: "readonly-live",
        ANALYSIS_REQUEST_JSON: JSON.stringify({
          ...request,
          executionRequested: true,
        }),
      }),
    ).toThrow();
  });
});
