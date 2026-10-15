import {
  stressScenarioSchema,
  valuationSchema,
  type DcdOffer,
  type MarketSnapshot,
  type OptionSnapshot,
} from "@hazine-ajani/report-schema";
import { describe, expect, it } from "vitest";

import {
  PremiumValuationError,
  valueBuyLowOffer,
} from "./premium-valuation.js";

const offer: DcdOffer = {
  productId: "BTC-USDT-20261106-79000",
  direction: "BUY_LOW",
  underlying: "BTC-USD",
  baseCurrency: "BTC",
  quoteCurrency: "USDT",
  notionalCurrency: "USDT",
  strike: { value: "79000", scale: 0, currency: "USDT" },
  expiryAt: "2026-11-06T08:00:00.000Z",
  quoteAt: "2026-10-15T08:00:00.000Z",
  annualizedYield: { value: "0.26227492", scale: 8 },
  termYield: { value: "0.01580509", scale: 8 },
  minSize: { value: "100", scale: 0, currency: "USDT" },
  maxSize: { value: "100000", scale: 0, currency: "USDT" },
  stepSize: { value: "1", scale: 0, currency: "USDT" },
};

const option: OptionSnapshot = {
  instrumentId: "BTC-USD-261106-79000-P",
  underlying: "BTC-USD",
  optionType: "PUT",
  settlementCurrency: "BTC",
  contractMultiplier: { value: "0.01", scale: 2 },
  strike: { value: "79000", scale: 0, currency: "USD" },
  expiryAt: "2026-11-06T08:00:00.000Z",
  bid: { value: "0.0195", scale: 4, currency: "BTC" },
  ask: { value: "0.0200", scale: 4, currency: "BTC" },
  bidSize: { value: "25", scale: 0, unit: "CONTRACT" },
  askSize: { value: "20", scale: 0, unit: "CONTRACT" },
  markPrice: { value: "0.0198", scale: 4, currency: "BTC" },
  markVolatility: { value: "0.54", scale: 2 },
  delta: { value: "-0.35", scale: 2 },
  gamma: { value: "0.00004", scale: 5 },
  theta: { value: "-0.0002", scale: 4 },
  vega: { value: "0.001", scale: 3 },
  observedAt: "2026-10-15T08:00:01.000Z",
};

const market: MarketSnapshot = {
  underlying: "BTC-USD",
  indexPrice: { value: "82002", scale: 0, currency: "USD" },
  observedAt: "2026-10-15T08:00:01.000Z",
};

function value(
  overrides: Partial<Parameters<typeof valueBuyLowOffer>[0]> = {},
) {
  return valueBuyLowOffer({
    offer,
    option,
    market,
    investmentAmount: { value: "10000", scale: 0, currency: "USDT" },
    optionFeeRate: { value: "0.0003", scale: 4 },
    simpleEarnAnnualRate: { value: "0.0279", scale: 4 },
    annualCarryRate: { value: "0.0279", scale: 4 },
    confidenceScore: { value: "0.90", scale: 2 },
    minimumConfidenceScore: { value: "0.70", scale: 2 },
    maxStressLossRatio: { value: "0.10", scale: 2 },
    downsideMove: { value: "0.20", scale: 2 },
    upsideMove: { value: "0.20", scale: 2 },
    outputScale: 8,
    ...overrides,
  });
}

describe("valueBuyLowOffer", () => {
  it("computes a fee-adjusted executable band without using the midpoint", () => {
    const result = value();
    expect(result.valuation.proxyYieldBand).toEqual({
      low: { value: "0.01992960", scale: 8 },
      high: { value: "0.02044860", scale: 8 },
    });
    expect(result.valuation.simpleEarnOpportunityCost).toEqual({
      status: "AVAILABLE",
      value: { value: "0.00168164", scale: 8 },
    });
    expect(result.valuation.netEdgeBand).toEqual({
      low: { value: "-0.00632515", scale: 8 },
      high: { value: "-0.00580615", scale: 8 },
    });
    expect(valuationSchema.safeParse(result.valuation).success).toBe(true);
    expect(
      result.stressScenarios.every(
        (item) => stressScenarioSchema.safeParse(item).success,
      ),
    ).toBe(true);
  });

  it("caps each trading fee at seven percent of that executable premium", () => {
    const result = value({ optionFeeRate: { value: "0.50", scale: 2 } });
    expect(result.valuation.proxyYieldBand.low.value).toBe("0.01882413");
    expect(result.valuation.proxyYieldBand.high.value).toBe("0.01930680");
  });

  it("returns a labeled risk-neutral model probability between zero and one", () => {
    const result = value();
    expect(
      Number(result.valuation.riskNeutralConversionProbability.value),
    ).toBeGreaterThan(0);
    expect(
      Number(result.valuation.riskNeutralConversionProbability.value),
    ).toBeLessThan(1);
    expect(result.probabilityModel.label).toBe("RISK_NEUTRAL_MODEL_ESTIMATE");
    expect(result.probabilityModel.carryRateSource).toBe(
      "OKX_SIMPLE_EARN_PROXY",
    );
  });

  it("produces downside, flat and upside settlement outcomes", () => {
    const result = value();
    expect(result.stressScenarios).toHaveLength(3);
    expect(result.stressScenarios.map((scenario) => scenario.id)).toEqual([
      "DOWNSIDE_20_PERCENT",
      "FLAT",
      "UPSIDE_20_PERCENT",
    ]);
    expect(result.stressScenarios[0]).toMatchObject({
      settlementCurrency: "BTC",
    });
    expect(result.stressScenarios[1]).toMatchObject({
      settlementCurrency: "USDT",
    });
    expect(result.stressScenarios[2]).toMatchObject({
      settlementCurrency: "USDT",
    });
    expect(result.stressPolicyImpacts).toEqual([
      { scenarioId: "DOWNSIDE_20_PERCENT", impact: "EXCEEDS_LIMIT" },
      { scenarioId: "FLAT", impact: "WITHIN_LIMIT" },
      { scenarioId: "UPSIDE_20_PERCENT", impact: "WITHIN_LIMIT" },
    ]);
  });

  it("exposes settlement-basis, early-exit and liquidity limitations", () => {
    expect(value().disclosures.map((item) => item.code)).toEqual([
      "SETTLEMENT_BASIS_MISMATCH",
      "NO_SECONDARY_MARKET_EXIT",
      "ORDER_BOOK_LIQUIDITY",
      "MODEL_PROBABILITY_NOT_FORECAST",
    ]);
  });

  it("fails the confidence gate even when valuation numbers exist", () => {
    const result = value({ confidenceScore: { value: "0.69", scale: 2 } });
    expect(result.valuation.proxyYieldBand.low.value).not.toBe("");
    expect(result.confidenceGate).toEqual({
      safeToUse: false,
      reasonCode: "INSUFFICIENT_MARKET_DATA",
    });
  });

  it("never returns an inverted band across representative books", () => {
    for (const [bid, ask] of [
      ["0.0001", "0.0002"],
      ["0.01", "0.01"],
      ["0.1", "0.5"],
    ] as const) {
      const result = value({
        option: {
          ...option,
          bid: { ...option.bid, value: bid },
          ask: { ...option.ask, value: ask },
        },
      });
      expect(
        Number(result.valuation.proxyYieldBand.low.value),
      ).toBeLessThanOrEqual(Number(result.valuation.proxyYieldBand.high.value));
      expect(
        Number(result.valuation.netEdgeBand.low.value),
      ).toBeLessThanOrEqual(Number(result.valuation.netEdgeBand.high.value));
    }
  });

  it("rejects crossed books and unusable theoretical inputs", () => {
    expect(() =>
      value({ option: { ...option, bid: { ...option.bid, value: "0.03" } } }),
    ).toThrowError(PremiumValuationError);
    expect(() =>
      value({
        option: { ...option, markVolatility: { value: "0", scale: 0 } },
      }),
    ).toThrowError(/volatility/i);
    expect(() =>
      value({ annualCarryRate: { value: "-0.01", scale: 2 } }),
    ).toThrowError(/carry/i);
  });
});
