import { decodeEventLog, isAddressEqual, parseAbi, type Hex } from "viem";

import { AVALANCHE_FUJI } from "@hazine-ajani/avalanche";
import type { FujiSettlementConfirmation } from "./paid-report.js";

const transferAbi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

type ConfirmationRequest = {
  transactionHash: `0x${string}`;
  payer: `0x${string}`;
  payTo: `0x${string}`;
  amount: bigint;
};

type FujiReceiptClient = {
  getTransactionReceipt(args: { hash: `0x${string}` }): Promise<{
    status: "success" | "reverted";
    transactionHash: `0x${string}`;
    blockNumber: bigint;
    logs: ReadonlyArray<{
      address: `0x${string}`;
      topics: [] | [Hex, ...Hex[]];
      data: Hex;
    }>;
  }>;
  getBlock(args: { blockNumber: bigint }): Promise<{ timestamp: bigint }>;
};

export async function confirmFujiUsdcSettlement(
  request: ConfirmationRequest,
  client: FujiReceiptClient,
): Promise<FujiSettlementConfirmation> {
  const receipt = await client.getTransactionReceipt({
    hash: request.transactionHash,
  });
  if (
    receipt.status !== "success" ||
    receipt.transactionHash.toLowerCase() !==
      request.transactionHash.toLowerCase()
  ) {
    throw new Error("Fuji transaction receipt is not successful");
  }

  const hasExactTransfer = receipt.logs.some((log) => {
    if (!isAddressEqual(log.address, AVALANCHE_FUJI.usdcAddress)) return false;
    try {
      const decoded = decodeEventLog({
        abi: transferAbi,
        eventName: "Transfer",
        topics: log.topics,
        data: log.data,
      });
      return (
        isAddressEqual(decoded.args.from, request.payer) &&
        isAddressEqual(decoded.args.to, request.payTo) &&
        decoded.args.value === request.amount
      );
    } catch {
      return false;
    }
  });
  if (!hasExactTransfer) {
    throw new Error("Fuji receipt lacks the expected test USDC transfer");
  }

  const block = await client.getBlock({ blockNumber: receipt.blockNumber });
  return {
    transactionHash: receipt.transactionHash,
    confirmedAt: new Date(Number(block.timestamp) * 1_000).toISOString(),
  };
}
