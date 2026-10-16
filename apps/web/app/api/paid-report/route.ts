export const dynamic = "force-dynamic";

const forwardedHeaders = ["payment-required", "payment-response"] as const;

export async function forwardPaidReportRequest(
  requestUpstream: typeof fetch,
  endpoint: string,
  request: Request,
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
    return new Response(await upstream.text(), {
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
