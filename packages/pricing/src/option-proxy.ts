import type {
  DcdOffer,
  Money,
  OptionSnapshot,
  ProxyMatch,
} from "@hazine-ajani/report-schema";

type Decimal = { value: string; scale: number };
type Fraction = { numerator: bigint; denominator: bigint };

export type ProxyRejectionReason =
  | "DIRECTION_MISMATCH"
  | "UNDERLYING_MISMATCH"
  | "SETTLEMENT_CURRENCY_MISMATCH"
  | "INVALID_TIMESTAMP"
  | "STALE_QUOTE"
  | "EMPTY_BOOK"
  | "CROSSED_BOOK"
  | "INSUFFICIENT_LIQUIDITY"
  | "STRIKE_DISTANCE_EXCEEDED"
  | "EXPIRY_DISTANCE_EXCEEDED"
  | "BELOW_MINIMUM_CONFIDENCE"
  | "LOWER_RANK";

export type ProxySelectionPolicy = {
  maxAgeMs: number;
  minBidSizeContracts: Decimal;
  minAskSizeContracts: Decimal;
  maxStrikeDistance: Money;
  maxExpiryDistanceMs: number;
  minConfidenceScore: Decimal;
};

type ProxyTrace = {
  instrumentId: string;
  status: "SELECTED" | "REJECTED";
  reasons: ProxyRejectionReason[];
  score?: Decimal;
  scoreComponents?: {
    strike: Decimal;
    expiry: Decimal;
    freshness: Decimal;
    liquidity: Decimal;
  };
};

type Confidence = {
  score: Decimal;
  level: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
};

type ProxySelectionResult =
  | {
      matched: true;
      selected: OptionSnapshot;
      proxyMatch: ProxyMatch;
      confidence: Confidence;
      trace: ProxyTrace[];
    }
  | {
      matched: false;
      proxyMatch: ProxyMatch;
      trace: ProxyTrace[];
    };

type ScoredCandidate = {
  option: OptionSnapshot;
  strikeDistance: Fraction;
  strikeDistanceText: string;
  expiryDistanceMs: number;
  confidenceBasisPoints: bigint;
  confidence: Confidence;
  scoreComponents: NonNullable<ProxyTrace["scoreComponents"]>;
};

const decimalPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
const basisPoints = 10_000n;
const componentWeight = 2_500n;

function powerOfTen(scale: number): bigint {
  if (!Number.isInteger(scale) || scale < 0 || scale > 30) {
    throw new TypeError("Decimal scale must be an integer from 0 to 30");
  }
  return 10n ** BigInt(scale);
}

function parseDecimal(input: Decimal): Fraction {
  if (!decimalPattern.test(input.value)) throw new TypeError("Invalid decimal");
  powerOfTen(input.scale);
  const negative = input.value.startsWith("-");
  const unsigned = negative ? input.value.slice(1) : input.value;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  if (fraction.length > input.scale)
    throw new TypeError("Decimal exceeds declared scale");
  const numerator = BigInt(`${whole}${fraction}`);
  return {
    numerator: negative ? -numerator : numerator,
    denominator: powerOfTen(fraction.length),
  };
}

function compare(left: Fraction, right: Fraction): number {
  const difference =
    left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function absoluteDifference(left: Fraction, right: Fraction): Fraction {
  const numerator =
    left.numerator * right.denominator - right.numerator * left.denominator;
  return {
    numerator: numerator < 0n ? -numerator : numerator,
    denominator: left.denominator * right.denominator,
  };
}

function ratioBasisPoints(
  value: Fraction,
  maximum: Fraction,
  weight: bigint,
): bigint {
  if (maximum.numerator <= 0n) throw new TypeError("Maximum must be positive");
  const numerator = value.numerator * maximum.denominator * weight;
  const denominator = value.denominator * maximum.numerator;
  const penalty = numerator / denominator;
  return penalty > weight ? weight : penalty;
}

function numberRatioBasisPoints(
  value: number,
  maximum: number,
  weight: bigint,
): bigint {
  if (
    !Number.isSafeInteger(value) ||
    !Number.isSafeInteger(maximum) ||
    value < 0 ||
    maximum <= 0
  ) {
    throw new TypeError("Distance policy must use positive safe integers");
  }
  const penalty = (BigInt(value) * weight) / BigInt(maximum);
  return penalty > weight ? weight : penalty;
}

function formatBasisPoints(value: bigint): Decimal {
  const clamped = value < 0n ? 0n : value > basisPoints ? basisPoints : value;
  const digits = clamped.toString().padStart(5, "0");
  return { value: `${digits.slice(0, -4)}.${digits.slice(-4)}`, scale: 4 };
}

function decimalText(input: Fraction): string {
  const denominatorText = input.denominator.toString();
  if (!/^10*$/.test(denominatorText))
    throw new TypeError("Non-decimal fraction");
  const scale = denominatorText.length - 1;
  const digits = input.numerator.toString().padStart(scale + 1, "0");
  const raw =
    scale === 0 ? digits : `${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
  return raw.includes(".")
    ? raw.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1")
    : raw;
}

function noMatch(
  trace: ProxyTrace[],
  currency: string,
  scale: number,
): ProxySelectionResult {
  return {
    matched: false,
    proxyMatch: {
      quality: "NONE",
      strikeDistance: { value: "0", scale, currency },
      expiryDistanceMs: "0",
      settlementComparable: false,
      differences: [],
    },
    trace,
  };
}

function liquidityPenalty(
  bidSize: Fraction,
  askSize: Fraction,
  minimumBid: Fraction,
  minimumAsk: Fraction,
): bigint {
  const coverage = (size: Fraction, minimum: Fraction) => {
    const numerator = size.numerator * minimum.denominator * basisPoints;
    const denominator = size.denominator * minimum.numerator;
    const value = numerator / denominator;
    return value > 2n * basisPoints ? 2n * basisPoints : value;
  };
  const bidCoverage = coverage(bidSize, minimumBid);
  const askCoverage = coverage(askSize, minimumAsk);
  const minimumCoverage = bidCoverage < askCoverage ? bidCoverage : askCoverage;
  if (minimumCoverage >= 2n * basisPoints) return 0n;
  if (minimumCoverage <= basisPoints) return componentWeight;
  return (componentWeight * (2n * basisPoints - minimumCoverage)) / basisPoints;
}

function confidenceLevel(score: bigint): Confidence["level"] {
  return score >= 8_500n ? "HIGH" : score >= 6_500n ? "MEDIUM" : "LOW";
}

export function selectOptionProxy(input: {
  offer: DcdOffer;
  candidates: OptionSnapshot[];
  policy: ProxySelectionPolicy;
  nowAt: string;
}): ProxySelectionResult {
  const nowMs = Date.parse(input.nowAt);
  if (!Number.isFinite(nowMs))
    throw new TypeError("nowAt must be a valid timestamp");
  const offerExpiryMs = Date.parse(input.offer.expiryAt);
  const offerQuoteMs = Date.parse(input.offer.quoteAt);
  if (!Number.isFinite(offerExpiryMs) || !Number.isFinite(offerQuoteMs)) {
    throw new TypeError("Offer timestamps must be valid");
  }
  const offerAgeMs = nowMs - offerQuoteMs;
  const offerIsStale = offerAgeMs < 0 || offerAgeMs > input.policy.maxAgeMs;
  if (input.policy.maxStrikeDistance.currency !== input.offer.quoteCurrency) {
    throw new TypeError(
      "Strike distance policy currency must match the DCD quote currency",
    );
  }

  const offerStrike = parseDecimal(input.offer.strike);
  const maximumStrikeDistance = parseDecimal(input.policy.maxStrikeDistance);
  const minimumBidSize = parseDecimal(input.policy.minBidSizeContracts);
  const minimumAskSize = parseDecimal(input.policy.minAskSizeContracts);
  const minimumConfidence = ratioBasisPoints(
    parseDecimal(input.policy.minConfidenceScore),
    { numerator: 1n, denominator: 1n },
    basisPoints,
  );
  const expectedType = input.offer.direction === "BUY_LOW" ? "PUT" : "CALL";
  const trace: ProxyTrace[] = [];
  const eligible: ScoredCandidate[] = [];

  for (const candidate of input.candidates) {
    const reasons: ProxyRejectionReason[] = [];
    if (candidate.optionType !== expectedType)
      reasons.push("DIRECTION_MISMATCH");
    if (candidate.underlying !== input.offer.underlying)
      reasons.push("UNDERLYING_MISMATCH");
    if (candidate.settlementCurrency !== input.offer.baseCurrency)
      reasons.push("SETTLEMENT_CURRENCY_MISMATCH");
    if (reasons.length > 0) {
      trace.push({
        instrumentId: candidate.instrumentId,
        status: "REJECTED",
        reasons,
      });
      continue;
    }

    const observedMs = Date.parse(candidate.observedAt);
    const expiryMs = Date.parse(candidate.expiryAt);
    if (!Number.isFinite(observedMs) || !Number.isFinite(expiryMs)) {
      trace.push({
        instrumentId: candidate.instrumentId,
        status: "REJECTED",
        reasons: ["INVALID_TIMESTAMP"],
      });
      continue;
    }
    const ageMs = nowMs - observedMs;
    if (offerIsStale || ageMs < 0 || ageMs > input.policy.maxAgeMs)
      reasons.push("STALE_QUOTE");

    const bid = parseDecimal(candidate.bid);
    const ask = parseDecimal(candidate.ask);
    if (bid.numerator <= 0n || ask.numerator <= 0n) reasons.push("EMPTY_BOOK");
    else if (compare(bid, ask) >= 0) reasons.push("CROSSED_BOOK");

    const bidSize = parseDecimal(candidate.bidSize);
    const askSize = parseDecimal(candidate.askSize);
    if (
      compare(bidSize, minimumBidSize) < 0 ||
      compare(askSize, minimumAskSize) < 0
    ) {
      reasons.push("INSUFFICIENT_LIQUIDITY");
    }

    const strikeDistance = absoluteDifference(
      parseDecimal(candidate.strike),
      offerStrike,
    );
    const expiryDistanceMs = Math.abs(expiryMs - offerExpiryMs);
    if (compare(strikeDistance, maximumStrikeDistance) > 0)
      reasons.push("STRIKE_DISTANCE_EXCEEDED");
    if (expiryDistanceMs > input.policy.maxExpiryDistanceMs)
      reasons.push("EXPIRY_DISTANCE_EXCEEDED");
    if (reasons.length > 0) {
      trace.push({
        instrumentId: candidate.instrumentId,
        status: "REJECTED",
        reasons,
      });
      continue;
    }

    const strikePenalty = ratioBasisPoints(
      strikeDistance,
      maximumStrikeDistance,
      componentWeight,
    );
    const expiryPenalty = numberRatioBasisPoints(
      expiryDistanceMs,
      input.policy.maxExpiryDistanceMs,
      componentWeight,
    );
    const freshnessPenalty = numberRatioBasisPoints(
      ageMs,
      input.policy.maxAgeMs,
      componentWeight,
    );
    const marketLiquidityPenalty = liquidityPenalty(
      bidSize,
      askSize,
      minimumBidSize,
      minimumAskSize,
    );
    const score =
      basisPoints -
      strikePenalty -
      expiryPenalty -
      freshnessPenalty -
      marketLiquidityPenalty;
    const scoreComponents = {
      strike: formatBasisPoints(componentWeight - strikePenalty),
      expiry: formatBasisPoints(componentWeight - expiryPenalty),
      freshness: formatBasisPoints(componentWeight - freshnessPenalty),
      liquidity: formatBasisPoints(componentWeight - marketLiquidityPenalty),
    };
    if (score < minimumConfidence) {
      trace.push({
        instrumentId: candidate.instrumentId,
        status: "REJECTED",
        reasons: ["BELOW_MINIMUM_CONFIDENCE"],
        score: formatBasisPoints(score),
        scoreComponents,
      });
      continue;
    }
    eligible.push({
      option: candidate,
      strikeDistance,
      strikeDistanceText: decimalText(strikeDistance),
      expiryDistanceMs,
      confidenceBasisPoints: score,
      confidence: {
        score: formatBasisPoints(score),
        level: confidenceLevel(score),
        reasons: [
          strikeDistance.numerator === 0n ? "EXACT_STRIKE" : "NEAR_STRIKE",
          expiryDistanceMs === 0 ? "EXACT_EXPIRY" : "NEAR_EXPIRY",
          "TWO_SIDED_BOOK",
          "FRESH_QUOTE",
        ],
      },
      scoreComponents,
    });
  }

  eligible.sort((left, right) => {
    if (left.confidenceBasisPoints !== right.confidenceBasisPoints) {
      return left.confidenceBasisPoints > right.confidenceBasisPoints ? -1 : 1;
    }
    return left.option.instrumentId.localeCompare(right.option.instrumentId);
  });
  const selected = eligible[0];
  if (!selected)
    return noMatch(trace, input.offer.quoteCurrency, input.offer.strike.scale);

  for (const candidate of eligible) {
    trace.push({
      instrumentId: candidate.option.instrumentId,
      status: candidate === selected ? "SELECTED" : "REJECTED",
      reasons: candidate === selected ? [] : ["LOWER_RANK"],
      score: candidate.confidence.score,
      scoreComponents: candidate.scoreComponents,
    });
  }

  const differences: ProxyMatch["differences"] = [
    ...(selected.strikeDistance.numerator === 0n ? [] : (["STRIKE"] as const)),
    ...(selected.expiryDistanceMs === 0 ? [] : (["EXPIRY"] as const)),
    "SETTLEMENT_WINDOW",
    "SETTLEMENT_MECHANISM",
    "EARLY_REDEMPTION",
    "COUNTERPARTY",
  ];
  return {
    matched: true,
    selected: selected.option,
    proxyMatch: {
      quality:
        selected.strikeDistance.numerator === 0n &&
        selected.expiryDistanceMs === 0
          ? "EXACT"
          : "NEAR",
      strikeDistance: {
        value: selected.strikeDistanceText,
        scale: input.offer.strike.scale,
        currency: input.offer.quoteCurrency,
      },
      expiryDistanceMs: String(selected.expiryDistanceMs),
      settlementComparable: true,
      differences,
    },
    confidence: selected.confidence,
    trace,
  };
}
