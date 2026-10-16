const unavailable = () =>
  Response.json({ code: "ANALYSIS_UNAVAILABLE" }, { status: 503 });

export const dynamic = "force-dynamic";

type RequestUpstream = (input: string, init: RequestInit) => Promise<Response>;

export async function forwardAnalysisRequest(
  requestUpstream: RequestUpstream,
  endpoint: string,
) {
  try {
    const upstream = await requestUpstream(endpoint, {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (upstream.status === 204) return new Response(null, { status: 204 });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return unavailable();
  }
}

export function GET() {
  const endpoint =
    process.env.ANALYSIS_API_URL ?? "http://127.0.0.1:3001/api/analysis";
  return forwardAnalysisRequest(fetch, endpoint);
}
