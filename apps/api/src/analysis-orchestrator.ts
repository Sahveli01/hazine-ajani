import {
  createAnalysisTrace,
  type AnalysisToolName,
} from "@hazine-ajani/observability";
import { explainAnalysisReport, evaluateRiskGate } from "@hazine-ajani/policy";
import {
  selectOptionProxy,
  valueBuyLowOffer,
  type ProxySelectionPolicy,
} from "@hazine-ajani/pricing";
import {
  ANALYSIS_REPORT_SCHEMA_VERSION,
  parseAnalysisReport,
  type AnalysisReport,
  type DcdOffer,
  type DecimalValue,
  type MarketSnapshot,
  type Money,
  type OptionSnapshot,
  type RiskPolicy,
} from "@hazine-ajani/report-schema";

type SourceKind = AnalysisReport["sources"][number]["kind"];
type Snapshot<T> = {
  data: T;
  source: { kind: SourceKind; reference: string };
  serverTime: string;
  receivedAt: string;
  expiresAt: string;
};

type Earn = { currency: string; annualRate: DecimalValue; observedAt: string };
type Spot = {
  instrumentId: string;
  last: Money;
  bid: Money;
  ask: Money;
  observedAt: string;
};

export type LiveAnalysisReader = {
  readDcdProducts(filter: {
    baseCurrency: string;
    quoteCurrency: string;
    optionType: "P" | "C";
  }): Promise<Snapshot<DcdOffer[]>>;
  readSimpleEarn(currency?: string): Promise<Snapshot<Earn>>;
  readSpotTicker(instrumentId?: string): Promise<Snapshot<Spot>>;
  readOptionMarket(
    instrumentId: string,
    indexId?: string,
  ): Promise<Snapshot<{ option: OptionSnapshot; market: MarketSnapshot }>>;
};

export type LiveAnalysisRequest = {
  policy: RiskPolicy;
  portfolio: {
    totalValue: Money;
    liquidValue: Money;
    proposedInvestment: Money;
  };
  investmentAmount: Money;
  optionFeeRate: DecimalValue;
  proxyPolicy: ProxySelectionPolicy;
  downsideMove: DecimalValue;
  upsideMove: DecimalValue;
  outputScale: number;
  executionRequested: boolean;
  productId?: string;
};

type Failure = {
  status: "SOURCE_UNAVAILABLE" | "STALE_DATA" | "NO_SUITABLE_PROXY";
  source?: AnalysisToolName;
  errorCode: string;
  trace: ReturnType<ReturnType<typeof createAnalysisTrace>["snapshot"]>;
};

export type LiveAnalysisResult =
  | {
      status: "SUCCESS";
      report: AnalysisReport;
      trace: ReturnType<ReturnType<typeof createAnalysisTrace>["snapshot"]>;
    }
  | Failure;

function publicErrorCode(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return [
      "STALE_DATA",
      "TIMEOUT",
      "RATE_LIMIT",
      "EMPTY_DATA",
      "REGIONAL_UNAVAILABLE",
      "AUTHENTICATION",
      "CLI_FAILURE",
      "INVALID_PAYLOAD",
    ].includes(error.code)
      ? error.code
      : "UNKNOWN";
  }
  return "UNKNOWN";
}

function selectOffer(
  offers: DcdOffer[],
  productId: string | undefined,
  now: Date,
): DcdOffer | undefined {
  if (productId) return offers.find((offer) => offer.productId === productId);
  return [...offers]
    .filter(
      (offer) =>
        offer.direction === "BUY_LOW" &&
        Date.parse(offer.expiryAt) > now.getTime(),
    )
    .sort(
      (a, b) =>
        Date.parse(a.expiryAt) - Date.parse(b.expiryAt) ||
        a.productId.localeCompare(b.productId),
    )[0];
}

function optionInstrumentId(offer: DcdOffer): string {
  const prefix = `${offer.baseCurrency}-${offer.quoteCurrency}-`;
  if (!offer.productId.startsWith(prefix))
    throw Object.assign(new Error("Unsupported DCD product id"), {
      code: "INVALID_PAYLOAD",
    });
  return `${offer.underlying}-${offer.productId.slice(prefix.length)}`;
}

function source(snapshot: Snapshot<unknown>, observedAt: string) {
  return { ...snapshot.source, observedAt };
}

export function createLiveAnalysisService(options: {
  reader: LiveAnalysisReader;
  now?: () => Date;
  id?: () => string;
}) {
  const now = options.now ?? (() => new Date());
  const id = options.id ?? (() => crypto.randomUUID().replaceAll("-", ""));
  return {
    async analyze(request: LiveAnalysisRequest): Promise<LiveAnalysisResult> {
      const created = now();
      const suffix = id();
      const analysisId = `ana_${suffix}`;
      const trace = createAnalysisTrace({
        analysisId,
        correlationId: `cor_${suffix}`,
        now,
      });
      const initial = await Promise.allSettled([
        trace.run("OKX_DCD_PRODUCTS", () =>
          options.reader.readDcdProducts({
            baseCurrency: "BTC",
            quoteCurrency: "USDT",
            optionType: "P",
          }),
        ),
        trace.run("OKX_SIMPLE_EARN", () =>
          options.reader.readSimpleEarn("USDT"),
        ),
        trace.run("OKX_SPOT_TICKER", () =>
          options.reader.readSpotTicker("BTC-USDT"),
        ),
      ]);
      const tools: AnalysisToolName[] = [
        "OKX_DCD_PRODUCTS",
        "OKX_SIMPLE_EARN",
        "OKX_SPOT_TICKER",
      ];
      const failed = initial.findIndex((item) => item.status === "rejected");
      if (failed >= 0) {
        const code = publicErrorCode(
          (initial[failed] as PromiseRejectedResult).reason as unknown,
        );
        return {
          status: code === "STALE_DATA" ? "STALE_DATA" : "SOURCE_UNAVAILABLE",
          source: tools[failed] ?? "OKX_DCD_PRODUCTS",
          errorCode: code,
          trace: trace.snapshot(),
        };
      }
      const dcd = (initial[0] as PromiseFulfilledResult<Snapshot<DcdOffer[]>>)
        .value;
      const earn = (initial[1] as PromiseFulfilledResult<Snapshot<Earn>>).value;
      const spot = (initial[2] as PromiseFulfilledResult<Snapshot<Spot>>).value;
      const offer = selectOffer(dcd.data, request.productId, created);
      if (!offer)
        return {
          status: "NO_SUITABLE_PROXY",
          errorCode: "DCD_PRODUCT_NOT_FOUND",
          trace: trace.snapshot(),
        };

      let optionMarket: Snapshot<{
        option: OptionSnapshot;
        market: MarketSnapshot;
      }>;
      try {
        optionMarket = await trace.run("OKX_OPTION_MARKET", () =>
          options.reader.readOptionMarket(
            optionInstrumentId(offer),
            offer.underlying,
          ),
        );
      } catch (error) {
        const code = publicErrorCode(error);
        return {
          status: code === "STALE_DATA" ? "STALE_DATA" : "SOURCE_UNAVAILABLE",
          source: "OKX_OPTION_MARKET",
          errorCode: code,
          trace: trace.snapshot(),
        };
      }
      const proxy = selectOptionProxy({
        offer,
        candidates: [optionMarket.data.option],
        policy: request.proxyPolicy,
        nowAt: created.toISOString(),
      });
      if (!proxy.matched)
        return {
          status: "NO_SUITABLE_PROXY",
          errorCode: "NO_SUITABLE_PROXY",
          trace: trace.snapshot(),
        };
      const valuation = valueBuyLowOffer({
        offer,
        option: proxy.selected,
        market: optionMarket.data.market,
        investmentAmount: request.investmentAmount,
        optionFeeRate: request.optionFeeRate,
        simpleEarnAnnualRate: earn.data.annualRate,
        annualCarryRate: earn.data.annualRate,
        confidenceScore: proxy.confidence.score,
        minimumConfidenceScore: request.proxyPolicy.minConfidenceScore,
        maxStressLossRatio: request.policy.maxStressLossRatio,
        downsideMove: request.downsideMove,
        upsideMove: request.upsideMove,
        outputScale: request.outputScale,
      });
      const dataQuality = {
        status: valuation.confidenceGate.safeToUse
          ? ("SUFFICIENT" as const)
          : ("INSUFFICIENT" as const),
        score: proxy.confidence.score,
        freshness: "FRESH" as const,
        liquidity: "TWO_SIDED" as const,
        proxyQuality: proxy.proxyMatch.quality,
      };
      const gate = evaluateRiskGate({
        policy: request.policy,
        valuation: valuation.valuation,
        stressScenarios: valuation.stressScenarios,
        dataQuality,
        proxyMatch: proxy.proxyMatch,
        portfolio: request.portfolio,
        regionalProductAvailable: true,
        executionRequested: request.executionRequested,
      });
      trace.recordDecision(gate.decision, gate.reasonCodes);
      const expiresAt = [
        dcd.expiresAt,
        spot.expiresAt,
        optionMarket.expiresAt,
      ].sort()[0]!;
      const draft = parseAnalysisReport({
        schemaVersion: ANALYSIS_REPORT_SCHEMA_VERSION,
        analysisId,
        createdAt: created.toISOString(),
        expiresAt,
        sourceRegion: "tr",
        sources: [
          source(dcd, offer.quoteAt),
          source(earn, earn.data.observedAt),
          source(spot, spot.data.observedAt),
          source(optionMarket, optionMarket.data.option.observedAt),
        ],
        dcdOffer: offer,
        marketSnapshot: optionMarket.data.market,
        optionSnapshot: proxy.selected,
        proxyMatch: proxy.proxyMatch,
        valuation: valuation.valuation,
        stressScenarios: valuation.stressScenarios,
        riskPolicy: request.policy,
        dataQuality,
        decision: gate.decision,
        reasonCodes: gate.reasonCodes,
        explanation: "Canonical analysis explanation pending.",
        execution: { status: "NOT_REQUESTED" },
      });
      const explanation = await explainAnalysisReport(draft);
      const report = parseAnalysisReport({
        ...draft,
        explanation: explanation.text,
      });
      return { status: "SUCCESS", report, trace: trace.snapshot() };
    },
  };
}
