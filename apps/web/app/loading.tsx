import { AnalysisShell } from "./analysis-shell";

export default function Loading() {
  return <AnalysisShell state={{ status: "loading" }} />;
}
