import {
  createCliReadTransport,
  createOkxReadAdapter,
  type OkxReadTransport,
} from "@hazine-ajani/okx-adapter";
import {
  decimalValueSchema,
  moneySchema,
  riskPolicySchema,
} from "@hazine-ajani/report-schema";
import { z } from "zod";

import {
  createLiveAnalysisService,
  type LiveAnalysisRequest,
} from "./analysis-orchestrator.js";

const runtimeRequestSchema = z.strictObject({
  policy: riskPolicySchema,
  portfolio: z.strictObject({
    totalValue: moneySchema,
    liquidValue: moneySchema,
    proposedInvestment: moneySchema,
  }),
  investmentAmount: moneySchema,
  optionFeeRate: decimalValueSchema,
  proxyPolicy: z.strictObject({
    maxAgeMs: z.number().int().positive(),
    minBidSizeContracts: decimalValueSchema,
    minAskSizeContracts: decimalValueSchema,
    maxStrikeDistance: moneySchema,
    maxExpiryDistanceMs: z.number().int().nonnegative(),
    minConfidenceScore: decimalValueSchema,
  }),
  downsideMove: decimalValueSchema,
  upsideMove: decimalValueSchema,
  outputScale: z.number().int().min(0).max(18),
  executionRequested: z.literal(false),
  productId: z.string().min(1).optional(),
});

type RuntimeEnvironment = Readonly<Record<string, string | undefined>>;

export function createRuntimeAnalysis(
  environment: RuntimeEnvironment,
  dependencies: { transport?: OkxReadTransport } = {},
):
  | {
      request: LiveAnalysisRequest;
      run(
        request: LiveAnalysisRequest,
      ): ReturnType<ReturnType<typeof createLiveAnalysisService>["analyze"]>;
    }
  | undefined {
  const profile = environment.OKX_READ_PROFILE;
  const requestJson = environment.ANALYSIS_REQUEST_JSON;
  if (!profile && !requestJson) return undefined;
  if (!profile) throw new Error("OKX_READ_PROFILE is required");
  if (!requestJson) throw new Error("ANALYSIS_REQUEST_JSON is required");

  let rawRequest: unknown;
  try {
    rawRequest = JSON.parse(requestJson);
  } catch {
    throw new Error("ANALYSIS_REQUEST_JSON must be valid JSON");
  }
  const parsedRequest = runtimeRequestSchema.parse(rawRequest);
  const { productId, ...requiredRequest } = parsedRequest;
  const request: LiveAnalysisRequest = productId
    ? { ...requiredRequest, productId }
    : requiredRequest;
  const reader = createOkxReadAdapter({
    transport: dependencies.transport ?? createCliReadTransport(),
    privateProfile: profile,
  });
  const service = createLiveAnalysisService({ reader });
  return {
    request,
    run: (nextRequest) => service.analyze(nextRequest),
  };
}
