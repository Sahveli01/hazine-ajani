"use client";

import { useEffect, useState } from "react";

import { INITIAL_ANALYSIS_STATE } from "./analysis-client-state";
import { AnalysisShell } from "./analysis-shell";
import { loadLiveAnalysis, type AnalysisViewState } from "./live-analysis";

export function AnalysisClient() {
  const [state, setState] = useState<AnalysisViewState>(INITIAL_ANALYSIS_STATE);

  useEffect(() => {
    const controller = new AbortController();
    void loadLiveAnalysis(() =>
      fetch("/api/analysis", {
        cache: "no-store",
        signal: controller.signal,
      }),
    ).then((nextState) => {
      if (!controller.signal.aborted) setState(nextState);
    });
    return () => controller.abort();
  }, []);

  return <AnalysisShell state={state} />;
}
