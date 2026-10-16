"use client";

import { AVALANCHE_FUJI, isAllowedFujiPayment } from "@hazine-ajani/avalanche";
import type { AnalysisReport } from "@hazine-ajani/report-schema";
import { x402Client } from "@x402/core/client";
import {
  decodePaymentRequiredHeader,
  decodePaymentResponseHeader,
} from "@x402/core/http";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import { isAddress, type Hex } from "viem";

import type { AgentPaymentState } from "./agent-payment-view-model";

export type Eip1193Provider = {
  request(args: {
    method: string;
    params?: readonly unknown[];
  }): Promise<unknown>;
};

const FUJI_HEX_CHAIN_ID = "0xa869";

function isHex(value: unknown): value is Hex {
  return typeof value === "string" && /^0x[0-9a-fA-F]+$/.test(value);
}

function errorCode(error: unknown): number | undefined {
  return typeof error === "object" && error !== null && "code" in error
    ? Number(error.code)
    : undefined;
}

export async function ensureFujiNetwork(provider: Eip1193Provider) {
  const chainId = await provider.request({ method: "eth_chainId" });
  if (chainId === FUJI_HEX_CHAIN_ID) return;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: FUJI_HEX_CHAIN_ID }],
    });
  } catch (error) {
    if (errorCode(error) !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: FUJI_HEX_CHAIN_ID,
          chainName: AVALANCHE_FUJI.label,
          nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
          rpcUrls: [AVALANCHE_FUJI.rpcUrl],
          blockExplorerUrls: [AVALANCHE_FUJI.explorerUrl],
        },
      ],
    });
  }
}

export function paymentFailureState(error: unknown): AgentPaymentState {
  if (errorCode(error) === 4001) return { status: "USER_REJECTED" };
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("insufficient") || message.includes("balance")) {
    return { status: "INSUFFICIENT_BALANCE" };
  }
  if (message.includes("revert")) return { status: "REVERTED" };
  return { status: "FACILITATOR_ERROR" };
}

function stringifyTypedData(value: unknown): string {
  return JSON.stringify(value, (_key: string, item: unknown) =>
    typeof item === "bigint" ? item.toString() : item,
  );
}

function paymentRequirement(response: Response) {
  const header = response.headers.get("payment-required");
  if (!header)
    throw new Error("Paid endpoint did not return an x402 challenge");
  const challenge = decodePaymentRequiredHeader(header);
  const requirement = challenge.accepts.find(
    (candidate) =>
      candidate.network === AVALANCHE_FUJI.network &&
      candidate.scheme === "exact",
  );
  if (!requirement || !isAddress(requirement.payTo, { strict: true })) {
    throw new Error("Paid endpoint did not offer an allowed Fuji payment");
  }
  if (!isAllowedFujiPayment(requirement, requirement.payTo)) {
    throw new Error(
      "Fuji x402 challenge failed the deterministic spend policy",
    );
  }
  return requirement;
}

export async function executeBrowserFujiPayment({
  provider,
  onState: updateState,
  request = fetch,
}: {
  provider: Eip1193Provider;
  onState: (state: AgentPaymentState) => void;
  request?: typeof fetch;
}): Promise<AnalysisReport> {
  try {
    const chainId = await provider.request({ method: "eth_chainId" });
    if (chainId !== FUJI_HEX_CHAIN_ID) {
      updateState({ status: "WRONG_CHAIN" });
      await ensureFujiNetwork(provider);
    }
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    const address: unknown = Array.isArray(accounts) ? accounts[0] : undefined;
    if (typeof address !== "string" || !isAddress(address, { strict: true })) {
      throw new Error("Wallet did not return a valid account");
    }

    const challengeResponse = await request("/api/paid-report", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (challengeResponse.status !== 402) {
      throw new Error("Paid endpoint did not return HTTP 402");
    }
    const requirement = paymentRequirement(challengeResponse);
    const signer = {
      address,
      async signTypedData(message: {
        domain: Record<string, unknown>;
        types: Record<string, unknown>;
        primaryType: string;
        message: Record<string, unknown>;
      }): Promise<Hex> {
        updateState({ status: "AWAITING_SIGNATURE" });
        const signature = await provider.request({
          method: "eth_signTypedData_v4",
          params: [address, stringifyTypedData(message)],
        });
        if (!isHex(signature)) {
          throw new Error("Wallet returned an invalid signature");
        }
        return signature;
      },
    };
    const client = x402Client.fromConfig({
      schemes: [
        {
          network: AVALANCHE_FUJI.network,
          client: new ExactEvmScheme(signer),
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
          requirements.filter((candidate) =>
            isAllowedFujiPayment(candidate, requirement.payTo),
          ),
      ],
    });
    const paidResponse = await wrapFetchWithPayment(request, client)(
      "/api/paid-report",
      { headers: { accept: "application/json" }, cache: "no-store" },
    );
    const settlementHeader = paidResponse.headers.get("payment-response");
    if (!paidResponse.ok || !settlementHeader) {
      throw new Error(
        "Facilitator did not return successful settlement evidence",
      );
    }
    const settlement = decodePaymentResponseHeader(settlementHeader);
    if (
      settlement.success !== true ||
      settlement.network !== AVALANCHE_FUJI.network ||
      !/^0x[0-9a-fA-F]{64}$/.test(settlement.transaction)
    ) {
      throw new Error("Facilitator returned invalid settlement evidence");
    }
    updateState({
      status: "SUBMITTED",
      transactionHash: settlement.transaction,
    });
    updateState({ status: "PENDING", transactionHash: settlement.transaction });

    const confirmation = await request("/api/paid-report/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        settlement,
        payTo: requirement.payTo,
      }),
    });
    const confirmed = (await confirmation.json()) as AnalysisReport & {
      code?: string;
    };
    if (!confirmation.ok || !confirmed.x402Payment) {
      if (confirmed.code === "REVERTED") {
        throw new Error("Fuji receipt reverted");
      }
      throw new Error("Fuji RPC confirmation failed");
    }
    return confirmed;
  } catch (error) {
    updateState(paymentFailureState(error));
    throw error;
  }
}
