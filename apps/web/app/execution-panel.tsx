import type { AnalysisReport } from "@hazine-ajani/report-schema";

import { executionView, type ExecutionUiState } from "./execution-view-model";

function time(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function ExecutionPanel({
  report,
  state,
  onConfirm,
  onCancel,
}: {
  report: AnalysisReport;
  state: ExecutionUiState;
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  const view = executionView(state);
  const orderId = "orderId" in state ? state.orderId : undefined;
  const sourceReference =
    "sourceReference" in state ? state.sourceReference : undefined;
  const canAct = view.canConfirm && onConfirm && onCancel;
  return (
    <section
      className={`execution-panel execution-${state.status.toLowerCase()}`}
      aria-labelledby="execution-title"
      aria-live="polite"
    >
      <div className="execution-heading">
        <h2 id="execution-title">{view.title}</h2>
        <strong>{view.label}</strong>
      </div>
      <p>{view.description}</p>

      {state.status !== "DISABLED" ? (
        <dl className="execution-summary">
          <div>
            <dt>Ürün</dt>
            <dd>{report.dcdOffer.productId}</dd>
          </div>
          <div>
            <dt>Tutar</dt>
            <dd>
              {report.dcdOffer.minSize.value} {report.dcdOffer.notionalCurrency}
            </dd>
          </div>
          <div>
            <dt>Mod</dt>
            <dd>Canlı · gerçek OKX işlemi</dd>
          </div>
          <div>
            <dt>Quote geçerliliği</dt>
            <dd>{time(report.expiresAt)}</dd>
          </div>
          <div>
            <dt>Dönüşüm</dt>
            <dd>Strike altında BTC; aksi durumda USDT</dd>
          </div>
          <div>
            <dt>Ana riskler</dt>
            <dd>Dönüşüm · erken çıkış yok · proxy farkı</dd>
          </div>
        </dl>
      ) : null}

      {state.status !== "DISABLED" ? (
        <div className="execution-reference-slot">
          {orderId ? (
            <p className="execution-reference">
              Emir kimliği · <code>{orderId}</code>
            </p>
          ) : null}
          {sourceReference ? (
            <p className="execution-reference">Kaynak · {sourceReference}</p>
          ) : null}
        </div>
      ) : null}

      {canAct ? (
        <div className="execution-actions">
          <button
            type="button"
            className="execution-confirm"
            onClick={onConfirm}
          >
            Onayla ve OKX’e gönder
          </button>
          <button type="button" className="execution-cancel" onClick={onCancel}>
            Vazgeç
          </button>
        </div>
      ) : null}
    </section>
  );
}
