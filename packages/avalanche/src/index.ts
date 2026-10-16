import { isAddress } from "viem";

export const AVALANCHE_FUJI = {
  label: "Avalanche Fuji Testnet",
  network: "eip155:43113",
  chainId: 43_113,
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  explorerUrl: "https://testnet.snowtrace.io",
  usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
  usdcName: "USD Coin",
  usdcVersion: "2",
  facilitatorUrl: "https://facilitator.ultravioletadao.xyz",
} as const;

export function assertFujiUsdcDomain(name: string, version: string): void {
  if (
    name !== AVALANCHE_FUJI.usdcName ||
    version !== AVALANCHE_FUJI.usdcVersion
  ) {
    throw new Error(
      `Fuji test USDC EIP-712 domain mismatch: expected ${AVALANCHE_FUJI.usdcName} v${AVALANCHE_FUJI.usdcVersion}`,
    );
  }
}

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
      extra: {
        name: AVALANCHE_FUJI.usdcName,
        version: AVALANCHE_FUJI.usdcVersion,
      },
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
  extra?: {
    name?: string;
    version?: string;
  };
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
      candidate.extra?.name === AVALANCHE_FUJI.usdcName &&
      candidate.extra?.version === AVALANCHE_FUJI.usdcVersion &&
      BigInt(candidate.amount) > 0n &&
      BigInt(candidate.amount) <= 10_000n
    );
  } catch {
    return false;
  }
}
