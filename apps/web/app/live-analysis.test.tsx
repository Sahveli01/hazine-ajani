import { describe, expect, it } from "vitest";

import { validAnalysisReport } from "./test-fixtures/analysis-report.js";
import { INITIAL_ANALYSIS_STATE } from "./analysis-client-state.js";
import {
  analysisStateContent,
  loadLiveAnalysis,
  shellConnectionContent,
} from "./live-analysis.js";

const report = validAnalysisReport();

describe("live analysis shell", () => {
  it("renders the product shell in a loading state before live data arrives", () => {
    expect(INITIAL_ANALYSIS_STATE).toEqual({ status: "loading" });
    expect(analysisStateContent(INITIAL_ANALYSIS_STATE)).toMatchObject({
      title: "OKX verisi bekleniyor",
      busy: true,
    });
  });

  it("classifies canonical success and stale responses by server time", async () => {
    const request = () =>
      Promise.resolve(new Response(JSON.stringify(report), { status: 200 }));
    await expect(
      loadLiveAnalysis(request, new Date("2026-10-16T10:00:30.000Z")),
    ).resolves.toMatchObject({ status: "success", report });
    await expect(
      loadLiveAnalysis(request, new Date("2026-10-16T10:01:00.001Z")),
    ).resolves.toMatchObject({ status: "stale", report });
  });

  it("distinguishes empty and retryable error states without fake data", async () => {
    await expect(
      loadLiveAnalysis(
        () => Promise.resolve(new Response(null, { status: 204 })),
        new Date(),
      ),
    ).resolves.toEqual({ status: "empty" });
    await expect(
      loadLiveAnalysis(() => Promise.reject(new Error("offline")), new Date()),
    ).resolves.toEqual({ status: "error", reason: "NETWORK_UNAVAILABLE" });
  });

  it("rejects an incomplete payload instead of presenting partial data as success", async () => {
    const incomplete = {
      schemaVersion: "1.0.0",
      analysisId: "ana_1234567890abcdef",
      createdAt: report.createdAt,
      expiresAt: report.expiresAt,
      sourceRegion: "tr",
      decision: "REJECT",
    };
    await expect(
      loadLiveAnalysis(
        () => Promise.resolve(new Response(JSON.stringify(incomplete))),
        new Date("2026-10-16T10:00:30.000Z"),
      ),
    ).resolves.toEqual({ status: "error", reason: "INVALID_RESPONSE" });
  });

  it("provides explicit content and actions for every async state", () => {
    const states = [
      { status: "loading" as const },
      { status: "empty" as const },
      { status: "error" as const, reason: "NETWORK_UNAVAILABLE" as const },
      { status: "stale" as const, report },
      { status: "success" as const, report },
    ];
    for (const state of states) {
      const content = analysisStateContent(state);
      expect(content.title.length).toBeGreaterThan(0);
      expect(content.description.length).toBeGreaterThan(0);
    }
    expect(analysisStateContent({ status: "loading" }).busy).toBe(true);
    expect(
      analysisStateContent({ status: "error", reason: "NETWORK_UNAVAILABLE" })
        .action,
    ).toBe("Tekrar dene");
    expect(analysisStateContent({ status: "stale", report }).title).toBe(
      "Veri eskidi",
    );
  });

  it("does not claim a verified live account before a canonical report exists", () => {
    expect(shellConnectionContent({ status: "loading" })).toMatchObject({
      marketState: "KONTROL",
      accountTitle: "Hesap kontrol ediliyor",
    });
    expect(
      shellConnectionContent({
        status: "error",
        reason: "NETWORK_UNAVAILABLE",
      }),
    ).toMatchObject({
      marketState: "ERİŞİLEMİYOR",
      accountTitle: "Hesap doğrulanamadı",
    });
    expect(shellConnectionContent({ status: "success", report })).toMatchObject(
      {
        marketState: "LIVE",
        accountTitle: "Salt okunur kaynak",
      },
    );
  });
});
