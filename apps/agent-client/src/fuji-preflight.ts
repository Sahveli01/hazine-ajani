import { AVALANCHE_FUJI, assertFujiUsdcDomain } from "@hazine-ajani/avalanche";
import { createPublicClient, http, parseAbi } from "viem";

const client = createPublicClient({ transport: http(AVALANCHE_FUJI.rpcUrl) });
const domainAbi = parseAbi([
  "function name() view returns (string)",
  "function version() view returns (string)",
]);

const [name, version] = await Promise.all([
  client.readContract({
    address: AVALANCHE_FUJI.usdcAddress,
    abi: domainAbi,
    functionName: "name",
  }),
  client.readContract({
    address: AVALANCHE_FUJI.usdcAddress,
    abi: domainAbi,
    functionName: "version",
  }),
]);

assertFujiUsdcDomain(name, version);
console.log(`Fuji test USDC domain dogrulandi: ${name} v${version}`);
