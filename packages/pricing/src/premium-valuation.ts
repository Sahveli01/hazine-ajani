import type {
  DcdOffer,
  DecimalValue,
  MarketSnapshot,
  Money,
  OptionSnapshot,
  StressScenario,
} from "@hazine-ajani/report-schema";

import { annualRateToTermYield, settleBuyLow } from "./dcd-settlement.js";

type Fraction = { numerator: bigint; denominator: bigint };

export type PremiumValuationErrorCode =
  | "INVALID_INPUT"
  | "INCOMPARABLE_MARKET"
  | "CROSSED_BOOK"
  | "UNRELIABLE_MODEL_INPUT";

export class PremiumValuationError extends Error {
  constructor(
    public readonly code: PremiumValuationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PremiumValuationError";
  }
}

export type PremiumValuationInput = {
  offer: DcdOffer;
  option: OptionSnapshot;
  market: MarketSnapshot;
  investmentAmount: Money;
  optionFeeRate: DecimalValue;
  simpleEarnAnnualRate: DecimalValue;
  annualCarryRate: DecimalValue;
  confidenceScore: DecimalValue;
  minimumConfidenceScore: DecimalValue;
  maxStressLossRatio: DecimalValue;
  downsideMove: DecimalValue;
  upsideMove: DecimalValue;
  outputScale: number;
};

const decimalPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
const one: Fraction = { numerator: 1n, denominator: 1n };
const sevenPercent: Fraction = { numerator: 7n, denominator: 100n };

function powerOfTen(scale: number): bigint {
  if (!Number.isInteger(scale) || scale < 0 || scale > 30) {
    throw new PremiumValuationError(
      "INVALID_INPUT",
      "Decimal scale must be from 0 to 30",
    );
  }
  return 10n ** BigInt(scale);
}

function fraction(value: DecimalValue | Money): Fraction {
  if (!decimalPattern.test(value.value)) {
    throw new PremiumValuationError("INVALID_INPUT", "Invalid decimal value");
  }
  powerOfTen(value.scale);
  const negative = value.value.startsWith("-");
  const unsigned = negative ? value.value.slice(1) : value.value;
  const [whole = "0", tail = ""] = unsigned.split(".");
  if (tail.length > value.scale) {
    throw new PremiumValuationError(
      "INVALID_INPUT",
      "Decimal exceeds declared scale",
    );
  }
  const numerator = BigInt(`${whole}${tail}`);
  return {
    numerator: negative ? -numerator : numerator,
    denominator: powerOfTen(tail.length),
  };
}

function add(a: Fraction, b: Fraction): Fraction {
  return {
    numerator: a.numerator * b.denominator + b.numerator * a.denominator,
    denominator: a.denominator * b.denominator,
  };
}

function subtract(a: Fraction, b: Fraction): Fraction {
  return add(a, { numerator: -b.numerator, denominator: b.denominator });
}

function multiply(a: Fraction, b: Fraction): Fraction {
  return {
    numerator: a.numerator * b.numerator,
    denominator: a.denominator * b.denominator,
  };
}

function divide(a: Fraction, b: Fraction): Fraction {
  if (b.numerator === 0n)
    throw new PremiumValuationError("INVALID_INPUT", "Cannot divide by zero");
  return {
    numerator: a.numerator * b.denominator,
    denominator: a.denominator * b.numerator,
  };
}

function compare(a: Fraction, b: Fraction): number {
  const difference = a.numerator * b.denominator - b.numerator * a.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function minimum(a: Fraction, b: Fraction): Fraction {
  return compare(a, b) <= 0 ? a : b;
}

function quantize(input: Fraction, scale: number): bigint {
  const scaled = input.numerator * powerOfTen(scale);
  const quotient = scaled / input.denominator;
  const remainder = scaled % input.denominator;
  if (remainder === 0n) return quotient;
  const magnitude = remainder < 0n ? -remainder : remainder;
  const denominator =
    input.denominator < 0n ? -input.denominator : input.denominator;
  return magnitude * 2n < denominator
    ? quotient
    : quotient + (scaled < 0n === input.denominator < 0n ? 1n : -1n);
}

function format(input: bigint, scale: number): string {
  const negative = input < 0n;
  const digits = (negative ? -input : input)
    .toString()
    .padStart(scale + 1, "0");
  const body =
    scale === 0 ? digits : `${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
  return negative ? `-${body}` : body;
}

function decimal(input: Fraction, scale: number): DecimalValue {
  return { value: format(quantize(input, scale), scale), scale };
}

function asNumber(input: Fraction): number {
  return Number(input.numerator) / Number(input.denominator);
}

function normalCdf(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}

function probability(input: PremiumValuationInput): DecimalValue {
  const spot = asNumber(fraction(input.market.indexPrice));
  const strike = asNumber(fraction(input.option.strike));
  const volatility = asNumber(fraction(input.option.markVolatility));
  const carry = asNumber(fraction(input.annualCarryRate));
  const term =
    (Date.parse(input.option.expiryAt) - Date.parse(input.option.observedAt)) /
    (365 * 24 * 60 * 60 * 1000);
  if (!(spot > 0 && strike > 0 && volatility > 0 && term > 0 && carry >= 0)) {
    throw new PremiumValuationError(
      "UNRELIABLE_MODEL_INPUT",
      "Positive spot, strike, volatility and term plus non-negative carry are required",
    );
  }
  const d2 =
    (Math.log(spot / strike) + (carry - 0.5 * volatility * volatility) * term) /
    (volatility * Math.sqrt(term));
  const result = Math.min(1, Math.max(0, normalCdf(-d2)));
  return { value: result.toFixed(input.outputScale), scale: input.outputScale };
}

function scenario(
  input: PremiumValuationInput,
  id: string,
  label: string,
  price: Fraction,
): StressScenario {
  const priceMoney: Money = {
    ...decimal(price, input.outputScale),
    currency: input.offer.quoteCurrency,
  };
  const settlement = settleBuyLow({
    investmentAmount: input.investmentAmount,
    targetPrice: input.offer.strike,
    expiryPrice: priceMoney,
    termYield: input.offer.termYield,
    baseCurrency: input.offer.baseCurrency,
    quoteCurrency: input.offer.quoteCurrency,
    outputScale: input.outputScale,
  });
  const settlementValue = settlement.converted
    ? multiply(fraction(settlement.settlementAmount), price)
    : fraction(settlement.settlementAmount);
  const principal = fraction(input.investmentAmount);
  return {
    id,
    label,
    underlyingPrice: priceMoney,
    settlementCurrency: settlement.settlementCurrency,
    portfolioValue: {
      ...decimal(settlementValue, input.outputScale),
      currency: input.offer.quoteCurrency,
    },
    lossRatio: decimal(
      divide(subtract(principal, settlementValue), principal),
      input.outputScale,
    ),
  };
}

export function valueBuyLowOffer(input: PremiumValuationInput) {
  if (
    input.offer.direction !== "BUY_LOW" ||
    input.option.optionType !== "PUT"
  ) {
    throw new PremiumValuationError(
      "INCOMPARABLE_MARKET",
      "Buy Low requires a comparable put option",
    );
  }
  if (
    input.offer.underlying !== input.option.underlying ||
    input.offer.underlying !== input.market.underlying ||
    input.option.settlementCurrency !== input.offer.baseCurrency ||
    input.investmentAmount.currency !== input.offer.quoteCurrency
  ) {
    throw new PremiumValuationError(
      "INCOMPARABLE_MARKET",
      "Offer, option, market and investment currencies must align",
    );
  }

  const bid = fraction(input.option.bid);
  const ask = fraction(input.option.ask);
  const feeRate = fraction(input.optionFeeRate);
  const score = fraction(input.confidenceScore);
  const threshold = fraction(input.minimumConfidenceScore);
  const maxStressLoss = fraction(input.maxStressLossRatio);
  const downside = fraction(input.downsideMove);
  const upside = fraction(input.upsideMove);
  if (
    compare(bid, { numerator: 0n, denominator: 1n }) < 0 ||
    compare(bid, ask) > 0
  ) {
    throw new PremiumValuationError(
      "CROSSED_BOOK",
      "Option bid/ask book is negative or crossed",
    );
  }
  if (
    [feeRate, score, threshold, maxStressLoss, downside, upside].some(
      (item) => compare(item, { numerator: 0n, denominator: 1n }) < 0,
    )
  ) {
    throw new PremiumValuationError(
      "INVALID_INPUT",
      "Rates, moves and confidence cannot be negative",
    );
  }
  if (compare(downside, one) >= 0) {
    throw new PremiumValuationError(
      "INVALID_INPUT",
      "Downside move must be below one",
    );
  }

  const netPremium = (premium: Fraction) =>
    subtract(premium, minimum(feeRate, multiply(sevenPercent, premium)));
  const index = fraction(input.market.indexPrice);
  const strike = fraction(input.option.strike);
  const lowYield = divide(multiply(netPremium(bid), index), strike);
  const highYield = divide(multiply(netPremium(ask), index), strike);
  const opportunity = fraction(
    annualRateToTermYield({
      annualRate: input.simpleEarnAnnualRate,
      accrualStartAt: input.offer.quoteAt,
      expiryAt: input.offer.expiryAt,
      outputScale: input.outputScale,
    }),
  );
  const dcdYield = fraction(input.offer.termYield);
  const edgeLow = subtract(subtract(dcdYield, highYield), opportunity);
  const edgeHigh = subtract(subtract(dcdYield, lowYield), opportunity);
  const flatPrice = index;
  const stressScenarios = [
    scenario(
      input,
      `DOWNSIDE_${Math.round(asNumber(downside) * 100)}_PERCENT`,
      "Downside",
      multiply(index, subtract(one, downside)),
    ),
    scenario(input, "FLAT", "Flat", flatPrice),
    scenario(
      input,
      `UPSIDE_${Math.round(asNumber(upside) * 100)}_PERCENT`,
      "Upside",
      multiply(index, add(one, upside)),
    ),
  ];

  return {
    valuation: {
      proxyYieldBand: {
        low: decimal(lowYield, input.outputScale),
        high: decimal(highYield, input.outputScale),
      },
      simpleEarnOpportunityCost: {
        status: "AVAILABLE" as const,
        value: decimal(opportunity, input.outputScale),
      },
      netEdgeBand: {
        low: decimal(edgeLow, input.outputScale),
        high: decimal(edgeHigh, input.outputScale),
      },
      riskNeutralConversionProbability: probability(input),
    },
    probabilityModel: {
      label: "RISK_NEUTRAL_MODEL_ESTIMATE" as const,
      model: "BLACK_SCHOLES_D2_PUT_EXERCISE" as const,
      carryRateSource: "OKX_SIMPLE_EARN_PROXY" as const,
    },
    stressScenarios,
    stressPolicyImpacts: stressScenarios.map((item) => ({
      scenarioId: item.id,
      impact:
        compare(fraction(item.lossRatio), maxStressLoss) > 0
          ? ("EXCEEDS_LIMIT" as const)
          : ("WITHIN_LIMIT" as const),
    })),
    confidenceGate:
      compare(score, threshold) >= 0
        ? { safeToUse: true as const }
        : {
            safeToUse: false as const,
            reasonCode: "INSUFFICIENT_MARKET_DATA" as const,
          },
    disclosures: [
      {
        code: "SETTLEMENT_BASIS_MISMATCH" as const,
        text: "DCD uses a 30-minute average index; the OKX option uses a one-hour time-weighted index before expiry.",
      },
      {
        code: "NO_SECONDARY_MARKET_EXIT" as const,
        text: "Dual Investment has no option-like secondary order book and early redemption can change the return.",
      },
      {
        code: "ORDER_BOOK_LIQUIDITY" as const,
        text: "The proxy band uses visible executable bid and ask; available size and slippage still limit execution.",
      },
      {
        code: "MODEL_PROBABILITY_NOT_FORECAST" as const,
        text: "Risk-neutral conversion probability is a market-implied model estimate, not a real-world forecast.",
      },
    ],
  };
}
