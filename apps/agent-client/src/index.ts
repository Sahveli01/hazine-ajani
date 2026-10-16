import {
  AVALANCHE_FUJI,
  createFujiPaymentRequirements,
  isAllowedFujiPayment,
} from "@hazine-ajani/avalanche";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { decodePaymentResponseHeader, wrapFetchWithPayment } from "@x402/fetch";
import { privateKeyToAccount } from "viem/accounts";

type ClientConfig = {
  privateKey: string;
  expectedPayTo: string;
};

export function createFujiPaidFetch({
  privateKey,
  expectedPayTo,
}: ClientConfig) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("X402_CLIENT_PRIVATE_KEY must be a 32-byte hex value");
  }
  createFujiPaymentRequirements(expectedPayTo);

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const client = x402Client.fromConfig({
    schemes: [
      {
        network: AVALANCHE_FUJI.network,
        client: new ExactEvmScheme(account),
      },
    ],
    spendControls: {
      allowedAssets: [
        {
          network: AVALANCHE_FUJI.network,
          asset: AVALANCHE_FUJI.usdcAddress,
          maxAmountPerPayment: "10000",
        },
      ],
    },
    policies: [
      (_version, requirements) =>
        requirements.filter((requirement) =>
          isAllowedFujiPayment(requirement, expectedPayTo),
        ),
    ],
  });

  return wrapFetchWithPayment(fetch, client);
}

type PaidFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class PaidResourceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly settled: boolean,
    readonly responseBody: unknown,
    readonly settlement?: ReturnType<typeof decodePaymentResponseHeader>,
  ) {
    super(message);
    this.name = "PaidResourceError";
  }
}

async function responseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function executeFujiPaidRequest(
  paidFetch: PaidFetch,
  resourceUrl: string,
) {
  const response = await paidFetch(resourceUrl, {
    headers: { accept: "application/json" },
  });
  const body = await responseBody(response);
  const encodedSettlement = response.headers.get("payment-response");
  let settlement: ReturnType<typeof decodePaymentResponseHeader> | undefined;
  if (encodedSettlement) {
    try {
      settlement = decodePaymentResponseHeader(encodedSettlement);
    } catch {
      settlement = undefined;
    }
  }
  if (!response.ok) {
    const reason = settlement?.errorReason ? `: ${settlement.errorReason}` : "";
    throw new PaidResourceError(
      `Paid resource returned HTTP ${response.status}${reason}`,
      response.status,
      settlement?.success === true,
      body,
      settlement,
    );
  }
  if (!encodedSettlement) {
    throw new PaidResourceError(
      "Paid response did not include settlement evidence",
      response.status,
      false,
      body,
    );
  }
  settlement ??= decodePaymentResponseHeader(encodedSettlement);
  if (
    !settlement.success ||
    settlement.network !== AVALANCHE_FUJI.network ||
    !/^0x[0-9a-fA-F]{64}$/.test(settlement.transaction)
  ) {
    throw new Error("Fuji settlement evidence is invalid or unsuccessful");
  }
  return { settlement, body };
}

export async function executeFujiPaidRequestWithRetry(
  paidFetch: PaidFetch,
  resourceUrl: string,
  maxAttempts = 3,
  wait: (milliseconds: number) => Promise<void> = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error("maxAttempts must be a positive integer");
  }
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await executeFujiPaidRequest(paidFetch, resourceUrl);
    } catch (error) {
      const retryable =
        error instanceof PaidResourceError &&
        error.status === 422 &&
        !error.settled &&
        attempt < maxAttempts;
      if (!retryable) throw error;
      await wait(1_000);
    }
  }
  throw new Error("Unreachable paid request retry state");
}
