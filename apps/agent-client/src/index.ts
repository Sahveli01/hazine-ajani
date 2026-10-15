import {
  AVALANCHE_FUJI,
  createFujiPaymentRequirements,
  isAllowedFujiPayment,
} from "@hazine-ajani/avalanche";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { wrapFetchWithPayment } from "@x402/fetch";
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
