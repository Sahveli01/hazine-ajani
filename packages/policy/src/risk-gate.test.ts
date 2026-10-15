import type {
  DataQuality,
  DecimalValue,
  Money,
  ProxyMatch,
  StressScenario,
} from "@hazine-ajani/report-schema";
import { describe, expect, it } from "vitest";

import { evaluateRiskGate } from "./risk-gate.js";

const decimal = (value: string, scale = 2): DecimalValue => ({ value, scale });
const money = (value: string): Money => ({ value, scale: 0, currency: "USDT" });

const policy = {
  policyVersion: "1.0.0",
  maxAllocationRatio: decimal("0.25"),
  minimumLiquidReserveRatio: decimal("0.50"),
  maxRiskNeutralConversionProbability: decimal("0.35"),
  maxStressLossRatio: decimal("0.20"),
  minDataQualityScore: decimal("0.80"),
  minNetEdgeLowerBound: decimal("0.00"),
  allowedSettlementCurrencies: ["USDT", "BTC"],
} as const;

const dataQuality: DataQuality = {
  status: "SUFFICIENT",
  score: decimal("0.96"),
  freshness: "FRESH",
  liquidity: "TWO_SIDED",
  proxyQuality: "EXACT",
};

const proxyMatch: ProxyMatch = {
  quality: "EXACT",
  strikeDistance: { value: "0", scale: 0, currency: "USD" },
  expiryDistanceMs: "0",
  settlementComparable: false,
  differences: ["SETTLEMENT_WINDOW", "SETTLEMENT_MECHANISM"],
};

const stressScenarios: StressScenario[] = [
  {
    id: "DOWN_20",
    label: "Downside",
    underlyingPrice: { value: "65600", scale: 0, currency: "USDT" },
    settlementCurrency: "BTC",
    portfolioValue: money("8500"),
    lossRatio: decimal("0.15"),
  },
  {
    id: "FLAT",
    label: "Flat",
    underlyingPrice: { value: "82000", scale: 0, currency: "USDT" },
    settlementCurrency: "USDT",
    portfolioValue: money("10100"),
    lossRatio: decimal("-0.01"),
  },
];

function evaluate(overrides: Record<string, unknown> = {}) {
  return evaluateRiskGate({
    policy,
    valuation: {
      netEdgeBand: { low: decimal("0.01"), high: decimal("0.02") },
      riskNeutralConversionProbability: decimal("0.30"),
    },
    stressScenarios,
    dataQuality,
    proxyMatch,
    portfolio: {
      totalValue: money("10000"),
      liquidValue: money("8000"),
      proposedInvestment: money("2000"),
    },
    regionalProductAvailable: true,
    executionRequested: false,
    ...overrides,
  });
}

describe("evaluateRiskGate", () => {
  it("accepts an analysis that satisfies every exact boundary", () => {
    expect(
      evaluate({
        valuation: {
          netEdgeBand: { low: decimal("0.00"), high: decimal("0.01") },
          riskNeutralConversionProbability: decimal("0.35"),
        },
        stressScenarios: [
          { ...stressScenarios[0]!, lossRatio: decimal("0.20") },
        ],
        dataQuality: { ...dataQuality, score: decimal("0.80") },
        portfolio: {
          totalValue: money("10000"),
          liquidValue: money("7500"),
          proposedInvestment: money("2500"),
        },
      }),
    ).toEqual({ decision: "ACCEPT", reasonCodes: ["POLICY_CHECKS_PASSED"] });
  });

  it("asks for explicit confirmation only after all risk checks pass", () => {
    expect(evaluate({ executionRequested: true })).toEqual({
      decision: "ASK",
      reasonCodes: ["WRITE_REQUIRES_CONFIRMATION"],
    });
  });

  it.each([
    [
      "PREMIUM_BELOW_MARKET_BAND",
      {
        valuation: {
          netEdgeBand: { low: decimal("-0.01"), high: decimal("0.01") },
          riskNeutralConversionProbability: decimal("0.30"),
        },
      },
    ],
    [
      "STRESS_LOSS_EXCEEDS_POLICY",
      {
        stressScenarios: [
          { ...stressScenarios[0]!, lossRatio: decimal("0.21") },
        ],
      },
    ],
    [
      "IMPLIED_CONVERSION_EXCEEDS_POLICY",
      {
        valuation: {
          netEdgeBand: { low: decimal("0.01"), high: decimal("0.02") },
          riskNeutralConversionProbability: decimal("0.36"),
        },
      },
    ],
    [
      "LIQUIDITY_RESERVE_BREACHED",
      {
        portfolio: {
          totalValue: money("10000"),
          liquidValue: money("7000"),
          proposedInvestment: money("2501"),
        },
      },
    ],
    [
      "INSUFFICIENT_MARKET_DATA",
      { dataQuality: { ...dataQuality, score: decimal("0.79") } },
    ],
    ["STALE_QUOTE", { dataQuality: { ...dataQuality, freshness: "STALE" } }],
    ["NO_SUITABLE_PROXY", { proxyMatch: { ...proxyMatch, quality: "NONE" } }],
    ["REGIONAL_PRODUCT_UNAVAILABLE", { regionalProductAvailable: false }],
    [
      "SETTLEMENT_CURRENCY_NOT_ALLOWED",
      { policy: { ...policy, allowedSettlementCurrencies: ["USDT"] } },
    ],
  ] as const)("rejects with %s", (reasonCode, overrides) => {
    const result = evaluate(overrides);
    expect(result.decision).toBe("REJECT");
    expect(result.reasonCodes).toContain(reasonCode);
  });

  it("collects multiple hard failures in stable priority order", () => {
    expect(
      evaluate({
        regionalProductAvailable: false,
        dataQuality: {
          ...dataQuality,
          freshness: "STALE",
          status: "INSUFFICIENT",
        },
        proxyMatch: { ...proxyMatch, quality: "NONE" },
      }),
    ).toEqual({
      decision: "REJECT",
      reasonCodes: [
        "REGIONAL_PRODUCT_UNAVAILABLE",
        "NO_SUITABLE_PROXY",
        "STALE_QUOTE",
        "INSUFFICIENT_MARKET_DATA",
      ],
    });
  });

  it("fails closed for missing, malformed or conflicting policy", () => {
    expect(
      evaluate({ policy: { ...policy, minNetEdgeLowerBound: undefined } }),
    ).toEqual({ decision: "REJECT", reasonCodes: ["INVALID_POLICY"] });
    expect(
      evaluate({ policy: { ...policy, maxAllocationRatio: decimal("1.01") } }),
    ).toEqual({ decision: "REJECT", reasonCodes: ["INVALID_POLICY"] });
    expect(
      evaluate({ policy: { ...policy, allowedSettlementCurrencies: [] } }),
    ).toEqual({ decision: "REJECT", reasonCodes: ["INVALID_POLICY"] });
    expect(
      evaluate({
        policy: { ...policy, minimumLiquidReserveRatio: decimal("0.60") },
        portfolio: {
          totalValue: money("10000"),
          liquidValue: money("8000"),
          proposedInvestment: money("2500"),
        },
      }),
    ).toEqual({
      decision: "REJECT",
      reasonCodes: ["LIQUIDITY_RESERVE_BREACHED"],
    });
  });

  it("separates two real OKX snapshots under one stated tolerance policy", () => {
    const tolerancePolicy = {
      ...policy,
      minNetEdgeLowerBound: decimal("-0.002", 3),
      maxRiskNeutralConversionProbability: decimal("0.50"),
    };
    const a4 = evaluate({
      policy: tolerancePolicy,
      valuation: {
        netEdgeBand: {
          low: decimal("-0.00632515", 8),
          high: decimal("-0.00580615", 8),
        },
        riskNeutralConversionProbability: decimal("0.31"),
      },
    });
    const shortDatedLive = evaluate({
      policy: tolerancePolicy,
      valuation: {
        netEdgeBand: {
          low: decimal("-0.00135", 5),
          high: decimal("-0.00085", 5),
        },
        riskNeutralConversionProbability: decimal("0.41"),
      },
    });
    expect(a4.decision).toBe("REJECT");
    expect(shortDatedLive.decision).toBe("ACCEPT");
  });
});
