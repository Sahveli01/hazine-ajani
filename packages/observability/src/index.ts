export type AnalysisToolName =
  | "OKX_DCD_PRODUCTS"
  | "OKX_SIMPLE_EARN"
  | "OKX_SPOT_TICKER"
  | "OKX_OPTION_MARKET";

type ToolEvent = {
  type: "TOOL_CALL";
  tool: AnalysisToolName;
  status: "OK" | "ERROR";
  startedAt: string;
  finishedAt: string;
  latencyMs: number;
  errorCode?: string;
};

type DecisionEvent = {
  type: "DECISION";
  decision: "ACCEPT" | "ASK" | "REJECT";
  reasonCodes: string[];
  recordedAt: string;
};

export type AnalysisTraceSnapshot = {
  analysisId: string;
  correlationId: string;
  events: Array<ToolEvent | DecisionEvent>;
};

const safeErrorCodes = new Set([
  "AUTHENTICATION",
  "CLI_FAILURE",
  "EMPTY_DATA",
  "INVALID_PAYLOAD",
  "RATE_LIMIT",
  "REGIONAL_UNAVAILABLE",
  "STALE_DATA",
  "TIMEOUT",
]);

function errorCode(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    safeErrorCodes.has(error.code)
  ) {
    return error.code;
  }
  return "UNKNOWN";
}

export function createAnalysisTrace(input: {
  analysisId: string;
  correlationId: string;
  now?: () => Date;
}) {
  const now = input.now ?? (() => new Date());
  const events: AnalysisTraceSnapshot["events"] = [];
  return {
    async run<T>(
      tool: AnalysisToolName,
      operation: () => Promise<T>,
    ): Promise<T> {
      const started = now();
      try {
        const result = await operation();
        const finished = now();
        events.push({
          type: "TOOL_CALL",
          tool,
          status: "OK",
          startedAt: started.toISOString(),
          finishedAt: finished.toISOString(),
          latencyMs: Math.max(0, finished.getTime() - started.getTime()),
        });
        return result;
      } catch (error) {
        const finished = now();
        events.push({
          type: "TOOL_CALL",
          tool,
          status: "ERROR",
          errorCode: errorCode(error),
          startedAt: started.toISOString(),
          finishedAt: finished.toISOString(),
          latencyMs: Math.max(0, finished.getTime() - started.getTime()),
        });
        throw error;
      }
    },
    recordDecision(decision: DecisionEvent["decision"], reasonCodes: string[]) {
      events.push({
        type: "DECISION",
        decision,
        reasonCodes: [...reasonCodes],
        recordedAt: now().toISOString(),
      });
    },
    snapshot(): AnalysisTraceSnapshot {
      return {
        analysisId: input.analysisId,
        correlationId: input.correlationId,
        events: events.map((event) => ({ ...event })),
      };
    },
  };
}
