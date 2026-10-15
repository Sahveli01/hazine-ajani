import { describe, expect, it } from "vitest";

import type { DcdOffer, RiskPolicy } from "@hazine-ajani/report-schema";

import { createLiveAnalysisService } from "./analysis-orchestrator.js";

const at = "2026-10-16T10:00:00.000Z";
const expiresAt = "2026-10-16T10:01:00.000Z";
const decimal = (value: string, scale = 4) => ({ value, scale });
const money = (value: string, currency: string, scale = 2) => ({
  value,
  scale,
  currency,
});

const offer: DcdOffer = {
  productId: "BTC-USDT-261017-82000-P",
  direction: "BUY_LOW",
  underlying: "BTC-USD",
  baseCurrency: "BTC",
  quoteCurrency: "USDT",
  notionalCurrency: "USDT",
  strike: money("82000", "USDT", 0),
  expiryAt: "2026-10-17T08:00:00.000Z",
  quoteAt: at,
  annualizedYield: decimal("0.0745"),
  termYield: decimal("0.00449156", 8),
  minSize: money("100", "USDT", 0),
  maxSize: money("10000", "USDT", 0),
  stepSize: money("1", "USDT", 0),
};

const policy: RiskPolicy = {
  policyVersion: "1.0.0",
  maxAllocationRatio: decimal("0.5"),
  minimumLiquidReserveRatio: decimal("0.2"),
  maxRiskNeutralConversionProbability: decimal("0.9"),
  maxStressLossRatio: decimal("0.5"),
  minDataQualityScore: decimal("0.5"),
  minNetEdgeLowerBound: decimal("-1", 4),
  allowedSettlementCurrencies: ["BTC", "USDT"],
};

function snapshot<T>(
  data: T,
  kind:
    | "OKX_PRIVATE_DCD"
    | "OKX_SIMPLE_EARN"
    | "OKX_PUBLIC_INDEX"
    | "OKX_PUBLIC_OPTION",
  reference: string,
) {
  return {
    data,
    source: { kind, reference },
    serverTime: at,
    receivedAt: at,
    expiresAt,
  };
}

function reader() {
  return {
    readDcdProducts: () =>
      Promise.resolve(
        snapshot([offer], "OKX_PRIVATE_DCD", "earn dcd products"),
      ),
    readSimpleEarn: () =>
      Promise.resolve(
        snapshot(
          { currency: "USDT", annualRate: decimal("0.03"), observedAt: at },
          "OKX_SIMPLE_EARN",
          "earn savings rate-history USDT",
        ),
      ),
    readSpotTicker: () =>
      Promise.resolve(
        snapshot(
          {
            instrumentId: "BTC-USDT",
            last: money("82392.5", "USDT", 1),
            bid: money("82392", "USDT", 0),
            ask: money("82393", "USDT", 0),
            observedAt: at,
          },
          "OKX_PUBLIC_INDEX",
          "market ticker BTC-USDT",
        ),
      ),
    readOptionMarket: () =>
      Promise.resolve(
        snapshot(
          {
            option: {
              instrumentId: "BTC-USD-261017-82000-P",
              underlying: "BTC-USD",
              optionType: "PUT" as const,
              settlementCurrency: "BTC",
              contractMultiplier: decimal("0.01", 2),
              strike: money("82000", "USDT", 0),
              expiryAt: "2026-10-17T08:00:00.000Z",
              bid: money("0.0055", "BTC", 4),
              ask: money("0.006", "BTC", 3),
              bidSize: { ...decimal("10", 0), unit: "CONTRACT" as const },
              askSize: { ...decimal("10", 0), unit: "CONTRACT" as const },
              markPrice: money("0.00575", "BTC", 5),
              markVolatility: decimal("0.318034", 6),
              delta: decimal("-0.45"),
              gamma: decimal("0.01"),
              theta: decimal("-0.01"),
              vega: decimal("0.1"),
              observedAt: at,
            },
            market: {
              underlying: "BTC-USD",
              indexPrice: money("82392.5", "USDT", 1),
              observedAt: at,
            },
          },
          "OKX_PUBLIC_OPTION",
          "option BTC-USD-261017-82000-P",
        ),
      ),
  };
}

const request = {
  policy,
  portfolio: {
    totalValue: money("10000", "USDT", 0),
    liquidValue: money("9000", "USDT", 0),
    proposedInvestment: money("1000", "USDT", 0),
  },
  investmentAmount: money("1000", "USDT", 0),
  optionFeeRate: decimal("0.0003"),
  proxyPolicy: {
    maxAgeMs: 60_000,
    minBidSizeContracts: decimal("1", 0),
    minAskSizeContracts: decimal("1", 0),
    maxStrikeDistance: money("1000", "USDT", 0),
    maxExpiryDistanceMs: 86_400_000,
    minConfidenceScore: decimal("0.5"),
  },
  downsideMove: decimal("0.1"),
  upsideMove: decimal("0.1"),
  outputScale: 8,
  executionRequested: false,
};

describe("live analysis orchestration", () => {
  it("builds one canonical report and a linked redacted trace", async () => {
    const service = createLiveAnalysisService({
      reader: reader(),
      now: () => new Date(at),
      id: () => "1234567890abcdef",
    });
    const result = await service.analyze(request);
    expect(result.status).toBe("SUCCESS");
    if (result.status !== "SUCCESS") return;
    expect(result.report.analysisId).toBe("ana_1234567890abcdef");
    expect(result.report.sources.map(({ kind }) => kind)).toEqual([
      "OKX_PRIVATE_DCD",
      "OKX_SIMPLE_EARN",
      "OKX_PUBLIC_INDEX",
      "OKX_PUBLIC_OPTION",
    ]);
    expect(result.trace.correlationId).toBe("cor_1234567890abcdef");
    expect(
      result.trace.events.filter(({ type }) => type === "TOOL_CALL"),
    ).toHaveLength(4);
    expect(result.report.explanation).toContain(
      `Karar: ${result.report.decision}`,
    );
  });

  it("returns a typed failure and never manufactures a partial report", async () => {
    const failing = reader();
    failing.readSpotTicker = () =>
      Promise.reject(
        Object.assign(new Error("network body with secret"), {
          code: "TIMEOUT",
        }),
      );
    const service = createLiveAnalysisService({
      reader: failing,
      now: () => new Date(at),
      id: () => "1234567890abcdef",
    });
    const result = await service.analyze(request);
    expect(result).toMatchObject({
      status: "SOURCE_UNAVAILABLE",
      source: "OKX_SPOT_TICKER",
      errorCode: "TIMEOUT",
    });
    expect(result).not.toHaveProperty("report");
    expect(JSON.stringify(result)).not.toContain("network body with secret");
  });
});
