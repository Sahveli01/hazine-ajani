import {
  riskPolicySchema,
  type DataQuality,
  type DecimalValue,
  type Decision,
  type Money,
  type ProxyMatch,
  type ReasonCode,
  type StressScenario,
} from "@hazine-ajani/report-schema";

type Fraction = { numerator: bigint; denominator: bigint };

export type RiskGateInput = {
  policy: unknown;
  valuation: {
    netEdgeBand: { low: DecimalValue; high: DecimalValue };
    riskNeutralConversionProbability: DecimalValue;
  };
  stressScenarios: StressScenario[];
  dataQuality: DataQuality;
  proxyMatch: ProxyMatch;
  portfolio: {
    totalValue: Money;
    liquidValue: Money;
    proposedInvestment: Money;
  };
  regionalProductAvailable: boolean;
  executionRequested: boolean;
};

export type RiskGateResult = {
  decision: Decision;
  reasonCodes: ReasonCode[];
};

const decimalPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
const zero: Fraction = { numerator: 0n, denominator: 1n };

function decimal(input: DecimalValue | Money): Fraction {
  if (
    !decimalPattern.test(input.value) ||
    input.scale < 0 ||
    input.scale > 30
  ) {
    throw new TypeError("Invalid decimal input");
  }
  const negative = input.value.startsWith("-");
  const unsigned = negative ? input.value.slice(1) : input.value;
  const [whole = "0", tail = ""] = unsigned.split(".");
  if (tail.length > input.scale) throw new TypeError("Decimal exceeds scale");
  const numerator = BigInt(`${whole}${tail}`);
  return {
    numerator: negative ? -numerator : numerator,
    denominator: 10n ** BigInt(tail.length),
  };
}

function compare(left: Fraction, right: Fraction): number {
  const difference =
    left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function subtract(left: Fraction, right: Fraction): Fraction {
  return {
    numerator:
      left.numerator * right.denominator - right.numerator * left.denominator,
    denominator: left.denominator * right.denominator,
  };
}

function divide(left: Fraction, right: Fraction): Fraction {
  if (right.numerator === 0n) throw new TypeError("Cannot divide by zero");
  return {
    numerator: left.numerator * right.denominator,
    denominator: left.denominator * right.numerator,
  };
}

function invalidPortfolio(input: RiskGateInput["portfolio"]): boolean {
  const currencies = [
    input.totalValue.currency,
    input.liquidValue.currency,
    input.proposedInvestment.currency,
  ];
  const total = decimal(input.totalValue);
  const liquid = decimal(input.liquidValue);
  const proposed = decimal(input.proposedInvestment);
  return (
    new Set(currencies).size !== 1 ||
    compare(total, zero) <= 0 ||
    compare(liquid, zero) < 0 ||
    compare(proposed, zero) <= 0 ||
    compare(liquid, total) > 0
  );
}

export function evaluateRiskGate(input: RiskGateInput): RiskGateResult {
  const parsedPolicy = riskPolicySchema.safeParse(input.policy);
  if (!parsedPolicy.success) {
    return { decision: "REJECT", reasonCodes: ["INVALID_POLICY"] };
  }
  const policy = parsedPolicy.data;
  const reasons: ReasonCode[] = [];

  if (!input.regionalProductAvailable)
    reasons.push("REGIONAL_PRODUCT_UNAVAILABLE");
  if (input.proxyMatch.quality === "NONE") reasons.push("NO_SUITABLE_PROXY");
  if (input.dataQuality.freshness === "STALE") reasons.push("STALE_QUOTE");
  if (
    input.dataQuality.status === "INSUFFICIENT" ||
    input.dataQuality.liquidity !== "TWO_SIDED" ||
    compare(
      decimal(input.dataQuality.score),
      decimal(policy.minDataQualityScore),
    ) < 0
  ) {
    reasons.push("INSUFFICIENT_MARKET_DATA");
  }
  if (
    compare(
      decimal(input.valuation.netEdgeBand.low),
      decimal(policy.minNetEdgeLowerBound),
    ) < 0
  ) {
    reasons.push("PREMIUM_BELOW_MARKET_BAND");
  }
  if (
    input.stressScenarios.some(
      ({ lossRatio }) =>
        compare(decimal(lossRatio), decimal(policy.maxStressLossRatio)) > 0,
    )
  ) {
    reasons.push("STRESS_LOSS_EXCEEDS_POLICY");
  }
  if (
    compare(
      decimal(input.valuation.riskNeutralConversionProbability),
      decimal(policy.maxRiskNeutralConversionProbability),
    ) > 0
  ) {
    reasons.push("IMPLIED_CONVERSION_EXCEEDS_POLICY");
  }

  if (invalidPortfolio(input.portfolio)) {
    reasons.push("LIQUIDITY_RESERVE_BREACHED");
  } else {
    const total = decimal(input.portfolio.totalValue);
    const liquid = decimal(input.portfolio.liquidValue);
    const proposed = decimal(input.portfolio.proposedInvestment);
    const allocationRatio = divide(proposed, total);
    const remainingLiquidRatio = divide(subtract(liquid, proposed), total);
    if (
      compare(allocationRatio, decimal(policy.maxAllocationRatio)) > 0 ||
      compare(remainingLiquidRatio, decimal(policy.minimumLiquidReserveRatio)) <
        0
    ) {
      reasons.push("LIQUIDITY_RESERVE_BREACHED");
    }
  }

  const allowed = new Set(policy.allowedSettlementCurrencies);
  if (
    input.stressScenarios.some(
      ({ settlementCurrency }) => !allowed.has(settlementCurrency),
    )
  ) {
    reasons.push("SETTLEMENT_CURRENCY_NOT_ALLOWED");
  }

  if (reasons.length > 0) return { decision: "REJECT", reasonCodes: reasons };
  if (input.executionRequested) {
    return { decision: "ASK", reasonCodes: ["WRITE_REQUIRES_CONFIRMATION"] };
  }
  return { decision: "ACCEPT", reasonCodes: ["POLICY_CHECKS_PASSED"] };
}
