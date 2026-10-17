import { serve } from "@hono/node-server";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import {
  AVALANCHE_FUJI,
  createFujiPaymentRequirements,
} from "@hazine-ajani/avalanche";
import {
  HTTPFacilitatorClient,
  type FacilitatorClient,
} from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { Hono, type Context } from "hono";

import type {
  LiveAnalysisRequest,
  LiveAnalysisResult,
} from "./analysis-orchestrator.js";
import { createRuntimeAnalysis } from "./runtime-analysis.js";

type AppConfig = {
  payTo: string;
  facilitatorClient?: FacilitatorClient;
  facilitatorUrl?: string;
  analysis?: {
    request: LiveAnalysisRequest;
    run(request: LiveAnalysisRequest): Promise<LiveAnalysisResult>;
  };
  deployment?: { commit?: string };
  requestId?: () => string;
  log?: (entry: Record<string, unknown>) => void;
};

export async function createApp({
  payTo,
  facilitatorClient,
  facilitatorUrl,
  analysis,
  deployment,
  requestId = () => `req_${randomUUID().replaceAll("-", "")}`,
  log = (entry) => console.log(JSON.stringify(entry)),
}: AppConfig) {
  const paymentRequirements = createFujiPaymentRequirements(payTo);
  const facilitator =
    facilitatorClient ??
    new HTTPFacilitatorClient({
      url: facilitatorUrl ?? AVALANCHE_FUJI.facilitatorUrl,
    });
  const resourceServer = new x402ResourceServer(facilitator).register(
    AVALANCHE_FUJI.network,
    new ExactEvmScheme(),
  );
  await resourceServer.initialize();

  const app = new Hono();
  let preparedAnalysis:
    | {
        result: Extract<LiveAnalysisResult, { status: "SUCCESS" }>;
        expiresAt: number;
      }
    | undefined;

  const runCanonicalAnalysis = async (): Promise<
    LiveAnalysisResult | undefined
  > => {
    if (!analysis) return undefined;
    if (preparedAnalysis && preparedAnalysis.expiresAt > Date.now()) {
      return preparedAnalysis.result;
    }
    const result = await analysis.run(analysis.request);
    if (result.status === "SUCCESS") {
      preparedAnalysis = { result, expiresAt: Date.now() + 30_000 };
    }
    return result;
  };

  app.use("*", async (context, next) => {
    const startedAt = Date.now();
    const correlationId = requestId();
    context.header("x-correlation-id", correlationId);
    await next();
    log({
      type: "HTTP_REQUEST",
      correlationId,
      method: context.req.method,
      path: new URL(context.req.url).pathname,
      status: context.res.status,
      latencyMs: Date.now() - startedAt,
    });
  });

  const canonicalAnalysis = async (context: Context) => {
    const result = await runCanonicalAnalysis();
    if (!result)
      return context.json({ status: "ANALYSIS_NOT_CONFIGURED" }, 503);
    return result.status === "SUCCESS"
      ? context.json(result.report)
      : context.json(result, result.status === "NO_SUITABLE_PROXY" ? 422 : 503);
  };

  app.get("/health", (context) =>
    context.json({
      status: "ok",
      service: "hazine-ajani-api",
      okxDiagnostics: "process-output-v2",
      ...(deployment?.commit ? { commit: deployment.commit } : {}),
    }),
  );
  app.get("/ready", (context) =>
    analysis
      ? context.json({ status: "ready" })
      : context.json({ status: "not_ready" }, 503),
  );
  app.get("/api/analysis", canonicalAnalysis);

  app.use("/api/agent/risk-report", async (context, next) => {
    if (!analysis) return next();
    const result = await runCanonicalAnalysis();
    if (result?.status === "SUCCESS") return next();
    return result
      ? context.json(result, result.status === "NO_SUITABLE_PROXY" ? 422 : 503)
      : context.json({ status: "ANALYSIS_NOT_CONFIGURED" }, 503);
  });

  app.use(
    paymentMiddleware(
      {
        "GET /api/agent/risk-report": {
          accepts: [paymentRequirements],
          description: "Hazine Ajani risk report access spike",
          mimeType: "application/json",
        },
      },
      resourceServer,
      undefined,
      undefined,
      false,
    ),
  );

  app.get("/api/agent/risk-report", canonicalAnalysis);

  return app;
}

export function isDirectExecution(
  moduleUrl: string,
  entryPoint: string | undefined,
): boolean {
  return (
    entryPoint !== undefined && moduleUrl === pathToFileURL(entryPoint).href
  );
}

export function resolvePort(
  value: string | undefined,
  fallback: number,
): number {
  const port = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("port must be an integer between 1 and 65535");
  }
  return port;
}

if (isDirectExecution(import.meta.url, process.argv[1])) {
  const analysis = createRuntimeAnalysis(process.env);
  const deployCommit =
    process.env.DEPLOY_COMMIT ?? process.env.RAILWAY_GIT_COMMIT_SHA;
  const app = await createApp({
    payTo: process.env.X402_PAY_TO_ADDRESS ?? "",
    ...(process.env.X402_FACILITATOR_URL
      ? { facilitatorUrl: process.env.X402_FACILITATOR_URL }
      : {}),
    ...(analysis ? { analysis } : {}),
    ...(deployCommit ? { deployment: { commit: deployCommit } } : {}),
  });
  serve({ fetch: app.fetch, port: resolvePort(process.env.PORT, 3001) });
}
