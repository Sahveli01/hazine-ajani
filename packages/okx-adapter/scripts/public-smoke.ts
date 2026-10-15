import { createCliReadTransport, createOkxReadAdapter } from "../src/index.js";

const optionId = process.argv[2];
const adapter = createOkxReadAdapter({
  transport: createCliReadTransport(),
  privateProfile: "unused-for-public-smoke",
});

const spot = await adapter.readSpotTicker("BTC-USDT");
const result: Record<string, unknown> = {
  spot: spot.data.instrumentId,
  spotSource: spot.source,
  spotServerTime: spot.serverTime,
  spotReceivedAt: spot.receivedAt,
  spotExpiresAt: spot.expiresAt,
};

if (optionId) {
  const option = await adapter.readOptionMarket(optionId);
  result.option = option.data.option.instrumentId;
  result.optionSource = option.source;
  result.optionServerTime = option.serverTime;
  result.optionReceivedAt = option.receivedAt;
  result.optionExpiresAt = option.expiresAt;
}

console.log(JSON.stringify(result, null, 2));
