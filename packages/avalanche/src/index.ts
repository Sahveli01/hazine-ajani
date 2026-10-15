import { isAddress } from "viem";

export const AVALANCHE_FUJI = {
  label: "Avalanche Fuji Testnet",
  network: "eip155:43113",
  chainId: 43_113,
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  explorerUrl: "https://testnet.snowtrace.io",
  usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
  facilitatorUrl: "https://facilitator.ultravioletadao.xyz",
} as const;

export function createFujiPaymentRequirements(payTo: string) {
  if (!isAddress(payTo, { strict: true })) {
    throw new Error("X402_PAY_TO_ADDRESS must be a valid EVM address");
  }

  return {
    scheme: "exact",
    network: AVALANCHE_FUJI.network,
    payTo,
    price: {
      asset: AVALANCHE_FUJI.usdcAddress,
      amount: "10000",
      extra: { name: "USD Coin", version: "2" },
    },
    maxTimeoutSeconds: 60,
  } as const;
}

type PaymentCandidate = {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
};

export function isAllowedFujiPayment(
  candidate: PaymentCandidate,
  expectedPayTo: string,
) {
  if (!isAddress(expectedPayTo, { strict: true })) {
    throw new Error("X402_PAY_TO_ADDRESS must be a valid EVM address");
  }

  try {
    return (
      candidate.scheme === "exact" &&
      candidate.network === AVALANCHE_FUJI.network &&
      candidate.asset.toLowerCase() ===
        AVALANCHE_FUJI.usdcAddress.toLowerCase() &&
      candidate.payTo.toLowerCase() === expectedPayTo.toLowerCase() &&
      BigInt(candidate.amount) > 0n &&
      BigInt(candidate.amount) <= 10_000n
    );
  } catch {
    return false;
  }
}
