import type { DecimalValue, Money } from "@hazine-ajani/report-schema";

export type DcdPricingErrorCode =
  | "INVALID_DECIMAL"
  | "NEGATIVE_RATE"
  | "INVALID_TERM"
  | "INVALID_AMOUNT"
  | "INVALID_PRICE"
  | "CURRENCY_MISMATCH";

export class DcdPricingError extends Error {
  constructor(
    public readonly code: DcdPricingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DcdPricingError";
  }
}

type Fraction = { numerator: bigint; denominator: bigint };
type YieldConversionInput = {
  accrualStartAt: string;
  expiryAt: string;
  outputScale: number;
};

const decimalPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
const timestampPattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|([+-])(\d{2}):(\d{2}))$/;
const millisecondsPerYear = 365n * 24n * 60n * 60n * 1_000n;

function powerOfTen(scale: number): bigint {
  if (!Number.isInteger(scale) || scale < 0 || scale > 30) {
    throw new DcdPricingError(
      "INVALID_DECIMAL",
      "Decimal scale must be an integer from 0 to 30",
    );
  }
  return 10n ** BigInt(scale);
}

function parseDecimal(decimal: DecimalValue): Fraction {
  if (!decimalPattern.test(decimal.value)) {
    throw new DcdPricingError(
      "INVALID_DECIMAL",
      "Decimal must use plain base-10 notation",
    );
  }
  powerOfTen(decimal.scale);
  const negative = decimal.value.startsWith("-");
  const unsigned = negative ? decimal.value.slice(1) : decimal.value;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  if (fraction.length > decimal.scale) {
    throw new DcdPricingError(
      "INVALID_DECIMAL",
      "Decimal has more fractional digits than its declared scale",
    );
  }
  const numerator = BigInt(`${whole}${fraction}`);
  return {
    numerator: negative ? -numerator : numerator,
    denominator: powerOfTen(fraction.length),
  };
}

function requireNonNegativeRate(rate: DecimalValue): Fraction {
  const parsed = parseDecimal(rate);
  if (parsed.numerator < 0n) {
    throw new DcdPricingError("NEGATIVE_RATE", "DCD rates cannot be negative");
  }
  return parsed;
}

function termMilliseconds(accrualStartAt: string, expiryAt: string): bigint {
  const start = parseTimestamp(accrualStartAt);
  const expiry = parseTimestamp(expiryAt);
  if (expiry <= start) {
    throw new DcdPricingError(
      "INVALID_TERM",
      "Expiry must be after interest accrual start",
    );
  }
  return BigInt(expiry - start);
}

function parseTimestamp(input: string): number {
  const match = timestampPattern.exec(input);
  if (!match) {
    throw new DcdPricingError(
      "INVALID_TERM",
      "Term timestamps must be ISO-8601 with a timezone",
    );
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const offsetHour = Number(match[8] ?? "0");
  const offsetMinute = Number(match[9] ?? "0");
  const daysInMonth =
    month >= 1 && month <= 12
      ? new Date(Date.UTC(year, month, 0)).getUTCDate()
      : 0;
  if (
    day < 1 ||
    day > daysInMonth ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 23 ||
    offsetMinute > 59
  ) {
    throw new DcdPricingError(
      "INVALID_TERM",
      "Term timestamp contains an invalid calendar value",
    );
  }
  const parsed = Date.parse(input);
  if (!Number.isFinite(parsed)) {
    throw new DcdPricingError("INVALID_TERM", "Term timestamp is invalid");
  }
  return parsed;
}

function multiply(left: Fraction, right: Fraction): Fraction {
  return {
    numerator: left.numerator * right.numerator,
    denominator: left.denominator * right.denominator,
  };
}

function divide(left: Fraction, right: Fraction): Fraction {
  if (right.numerator === 0n) {
    throw new DcdPricingError(
      "INVALID_PRICE",
      "Division by zero is not allowed",
    );
  }
  return {
    numerator: left.numerator * right.denominator,
    denominator: left.denominator * right.numerator,
  };
}

function add(left: Fraction, right: Fraction): Fraction {
  return {
    numerator:
      left.numerator * right.denominator + right.numerator * left.denominator,
    denominator: left.denominator * right.denominator,
  };
}

function compare(left: Fraction, right: Fraction): number {
  const difference =
    left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function quantize(input: Fraction, scale: number): bigint {
  const scaledNumerator = input.numerator * powerOfTen(scale);
  const quotient = scaledNumerator / input.denominator;
  const remainder = scaledNumerator % input.denominator;
  if (remainder === 0n) return quotient;
  const magnitude = remainder < 0n ? -remainder : remainder;
  const rounded =
    magnitude * 2n >=
    (input.denominator < 0n ? -input.denominator : input.denominator);
  if (!rounded) return quotient;
  return (
    quotient + (scaledNumerator < 0n === input.denominator < 0n ? 1n : -1n)
  );
}

function formatScaled(input: bigint, scale: number): string {
  const negative = input < 0n;
  const digits = (negative ? -input : input)
    .toString()
    .padStart(scale + 1, "0");
  const value =
    scale === 0 ? digits : `${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
  return negative ? `-${value}` : value;
}

function decimalResult(input: Fraction, scale: number): DecimalValue {
  return { value: formatScaled(quantize(input, scale), scale), scale };
}

function moneyFromScaled(
  amount: bigint,
  scale: number,
  currency: string,
): Money {
  return { value: formatScaled(amount, scale), scale, currency };
}

export function annualRateToTermYield(
  input: YieldConversionInput & { annualRate: DecimalValue },
): DecimalValue {
  const annualRate = requireNonNegativeRate(input.annualRate);
  const duration = termMilliseconds(input.accrualStartAt, input.expiryAt);
  return decimalResult(
    multiply(annualRate, {
      numerator: duration,
      denominator: millisecondsPerYear,
    }),
    input.outputScale,
  );
}

export function termYieldToAnnualRate(
  input: YieldConversionInput & { termYield: DecimalValue },
): DecimalValue {
  const termYield = requireNonNegativeRate(input.termYield);
  const duration = termMilliseconds(input.accrualStartAt, input.expiryAt);
  return decimalResult(
    multiply(termYield, {
      numerator: millisecondsPerYear,
      denominator: duration,
    }),
    input.outputScale,
  );
}

export type BuyLowSettlementInput = {
  investmentAmount: Money;
  targetPrice: Money;
  expiryPrice: Money;
  termYield: DecimalValue;
  baseCurrency: string;
  quoteCurrency: string;
  outputScale: number;
};

export type BuyLowSettlement = {
  converted: boolean;
  settlementCurrency: string;
  settlementAmount: Money;
  principalAmount: Money;
  yieldAmount: Money;
  settlementPriceMethod: {
    source: "OKX_INDEX";
    method: "ARITHMETIC_AVERAGE";
    windowMinutes: 30;
    samplingIntervalMilliseconds: 200;
    warning: "Settlement uses OKX's 30-minute average index, not a spot tick.";
  };
};

export function settleBuyLow(input: BuyLowSettlementInput): BuyLowSettlement {
  const investmentAmount = parseDecimal(input.investmentAmount);
  const targetPrice = parseDecimal(input.targetPrice);
  const expiryPrice = parseDecimal(input.expiryPrice);
  const termYield = requireNonNegativeRate(input.termYield);
  powerOfTen(input.outputScale);

  if (investmentAmount.numerator <= 0n) {
    throw new DcdPricingError(
      "INVALID_AMOUNT",
      "Investment amount must be positive",
    );
  }
  if (targetPrice.numerator <= 0n || expiryPrice.numerator <= 0n) {
    throw new DcdPricingError(
      "INVALID_PRICE",
      "Target and expiry prices must be positive",
    );
  }
  if (
    input.investmentAmount.currency !== input.quoteCurrency ||
    input.targetPrice.currency !== input.quoteCurrency ||
    input.expiryPrice.currency !== input.quoteCurrency ||
    input.baseCurrency === input.quoteCurrency
  ) {
    throw new DcdPricingError(
      "CURRENCY_MISMATCH",
      "Buy Low currencies do not match the quoted pair",
    );
  }

  const converted = compare(expiryPrice, targetPrice) <= 0;
  const currency = converted ? input.baseCurrency : input.quoteCurrency;
  const principal = converted
    ? divide(investmentAmount, targetPrice)
    : investmentAmount;
  const total = multiply(
    principal,
    add({ numerator: 1n, denominator: 1n }, termYield),
  );
  const principalScaled = quantize(principal, input.outputScale);
  const totalScaled = quantize(total, input.outputScale);

  return {
    converted,
    settlementCurrency: currency,
    settlementAmount: moneyFromScaled(totalScaled, input.outputScale, currency),
    principalAmount: moneyFromScaled(
      principalScaled,
      input.outputScale,
      currency,
    ),
    yieldAmount: moneyFromScaled(
      totalScaled - principalScaled,
      input.outputScale,
      currency,
    ),
    settlementPriceMethod: {
      source: "OKX_INDEX",
      method: "ARITHMETIC_AVERAGE",
      windowMinutes: 30,
      samplingIntervalMilliseconds: 200,
      warning:
        "Settlement uses OKX's 30-minute average index, not a spot tick.",
    },
  };
}
