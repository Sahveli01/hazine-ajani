import { createCliReadTransport, createOkxReadAdapter } from "../src/index.js";

const privateProfile = process.env.OKX_READ_PROFILE;
if (!privateProfile) throw new Error("OKX_READ_PROFILE is required");

const adapter = createOkxReadAdapter({
  transport: createCliReadTransport(),
  privateProfile,
});
const [dcd, earn] = await Promise.all([
  adapter.readDcdProducts({
    baseCurrency: "BTC",
    quoteCurrency: "USDT",
    optionType: "P",
  }),
  adapter.readSimpleEarn("USDT"),
]);

console.log(
  JSON.stringify(
    {
      dcdProducts: dcd.data.length,
      dcdSource: dcd.source,
      dcdServerTime: dcd.serverTime,
      dcdReceivedAt: dcd.receivedAt,
      dcdExpiresAt: dcd.expiresAt,
      earnCurrency: earn.data.currency,
      earnSource: earn.source,
      earnServerTime: earn.serverTime,
      earnReceivedAt: earn.receivedAt,
      earnExpiresAt: earn.expiresAt,
    },
    null,
    2,
  ),
);
