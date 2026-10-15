import { serve } from "@hono/node-server";
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

type AppConfig = {
  payTo: string;
  facilitatorClient?: FacilitatorClient;
  analysis?: {
    request: LiveAnalysisRequest;
    run(request: LiveAnalysisRequest): Promise<LiveAnalysisResult>;
  };
};

export async function createApp({
  payTo,
  facilitatorClient,
  analysis,
}: AppConfig) {
  const paymentRequirements = createFujiPaymentRequirements(payTo);
  const facilitator =
    facilitatorClient ??
    new HTTPFacilitatorClient({ url: AVALANCHE_FUJI.facilitatorUrl });
  const resourceServer = new x402ResourceServer(facilitator).register(
    AVALANCHE_FUJI.network,
    new ExactEvmScheme(),
  );
  await resourceServer.initialize();

  const app = new Hono();

  const canonicalAnalysis = async (context: Context) => {
    if (!analysis)
      return context.json({ status: "ANALYSIS_NOT_CONFIGURED" }, 503);
    const result = await analysis.run(analysis.request);
    return result.status === "SUCCESS"
      ? context.json(result.report)
      : context.json(result, result.status === "NO_SUITABLE_PROXY" ? 422 : 503);
  };

  app.get("/health", (context) => context.json({ status: "ok" }));
  app.get("/api/analysis", canonicalAnalysis);

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

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = await createApp({
    payTo: process.env.X402_PAY_TO_ADDRESS ?? "",
  });
  serve({ fetch: app.fetch, port: 3001 });
}
