import { describe, expect, it } from "vitest";
import { createExecutionAuthorizationMachine } from "../../../packages/policy/src/execution-authorization.js";
import { createDcdWriteAdapter } from "../../../packages/okx-adapter/src/write-adapter.js";

import { validAnalysisReport } from "./test-fixtures/analysis-report.js";
import {
  executionUiStateFromMachineResult,
  executionUiStateFromReconciliation,
  executionView,
} from "./execution-view-model.js";

describe("execution lifecycle view", () => {
  it.each([
    ["DISABLED", "Canlı OKX işlemi kapalı"],
    ["AWAITING_CONFIRMATION", "İşlemi ayrı olarak onayla"],
    ["SUBMITTING", "OKX’e gönderiliyor"],
    ["SUBMITTED", "Emir gönderildi"],
    ["PENDING", "OKX sonucu bekleniyor"],
    ["CONFIRMED", "OKX emri doğrulandı"],
    ["FAILED", "İşlem tamamlanamadı"],
    ["RECONCILIATION_REQUIRED", "Sonuç belirsiz"],
    ["REJECTED_BY_USER", "İşlemden vazgeçildi"],
    ["EXPIRED", "Teklifin süresi doldu"],
  ] as const)("maps %s to an explicit user state", (status, title) => {
    expect(executionView({ status })).toMatchObject({ title });
  });

  it("shows confirm and cancel only while a fresh explicit confirmation is awaiting", () => {
    expect(executionView({ status: "AWAITING_CONFIRMATION" })).toMatchObject({
      canConfirm: true,
      canCancel: true,
    });
    expect(executionView({ status: "DISABLED" })).toMatchObject({
      canConfirm: false,
      canCancel: false,
    });
    expect(executionView({ status: "RECONCILIATION_REQUIRED" })).toMatchObject({
      canConfirm: false,
      canCancel: false,
    });
  });

  it("uses plain Turkish state and transaction language", () => {
    const awaiting = executionView({ status: "AWAITING_CONFIRMATION" });
    const disabled = executionView({ status: "DISABLED" });
    expect(awaiting.label).toBe("Onay bekliyor");
    expect(disabled.label).toBe("İşlem kapalı");
    expect(`${awaiting.description} ${disabled.description}`).not.toMatch(
      /write|reconciliation|settlement/i,
    );
  });

  it("carries real authorization-machine outcomes into the UI without inventing success", async () => {
    let now = new Date("2026-10-16T10:00:00.000Z");
    const machine = createExecutionAuthorizationMachine({
      now: () => now,
      id: () => "confirm_e2e1234567890",
      ttlMs: 60_000,
    });
    const base = validAnalysisReport();
    const accepted = {
      ...base,
      decision: "ACCEPT" as const,
      reasonCodes: ["POLICY_CHECKS_PASSED" as const],
    };
    const prepared = machine.prepare(accepted, base.dcdOffer.minSize);
    expect(executionUiStateFromMachineResult(prepared)).toEqual({
      status: "AWAITING_CONFIRMATION",
    });

    const rejected = machine.reject("confirm_e2e1234567890");
    expect(executionUiStateFromMachineResult(rejected)).toEqual({
      status: "REJECTED_BY_USER",
    });

    const uncertain = createExecutionAuthorizationMachine({
      now: () => now,
      id: () => "confirm_unknown123456",
      ttlMs: 60_000,
    });
    uncertain.prepare(accepted, base.dcdOffer.minSize);
    const unknown = await uncertain.confirmAndExecute("confirm_unknown123456", {
      submit: () => Promise.reject(new Error("network uncertainty")),
    });
    expect(executionUiStateFromMachineResult(unknown)).toEqual({
      status: "RECONCILIATION_REQUIRED",
    });

    const expired = createExecutionAuthorizationMachine({
      now: () => now,
      id: () => "confirm_expired123456",
      ttlMs: 1_000,
    });
    expired.prepare(accepted, base.dcdOffer.minSize);
    now = new Date("2026-10-16T10:00:01.001Z");
    const expiredResult = await expired.confirmAndExecute(
      "confirm_expired123456",
      { submit: () => Promise.resolve({ submissionId: "never" }) },
    );
    expect(executionUiStateFromMachineResult(expiredResult)).toEqual({
      status: "EXPIRED",
    });
  });

  it("shows confirmed success only from a reconciled OKX order state", async () => {
    const adapter = createDcdWriteAdapter({
      executionEnabled: true,
      writeProfile: "okx-tr-write-test",
      maximumLiveAmount: { value: "100", scale: 0, currency: "USDT" },
      transport: {
        execute: () =>
          Promise.resolve({
            env: "live",
            data: [{ ordId: "312847563920184", state: "live" }],
          }),
      },
    });
    const reconciled = await adapter.reconcile("312847563920184");
    expect(executionUiStateFromReconciliation(reconciled)).toEqual({
      status: "CONFIRMED",
      orderId: "312847563920184",
      sourceReference: "OKX earn dcd order · live · live",
    });
  });
});
