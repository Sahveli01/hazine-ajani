import { createPublicClient, http, isAddress, isAddressEqual } from "viem";
import { avalancheFuji } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import { AVALANCHE_FUJI } from "@hazine-ajani/avalanche";

import {
  createFujiPaidFetch,
  executeFujiPaidRequestWithRetry,
} from "./index.js";
import { confirmFujiUsdcSettlement } from "./fuji-confirmation.js";
import {
  finalizeFujiPaidReport,
  SettlementReplayGuard,
} from "./paid-report.js";

const privateKey = process.env.X402_CLIENT_PRIVATE_KEY ?? "";
const expectedPayTo = process.env.X402_PAY_TO_ADDRESS ?? "";
const expectedPayer = process.env.X402_EXPECTED_PAYER ?? "";
const resourceUrl =
  process.env.X402_RESOURCE_URL ??
  "http://127.0.0.1:3001/api/agent/risk-report";

if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error("X402_CLIENT_PRIVATE_KEY is missing or invalid");
}
if (!isAddress(expectedPayer, { strict: true })) {
  throw new Error("X402_EXPECTED_PAYER must be the funded Fuji address");
}

const account = privateKeyToAccount(privateKey as `0x${string}`);
if (!isAddressEqual(account.address, expectedPayer)) {
  throw new Error("Private key does not belong to X402_EXPECTED_PAYER");
}

const paidFetch = createFujiPaidFetch({ privateKey, expectedPayTo });
const result = await executeFujiPaidRequestWithRetry(paidFetch, resourceUrl);
const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(AVALANCHE_FUJI.rpcUrl),
});
const report = await finalizeFujiPaidReport({
  body: result.body,
  settlement: result.settlement,
  expectedPayTo,
  confirmSettlement: (request) =>
    confirmFujiUsdcSettlement(request, publicClient),
  replayGuard: new SettlementReplayGuard(),
});

console.log(
  JSON.stringify(
    {
      network: "Avalanche Fuji Testnet",
      payer: result.settlement.payer,
      amount: result.settlement.amount,
      transaction: result.settlement.transaction,
      resourceStatus: "PAID_REPORT_RPC_CONFIRMED",
      report,
    },
    null,
    2,
  ),
);
