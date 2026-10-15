import type { DcdOffer, OptionSnapshot } from "@hazine-ajani/report-schema";
import { describe, expect, it } from "vitest";

import { selectOptionProxy } from "./index.js";

const offer: DcdOffer = {
  productId: "BTC-USDT-261106-79000-P",
  direction: "BUY_LOW",
  underlying: "BTC-USD",
  baseCurrency: "BTC",
  quoteCurrency: "USDT",
  notionalCurrency: "USDT",
  strike: { value: "79000", scale: 2, currency: "USDT" },
  expiryAt: "2026-11-06T08:00:00.000Z",
  quoteAt: "2026-10-15T18:24:35.479Z",
  annualizedYield: { value: "0.2678", scale: 4 },
  termYield: { value: "0.01580509", scale: 8 },
  minSize: { value: "10", scale: 2, currency: "USDT" },
  maxSize: { value: "6000000", scale: 2, currency: "USDT" },
  stepSize: { value: "1", scale: 2, currency: "USDT" },
};

const exactOption: OptionSnapshot = {
  instrumentId: "BTC-USD-261106-79000-P",
  underlying: "BTC-USD",
  optionType: "PUT",
  settlementCurrency: "BTC",
  contractMultiplier: { value: "0.01", scale: 2 },
  strike: { value: "79000", scale: 2, currency: "USD" },
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
};

const policy = {
  maxAgeMs: 30_000,
  minBidSizeContracts: { value: "10", scale: 0 },
  minAskSizeContracts: { value: "10", scale: 0 },
  maxStrikeDistance: { value: "1000", scale: 2, currency: "USDT" },
  maxExpiryDistanceMs: 2 * 24 * 60 * 60 * 1_000,
  minConfidenceScore: { value: "0.50", scale: 2 },
} as const;

const nowAt = "2026-10-15T18:24:40.000Z";

function option(overrides: Partial<OptionSnapshot>): OptionSnapshot {
  return { ...exactOption, ...overrides };
}

describe("auditable option proxy selection", () => {
  it("selects the A4 exact live-shaped option with high confidence", () => {
    const result = selectOptionProxy({
      offer,
      candidates: [exactOption],
      policy,
      nowAt,
    });

    expect(result.matched).toBe(true);
    if (!result.matched) throw new Error("expected a proxy match");
    expect(result.selected.instrumentId).toBe("BTC-USD-261106-79000-P");
    expect(result.proxyMatch).toEqual({
      quality: "EXACT",
      strikeDistance: { value: "0", scale: 2, currency: "USDT" },
      expiryDistanceMs: "0",
      settlementComparable: true,
      differences: [
        "SETTLEMENT_WINDOW",
        "SETTLEMENT_MECHANISM",
        "EARLY_REDEMPTION",
        "COUNTERPARTY",
      ],
    });
    expect(result.confidence.level).toBe("HIGH");
    expect(Number(result.confidence.score.value)).toBeGreaterThanOrEqual(0.9);
    expect(result.trace).toEqual([
      expect.objectContaining({
        instrumentId: exactOption.instrumentId,
        status: "SELECTED",
        reasons: [],
      }),
    ]);
  });

  it("ranks near candidates by explicit strike, expiry, freshness and liquidity score", () => {
    const exactExpiryNearStrike = option({
      instrumentId: "BTC-USD-261106-79200-P",
      strike: { value: "79200", scale: 2, currency: "USD" },
    });
    const exactStrikeNearExpiry = option({
      instrumentId: "BTC-USD-261107-79000-P",
      expiryAt: "2026-11-07T08:00:00.000Z",
    });

    const result = selectOptionProxy({
      offer,
      candidates: [exactStrikeNearExpiry, exactExpiryNearStrike],
      policy,
      nowAt,
    });

    expect(result.matched).toBe(true);
    if (!result.matched) throw new Error("expected a proxy match");
    expect(result.selected.instrumentId).toBe(
      exactExpiryNearStrike.instrumentId,
    );
    expect(result.proxyMatch.quality).toBe("NEAR");
    expect(result.proxyMatch.strikeDistance.value).toBe("200");
    expect(result.proxyMatch.differences).toContain("STRIKE");
    expect(result.trace.map(({ status }) => status).sort()).toEqual([
      "REJECTED",
      "SELECTED",
    ]);
    expect(
      result.trace.find(
        ({ instrumentId }) =>
          instrumentId === exactStrikeNearExpiry.instrumentId,
      )?.reasons,
    ).toContain("LOWER_RANK");
  });

  it("hard-rejects wrong direction, underlying and settlement currency", () => {
    const result = selectOptionProxy({
      offer,
      candidates: [
        option({ instrumentId: "call", optionType: "CALL" }),
        option({ instrumentId: "wrong-underlying", underlying: "ETH-USD" }),
        option({
          instrumentId: "wrong-settlement",
          settlementCurrency: "USDT",
        }),
      ],
      policy,
      nowAt,
    });

    expect(result.matched).toBe(false);
    expect(result.proxyMatch.quality).toBe("NONE");
    expect("selected" in result).toBe(false);
    expect(result.trace).toEqual([
      expect.objectContaining({
        instrumentId: "call",
        reasons: ["DIRECTION_MISMATCH"],
      }),
      expect.objectContaining({
        instrumentId: "wrong-underlying",
        reasons: ["UNDERLYING_MISMATCH"],
      }),
      expect.objectContaining({
        instrumentId: "wrong-settlement",
        reasons: ["SETTLEMENT_CURRENCY_MISMATCH"],
      }),
    ]);
  });

  it("rejects stale, empty, crossed and illiquid markets", () => {
    const result = selectOptionProxy({
      offer,
      candidates: [
        option({
          instrumentId: "stale",
          observedAt: "2026-10-15T18:23:00.000Z",
        }),
        option({
          instrumentId: "empty",
          bid: { value: "0", scale: 4, currency: "BTC" },
        }),
        option({
          instrumentId: "crossed",
          bid: { value: "0.021", scale: 4, currency: "BTC" },
        }),
        option({
          instrumentId: "illiquid",
          bidSize: { value: "9", scale: 0, unit: "CONTRACT" },
        }),
      ],
      policy,
      nowAt,
    });

    expect(result.matched).toBe(false);
    expect(result.trace.map(({ reasons }) => reasons[0])).toEqual([
      "STALE_QUOTE",
      "EMPTY_BOOK",
      "CROSSED_BOOK",
      "INSUFFICIENT_LIQUIDITY",
    ]);
  });

  it("rejects a fresh option when the DCD quote itself is stale", () => {
    const result = selectOptionProxy({
      offer: { ...offer, quoteAt: "2026-10-15T18:23:00.000Z" },
      candidates: [exactOption],
      policy,
      nowAt,
    });

    expect(result.matched).toBe(false);
    expect(result.trace[0]).toMatchObject({
      instrumentId: exactOption.instrumentId,
      reasons: ["STALE_QUOTE"],
    });
  });

  it("rejects candidates outside distance or minimum-confidence limits without a premium fallback", () => {
    const result = selectOptionProxy({
      offer,
      candidates: [
        option({
          instrumentId: "far-strike",
          strike: { value: "81001", scale: 2, currency: "USD" },
        }),
        option({
          instrumentId: "far-expiry",
          expiryAt: "2026-11-10T08:00:00.000Z",
        }),
        option({
          instrumentId: "low-confidence",
          strike: { value: "79900", scale: 2, currency: "USD" },
          expiryAt: "2026-11-07T20:00:00.000Z",
          observedAt: "2026-10-15T18:24:11.000Z",
          bidSize: { value: "10", scale: 0, unit: "CONTRACT" },
          askSize: { value: "10", scale: 0, unit: "CONTRACT" },
        }),
      ],
      policy,
      nowAt,
    });

    expect(result.matched).toBe(false);
    expect(result.trace[0]?.reasons).toContain("STRIKE_DISTANCE_EXCEEDED");
    expect(result.trace[1]?.reasons).toContain("EXPIRY_DISTANCE_EXCEEDED");
    expect(result.trace[2]?.reasons).toContain("BELOW_MINIMUM_CONFIDENCE");
    expect("selected" in result).toBe(false);
    expect("premium" in result).toBe(false);
  });
});
