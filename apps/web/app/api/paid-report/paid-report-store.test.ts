import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { validAnalysisReport } from "../../test-fixtures/analysis-report.js";
import { FilePaidReportStore } from "./paid-report-store.js";

describe("durable paid report store", () => {
  it("loads only the server-saved canonical report across store instances", async () => {
    const directory = await mkdtemp(join(tmpdir(), "hazine-paid-"));
    const first = new FilePaidReportStore(directory);
    const report = validAnalysisReport();
    await first.save("0xabc", report);
    await expect(
      new FilePaidReportStore(directory).load("0xabc"),
    ).resolves.toMatchObject({
      analysisId: report.analysisId,
      decision: report.decision,
    });
  });

  it("atomically rejects a consumed transaction after process recreation", async () => {
    const directory = await mkdtemp(join(tmpdir(), "hazine-paid-"));
    await expect(
      new FilePaidReportStore(directory).consume("0xdef", () =>
        Promise.resolve("ok"),
      ),
    ).resolves.toBe("ok");
    await expect(
      new FilePaidReportStore(directory).consume("0xdef", () =>
        Promise.resolve("bad"),
      ),
    ).rejects.toThrow("SETTLEMENT_REPLAY");
  });
});
