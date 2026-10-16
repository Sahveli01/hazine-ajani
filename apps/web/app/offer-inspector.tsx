import type {
  AnalysisReport,
  DecimalValue,
  Money,
} from "@hazine-ajani/report-schema";

import { buildOfferInspectorView } from "./offer-inspector-model";
import { ExecutionPanel } from "./execution-panel";
import { exactPercentLabel } from "./financial-format";
import { AgentPaymentExperience } from "./agent-payment-experience";

const decisionCopy = {
  ACCEPT: {
    label: "ACCEPT",
    title: "Politika kontrolleri geçti",
    summary: "Canlı prim bandı ve risk sınırları bu teklif için uyumlu.",
  },
  ASK: {
    label: "ASK",
    title: "Açık kullanıcı onayı gerekiyor",
    summary: "Karar üretildi; para hareketinden önce koşullar doğrulanmalı.",
  },
  REJECT: {
    label: "REJECT",
    title: "Prim, piyasa bandının altında",
    summary: "Teklif bu risk karşılığında belirlenen alt sınırı karşılamıyor.",
  },
} as const;

const differenceLabels: Record<
  AnalysisReport["proxyMatch"]["differences"][number],
  string
> = {
  STRIKE: "Strike farkı",
  EXPIRY: "Vade farkı",
  SETTLEMENT_WINDOW: "Settlement penceresi farkı",
  SETTLEMENT_MECHANISM: "Settlement mekanizması farkı",
  SETTLEMENT_CURRENCY: "Settlement para birimi farkı",
  EARLY_REDEMPTION: "Erken kapama farkı",
  COUNTERPARTY: "Karşı taraf farkı",
};

function decimal(value: DecimalValue): string {
  return value.value;
}

function money(value: Money): string {
  return `${value.value} ${value.currency}`;
}

function percent(value: DecimalValue): string {
  return `${(Number(value.value) * 100).toLocaleString("tr-TR", {
    maximumFractionDigits: 4,
  })}%`;
}

function time(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function OfferInspector({ report }: { report: AnalysisReport }) {
  const copy = decisionCopy[report.decision];
  const view = buildOfferInspectorView(report);
  const insufficient = view.blocksValuation;
  const simpleEarn = report.valuation.simpleEarnOpportunityCost;

  return (
    <section className="inspector" aria-labelledby="decision-title">
      <div className="decision-stage">
        <div className="decision-context">
          <span className="live-label">CANLI TEKLİF DENETİMİ</span>
          <span>{report.dcdOffer.productId}</span>
          <span>{time(report.createdAt)}</span>
          <span>Geçerlilik: {time(view.expiresAt)}</span>
        </div>
        <div className={`decision decision-${report.decision.toLowerCase()}`}>
          <div>
            <p className="decision-label">Deterministik karar</p>
            <h1 id="decision-title">{copy.label}</h1>
          </div>
          <div className="decision-reasons">
            <strong>{view.reason}</strong>
            <p>{copy.summary}</p>
            <span>
              Veri güveni {percent(report.dataQuality.score)} ·{" "}
              {report.dataQuality.freshness}
            </span>
            {view.nextStep ? (
              <a className="decision-next-step" href="#policy-title">
                {view.nextStep}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {insufficient ? (
        <section className="valuation-blocked" role="alert">
          <strong>Değerleme durduruldu</strong>
          <p>
            Piyasa verisi bu teklif için yeterli değil. Sistem adil değer veya
            avantaj bandı üretmedi; yeni veri bekleniyor.
          </p>
        </section>
      ) : (
        <div className="evidence-strip" aria-label="Karar kanıtları">
          <div className="primary-evidence">
            <span>DCD dönem getirisi</span>
            <strong aria-label={exactPercentLabel(report.dcdOffer.termYield)}>
              {percent(report.dcdOffer.termYield)}
            </strong>
            <small
              aria-label={`APR, ${exactPercentLabel(report.dcdOffer.annualizedYield)}`}
            >
              APR {percent(report.dcdOffer.annualizedYield)}
            </small>
          </div>
          <div className="primary-evidence">
            <span>Opsiyon premium bandı</span>
            <strong
              aria-label={`${exactPercentLabel(report.valuation.proxyYieldBand.low)} ile ${exactPercentLabel(report.valuation.proxyYieldBand.high)} arası`}
            >
              {percent(report.valuation.proxyYieldBand.low)}–
              {percent(report.valuation.proxyYieldBand.high)}
            </strong>
            <small>{report.optionSnapshot.instrumentId}</small>
          </div>
          <div>
            <span>Net avantaj bandı</span>
            <strong
              aria-label={`${exactPercentLabel(report.valuation.netEdgeBand.low)} ile ${exactPercentLabel(report.valuation.netEdgeBand.high)} arası`}
            >
              {percent(report.valuation.netEdgeBand.low)}–
              {percent(report.valuation.netEdgeBand.high)}
            </strong>
          </div>
          <div>
            <span>Simple Earn</span>
            <strong
              aria-label={
                simpleEarn.status === "AVAILABLE"
                  ? exactPercentLabel(simpleEarn.value)
                  : undefined
              }
            >
              {simpleEarn.status === "AVAILABLE"
                ? percent(simpleEarn.value)
                : "Kullanılamıyor"}
            </strong>
          </div>
          <div>
            <span>Risk-nötr dönüşüm olasılığı</span>
            <strong
              aria-label={exactPercentLabel(
                report.valuation.riskNeutralConversionProbability,
              )}
            >
              {percent(report.valuation.riskNeutralConversionProbability)}
            </strong>
            <small title="Opsiyon fiyatından türetilen model ölçüsüdür; tahmin değildir.">
              Model ölçüsü · gerçek dünyadaki gerçekleşme olasılığı değildir
            </small>
          </div>
        </div>
      )}

      <div className="inspector-lower">
        <section className="policy-summary" aria-labelledby="policy-title">
          <div className="section-heading">
            <h2 id="policy-title">
              Doğrulanmış politika · v{report.riskPolicy.policyVersion}
            </h2>
            <span>Deterministik girdiler</span>
          </div>
          <dl>
            <div>
              <dt>Azami dönüşüm</dt>
              <dd
                aria-label={exactPercentLabel(
                  report.riskPolicy.maxRiskNeutralConversionProbability,
                )}
              >
                {percent(report.riskPolicy.maxRiskNeutralConversionProbability)}
              </dd>
            </div>
            <div>
              <dt>Asgari likit rezerv</dt>
              <dd
                aria-label={exactPercentLabel(
                  report.riskPolicy.minimumLiquidReserveRatio,
                )}
              >
                {percent(report.riskPolicy.minimumLiquidReserveRatio)}
              </dd>
            </div>
            <div>
              <dt>Azami stres kaybı</dt>
              <dd
                aria-label={exactPercentLabel(
                  report.riskPolicy.maxStressLossRatio,
                )}
              >
                {percent(report.riskPolicy.maxStressLossRatio)}
              </dd>
            </div>
            <div>
              <dt>İzinli settlement</dt>
              <dd>
                {report.riskPolicy.allowedSettlementCurrencies.join(" · ")}
              </dd>
            </div>
          </dl>
        </section>

        <details className="evidence-details">
          <summary>Kaynak ve eşleşme ayrıntıları</summary>
          <div className="detail-grid">
            <dl>
              <div>
                <dt>Proxy kalitesi</dt>
                <dd>{report.proxyMatch.quality}</dd>
              </div>
              <div>
                <dt>Strike farkı</dt>
                <dd>{money(report.proxyMatch.strikeDistance)}</dd>
              </div>
              <div>
                <dt>Vade farkı</dt>
                <dd>{report.proxyMatch.expiryDistanceMs} ms</dd>
              </div>
              <div>
                <dt>Bid–ask</dt>
                <dd>
                  {decimal(report.optionSnapshot.bid)}–
                  {decimal(report.optionSnapshot.ask)} BTC
                </dd>
              </div>
              <div>
                <dt>Veri güveni</dt>
                <dd aria-label={exactPercentLabel(report.dataQuality.score)}>
                  {percent(report.dataQuality.score)}
                </dd>
              </div>
              <div>
                <dt>Index</dt>
                <dd>{money(report.marketSnapshot.indexPrice)}</dd>
              </div>
            </dl>
            <div className="source-list">
              <strong>Canlı kaynaklar</strong>
              {report.sources.map((source) => (
                <p key={`${source.kind}-${source.reference}`}>
                  <span>{source.kind.replaceAll("_", " ")}</span>
                  {source.reference} · {time(source.observedAt)}
                </p>
              ))}
              {report.proxyMatch.differences.map((difference) => (
                <p key={difference}>{differenceLabels[difference]}</p>
              ))}
              <p>
                <span>Makine neden kodları</span>
                {report.reasonCodes.join(" · ")}
              </p>
              <p>
                DCD ve opsiyon aynı ürün değildir; settlement koşulları ayrı
                kalır.
              </p>
            </div>
          </div>
        </details>
      </div>
      {report.decision === "ACCEPT" ? (
        <ExecutionPanel report={report} state={{ status: "DISABLED" }} />
      ) : null}

      <AgentPaymentExperience report={report} />
    </section>
  );
}
