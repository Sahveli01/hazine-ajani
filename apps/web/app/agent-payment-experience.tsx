"use client";

import type { AnalysisReport } from "@hazine-ajani/report-schema";
import { useState } from "react";

import { AgentPaymentPanel } from "./agent-payment-panel";
import {
  executeBrowserFujiPayment,
  type Eip1193Provider,
} from "./browser-payment-controller";
import {
  agentPaymentStateFromReport,
  type AgentPaymentState,
} from "./agent-payment-view-model";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export function AgentPaymentExperience({
  report: initialReport,
}: {
  report: AnalysisReport;
}) {
  const [report, setReport] = useState(initialReport);
  const [state, setState] = useState<AgentPaymentState>(() =>
    agentPaymentStateFromReport(initialReport),
  );

  const requestPayment = async () => {
    if (!window.ethereum) {
      setState({ status: "FACILITATOR_ERROR" });
      return;
    }
    try {
      const confirmed = await executeBrowserFujiPayment({
        provider: window.ethereum,
        onState: setState,
      });
      setReport(confirmed);
      setState(agentPaymentStateFromReport(confirmed));
    } catch {
      // The controller maps every failure to an explicit visible state.
    }
  };

  const reset = () => setState({ status: "IDLE" });

  return (
    <AgentPaymentPanel
      report={report}
      state={state}
      onRequest={() => void requestPayment()}
      onRetry={
        state.status === "USER_REJECTED" ? reset : () => void requestPayment()
      }
      onReset={reset}
    />
  );
}
