import { describe, expect, it } from "vitest";

import {
  DcdPricingError,
  annualRateToTermYield,
  settleBuyLow,
  termYieldToAnnualRate,
} from "./index.js";

const tenDayTerm = {
  accrualStartAt: "2026-10-01T08:00:00.000Z",
  expiryAt: "2026-10-11T08:00:00.000Z",
};

describe("DCD Actual/365 yield conversion", () => {
  it("converts annual rate to term yield using exact elapsed time", () => {
    expect(
      annualRateToTermYield({
        annualRate: { value: "0.365", scale: 3 },
        ...tenDayTerm,
        outputScale: 8,
      }),
    ).toEqual({ value: "0.01000000", scale: 8 });
  });

  it("converts term yield back to annual rate", () => {
    expect(
      termYieldToAnnualRate({
        termYield: { value: "0.01000000", scale: 8 },
        ...tenDayTerm,
        outputScale: 6,
      }),
    ).toEqual({ value: "0.365000", scale: 6 });
  });

  it("rejects invalid dates and malformed or negative rates", () => {
    expect(() =>
      annualRateToTermYield({
        annualRate: { value: "1e-2", scale: 4 },
        ...tenDayTerm,
        outputScale: 8,
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_DECIMAL" }));

    expect(() =>
      annualRateToTermYield({
        annualRate: { value: "-0.01", scale: 2 },
        ...tenDayTerm,
        outputScale: 8,
      }),
    ).toThrowError(expect.objectContaining({ code: "NEGATIVE_RATE" }));

    expect(() =>
      annualRateToTermYield({
        annualRate: { value: "0.1", scale: 1 },
        accrualStartAt: tenDayTerm.expiryAt,
        expiryAt: tenDayTerm.accrualStartAt,
        outputScale: 8,
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_TERM" }));

    expect(() =>
      annualRateToTermYield({
        annualRate: { value: "0.1", scale: 1 },
        accrualStartAt: "2026-02-30T08:00:00.000Z",
        expiryAt: "2026-03-10T08:00:00.000Z",
        outputScale: 8,
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_TERM" }));
  });
});

describe("Buy Low settlement", () => {
  const order = {
    investmentAmount: { value: "10000", scale: 2, currency: "USDT" },
    targetPrice: { value: "50000", scale: 2, currency: "USDT" },
    termYield: { value: "0.0124", scale: 4 },
    baseCurrency: "BTC",
    quoteCurrency: "USDT",
  } as const;

  it.each([
    ["below", "49000"],
    ["equal", "50000"],
  ])(
    "converts principal and coupon when expiry is %s target",
    (_label, expiryPrice) => {
      const result = settleBuyLow({
        ...order,
        expiryPrice: { value: expiryPrice, scale: 2, currency: "USDT" },
        outputScale: 8,
      });

      expect(result).toMatchObject({
        converted: true,
        settlementCurrency: "BTC",
        settlementAmount: { value: "0.20248000", scale: 8, currency: "BTC" },
        principalAmount: { value: "0.20000000", scale: 8, currency: "BTC" },
        yieldAmount: { value: "0.00248000", scale: 8, currency: "BTC" },
      });
    },
  );

  it("keeps principal and coupon in quote currency above target", () => {
    const result = settleBuyLow({
      ...order,
      expiryPrice: { value: "50000.01", scale: 2, currency: "USDT" },
      outputScale: 2,
    });

    expect(result).toMatchObject({
      converted: false,
      settlementCurrency: "USDT",
      settlementAmount: { value: "10124.00", scale: 2, currency: "USDT" },
      principalAmount: { value: "10000.00", scale: 2, currency: "USDT" },
      yieldAmount: { value: "124.00", scale: 2, currency: "USDT" },
    });
  });

  it("carries the 30-minute average-index settlement warning", () => {
    const result = settleBuyLow({
      ...order,
      expiryPrice: { value: "50001", scale: 2, currency: "USDT" },
      outputScale: 2,
    });

    expect(result.settlementPriceMethod).toEqual({
      source: "OKX_INDEX",
      method: "ARITHMETIC_AVERAGE",
      windowMinutes: 30,
      samplingIntervalMilliseconds: 200,
      warning:
        "Settlement uses OKX's 30-minute average index, not a spot tick.",
    });
  });

  it.each([
    [
      "zero amount",
      {
        ...order,
        investmentAmount: { value: "0", scale: 2, currency: "USDT" },
      },
      "INVALID_AMOUNT",
    ],
    [
      "negative amount",
      {
        ...order,
        investmentAmount: { value: "-1", scale: 2, currency: "USDT" },
      },
      "INVALID_AMOUNT",
    ],
    [
      "zero target",
      { ...order, targetPrice: { value: "0", scale: 2, currency: "USDT" } },
      "INVALID_PRICE",
    ],
    [
      "currency mismatch",
      { ...order, targetPrice: { value: "50000", scale: 2, currency: "EUR" } },
      "CURRENCY_MISMATCH",
    ],
  ])("fails closed for %s", (_label, invalidOrder, code) => {
    expect(() =>
      settleBuyLow({
        ...invalidOrder,
        expiryPrice: { value: "50001", scale: 2, currency: "USDT" },
        outputScale: 8,
      }),
    ).toThrowError(expect.objectContaining({ code }));
  });

  it("exports a typed pricing error", () => {
    expect(new DcdPricingError("INVALID_TERM", "bad")).toMatchObject({
      name: "DcdPricingError",
      code: "INVALID_TERM",
    });
  });
});
