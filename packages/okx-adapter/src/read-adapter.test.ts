import { describe, expect, it } from "vitest";

import {
  OkxAdapterError,
  createOkxReadAdapter,
  classifyCliFailure,
  normalizeDcdProducts,
  normalizeOptionMarket,
  normalizeSimpleEarn,
  normalizeSpotTicker,
  retryIdempotentRead,
  resolveOkxCliInvocation,
  type OkxReadTransport,
} from "./index.js";

const now = new Date("2026-10-15T19:40:00.000Z");

describe("OKX live payload normalizers", () => {
  it("normalizes a private DCD product with source and expiry metadata", () => {
    const snapshot = normalizeDcdProducts(
      {
        env: "live",
        profile: "okx-tr-read",
        data: [
          {
            productId: "BTC-USDT-261106-79000-P",
            strike: "79000",
            expTime: "1793952000000",
            annualizedYield: "0.2678",
            absYield: "0.01580509",
            quoteTime: "1792090800000",
            minSize: "10",
            maxSize: "100000",
            stepSz: "0.1",
            uly: "BTC-USD",
            baseCcy: "BTC",
            quoteCcy: "USDT",
            notionalCcy: "USDT",
            optType: "P",
          },
        ],
      },
      { receivedAt: now, maxAgeMs: 3_600_000 },
    );

    expect(snapshot.data[0]).toMatchObject({
      productId: "BTC-USDT-261106-79000-P",
      direction: "BUY_LOW",
      strike: { value: "79000", currency: "USDT" },
      annualizedYield: { value: "0.2678" },
    });
    expect(snapshot.source.kind).toBe("OKX_PRIVATE_DCD");
    expect(snapshot.serverTime).toBe("2026-10-15T19:00:00.000Z");
    expect(snapshot.expiresAt).toBe("2026-10-15T20:00:00.000Z");
  });

  it("normalizes exact option, book, Greeks, mark and index payloads", () => {
    const snapshot = normalizeOptionMarket(
      {
        instrument: {
          instId: "BTC-USD-261106-79000-P",
          uly: "BTC-USD",
          optType: "P",
          settleCcy: "BTC",
          ctMult: "0.01",
          stk: "79000",
          expTime: "1793952000000",
        },
        book: {
          bids: [["0.0195", "12", "0", "1"]],
          asks: [["0.0200", "9", "0", "1"]],
          ts: "1792090800000",
        },
        greeks: {
          markVol: "0.62",
          delta: "-0.31",
          gamma: "0.00002",
          theta: "-0.0008",
          vega: "0.0014",
          ts: "1792090800000",
        },
        mark: { markPx: "0.0198", ts: "1792090800000" },
        index: { instId: "BTC-USD", idxPx: "82391.3", ts: "1792090800000" },
      },
      { receivedAt: now, maxAgeMs: 3_600_000 },
    );

    expect(snapshot.data.option).toMatchObject({
      instrumentId: "BTC-USD-261106-79000-P",
      optionType: "PUT",
      bid: { value: "0.0195", currency: "BTC" },
      ask: { value: "0.0200", currency: "BTC" },
    });
    expect(snapshot.data.market.indexPrice).toMatchObject({
      value: "82391.3",
      currency: "USD",
    });
    expect(snapshot.source.kind).toBe("OKX_PUBLIC_OPTION");
  });

  it("normalizes Simple Earn and spot snapshots without inventing missing values", () => {
    const earn = normalizeSimpleEarn(
      {
        env: "live",
        profile: "okx-tr-read",
        data: {
          data: [
            {
              amt: "",
              ccy: "USDT",
              lendingRate: "0.0279",
              ts: "1792090800000",
            },
          ],
          fixedOffers: [],
        },
      },
      { receivedAt: now, maxAgeMs: 3_600_000 },
    );
    const spot = normalizeSpotTicker(
      {
        env: "live",
        profile: "default",
        data: [
          {
            instType: "SPOT",
            instId: "BTC-USDT",
            last: "82391.3",
            bidPx: "82392.2",
            askPx: "82392.3",
            ts: "1792090800000",
          },
        ],
      },
      { receivedAt: now, maxAgeMs: 3_600_000 },
    );

    expect(earn.data).toEqual({
      currency: "USDT",
      annualRate: { value: "0.0279", scale: 4 },
      observedAt: "2026-10-15T19:00:00.000Z",
    });
    expect(spot.data).toMatchObject({
      instrumentId: "BTC-USDT",
      last: { value: "82391.3", currency: "USDT" },
    });
    expect(spot.source.kind).toBe("OKX_PUBLIC_INDEX");
  });

  it("rejects malformed, empty and stale payloads with typed errors", () => {
    expect(() =>
      normalizeSpotTicker(
        { data: [] },
        { receivedAt: now, maxAgeMs: 3_600_000 },
      ),
    ).toThrowError(expect.objectContaining({ code: "EMPTY_DATA" }));
    expect(() =>
      normalizeSpotTicker(
        { data: [{ nope: true }] },
        { receivedAt: now, maxAgeMs: 3_600_000 },
      ),
    ).toThrowError(expect.objectContaining({ code: "INVALID_PAYLOAD" }));
    expect(() =>
      normalizeSpotTicker(
        {
          env: "live",
          profile: "default",
          data: [
            {
              instType: "SPOT",
              instId: "BTC-USDT",
              last: "1",
              bidPx: "1",
              askPx: "2",
              ts: "1792080000000",
            },
          ],
        },
        { receivedAt: now, maxAgeMs: 60_000 },
      ),
    ).toThrowError(expect.objectContaining({ code: "STALE_DATA" }));
  });
});

describe("read boundary", () => {
  it("classifies OKX diagnostics written outside the process error message", () => {
    const failure = Object.assign(new Error("Command failed"), {
      stdout: '{"code":"50038","msg":"DCD Open API feature is disabled"}',
      stderr: "",
    });

    expect(classifyCliFailure(failure)).toEqual({
      code: "AUTH",
      externalCode: "50038",
    });
  });

  it("invokes the installed OKX JavaScript entrypoint without a command shell", () => {
    const invocation = resolveOkxCliInvocation();
    expect(invocation.executable).toBe(process.execPath);
    expect(invocation.prefixArgs[0]?.replaceAll("\\", "/")).toMatch(
      /@okx_ai\/okx-trade-cli\/dist\/index\.js$/,
    );
  });

  it("retries only retryable idempotent read failures within the bound", async () => {
    let attempts = 0;
    const result = await retryIdempotentRead(
      () => {
        attempts += 1;
        if (attempts < 3)
          return Promise.reject(new OkxAdapterError("RATE_LIMIT", "slow down"));
        return Promise.resolve("ok");
      },
      { maxRetries: 2, delayMs: 0 },
    );
    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("does not retry auth or regional failures", async () => {
    let attempts = 0;
    await expect(
      retryIdempotentRead(
        () => {
          attempts += 1;
          return Promise.reject(
            new OkxAdapterError("REGIONAL_UNAVAILABLE", "not offered"),
          );
        },
        { maxRetries: 2, delayMs: 0 },
      ),
    ).rejects.toMatchObject({ code: "REGIONAL_UNAVAILABLE" });
    expect(attempts).toBe(1);
  });

  it("keeps private reads on the named profile and exposes no write command", async () => {
    const calls: Array<{ args: readonly string[]; privateRead: boolean }> = [];
    const transport: OkxReadTransport = {
      execute: (request) => {
        calls.push({ args: request.args, privateRead: request.privateRead });
        return Promise.resolve({
          env: "live",
          profile: "okx-tr-read",
          data: [],
        });
      },
    };
    const adapter = createOkxReadAdapter({
      transport,
      privateProfile: "okx-tr-read",
      now: () => now,
    });

    await expect(
      adapter.readDcdProducts({
        baseCurrency: "BTC",
        quoteCurrency: "USDT",
        optionType: "P",
      }),
    ).rejects.toMatchObject({ code: "EMPTY_DATA" });
    expect(calls[0]).toEqual({
      args: [
        "earn",
        "dcd",
        "products",
        "--baseCcy",
        "BTC",
        "--quoteCcy",
        "USDT",
        "--optType",
        "P",
      ],
      privateRead: true,
    });
    expect(Object.keys(adapter).sort()).toEqual([
      "readDcdProducts",
      "readOptionMarket",
      "readSimpleEarn",
      "readSpotTicker",
    ]);
  });

  it("uses an hourly freshness window for Simple Earn without weakening market quotes", async () => {
    const transport: OkxReadTransport = {
      execute: () =>
        Promise.resolve({
          env: "live",
          profile: "okx-tr-read",
          data: {
            data: [
              {
                amt: "",
                ccy: "USDT",
                lendingRate: "0.0279",
                ts: "1792090800000",
              },
            ],
            fixedOffers: [],
          },
        }),
    };
    const adapter = createOkxReadAdapter({
      transport,
      privateProfile: "okx-tr-read",
      now: () => now,
    });

    const result = await adapter.readSimpleEarn("USDT");

    expect(result.data.annualRate.value).toBe("0.0279");
  });

  it("selects the requested option from broad CLI result arrays", async () => {
    const responses: unknown[] = [
      {
        data: [
          { instId: "WRONG" },
          {
            instId: "BTC-USD-261106-79000-P",
            uly: "BTC-USD",
            optType: "P",
            settleCcy: "BTC",
            ctMult: "0.01",
            stk: "79000",
            expTime: "1793952000000",
          },
        ],
      },
      {
        data: {
          bids: [["0.0195", "12", "0", "1"]],
          asks: [["0.0200", "9", "0", "1"]],
          ts: "1792090800000",
        },
      },
      {
        data: [
          { instId: "WRONG" },
          {
            instId: "BTC-USD-261106-79000-P",
            markVol: "0.62",
            delta: "-0.31",
            gamma: "0.00002",
            theta: "-0.0008",
            vega: "0.0014",
            ts: "1792090800000",
          },
        ],
      },
      {
        data: [
          {
            instId: "BTC-USD-261106-79000-P",
            markPx: "0.0198",
            ts: "1792090800000",
          },
        ],
      },
      { data: [{ instId: "BTC-USD", idxPx: "82391.3", ts: "1792090800000" }] },
    ];
    const transport: OkxReadTransport = {
      execute: () => Promise.resolve(responses.shift()),
    };
    const adapter = createOkxReadAdapter({
      transport,
      privateProfile: "okx-tr-read",
      now: () => now,
      maxAgeMs: 3_600_000,
    });

    const result = await adapter.readOptionMarket("BTC-USD-261106-79000-P");

    expect(result.data.option.instrumentId).toBe("BTC-USD-261106-79000-P");
  });
});
