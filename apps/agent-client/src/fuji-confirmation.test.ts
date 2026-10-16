import { describe, expect, it } from "vitest";
import {
  encodeAbiParameters,
  encodeEventTopics,
  parseAbi,
  type Address,
  type Hex,
} from "viem";

import { AVALANCHE_FUJI } from "@hazine-ajani/avalanche";

import { confirmFujiUsdcSettlement } from "./fuji-confirmation.js";

const PAYER: Address = "0x2222222222222222222222222222222222222222";
const PAY_TO: Address = "0x1111111111111111111111111111111111111111";
const TRANSACTION = `0x${"a".repeat(64)}` as const;
const transferAbi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

function transferLog({
  from = PAYER,
  to = PAY_TO,
  amount = 10_000n,
  address = AVALANCHE_FUJI.usdcAddress,
}: {
  from?: Address;
  to?: Address;
  amount?: bigint;
  address?: Address;
} = {}) {
  return {
    address,
    topics: encodeEventTopics({
      abi: transferAbi,
      eventName: "Transfer",
      args: { from, to },
    }) as [Hex, ...Hex[]],
    data: encodeAbiParameters([{ type: "uint256" }], [amount]),
  };
}

function rpc(
  logs = [transferLog()],
  status: "success" | "reverted" = "success",
) {
  return {
    getTransactionReceipt: () =>
      Promise.resolve({
        status,
        transactionHash: TRANSACTION,
        blockNumber: 59_557_495n,
        logs,
      }),
    getBlock: () => Promise.resolve({ timestamp: 1_760_620_273n }),
  };
}

const request = {
  transactionHash: TRANSACTION,
  payer: PAYER,
  payTo: PAY_TO,
  amount: 10_000n,
};

describe("Fuji USDC settlement confirmation", () => {
  it("requires a successful receipt and the exact USDC Transfer log", async () => {
    await expect(confirmFujiUsdcSettlement(request, rpc())).resolves.toEqual({
      transactionHash: TRANSACTION,
      confirmedAt: "2025-10-16T13:11:13.000Z",
    });
  });

  it.each([
    { label: "reverted receipt", client: rpc([transferLog()], "reverted") },
    { label: "wrong token", client: rpc([transferLog({ address: PAY_TO })]) },
    { label: "wrong recipient", client: rpc([transferLog({ to: PAYER })]) },
    { label: "wrong payer", client: rpc([transferLog({ from: PAY_TO })]) },
    { label: "wrong amount", client: rpc([transferLog({ amount: 9_999n })]) },
    { label: "missing transfer", client: rpc([]) },
  ])("rejects $label", async ({ client }) => {
    await expect(confirmFujiUsdcSettlement(request, client)).rejects.toThrow();
  });
});
