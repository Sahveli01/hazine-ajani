import { describe, expect, it } from "vitest";

import {
  ANALYSIS_REPORT_SCHEMA_VERSION,
  analysisReportSchema,
  parseAnalysisReport,
} from "./index.js";

function validReport(): unknown {
  return {
    schemaVersion: "1.0.0",
    analysisId: "ana_01JAF7M6NQJ9XT9WQ8Q6N3T2ZX",
    createdAt: "2026-10-15T18:24:37.000Z",
    expiresAt: "2026-10-15T18:25:07.000Z",
    sourceRegion: "tr",
    sources: [
      {
        kind: "OKX_PRIVATE_DCD",
        reference: "okx-cli:earn/dcd/products",
        observedAt: "2026-10-15T18:24:35.479Z",
      },
      {
        kind: "OKX_PUBLIC_OPTION",
        reference: "okx-cli:market/orderbook",
        observedAt: "2026-10-15T18:24:36.703Z",
      },
    ],
    dcdOffer: {
      productId: "BTC-USDT-261106-79000-P",
      direction: "BUY_LOW",
      underlying: "BTC-USD",
      baseCurrency: "BTC",
      quoteCurrency: "USDT",
      notionalCurrency: "USDT",
      strike: { value: "79000", scale: 0, currency: "USDT" },
      expiryAt: "2026-11-06T08:00:00.000Z",
      quoteAt: "2026-10-15T18:24:35.479Z",
      annualizedYield: { value: "0.2678", scale: 4 },
      termYield: { value: "0.01580509", scale: 8 },
      minSize: { value: "10", scale: 0, currency: "USDT" },
      maxSize: { value: "6000000", scale: 0, currency: "USDT" },
      stepSize: { value: "1", scale: 0, currency: "USDT" },
    },
    marketSnapshot: {
      underlying: "BTC-USD",
      indexPrice: { value: "82002.2", scale: 1, currency: "USD" },
      observedAt: "2026-10-15T18:24:36.574Z",
    },
    optionSnapshot: {
      instrumentId: "BTC-USD-261106-79000-P",
      underlying: "BTC-USD",
      optionType: "PUT",
      settlementCurrency: "BTC",
      contractMultiplier: { value: "0.01", scale: 2 },
      strike: { value: "79000", scale: 0, currency: "USD" },
      expiryAt: "2026-11-06T08:00:00.000Z",
      bid: { value: "0.0195", scale: 4, currency: "BTC" },
      ask: { value: "0.0200", scale: 4, currency: "BTC" },
      bidSize: { value: "6090", scale: 0, unit: "CONTRACT" },
      askSize: { value: "5173", scale: 0, unit: "CONTRACT" },
      markPrice: { value: "0.0196678995968725", scale: 16, currency: "BTC" },
      markVolatility: { value: "0.38083259140351755", scale: 17 },
      delta: { value: "-0.3329985324793777", scale: 16 },
      gamma: { value: "0.00004667476288524289", scale: 20 },
      theta: { value: "-58.009097007114406", scale: 15 },
      vega: { value: "70.62369008097316", scale: 14 },
      observedAt: "2026-10-15T18:24:36.703Z",
    },
    proxyMatch: {
      quality: "EXACT",
      strikeDistance: { value: "0", scale: 0, currency: "USD" },
      expiryDistanceMs: "0",
      settlementComparable: false,
      differences: ["SETTLEMENT_WINDOW", "SETTLEMENT_MECHANISM"],
    },
    valuation: {
      proxyYieldBand: {
        low: { value: "0.01", scale: 2 },
        high: { value: "0.02", scale: 2 },
      },
      simpleEarnOpportunityCost: { status: "UNAVAILABLE" },
      netEdgeBand: {
        low: { value: "-0.0042", scale: 4 },
        high: { value: "0.0058", scale: 4 },
      },
      riskNeutralConversionProbability: { value: "0.31", scale: 2 },
    },
    stressScenarios: [
      {
        id: "DOWN_20",
        label: "BTC -20%",
        underlyingPrice: { value: "65601.76", scale: 2, currency: "USD" },
        settlementCurrency: "BTC",
        portfolioValue: { value: "8100", scale: 0, currency: "USDT" },
        lossRatio: { value: "-0.19", scale: 2 },
      },
    ],
    riskPolicy: {
      policyVersion: "1.0.0",
      maxAllocationRatio: { value: "0.25", scale: 2 },
      minimumLiquidReserveRatio: { value: "0.50", scale: 2 },
      maxRiskNeutralConversionProbability: { value: "0.35", scale: 2 },
      maxStressLossRatio: { value: "0.20", scale: 2 },
      minDataQualityScore: { value: "0.80", scale: 2 },
    },
    dataQuality: {
      status: "SUFFICIENT",
      score: { value: "0.96", scale: 2 },
      freshness: "FRESH",
      liquidity: "TWO_SIDED",
      proxyQuality: "EXACT",
    },
    decision: "ASK",
    reasonCodes: ["WRITE_REQUIRES_CONFIRMATION"],
    explanation:
      "Teklif piyasa bandında; işlem için açık kullanıcı onayı gerekiyor.",
    execution: { status: "AWAITING_CONFIRMATION" },
  };
}

describe("canonical financial domain contracts", () => {
  it("parses a complete current AnalysisReport", () => {
    expect(ANALYSIS_REPORT_SCHEMA_VERSION).toBe("1.0.0");
    expect(parseAnalysisReport(validReport())).toEqual(
      analysisReportSchema.parse(validReport()),
    );
  });

  it("rejects unknown fields that could leak account secrets", () => {
    expect(() =>
      parseAnalysisReport({
        ...(validReport() as Record<string, unknown>),
        apiKey: "must-never-enter-the-domain-report",
      }),
    ).toThrow();
  });

  it("rejects missing source timestamps", () => {
    const report = validReport() as Record<string, unknown>;
    const [source] = report.sources as Array<Record<string, unknown>>;
    delete source!.observedAt;

    expect(() => parseAnalysisReport(report)).toThrow();
  });

  it("rejects binary floating-point numbers in decimal fields", () => {
    const report = validReport() as Record<string, unknown>;
    const offer = report.dcdOffer as Record<string, unknown>;
    offer.annualizedYield = { value: 0.2678, scale: 4 };

    expect(() => parseAnalysisReport(report)).toThrow();
  });

  it("compares decimal bands without losing integer precision", () => {
    const report = validReport() as Record<string, unknown>;
    const valuation = report.valuation as Record<string, unknown>;
    valuation.proxyYieldBand = {
      low: { value: "9007199254740993", scale: 0 },
      high: { value: "9007199254740992", scale: 0 },
    };

    expect(() => parseAnalysisReport(report)).toThrow();
  });

  it("enforces declared scale on currency amounts", () => {
    const report = validReport() as Record<string, unknown>;
    const offer = report.dcdOffer as Record<string, unknown>;
    offer.strike = { value: "79000.12", scale: 0, currency: "USDT" };

    expect(() => parseAnalysisReport(report)).toThrow();
  });

  it("rejects timestamps without a timezone", () => {
    const report = validReport() as Record<string, unknown>;
    report.createdAt = "2026-10-15T18:24:37";

    expect(() => parseAnalysisReport(report)).toThrow();
  });

  it("rejects unsupported schema versions", () => {
    const report = validReport() as Record<string, unknown>;
    report.schemaVersion = "2.0.0";

    expect(() => parseAnalysisReport(report)).toThrow();
  });

  it("rejects invalid execution states", () => {
    const report = validReport() as Record<string, unknown>;
    report.execution = { status: "AUTO_EXECUTED" };

    expect(() => parseAnalysisReport(report)).toThrow();
  });

  it("requires a complete x402 receipt when payment is present", () => {
    const report = validReport() as Record<string, unknown>;
    report.x402Payment = {
      network: "eip155:43113",
      testnet: true,
      token: "USDC",
    };

    expect(() => parseAnalysisReport(report)).toThrow();
  });
});
