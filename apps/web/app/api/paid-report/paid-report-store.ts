import { createHash } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  parseAnalysisReport,
  type AnalysisReport,
} from "@hazine-ajani/report-schema";

function key(transactionHash: string) {
  return createHash("sha256")
    .update(transactionHash.toLowerCase())
    .digest("hex");
}

export class FilePaidReportStore {
  constructor(readonly directory: string) {}

  async save(transactionHash: string, report: AnalysisReport) {
    await mkdir(this.directory, { recursive: true });
    const path = join(this.directory, `${key(transactionHash)}.report.json`);
    try {
      await writeFile(path, JSON.stringify(report), {
        flag: "wx",
        encoding: "utf8",
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const existing = parseAnalysisReport(
        JSON.parse(await readFile(path, "utf8")),
      );
      if (existing.analysisId !== report.analysisId)
        throw new Error("SETTLEMENT_REPLAY", { cause: error });
    }
  }

  async load(transactionHash: string) {
    const path = join(this.directory, `${key(transactionHash)}.report.json`);
    return parseAnalysisReport(JSON.parse(await readFile(path, "utf8")));
  }

  async consume<T>(transactionHash: string, task: () => Promise<T>) {
    await mkdir(this.directory, { recursive: true });
    const path = join(this.directory, `${key(transactionHash)}.consumed`);
    try {
      await writeFile(path, new Date().toISOString(), {
        flag: "wx",
        encoding: "utf8",
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST")
        throw new Error("SETTLEMENT_REPLAY", { cause: error });
      throw error;
    }
    try {
      return await task();
    } catch (error) {
      await unlink(path).catch(() => undefined);
      throw error;
    }
  }
}

export function paidReportStoreFromEnv() {
  const directory = process.env.X402_REPLAY_STORE_DIR;
  if (!directory) throw new Error("PAYMENT_STORE_UNAVAILABLE");
  return new FilePaidReportStore(directory);
}
