import { describe, expect, it } from "vitest";

import { assessOptionProxySnapshot } from "./index.js";

const NOW = 1_792_088_600_000;
const validSnapshot = {
  targetStrike: 79_000,
  targetExpiryMs: 1_793_952_000_000,
  instrument: {
    instId: "BTC-USD-261106-79000-P",
    strike: 79_000,
    expiryMs: 1_793_952_000_000,
    optionType: "P" as const,
  },
  book: {
    bid: 0.0195,
    ask: 0.02,
    timestampMs: NOW - 2_000,
  },
  greeks: {
    markVol: 0.3811,
    delta: -0.3325,
    timestampMs: NOW - 4_000,
  },
  index: {
    price: 82_029.2,
    timestampMs: NOW - 6_000,
  },
  nowMs: NOW,
  maxAgeMs: 30_000,
};

describe("option proxy snapshot quality gate", () => {
  it("accepts a fresh exact-match proxy with two-sided liquidity", () => {
    expect(assessOptionProxySnapshot(validSnapshot)).toEqual({
      usable: true,
      match: "exact",
      strikeDistance: 0,
      expiryDistanceMs: 0,
    });
  });

  it.each([
    ["empty bid", { book: { ...validSnapshot.book, bid: 0 } }, "EMPTY_BOOK"],
    [
      "crossed book",
      { book: { ...validSnapshot.book, bid: 0.0205 } },
      "CROSSED_BOOK",
    ],
    [
      "stale quote",
      { book: { ...validSnapshot.book, timestampMs: NOW - 30_001 } },
      "STALE_QUOTE",
    ],
    ["missing Greeks", { greeks: undefined }, "MISSING_GREEKS"],
  ])("rejects %s", (_label, override, reason) => {
    expect(
      assessOptionProxySnapshot({ ...validSnapshot, ...override }),
    ).toEqual({ usable: false, reason });
  });
});
