import { describe, expect, it } from "vitest";

import {
  parseAnalysisReport,
  type AnalysisReport,
} from "@hazine-ajani/report-schema";

import { createExecutionAuthorizationMachine } from "./execution-authorization.js";

const nowAt = "2026-10-16T10:00:00.000Z";
const amount = { value: "100", scale: 0, currency: "USDT" };

function report(
  decision: AnalysisReport["decision"] = "ACCEPT",
): AnalysisReport {
  return parseAnalysisReport({
    schemaVersion: "1.0.0",
    analysisId: "ana_1234567890abcdef",
    createdAt: nowAt,
    expiresAt: "2026-10-16T10:02:00.000Z",
    sourceRegion: "tr",
    sources: [
      {
        kind: "OKX_PRIVATE_DCD",
        reference: "earn dcd products",
        observedAt: nowAt,
      },
    ],
    dcdOffer: {
      productId: "BTC-USDT-261017-82000-P",
      direction: "BUY_LOW",
      underlying: "BTC-USD",
      baseCurrency: "BTC",
      quoteCurrency: "USDT",
      notionalCurrency: "USDT",
      strike: { value: "82000", scale: 0, currency: "USDT" },
      expiryAt: "2026-10-17T08:00:00.000Z",
      quoteAt: nowAt,
      annualizedYield: { value: "0.0745", scale: 4 },
      termYield: { value: "0.00449156", scale: 8 },
      minSize: { value: "10", scale: 0, currency: "USDT" },
      maxSize: { value: "10000", scale: 0, currency: "USDT" },
      stepSize: { value: "1", scale: 0, currency: "USDT" },
    },
    marketSnapshot: {
      underlying: "BTC-USD",
      indexPrice: { value: "82392.5", scale: 1, currency: "USDT" },
      observedAt: nowAt,
    },
    optionSnapshot: {
      instrumentId: "BTC-USD-261017-82000-P",
      underlying: "BTC-USD",
      optionType: "PUT",
      settlementCurrency: "BTC",
      contractMultiplier: { value: "0.01", scale: 2 },
      strike: { value: "82000", scale: 0, currency: "USDT" },
      expiryAt: "2026-10-17T08:00:00.000Z",
      bid: { value: "0.0055", scale: 4, currency: "BTC" },
      ask: { value: "0.006", scale: 3, currency: "BTC" },
      bidSize: { value: "10", scale: 0, unit: "CONTRACT" },
      askSize: { value: "10", scale: 0, unit: "CONTRACT" },
      markPrice: { value: "0.00575", scale: 5, currency: "BTC" },
      markVolatility: { value: "0.318034", scale: 6 },
      delta: { value: "-0.45", scale: 2 },
      gamma: { value: "0.01", scale: 2 },
      theta: { value: "-0.01", scale: 2 },
      vega: { value: "0.1", scale: 1 },
      observedAt: nowAt,
    },
    proxyMatch: {
      quality: "EXACT",
      strikeDistance: { value: "0", scale: 0, currency: "USDT" },
      expiryDistanceMs: "0",
      settlementComparable: false,
      differences: ["SETTLEMENT_WINDOW", "EARLY_REDEMPTION"],
    },
    valuation: {
      proxyYieldBand: {
        low: { value: "0.003", scale: 3 },
        high: { value: "0.004", scale: 3 },
      },
      simpleEarnOpportunityCost: {
        status: "AVAILABLE",
        value: { value: "0.001", scale: 3 },
      },
      netEdgeBand: {
        low: { value: "0.0004", scale: 4 },
        high: { value: "0.0014", scale: 4 },
      },
      riskNeutralConversionProbability: { value: "0.3", scale: 1 },
    },
    stressScenarios: [
      {
        id: "DOWNSIDE_10_PERCENT",
        label: "Downside",
        underlyingPrice: { value: "74153.25", scale: 2, currency: "USDT" },
        settlementCurrency: "BTC",
        portfolioValue: { value: "900", scale: 0, currency: "USDT" },
        lossRatio: { value: "0.1", scale: 1 },
      },
    ],
    riskPolicy: {
      policyVersion: "1.0.0",
      maxAllocationRatio: { value: "0.5", scale: 1 },
      minimumLiquidReserveRatio: { value: "0.2", scale: 1 },
      maxRiskNeutralConversionProbability: { value: "0.5", scale: 1 },
      maxStressLossRatio: { value: "0.2", scale: 1 },
      minDataQualityScore: { value: "0.5", scale: 1 },
      minNetEdgeLowerBound: { value: "0", scale: 0 },
      allowedSettlementCurrencies: ["BTC", "USDT"],
    },
    dataQuality: {
      status: "SUFFICIENT",
      score: { value: "0.9", scale: 1 },
      freshness: "FRESH",
      liquidity: "TWO_SIDED",
      proxyQuality: "EXACT",
    },
    decision,
    reasonCodes:
      decision === "ACCEPT"
        ? ["POLICY_CHECKS_PASSED"]
        : ["PREMIUM_BELOW_MARKET_BAND"],
    explanation: "Deterministic result.",
    execution: { status: "NOT_REQUESTED" },
  });
}

function machine(clock = () => new Date(nowAt)) {
  return createExecutionAuthorizationMachine({
    now: clock,
    id: () => "confirm_1234567890abcdef",
    ttlMs: 60_000,
  });
}

describe("execution authorization state machine", () => {
  it("prepares a live, short-lived review summary only for ACCEPT", () => {
    const state = machine();
    expect(state.prepare(report("REJECT"), amount)).toEqual({
      status: "NOT_ELIGIBLE",
      reason: "ANALYSIS_NOT_ACCEPTED",
    });
    expect(state.prepare(report(), amount)).toMatchObject({
      status: "AWAITING_CONFIRMATION",
      confirmation: {
        confirmationId: "confirm_1234567890abcdef",
        analysisId: "ana_1234567890abcdef",
        productId: "BTC-USDT-261017-82000-P",
        amount,
        quoteExpiresAt: "2026-10-16T10:01:00.000Z",
        live: true,
        settlementScenarios: [
          { id: "DOWNSIDE_10_PERCENT", settlementCurrency: "BTC" },
        ],
        mainRisks: [
          "CONVERSION_RISK",
          "NO_SECONDARY_MARKET_EXIT",
          "PROXY_BASIS_RISK",
        ],
      },
    });
  });

  it("rejects an expired analysis or a mismatched notional currency before review", () => {
    const expired = machine(() => new Date("2026-10-16T10:02:00.001Z"));
    expect(expired.prepare(report(), amount)).toEqual({
      status: "NOT_ELIGIBLE",
      reason: "ANALYSIS_EXPIRED",
    });
    expect(machine().prepare(report(), { ...amount, currency: "BTC" })).toEqual(
      {
        status: "NOT_ELIGIBLE",
        reason: "AMOUNT_CURRENCY_MISMATCH",
      },
    );
  });

  it("never invokes the writer before a fresh explicit confirmation", async () => {
    const state = machine();
    let calls = 0;
    const writer = {
      submit: () => {
        calls += 1;
        return Promise.resolve({ submissionId: "ord_1" });
      },
    };
    expect(await state.confirmAndExecute("missing", writer)).toEqual({
      status: "NOT_FOUND",
    });
    expect(calls).toBe(0);
  });

  it("consumes one confirmation once and blocks double submit", async () => {
    const state = machine();
    state.prepare(report(), amount);
    let calls = 0;
    const writer = {
      submit: () => {
        calls += 1;
        return Promise.resolve({ submissionId: "ord_1" });
      },
    };
    await expect(
      state.confirmAndExecute("confirm_1234567890abcdef", writer),
    ).resolves.toEqual({ status: "SUBMITTED", submissionId: "ord_1" });
    await expect(
      state.confirmAndExecute("confirm_1234567890abcdef", writer),
    ).resolves.toEqual({ status: "ALREADY_CONSUMED" });
    expect(calls).toBe(1);
  });

  it("treats rejection as a non-error terminal state", async () => {
    const state = machine();
    state.prepare(report(), amount);
    expect(state.reject("confirm_1234567890abcdef")).toEqual({
      status: "REJECTED_BY_USER",
      rejectedAt: nowAt,
    });
    let calls = 0;
    const result = await state.confirmAndExecute("confirm_1234567890abcdef", {
      submit: () => {
        calls += 1;
        return Promise.resolve({ submissionId: "never" });
      },
    });
    expect(result).toEqual({ status: "REJECTED_BY_USER" });
    expect(calls).toBe(0);
  });

  it("requires reanalysis after expiry and reconciliation after network uncertainty", async () => {
    let current = new Date(nowAt);
    const state = machine(() => current);
    state.prepare(report(), amount);
    current = new Date("2026-10-16T10:01:00.001Z");
    let calls = 0;
    expect(
      await state.confirmAndExecute("confirm_1234567890abcdef", {
        submit: () => {
          calls += 1;
          return Promise.resolve({ submissionId: "never" });
        },
      }),
    ).toEqual({ status: "EXPIRED_REANALYSIS_REQUIRED" });
    expect(calls).toBe(0);

    current = new Date(nowAt);
    const uncertain = machine(() => current);
    uncertain.prepare(report(), amount);
    const writer = {
      submit: () => {
        calls += 1;
        return Promise.reject(new Error("timeout"));
      },
    };
    await expect(
      uncertain.confirmAndExecute("confirm_1234567890abcdef", writer),
    ).resolves.toEqual({
      status: "SUBMISSION_UNKNOWN",
      reconciliationRequired: true,
    });
    await expect(
      uncertain.confirmAndExecute("confirm_1234567890abcdef", writer),
    ).resolves.toEqual({ status: "RECONCILIATION_REQUIRED" });
    expect(calls).toBe(1);
  });
});
