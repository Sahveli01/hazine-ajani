import type { AnalysisViewState } from "./live-analysis";
import { analysisStateContent, shellConnectionContent } from "./live-analysis";
import { OfferInspector } from "./offer-inspector";

function formatTime(value: string | undefined): string {
  if (!value) return "Veri bekleniyor";
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function AnalysisShell({ state }: { state: AnalysisViewState }) {
  const content = analysisStateContent(state);
  const connection = shellConnectionContent(state);
  const report =
    state.status === "success" || state.status === "stale"
      ? state.report
      : undefined;
  return (
    <main className="app-shell">
      <header className="app-header" aria-label="Uygulama ve bağlantı durumu">
        <a className="brand" href="/" aria-label="Hazine Ajanı ana sayfa">
          <span className="brand-mark" aria-hidden="true">
            HA
          </span>
          <span className="brand-copy">
            <strong>Hazine Ajanı</strong>
            <small>Dual Investment Risk Gate</small>
          </span>
        </a>
        <div className="status-rail">
          <div className="status-cell">
            <span className="status-label">Piyasa</span>
            <strong>
              <i
                className={`status-dot ${connection.verified ? "status-dot-live" : "status-dot-unverified"}`}
              />
              OKX TR <em>{connection.marketState}</em>
            </strong>
          </div>
          <div className="status-cell status-cell-network">
            <span className="status-label">Agent ağı</span>
            <strong>
              Avalanche Fuji <em>TESTNET</em>
            </strong>
          </div>
          <div className="status-cell status-cell-time">
            <span className="status-label">Son veri</span>
            <strong>{formatTime(report?.createdAt)}</strong>
          </div>
          <div className="account-state">
            <span className="account-icon" aria-hidden="true">
              R
            </span>
            <span>
              <strong>{connection.accountTitle}</strong>
              <small>{connection.accountDetail}</small>
            </span>
          </div>
        </div>
      </header>

      {state.status === "success" ? (
        <OfferInspector report={state.report} />
      ) : (
        <section className="shell-content" aria-labelledby="shell-title">
          <div className="intro-copy">
            <h1 id="shell-title">
              Yüksek APR’yi değil,
              <br /> aldığın riski ölç.
            </h1>
            <p className="lede">
              Canlı OKX teklifini işlem yapılabilir opsiyon bandı, fırsat
              maliyeti ve kişisel risk politikanla karşılaştıran deterministik
              işlem kapısı.
            </p>
            <ul className="principles" aria-label="Ürün ilkeleri">
              <li>Gerçek kaynak ve zaman damgası</li>
              <li>Tek sayı yerine uygulanabilir bant</li>
              <li>Her write için ayrı insan onayı</li>
            </ul>
          </div>

          <section
            className={`analysis-state analysis-state-${state.status}`}
            aria-live="polite"
            aria-busy={content.busy ?? false}
          >
            <div className="state-topline">
              <span>{content.eyebrow}</span>
              <span className="state-source">OKX TR · server-side</span>
            </div>
            {state.status === "loading" ? (
              <>
                <div className="sr-only">
                  <h2>{content.title}</h2>
                  <p>{content.description}</p>
                </div>
                <div className="skeleton-stack" aria-hidden="true">
                  <span className="skeleton skeleton-title" />
                  <span className="skeleton skeleton-copy" />
                  <span className="skeleton skeleton-copy skeleton-copy-short" />
                </div>
              </>
            ) : (
              <>
                <span className="state-status-label">Durum</span>
                <h2>{content.title}</h2>
                <p>{content.description}</p>
              </>
            )}
            <div className="state-footer">
              {content.action ? (
                <a className="primary-action" href="/">
                  {content.action}
                </a>
              ) : (
                <span className="loading-note">Kaynaklar eşzamanlanıyor</span>
              )}
              {report ? (
                <code title={report.analysisId}>{report.analysisId}</code>
              ) : (
                <span className="privacy-note">
                  Credential tarayıcıya girmez
                </span>
              )}
            </div>
          </section>
        </section>
      )}
    </main>
  );
}
