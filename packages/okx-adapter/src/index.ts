export const okxAdapterStatus = "unconfigured" as const;

export * from "./read-adapter.js";

type OptionProxySnapshot = {
  targetStrike: number;
  targetExpiryMs: number;
  instrument: {
    instId: string;
    strike: number;
    expiryMs: number;
    optionType: "P" | "C";
  };
  book: {
    bid: number;
    ask: number;
    timestampMs: number;
  };
  greeks:
    | {
        markVol: number;
        delta: number;
        timestampMs: number;
      }
    | undefined;
  index: {
    price: number;
    timestampMs: number;
  };
  nowMs: number;
  maxAgeMs: number;
};

type RejectedProxySnapshot = {
  usable: false;
  reason:
    | "EMPTY_BOOK"
    | "CROSSED_BOOK"
    | "STALE_QUOTE"
    | "MISSING_GREEKS"
    | "INVALID_INDEX";
};

type UsableProxySnapshot = {
  usable: true;
  match: "exact" | "proxy";
  strikeDistance: number;
  expiryDistanceMs: number;
};

export function assessOptionProxySnapshot(
  snapshot: OptionProxySnapshot,
): RejectedProxySnapshot | UsableProxySnapshot {
  if (snapshot.book.bid <= 0 || snapshot.book.ask <= 0) {
    return { usable: false, reason: "EMPTY_BOOK" };
  }

  if (snapshot.book.bid >= snapshot.book.ask) {
    return { usable: false, reason: "CROSSED_BOOK" };
  }

  if (
    snapshot.nowMs - snapshot.book.timestampMs > snapshot.maxAgeMs ||
    snapshot.nowMs - snapshot.index.timestampMs > snapshot.maxAgeMs
  ) {
    return { usable: false, reason: "STALE_QUOTE" };
  }

  if (!snapshot.greeks) {
    return { usable: false, reason: "MISSING_GREEKS" };
  }

  if (!Number.isFinite(snapshot.index.price) || snapshot.index.price <= 0) {
    return { usable: false, reason: "INVALID_INDEX" };
  }

  const strikeDistance = Math.abs(
    snapshot.instrument.strike - snapshot.targetStrike,
  );
  const expiryDistanceMs = Math.abs(
    snapshot.instrument.expiryMs - snapshot.targetExpiryMs,
  );

  return {
    usable: true,
    match: strikeDistance === 0 && expiryDistanceMs === 0 ? "exact" : "proxy",
    strikeDistance,
    expiryDistanceMs,
  };
}
