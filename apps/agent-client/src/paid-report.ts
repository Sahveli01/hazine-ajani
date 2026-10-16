import {
  type AnalysisReport,
  parseAnalysisReport,
} from "@hazine-ajani/report-schema";
import { AVALANCHE_FUJI } from "@hazine-ajani/avalanche";
import { isAddress, type Hex } from "viem";

type SuccessfulSettlement = {
  success: boolean;
  payer?: string;
  transaction: string;
  network: string;
  amount?: string;
};

export type FujiSettlementConfirmation = {
  transactionHash: `0x${string}`;
  confirmedAt: string;
};

type ConfirmationRequest = {
  transactionHash: `0x${string}`;
  payer: `0x${string}`;
  payTo: `0x${string}`;
  amount: bigint;
};

type FinalizePaidReportInput = {
  body: unknown;
  settlement: SuccessfulSettlement;
  expectedPayTo: string;
  confirmSettlement: (
    request: ConfirmationRequest,
  ) => Promise<FujiSettlementConfirmation>;
  replayGuard: SettlementReplayGuard;
};

export class SettlementReplayGuard {
  readonly #transactions = new Set<string>();

  async consume<T>(
    transactionHash: string,
    task: () => Promise<T>,
  ): Promise<T> {
    const normalized = transactionHash.toLowerCase();
    if (this.#transactions.has(normalized)) {
      throw new Error("x402 settlement replay detected");
    }
    this.#transactions.add(normalized);
    try {
      return await task();
    } catch (error) {
      this.#transactions.delete(normalized);
      throw error;
    }
  }
}

function isTransactionHash(value: string): value is Hex {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

export async function finalizeFujiPaidReport({
  body,
  settlement,
  expectedPayTo,
  confirmSettlement,
  replayGuard,
}: FinalizePaidReportInput): Promise<AnalysisReport> {
  const report = parseAnalysisReport(body);
  if (report.x402Payment) {
    throw new Error("Paid response already contains x402 settlement data");
  }
  if (
    settlement.success !== true ||
    settlement.network !== AVALANCHE_FUJI.network ||
    (settlement.amount !== undefined && settlement.amount !== "10000") ||
    !isTransactionHash(settlement.transaction) ||
    !settlement.payer ||
    !isAddress(settlement.payer, { strict: true }) ||
    !isAddress(expectedPayTo, { strict: true })
  ) {
    throw new Error("Fuji x402 settlement evidence is invalid");
  }

  const transactionHash = settlement.transaction;
  const payer = settlement.payer;
  const payTo = expectedPayTo;

  return replayGuard.consume(transactionHash, async () => {
    const confirmation = await confirmSettlement({
      transactionHash,
      payer,
      payTo,
      amount: 10_000n,
    });
    if (
      confirmation.transactionHash.toLowerCase() !==
      transactionHash.toLowerCase()
    ) {
      throw new Error("Fuji RPC confirmed a different transaction");
    }

    return parseAnalysisReport({
      ...report,
      x402Payment: {
        network: AVALANCHE_FUJI.network,
        chainId: AVALANCHE_FUJI.chainId,
        testnet: true,
        token: "USDC",
        amount: { value: "0.01", scale: 6, currency: "USDC" },
        payer,
        payTo,
        transactionHash,
        explorerUrl: `${AVALANCHE_FUJI.explorerUrl}/tx/${transactionHash}`,
        confirmedAt: confirmation.confirmedAt,
      },
    });
  });
}
