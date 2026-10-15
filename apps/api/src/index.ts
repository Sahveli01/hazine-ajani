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
import { Hono } from "hono";

type AppConfig = {
  payTo: string;
  facilitatorClient?: FacilitatorClient;
};

export async function createApp({ payTo, facilitatorClient }: AppConfig) {
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

  app.get("/health", (context) => context.json({ status: "ok" }));

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

  app.get("/api/agent/risk-report", (context) =>
    context.json({
      status: "paid-access-proven",
      network: AVALANCHE_FUJI.label,
      note: "A5 integration spike; live OKX report is added after A3 and A4.",
    }),
  );

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = await createApp({
    payTo: process.env.X402_PAY_TO_ADDRESS ?? "",
  });
  serve({ fetch: app.fetch, port: 3001 });
}
