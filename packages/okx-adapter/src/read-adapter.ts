import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { promisify } from "node:util";

import {
  dcdOfferSchema,
  marketSnapshotSchema,
  optionSnapshotSchema,
  type DcdOffer,
  type MarketSnapshot,
  type OptionSnapshot,
} from "@hazine-ajani/report-schema";
import { z } from "zod";

export type OkxAdapterErrorCode =
  | "RATE_LIMIT"
  | "REGIONAL_UNAVAILABLE"
  | "TIMEOUT"
  | "EMPTY_DATA"
  | "STALE_DATA"
  | "INVALID_PAYLOAD"
  | "AUTH"
  | "CLI_FAILURE";

export class OkxAdapterError extends Error {
  constructor(
    public readonly code: OkxAdapterErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "OkxAdapterError";
  }
}

type SourceKind =
  | "OKX_PRIVATE_DCD"
  | "OKX_PUBLIC_OPTION"
  | "OKX_PUBLIC_INDEX"
  | "OKX_SIMPLE_EARN";

export type NormalizedSnapshot<T> = {
  data: T;
  source: { kind: SourceKind; reference: string };
  serverTime: string;
  receivedAt: string;
  expiresAt: string;
};

type NormalizeOptions = { receivedAt: Date; maxAgeMs: number };

const decimal = z.string().regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/);
const timestamp = z.string().regex(/^\d+$/);
const envelope = z.object({ env: z.literal("live"), profile: z.string() });

const dcdProduct = z.object({
  productId: z.string().min(1),
  strike: decimal,
  expTime: timestamp,
  annualizedYield: decimal,
  absYield: decimal,
  quoteTime: timestamp,
  minSize: decimal,
  maxSize: decimal,
  stepSz: decimal,
  uly: z.string().min(1),
  baseCcy: z.string().min(1),
  quoteCcy: z.string().min(1),
  notionalCcy: z.string().min(1),
  optType: z.enum(["P", "C"]),
});

const earnRate = z.object({
  ccy: z.string().min(1),
  lendingRate: decimal,
  ts: timestamp,
});

const spotTicker = z.object({
  instType: z.literal("SPOT"),
  instId: z.string().min(1),
  last: decimal,
  bidPx: decimal,
  askPx: decimal,
  ts: timestamp,
});

const optionInput = z.object({
  instrument: z.object({
    instId: z.string().min(1),
    uly: z.string().min(1),
    optType: z.enum(["P", "C"]),
    settleCcy: z.string().min(1),
    ctMult: decimal,
    stk: decimal,
    expTime: timestamp,
  }),
  book: z.object({
    bids: z.array(z.tuple([decimal, decimal, z.string(), z.string()])).min(1),
    asks: z.array(z.tuple([decimal, decimal, z.string(), z.string()])).min(1),
    ts: timestamp,
  }),
  greeks: z.object({
    markVol: decimal,
    delta: decimal,
    gamma: decimal,
    theta: decimal,
    vega: decimal,
    ts: timestamp,
  }),
  mark: z.object({ markPx: decimal, ts: timestamp }),
  index: z.object({ instId: z.string().min(1), idxPx: decimal, ts: timestamp }),
});

function scale(value: string): number {
  return value.split(".")[1]?.length ?? 0;
}

function value(value: string) {
  return { value, scale: scale(value) };
}

function money(amount: string, currency: string) {
  return { ...value(amount), currency };
}

function iso(ms: string | number): string {
  return new Date(Number(ms)).toISOString();
}

function parsed<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new OkxAdapterError(
      "INVALID_PAYLOAD",
      "OKX returned an unexpected payload shape",
      {
        cause: result.error,
      },
    );
  }
  return result.data;
}

function snapshot<T>(
  data: T,
  kind: SourceKind,
  reference: string,
  serverTimeMs: string,
  options: NormalizeOptions,
): NormalizedSnapshot<T> {
  const serverTime = Number(serverTimeMs);
  if (options.receivedAt.getTime() - serverTime > options.maxAgeMs) {
    throw new OkxAdapterError("STALE_DATA", `${reference} snapshot is stale`);
  }
  return {
    data,
    source: { kind, reference },
    serverTime: iso(serverTime),
    receivedAt: options.receivedAt.toISOString(),
    expiresAt: iso(serverTime + options.maxAgeMs),
  };
}

export function normalizeDcdProducts(
  input: unknown,
  options: NormalizeOptions,
): NormalizedSnapshot<DcdOffer[]> {
  const root = parsed(envelope.extend({ data: z.array(dcdProduct) }), input);
  if (root.data.length === 0)
    throw new OkxAdapterError("EMPTY_DATA", "No DCD products returned");
  const products = root.data.map((item) => {
    return dcdOfferSchema.parse({
      productId: item.productId,
      direction: item.optType === "P" ? "BUY_LOW" : "SELL_HIGH",
      underlying: item.uly,
      baseCurrency: item.baseCcy,
      quoteCurrency: item.quoteCcy,
      notionalCurrency: item.notionalCcy,
      strike: money(item.strike, item.quoteCcy),
      expiryAt: iso(item.expTime),
      quoteAt: iso(item.quoteTime),
      annualizedYield: value(item.annualizedYield),
      termYield: value(item.absYield),
      minSize: money(item.minSize, item.notionalCcy),
      maxSize: money(item.maxSize, item.notionalCcy),
      stepSize: money(item.stepSz, item.notionalCcy),
    });
  });
  const newest = root.data.reduce(
    (latest, item) =>
      Number(item.quoteTime) > Number(latest) ? item.quoteTime : latest,
    "0",
  );
  return snapshot(
    products,
    "OKX_PRIVATE_DCD",
    "earn dcd products",
    newest,
    options,
  );
}

export type SimpleEarnSnapshot = {
  currency: string;
  annualRate: ReturnType<typeof value>;
  observedAt: string;
};

export function normalizeSimpleEarn(
  input: unknown,
  options: NormalizeOptions,
): NormalizedSnapshot<SimpleEarnSnapshot> {
  const root = parsed(
    envelope.extend({ data: z.object({ data: z.array(earnRate) }) }),
    input,
  );
  const item = root.data.data[0];
  if (!item)
    throw new OkxAdapterError("EMPTY_DATA", "No Simple Earn rates returned");
  return snapshot(
    {
      currency: item.ccy,
      annualRate: value(item.lendingRate),
      observedAt: iso(item.ts),
    },
    "OKX_SIMPLE_EARN",
    `earn savings rate-history ${item.ccy}`,
    item.ts,
    options,
  );
}

export type SpotSnapshot = {
  instrumentId: string;
  last: ReturnType<typeof money>;
  bid: ReturnType<typeof money>;
  ask: ReturnType<typeof money>;
  observedAt: string;
};

export function normalizeSpotTicker(
  input: unknown,
  options: NormalizeOptions,
): NormalizedSnapshot<SpotSnapshot> {
  if (
    typeof input === "object" &&
    input !== null &&
    "data" in input &&
    Array.isArray(input.data) &&
    input.data.length === 0
  ) {
    throw new OkxAdapterError("EMPTY_DATA", "No spot ticker returned");
  }
  const root = parsed(envelope.extend({ data: z.array(spotTicker) }), input);
  const item = root.data[0];
  if (!item) throw new OkxAdapterError("EMPTY_DATA", "No spot ticker returned");
  const quoteCurrency = item.instId.split("-")[1];
  if (!quoteCurrency)
    throw new OkxAdapterError("INVALID_PAYLOAD", "Invalid spot instrument id");
  return snapshot(
    {
      instrumentId: item.instId,
      last: money(item.last, quoteCurrency),
      bid: money(item.bidPx, quoteCurrency),
      ask: money(item.askPx, quoteCurrency),
      observedAt: iso(item.ts),
    },
    "OKX_PUBLIC_INDEX",
    `market ticker ${item.instId}`,
    item.ts,
    options,
  );
}

export function normalizeOptionMarket(
  input: unknown,
  options: NormalizeOptions,
): NormalizedSnapshot<{ option: OptionSnapshot; market: MarketSnapshot }> {
  const root = parsed(optionInput, input);
  const observedMs = String(
    Math.min(
      Number(root.book.ts),
      Number(root.greeks.ts),
      Number(root.mark.ts),
      Number(root.index.ts),
    ),
  );
  const quoteCurrency = root.index.instId.split("-")[1] ?? "USD";
  const option = optionSnapshotSchema.parse({
    instrumentId: root.instrument.instId,
    underlying: root.instrument.uly,
    optionType: root.instrument.optType === "P" ? "PUT" : "CALL",
    settlementCurrency: root.instrument.settleCcy,
    contractMultiplier: value(root.instrument.ctMult),
    strike: money(root.instrument.stk, quoteCurrency),
    expiryAt: iso(root.instrument.expTime),
    bid: money(root.book.bids[0]![0], root.instrument.settleCcy),
    ask: money(root.book.asks[0]![0], root.instrument.settleCcy),
    bidSize: { ...value(root.book.bids[0]![1]), unit: "CONTRACT" },
    askSize: { ...value(root.book.asks[0]![1]), unit: "CONTRACT" },
    markPrice: money(root.mark.markPx, root.instrument.settleCcy),
    markVolatility: value(root.greeks.markVol),
    delta: value(root.greeks.delta),
    gamma: value(root.greeks.gamma),
    theta: value(root.greeks.theta),
    vega: value(root.greeks.vega),
    observedAt: iso(observedMs),
  });
  const market = marketSnapshotSchema.parse({
    underlying: root.index.instId,
    indexPrice: money(root.index.idxPx, quoteCurrency),
    observedAt: iso(root.index.ts),
  });
  return snapshot(
    { option, market },
    "OKX_PUBLIC_OPTION",
    `option ${root.instrument.instId}`,
    observedMs,
    options,
  );
}

const retryable = new Set<OkxAdapterErrorCode>([
  "RATE_LIMIT",
  "TIMEOUT",
  "CLI_FAILURE",
]);

export async function retryIdempotentRead<T>(
  operation: () => Promise<T>,
  options: { maxRetries: number; delayMs: number },
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (
        !(error instanceof OkxAdapterError) ||
        !retryable.has(error.code) ||
        attempt >= options.maxRetries
      )
        throw error;
      if (options.delayMs > 0)
        await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    }
  }
}

export type OkxReadRequest = {
  args: readonly string[];
  privateRead: boolean;
  profile?: string;
};
export type OkxReadTransport = {
  execute(request: OkxReadRequest): Promise<unknown>;
};

export function createOkxReadAdapter(options: {
  transport: OkxReadTransport;
  privateProfile: string;
  now?: () => Date;
  maxAgeMs?: number;
  simpleEarnMaxAgeMs?: number;
}) {
  const now = options.now ?? (() => new Date());
  const maxAgeMs = options.maxAgeMs ?? 60_000;
  const simpleEarnMaxAgeMs = options.simpleEarnMaxAgeMs ?? 2 * 60 * 60_000;
  const read = (request: OkxReadRequest) =>
    retryIdempotentRead(() => options.transport.execute(request), {
      maxRetries: 2,
      delayMs: 100,
    });
  return {
    readDcdProducts: async (filter: {
      baseCurrency: string;
      quoteCurrency: string;
      optionType: "P" | "C";
    }) =>
      normalizeDcdProducts(
        await read({
          args: [
            "earn",
            "dcd",
            "products",
            "--baseCcy",
            filter.baseCurrency,
            "--quoteCcy",
            filter.quoteCurrency,
            "--optType",
            filter.optionType,
          ],
          privateRead: true,
          profile: options.privateProfile,
        }),
        { receivedAt: now(), maxAgeMs },
      ),
    readSimpleEarn: async (currency = "USDT") =>
      normalizeSimpleEarn(
        await read({
          args: [
            "earn",
            "savings",
            "rate-history",
            "--ccy",
            currency,
            "--limit",
            "5",
          ],
          privateRead: true,
          profile: options.privateProfile,
        }),
        { receivedAt: now(), maxAgeMs: simpleEarnMaxAgeMs },
      ),
    readSpotTicker: async (instrumentId = "BTC-USDT") =>
      normalizeSpotTicker(
        await read({
          args: ["market", "ticker", instrumentId],
          privateRead: false,
        }),
        { receivedAt: now(), maxAgeMs },
      ),
    readOptionMarket: async (instrumentId: string, indexId = "BTC-USD") => {
      const parts = instrumentId.split("-");
      const underlying = `${parts[0]}-${parts[1]}`;
      const expiry = parts[2];
      if (!parts[0] || !parts[1] || !expiry || !/^\d{6}$/.test(expiry))
        throw new OkxAdapterError(
          "INVALID_PAYLOAD",
          "Invalid option instrument id",
        );
      const [instrument, book, greeks, mark, index] = await Promise.all([
        read({
          args: [
            "market",
            "instruments",
            "--instType",
            "OPTION",
            "--uly",
            underlying,
            "--instId",
            instrumentId,
          ],
          privateRead: false,
        }),
        read({
          args: ["market", "orderbook", instrumentId],
          privateRead: false,
        }),
        read({
          args: ["option", "greeks", "--uly", underlying, "--expTime", expiry],
          privateRead: false,
        }),
        read({
          args: [
            "market",
            "mark-price",
            "--instType",
            "OPTION",
            "--instId",
            instrumentId,
          ],
          privateRead: false,
        }),
        read({
          args: ["market", "index-ticker", "--instId", indexId],
          privateRead: false,
        }),
      ]);
      return normalizeOptionMarket(
        {
          instrument: findRecord(instrument, instrumentId),
          book: unwrapFirst(book),
          greeks: findRecord(greeks, instrumentId),
          mark: findRecord(mark, instrumentId),
          index: findRecord(index, indexId),
        },
        { receivedAt: now(), maxAgeMs },
      );
    },
  };
}

function unwrapFirst(input: unknown): unknown {
  if (typeof input !== "object" || input === null || !("data" in input))
    return input;
  const data = input.data;
  if (Array.isArray(data)) return data[0];
  if (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    Array.isArray(data.data)
  )
    return data.data[0];
  return data;
}

function findRecord(input: unknown, instrumentId: string): unknown {
  if (typeof input !== "object" || input === null || !("data" in input))
    return input;
  const data = input.data;
  const records: unknown[] = Array.isArray(data)
    ? (data as unknown[])
    : typeof data === "object" &&
        data !== null &&
        "data" in data &&
        Array.isArray(data.data)
      ? (data.data as unknown[])
      : [data];
  const found = records.find(
    (record) =>
      typeof record === "object" &&
      record !== null &&
      "instId" in record &&
      record.instId === instrumentId,
  );
  if (!found)
    throw new OkxAdapterError(
      "EMPTY_DATA",
      `No exact OKX record for ${instrumentId}`,
    );
  return found;
}

const executeFile = promisify(execFile);
const require = createRequire(import.meta.url);
const allowedPrefixes = [
  "earn dcd products",
  "earn savings rate-history",
  "market ticker",
  "market instruments",
  "market orderbook",
  "market mark-price",
  "market index-ticker",
  "option greeks",
];

type ProcessFailure = Error & { stdout?: unknown; stderr?: unknown };

export function classifyCliFailure(cause: unknown): {
  code: OkxAdapterErrorCode;
  externalCode?: string;
} {
  const failure = cause as Partial<ProcessFailure> | undefined;
  const diagnostics = [failure?.message, failure?.stdout, failure?.stderr]
    .filter((value): value is string => typeof value === "string")
    .join("\n");
  const lower = diagnostics.toLowerCase();
  const externalCode =
    diagnostics.match(/(?:"code"\s*:\s*"|\bcode[=: ]+)(\d{5})/i)?.[1];
  const code: OkxAdapterErrorCode = lower.includes("timed out")
    ? "TIMEOUT"
    : lower.includes("429") || lower.includes("rate limit")
      ? "RATE_LIMIT"
      : lower.includes("region") || lower.includes("not available")
        ? "REGIONAL_UNAVAILABLE"
        : ["50030", "50038", "50110"].includes(externalCode ?? "") ||
            lower.includes("auth") ||
            lower.includes("credential") ||
            lower.includes("whitelist") ||
            lower.includes("feature is disabled")
          ? "AUTH"
          : "CLI_FAILURE";
  return externalCode ? { code, externalCode } : { code };
}

export function parseCliJson(stdout: string): unknown {
  try {
    return JSON.parse(stdout) as unknown;
  } catch {
    const objectStart = stdout.indexOf("{");
    const objectEnd = stdout.lastIndexOf("}");
    if (objectStart >= 0 && objectEnd > objectStart) {
      return JSON.parse(stdout.slice(objectStart, objectEnd + 1)) as unknown;
    }
    const arrayStart = stdout.indexOf("[");
    const arrayEnd = stdout.lastIndexOf("]");
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      return JSON.parse(stdout.slice(arrayStart, arrayEnd + 1)) as unknown;
    }
    throw new OkxAdapterError("INVALID_PAYLOAD", "OKX CLI returned no JSON");
  }
}

export function createCliReadTransport(
  options: { timeoutMs?: number } = {},
): OkxReadTransport {
  return {
    async execute(request) {
      const commandText = request.args.join(" ");
      if (
        !allowedPrefixes.some(
          (prefix) =>
            commandText === prefix || commandText.startsWith(`${prefix} `),
        )
      ) {
        throw new OkxAdapterError(
          "CLI_FAILURE",
          "Command is outside the read-only allowlist",
        );
      }
      if (request.privateRead && !request.profile)
        throw new OkxAdapterError("AUTH", "Private read profile is required");
      const invocation = resolveOkxCliInvocation();
      const globalArgs = [...invocation.prefixArgs];
      if (request.privateRead) globalArgs.push("--profile", request.profile!);
      globalArgs.push("--live", "--json", "--env", ...request.args);
      try {
        const { stdout } = await executeFile(
          invocation.executable,
          globalArgs,
          {
            timeout: options.timeoutMs ?? 15_000,
            windowsHide: true,
            maxBuffer: 1_000_000,
          },
        );
        return parseCliJson(stdout);
      } catch (cause) {
        if (cause instanceof OkxAdapterError) throw cause;
        const { code } = classifyCliFailure(cause);
        throw new OkxAdapterError(code, "OKX read failed", { cause });
      }
    },
  };
}

export function resolveOkxCliInvocation(): {
  executable: string;
  prefixArgs: readonly string[];
} {
  const packageJson = require.resolve("@okx_ai/okx-trade-cli/package.json");
  return {
    executable: process.execPath,
    prefixArgs: [join(dirname(packageJson), "dist", "index.js")],
  };
}
