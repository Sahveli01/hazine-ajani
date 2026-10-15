import { z } from "zod";

export const ANALYSIS_REPORT_SCHEMA_VERSION = "1.0.0" as const;
export const reportSchemaVersion = ANALYSIS_REPORT_SCHEMA_VERSION;

const decimalPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
const currencyPattern = /^[A-Z][A-Z0-9_]{1,11}$/;
const isoTimestampSchema = z.iso.datetime({ offset: true });
const decimalStringSchema = z.string().regex(decimalPattern);
const currencySchema = z.string().regex(currencyPattern);

function decimalPlaces(value: string): number {
  return value.split(".")[1]?.length ?? 0;
}

function decimalAsScaledInteger(value: string, scale: number): bigint {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [integer = "0", fraction = ""] = unsigned.split(".");
  const digits = `${integer}${fraction.padEnd(scale, "0")}`;
  const scaled = BigInt(digits);
  return negative ? -scaled : scaled;
}

function compareDecimals(left: string, right: string): number {
  const scale = Math.max(decimalPlaces(left), decimalPlaces(right));
  const leftInteger = decimalAsScaledInteger(left, scale);
  const rightInteger = decimalAsScaledInteger(right, scale);
  return leftInteger < rightInteger ? -1 : leftInteger > rightInteger ? 1 : 0;
}

export const decimalValueSchema = z
  .strictObject({
    value: decimalStringSchema,
    scale: z.number().int().min(0).max(30),
  })
  .superRefine(({ value, scale }, context) => {
    if (decimalPlaces(value) > scale) {
      context.addIssue({
        code: "custom",
        message: "Decimal value has more fractional digits than its scale",
        path: ["value"],
      });
    }
  });

export const moneySchema = decimalValueSchema.extend({
  currency: currencySchema,
});

export const quantitySchema = decimalValueSchema.extend({
  unit: z.enum(["CONTRACT", "MILLISECOND"]),
});

export const sourceReferenceSchema = z.strictObject({
  kind: z.enum([
    "OKX_PRIVATE_DCD",
    "OKX_PUBLIC_OPTION",
    "OKX_PUBLIC_INDEX",
    "OKX_SIMPLE_EARN",
    "AVALANCHE_RPC",
  ]),
  reference: z.string().min(1).max(512),
  observedAt: isoTimestampSchema,
});

export const dcdOfferSchema = z.strictObject({
  productId: z.string().min(1).max(128),
  direction: z.enum(["BUY_LOW", "SELL_HIGH"]),
  underlying: z.string().min(1).max(32),
  baseCurrency: currencySchema,
  quoteCurrency: currencySchema,
  notionalCurrency: currencySchema,
  strike: moneySchema,
  expiryAt: isoTimestampSchema,
  quoteAt: isoTimestampSchema,
  annualizedYield: decimalValueSchema,
  termYield: decimalValueSchema,
  minSize: moneySchema,
  maxSize: moneySchema,
  stepSize: moneySchema,
});

export const marketSnapshotSchema = z.strictObject({
  underlying: z.string().min(1).max(32),
  indexPrice: moneySchema,
  observedAt: isoTimestampSchema,
});

export const optionSnapshotSchema = z.strictObject({
  instrumentId: z.string().min(1).max(128),
  underlying: z.string().min(1).max(32),
  optionType: z.enum(["PUT", "CALL"]),
  settlementCurrency: currencySchema,
  contractMultiplier: decimalValueSchema,
  strike: moneySchema,
  expiryAt: isoTimestampSchema,
  bid: moneySchema,
  ask: moneySchema,
  bidSize: quantitySchema,
  askSize: quantitySchema,
  markPrice: moneySchema,
  markVolatility: decimalValueSchema,
  delta: decimalValueSchema,
  gamma: decimalValueSchema,
  theta: decimalValueSchema,
  vega: decimalValueSchema,
  observedAt: isoTimestampSchema,
});

export const proxyMatchSchema = z.strictObject({
  quality: z.enum(["EXACT", "NEAR", "NONE"]),
  strikeDistance: moneySchema,
  expiryDistanceMs: decimalStringSchema,
  settlementComparable: z.boolean(),
  differences: z.array(
    z.enum([
      "STRIKE",
      "EXPIRY",
      "SETTLEMENT_WINDOW",
      "SETTLEMENT_MECHANISM",
      "SETTLEMENT_CURRENCY",
      "EARLY_REDEMPTION",
      "COUNTERPARTY",
    ]),
  ),
});

const decimalBandSchema = z
  .strictObject({
    low: decimalValueSchema,
    high: decimalValueSchema,
  })
  .superRefine(({ low, high }, context) => {
    if (compareDecimals(low.value, high.value) > 0) {
      context.addIssue({
        code: "custom",
        message: "Band low value cannot exceed high value",
      });
    }
  });

const opportunityCostSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("AVAILABLE"),
    value: decimalValueSchema,
  }),
  z.strictObject({
    status: z.literal("UNAVAILABLE"),
    reason: z.string().min(1).max(256).optional(),
  }),
]);

export const valuationSchema = z.strictObject({
  proxyYieldBand: decimalBandSchema,
  simpleEarnOpportunityCost: opportunityCostSchema,
  netEdgeBand: decimalBandSchema,
  riskNeutralConversionProbability: decimalValueSchema,
});

const unitRatioSchema = decimalValueSchema.refine(
  ({ value }) =>
    compareDecimals(value, "0") >= 0 && compareDecimals(value, "1") <= 0,
  "Ratio must be between zero and one",
);

export const riskPolicySchema = z.strictObject({
  policyVersion: z.literal("1.0.0"),
  maxAllocationRatio: unitRatioSchema,
  minimumLiquidReserveRatio: unitRatioSchema,
  maxRiskNeutralConversionProbability: unitRatioSchema,
  maxStressLossRatio: unitRatioSchema,
  minDataQualityScore: unitRatioSchema,
  minNetEdgeLowerBound: decimalValueSchema,
  allowedSettlementCurrencies: z.array(currencySchema).min(1),
});

export const stressScenarioSchema = z.strictObject({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(128),
  underlyingPrice: moneySchema,
  settlementCurrency: currencySchema,
  portfolioValue: moneySchema,
  lossRatio: decimalValueSchema,
});

export const dataQualitySchema = z.strictObject({
  status: z.enum(["SUFFICIENT", "INSUFFICIENT"]),
  score: decimalValueSchema,
  freshness: z.enum(["FRESH", "STALE"]),
  liquidity: z.enum(["TWO_SIDED", "ONE_SIDED", "EMPTY", "CROSSED"]),
  proxyQuality: z.enum(["EXACT", "NEAR", "NONE"]),
});

export const decisionSchema = z.enum(["ACCEPT", "ASK", "REJECT"]);

export const reasonCodeSchema = z.enum([
  "PREMIUM_BELOW_MARKET_BAND",
  "STRESS_LOSS_EXCEEDS_POLICY",
  "IMPLIED_CONVERSION_EXCEEDS_POLICY",
  "LIQUIDITY_RESERVE_BREACHED",
  "INSUFFICIENT_MARKET_DATA",
  "STALE_QUOTE",
  "NO_SUITABLE_PROXY",
  "WRITE_REQUIRES_CONFIRMATION",
  "REGIONAL_PRODUCT_UNAVAILABLE",
  "SETTLEMENT_CURRENCY_NOT_ALLOWED",
  "INVALID_POLICY",
  "POLICY_CHECKS_PASSED",
]);

export const executionStateSchema = z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("NOT_REQUESTED") }),
  z.strictObject({
    status: z.literal("AWAITING_CONFIRMATION"),
    quoteExpiresAt: isoTimestampSchema.optional(),
  }),
  z.strictObject({
    status: z.literal("REJECTED_BY_USER"),
    rejectedAt: isoTimestampSchema,
  }),
  z.strictObject({
    status: z.literal("SUBMITTED"),
    orderId: z.string().min(1).max(128),
    submittedAt: isoTimestampSchema,
  }),
  z.strictObject({
    status: z.literal("CONFIRMED"),
    orderId: z.string().min(1).max(128),
    confirmedAt: isoTimestampSchema,
  }),
  z.strictObject({
    status: z.literal("FAILED"),
    failureCode: z.string().min(1).max(128),
    failedAt: isoTimestampSchema,
  }),
]);

const evmAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const transactionHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);

export const x402PaymentSchema = z.strictObject({
  network: z.string().regex(/^eip155:\d+$/),
  chainId: z.number().int().positive(),
  testnet: z.boolean(),
  token: currencySchema,
  amount: moneySchema,
  payer: evmAddressSchema,
  payTo: evmAddressSchema,
  transactionHash: transactionHashSchema,
  explorerUrl: z.url({ protocol: /^https$/ }),
  confirmedAt: isoTimestampSchema,
});

export const analysisReportSchema = z
  .strictObject({
    schemaVersion: z.literal(ANALYSIS_REPORT_SCHEMA_VERSION),
    analysisId: z.string().regex(/^ana_[A-Za-z0-9_-]{16,64}$/),
    createdAt: isoTimestampSchema,
    expiresAt: isoTimestampSchema,
    sourceRegion: z.enum(["tr"]),
    sources: z.array(sourceReferenceSchema).min(1),
    dcdOffer: dcdOfferSchema,
    marketSnapshot: marketSnapshotSchema,
    optionSnapshot: optionSnapshotSchema,
    proxyMatch: proxyMatchSchema,
    valuation: valuationSchema,
    stressScenarios: z.array(stressScenarioSchema).min(1),
    riskPolicy: riskPolicySchema,
    dataQuality: dataQualitySchema,
    decision: decisionSchema,
    reasonCodes: z.array(reasonCodeSchema),
    explanation: z.string().min(1).max(2_000),
    execution: executionStateSchema,
    x402Payment: x402PaymentSchema.optional(),
  })
  .superRefine(({ createdAt, expiresAt }, context) => {
    if (Date.parse(expiresAt) <= Date.parse(createdAt)) {
      context.addIssue({
        code: "custom",
        message: "Analysis expiry must be after creation",
        path: ["expiresAt"],
      });
    }
  });

export function parseAnalysisReport(input: unknown): AnalysisReport {
  return analysisReportSchema.parse(input);
}

export type DecimalValue = z.infer<typeof decimalValueSchema>;
export type Money = z.infer<typeof moneySchema>;
export type DcdOffer = z.infer<typeof dcdOfferSchema>;
export type MarketSnapshot = z.infer<typeof marketSnapshotSchema>;
export type OptionSnapshot = z.infer<typeof optionSnapshotSchema>;
export type ProxyMatch = z.infer<typeof proxyMatchSchema>;
export type RiskPolicy = z.infer<typeof riskPolicySchema>;
export type StressScenario = z.infer<typeof stressScenarioSchema>;
export type DataQuality = z.infer<typeof dataQualitySchema>;
export type Decision = z.infer<typeof decisionSchema>;
export type ReasonCode = z.infer<typeof reasonCodeSchema>;
export type ExecutionState = z.infer<typeof executionStateSchema>;
export type X402Payment = z.infer<typeof x402PaymentSchema>;
export type AnalysisReport = z.infer<typeof analysisReportSchema>;
