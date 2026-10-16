import { AVALANCHE_FUJI } from "@hazine-ajani/avalanche";
import { parseAnalysisReport } from "@hazine-ajani/report-schema";
import {
  createPublicClient,
  decodeEventLog,
  http,
  isAddress,
  isAddressEqual,
  parseAbi,
} from "viem";
import { avalancheFuji } from "viem/chains";

import {
  paidReportStoreFromEnv,
  type FilePaidReportStore,
} from "../paid-report-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const transferAbi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

type ConfirmationBody = {
  settlement?: {
    success?: boolean;
    network?: string;
    transaction?: string;
    payer?: string;
    amount?: string;
  };
  payTo?: string;
};

export async function confirmPaidReport(
  input: ConfirmationBody,
  expectedPayTo: string,
  client = createPublicClient({
    chain: avalancheFuji,
    transport: http(AVALANCHE_FUJI.rpcUrl),
  }),
  store?: FilePaidReportStore,
) {
  const settlement = input.settlement;
  if (
    settlement?.success !== true ||
    settlement.network !== AVALANCHE_FUJI.network ||
    !settlement.transaction?.match(/^0x[0-9a-fA-F]{64}$/) ||
    !settlement.payer ||
    !isAddress(settlement.payer, { strict: true }) ||
    !isAddress(expectedPayTo, { strict: true }) ||
    input.payTo?.toLowerCase() !== expectedPayTo.toLowerCase() ||
    (settlement.amount !== undefined && settlement.amount !== "10000")
  ) {
    throw new Error("INVALID_SETTLEMENT");
  }
  const reportStore = store ?? paidReportStoreFromEnv();
  const report = await reportStore.load(settlement.transaction);
  if (report.x402Payment) throw new Error("ALREADY_PAID");
  const transactionHash = settlement.transaction as `0x${string}`;
  return reportStore.consume(transactionHash, async () => {
    const receipt = await client.getTransactionReceipt({
      hash: transactionHash,
    });
    if (receipt.status !== "success") throw new Error("REVERTED");
    const exactTransfer = receipt.logs.some((log) => {
      if (!isAddressEqual(log.address, AVALANCHE_FUJI.usdcAddress))
        return false;
      try {
        const decoded = decodeEventLog({
          abi: transferAbi,
          eventName: "Transfer",
          topics: log.topics,
          data: log.data,
        });
        return (
          isAddressEqual(
            decoded.args.from,
            settlement.payer as `0x${string}`,
          ) &&
          isAddressEqual(decoded.args.to, expectedPayTo) &&
          decoded.args.value === 10_000n
        );
      } catch {
        return false;
      }
    });
    if (!exactTransfer) throw new Error("TRANSFER_MISMATCH");
    const block = await client.getBlock({ blockNumber: receipt.blockNumber });
    return parseAnalysisReport({
      ...report,
      x402Payment: {
        network: AVALANCHE_FUJI.network,
        chainId: AVALANCHE_FUJI.chainId,
        testnet: true,
        token: "USDC",
        amount: { value: "0.01", scale: 6, currency: "USDC" },
        payer: settlement.payer,
        payTo: expectedPayTo,
        transactionHash,
        explorerUrl: `${AVALANCHE_FUJI.explorerUrl}/tx/${transactionHash}`,
        confirmedAt: new Date(Number(block.timestamp) * 1_000).toISOString(),
      },
    });
  });
}

export async function POST(request: Request) {
  try {
    const expectedPayTo = process.env.X402_PAY_TO_ADDRESS;
    if (!expectedPayTo) {
      return Response.json(
        { code: "PAYMENT_CONFIG_UNAVAILABLE" },
        { status: 503 },
      );
    }
    return Response.json(
      await confirmPaidReport(
        (await request.json()) as ConfirmationBody,
        expectedPayTo,
      ),
    );
  } catch (error) {
    const internal = error instanceof Error ? error.message : "";
    const code = publicConfirmationError(internal);
    return Response.json(
      { code },
      {
        status:
          code === "REVERTED" || code === "SETTLEMENT_REPLAY"
            ? 409
            : code === "PAYMENT_STORE_UNAVAILABLE"
              ? 503
              : 422,
      },
    );
  }
}

export function publicConfirmationError(internal: string) {
  return internal === "REVERTED"
    ? "REVERTED"
    : internal === "SETTLEMENT_REPLAY"
      ? "SETTLEMENT_REPLAY"
      : internal === "PAYMENT_STORE_UNAVAILABLE"
        ? "PAYMENT_STORE_UNAVAILABLE"
        : "CONFIRMATION_FAILED";
}
