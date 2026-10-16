import { parseAnalysisReport } from "@hazine-ajani/report-schema";
import { decodePaymentResponseHeader } from "@x402/core/http";

import { paidReportStoreFromEnv } from "./paid-report-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const forwardedHeaders = ["payment-required", "payment-response"] as const;

export async function forwardPaidReportRequest(
  requestUpstream: typeof fetch,
  endpoint: string,
  request: Request,
  store?: Pick<ReturnType<typeof paidReportStoreFromEnv>, "save">,
) {
  const headers = new Headers({ accept: "application/json" });
  const signature = request.headers.get("payment-signature");
  if (signature) headers.set("payment-signature", signature);
  try {
    const upstream = await requestUpstream(endpoint, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    const responseHeaders = new Headers({
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
    });
    for (const name of forwardedHeaders) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    const body = await upstream.text();
    const settlementHeader = upstream.headers.get("payment-response");
    if (upstream.ok && settlementHeader) {
      const settlement = decodePaymentResponseHeader(settlementHeader);
      if (!settlement.success || !settlement.transaction) {
        return Response.json(
          { code: "PAYMENT_CONFIRMATION_FAILED" },
          { status: 502 },
        );
      }
      await (store ?? paidReportStoreFromEnv()).save(
        settlement.transaction,
        parseAnalysisReport(JSON.parse(body)),
      );
    }
    return new Response(body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json({ code: "PAID_REPORT_UNAVAILABLE" }, { status: 503 });
  }
}

export function GET(request: Request) {
  const analysisUrl =
    process.env.ANALYSIS_API_URL ?? "http://127.0.0.1:3001/api/analysis";
  const endpoint = new URL("/api/agent/risk-report", analysisUrl).toString();
  return forwardPaidReportRequest(fetch, endpoint, request);
}
