import {
  createCliReadTransport,
  createOkxReadAdapter,
} from "@hazine-ajani/okx-adapter";

import { createLiveAnalysisService } from "../src/analysis-orchestrator.js";

const profile = process.env.OKX_READ_PROFILE;
if (!profile) throw new Error("OKX_READ_PROFILE is required");

const decimal = (value: string, scale: number) => ({ value, scale });
const money = (value: string, currency: string, scale: number) => ({
  value,
  currency,
  scale,
});
const reader = createOkxReadAdapter({
  transport: createCliReadTransport(),
  privateProfile: profile,
});
const result = await createLiveAnalysisService({ reader }).analyze({
  policy: {
    policyVersion: "1.0.0",
    maxAllocationRatio: decimal("0.25", 2),
    minimumLiquidReserveRatio: decimal("0.50", 2),
    maxRiskNeutralConversionProbability: decimal("0.50", 2),
    maxStressLossRatio: decimal("0.15", 2),
    minDataQualityScore: decimal("0.50", 2),
    minNetEdgeLowerBound: decimal("0", 0),
    allowedSettlementCurrencies: ["BTC", "USDT"],
  },
  portfolio: {
    totalValue: money("10000", "USDT", 0),
    liquidValue: money("9000", "USDT", 0),
    proposedInvestment: money("1000", "USDT", 0),
  },
  investmentAmount: money("1000", "USDT", 0),
  optionFeeRate: decimal("0.0003", 4),
  proxyPolicy: {
    maxAgeMs: 60_000,
    minBidSizeContracts: decimal("0.01", 2),
    minAskSizeContracts: decimal("0.01", 2),
    maxStrikeDistance: money("1000", "USDT", 0),
    maxExpiryDistanceMs: 86_400_000,
    minConfidenceScore: decimal("0.50", 2),
  },
  downsideMove: decimal("0.10", 2),
  upsideMove: decimal("0.10", 2),
  outputScale: 8,
  executionRequested: false,
});

if (result.status !== "SUCCESS") {
  console.log(
    JSON.stringify(
      {
        status: result.status,
        errorCode: result.errorCode,
        trace: result.trace,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify(
      {
        status: result.status,
        analysisId: result.report.analysisId,
        createdAt: result.report.createdAt,
        expiresAt: result.report.expiresAt,
        productId: result.report.dcdOffer.productId,
        optionInstrumentId: result.report.optionSnapshot.instrumentId,
        decision: result.report.decision,
        reasonCodes: result.report.reasonCodes,
        schemaVersion: result.report.schemaVersion,
        sources: result.report.sources,
        trace: result.trace,
      },
      null,
      2,
    ),
  );
}
