import {
  moneySchema,
  parseAnalysisReport,
  type AnalysisReport,
  type Money,
} from "@hazine-ajani/report-schema";

export type ExecutionCommand = {
  confirmationId: string;
  analysisId: string;
  productId: string;
  amount: Money;
  notionalCurrency: string;
  minimumAnnualizedYield: AnalysisReport["dcdOffer"]["annualizedYield"];
};

export type ConfirmedExecutionWriter = {
  submit(command: ExecutionCommand): Promise<{ submissionId: string }>;
};

type ConfirmationSummary = ExecutionCommand & {
  quoteExpiresAt: string;
  live: true;
  settlementScenarios: Array<{
    id: string;
    settlementCurrency: string;
    underlyingPrice: Money;
    portfolioValue: Money;
  }>;
  mainRisks: Array<
    "CONVERSION_RISK" | "NO_SECONDARY_MARKET_EXIT" | "PROXY_BASIS_RISK"
  >;
};

type Entry = {
  summary: ConfirmationSummary;
  state:
    | "AWAITING_CONFIRMATION"
    | "SUBMITTING"
    | "SUBMITTED"
    | "REJECTED_BY_USER"
    | "SUBMISSION_UNKNOWN"
    | "EXPIRED";
};

function risks(report: AnalysisReport): ConfirmationSummary["mainRisks"] {
  return [
    "CONVERSION_RISK",
    "NO_SECONDARY_MARKET_EXIT",
    ...(!report.proxyMatch.settlementComparable ||
    report.proxyMatch.differences.length > 0
      ? (["PROXY_BASIS_RISK"] as const)
      : []),
  ];
}

export function createExecutionAuthorizationMachine(options: {
  now?: () => Date;
  id?: () => string;
  ttlMs: number;
}) {
  const now = options.now ?? (() => new Date());
  const id =
    options.id ?? (() => `confirm_${crypto.randomUUID().replaceAll("-", "")}`);
  const entries = new Map<string, Entry>();

  return {
    prepare(input: unknown, amountInput: unknown) {
      const report = parseAnalysisReport(input);
      const amount = moneySchema.parse(amountInput);
      const preparedAt = now();
      if (report.decision !== "ACCEPT") {
        return {
          status: "NOT_ELIGIBLE" as const,
          reason: "ANALYSIS_NOT_ACCEPTED" as const,
        };
      }
      if (Date.parse(report.expiresAt) <= preparedAt.getTime()) {
        return {
          status: "NOT_ELIGIBLE" as const,
          reason: "ANALYSIS_EXPIRED" as const,
        };
      }
      if (amount.currency !== report.dcdOffer.notionalCurrency) {
        return {
          status: "NOT_ELIGIBLE" as const,
          reason: "AMOUNT_CURRENCY_MISMATCH" as const,
        };
      }
      const confirmationId = id();
      const quoteExpiresAt = new Date(
        Math.min(
          Date.parse(report.expiresAt),
          preparedAt.getTime() + options.ttlMs,
        ),
      ).toISOString();
      const summary: ConfirmationSummary = {
        confirmationId,
        analysisId: report.analysisId,
        productId: report.dcdOffer.productId,
        amount,
        notionalCurrency: report.dcdOffer.notionalCurrency,
        minimumAnnualizedYield: report.dcdOffer.annualizedYield,
        quoteExpiresAt,
        live: true,
        settlementScenarios: report.stressScenarios.map((scenario) => ({
          id: scenario.id,
          settlementCurrency: scenario.settlementCurrency,
          underlyingPrice: scenario.underlyingPrice,
          portfolioValue: scenario.portfolioValue,
        })),
        mainRisks: risks(report),
      };
      entries.set(confirmationId, {
        summary,
        state: "AWAITING_CONFIRMATION",
      });
      return {
        status: "AWAITING_CONFIRMATION" as const,
        confirmation: summary,
      };
    },

    reject(confirmationId: string) {
      const entry = entries.get(confirmationId);
      if (!entry) return { status: "NOT_FOUND" as const };
      if (entry.state !== "AWAITING_CONFIRMATION") {
        return { status: "ALREADY_CONSUMED" as const };
      }
      entry.state = "REJECTED_BY_USER";
      return {
        status: "REJECTED_BY_USER" as const,
        rejectedAt: now().toISOString(),
      };
    },

    async confirmAndExecute(
      confirmationId: string,
      writer: ConfirmedExecutionWriter,
    ) {
      const entry = entries.get(confirmationId);
      if (!entry) return { status: "NOT_FOUND" as const };
      if (entry.state === "REJECTED_BY_USER") {
        return { status: "REJECTED_BY_USER" as const };
      }
      if (entry.state === "SUBMISSION_UNKNOWN") {
        return { status: "RECONCILIATION_REQUIRED" as const };
      }
      if (entry.state !== "AWAITING_CONFIRMATION") {
        return { status: "ALREADY_CONSUMED" as const };
      }
      if (Date.parse(entry.summary.quoteExpiresAt) <= now().getTime()) {
        entry.state = "EXPIRED";
        return { status: "EXPIRED_REANALYSIS_REQUIRED" as const };
      }

      entry.state = "SUBMITTING";
      try {
        const result = await writer.submit({
          confirmationId: entry.summary.confirmationId,
          analysisId: entry.summary.analysisId,
          productId: entry.summary.productId,
          amount: entry.summary.amount,
          notionalCurrency: entry.summary.notionalCurrency,
          minimumAnnualizedYield: entry.summary.minimumAnnualizedYield,
        });
        entry.state = "SUBMITTED";
        return {
          status: "SUBMITTED" as const,
          submissionId: result.submissionId,
        };
      } catch {
        entry.state = "SUBMISSION_UNKNOWN";
        return {
          status: "SUBMISSION_UNKNOWN" as const,
          reconciliationRequired: true as const,
        };
      }
    },
  };
}
