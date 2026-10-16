import { serve } from "@hono/node-server";
import { AVALANCHE_FUJI } from "@hazine-ajani/avalanche";
import { x402Facilitator } from "@x402/core/facilitator";
import {
  PaymentPayloadSchema,
  PaymentRequirementsSchema,
} from "@x402/core/schemas";
import type { PaymentPayload, PaymentRequirements } from "@x402/core/types";
import { toFacilitatorEvmSigner } from "@x402/evm";
import { registerExactEvmScheme } from "@x402/evm/exact/facilitator";
import { Hono } from "hono";
import { pathToFileURL } from "node:url";
import { createPublicClient, createWalletClient, http } from "viem";
import { avalancheFuji } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import { resolvePort } from "./index.js";

type FacilitatorRequest = {
  paymentPayload: unknown;
  paymentRequirements: unknown;
};

function parseFacilitatorRequest(value: unknown) {
  if (typeof value !== "object" || value === null) return null;
  const request = value as Partial<FacilitatorRequest>;
  const payload = PaymentPayloadSchema.safeParse(request.paymentPayload);
  const requirements = PaymentRequirementsSchema.safeParse(
    request.paymentRequirements,
  );
  if (!payload.success || !requirements.success) return null;
  if (payload.data.x402Version !== 2 || !("amount" in requirements.data)) {
    return null;
  }
  return {
    payload: payload.data as PaymentPayload,
    requirements: requirements.data as PaymentRequirements,
  };
}

export function createFacilitatorHttpApp(facilitator: x402Facilitator) {
  const app = new Hono();
  app.get("/health", (context) =>
    context.json({ status: "ok", network: AVALANCHE_FUJI.network }),
  );
  app.get("/supported", (context) => context.json(facilitator.getSupported()));
  app.post("/verify", async (context) => {
    const request = parseFacilitatorRequest(await context.req.json());
    if (!request) return context.json({ error: "invalid_request" }, 400);
    return context.json(
      await facilitator.verify(request.payload, request.requirements),
    );
  });
  app.post("/settle", async (context) => {
    const request = parseFacilitatorRequest(await context.req.json());
    if (!request) return context.json({ error: "invalid_request" }, 400);
    return context.json(
      await facilitator.settle(request.payload, request.requirements),
    );
  });
  return app;
}

export function createFujiFacilitator(privateKey: string) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("LOCAL_FACILITATOR_PRIVATE_KEY is missing or invalid");
  }
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const publicClient = createPublicClient({
    chain: avalancheFuji,
    transport: http(AVALANCHE_FUJI.rpcUrl),
  });
  const walletClient = createWalletClient({
    account,
    chain: avalancheFuji,
    transport: http(AVALANCHE_FUJI.rpcUrl),
  });
  const signer = toFacilitatorEvmSigner(
    {
      address: account.address,
      readContract: (args) => publicClient.readContract(args),
      verifyTypedData: (args) => publicClient.verifyTypedData(args as never),
      writeContract: (args) => walletClient.writeContract(args),
      sendTransaction: (args) => walletClient.sendTransaction(args as never),
      waitForTransactionReceipt: async (args) => {
        const receipt = await publicClient.waitForTransactionReceipt(args);
        return { status: receipt.status, logs: receipt.logs };
      },
      getCode: (args) => publicClient.getCode(args),
    },
    { confirmationTimeoutMs: 60_000 },
  );
  return registerExactEvmScheme(new x402Facilitator(), {
    signer,
    networks: AVALANCHE_FUJI.network,
    simulateInSettle: true,
  });
}

export function isLocalFacilitatorDirectExecution(
  moduleUrl: string,
  entryPoint: string | undefined,
): boolean {
  return (
    entryPoint !== undefined && moduleUrl === pathToFileURL(entryPoint).href
  );
}

if (isLocalFacilitatorDirectExecution(import.meta.url, process.argv[1])) {
  const facilitator = createFujiFacilitator(
    process.env.LOCAL_FACILITATOR_PRIVATE_KEY ?? "",
  );
  serve({
    fetch: createFacilitatorHttpApp(facilitator).fetch,
    port: resolvePort(process.env.PORT, 3002),
  });
}
