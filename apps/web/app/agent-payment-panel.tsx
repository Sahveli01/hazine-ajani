"use client";

import type { AnalysisReport } from "@hazine-ajani/report-schema";
import { useState } from "react";

import {
  agentPaymentStateFromReport,
  agentPaymentView,
  type AgentPaymentState,
} from "./agent-payment-view-model";

function shortHash(value: string): string {
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export function AgentPaymentPanel({
  report,
  state = agentPaymentStateFromReport(report),
  onRequest,
  onRetry,
  onReset,
}: {
  report: AnalysisReport;
  state?: AgentPaymentState;
  onRequest?: () => void;
  onRetry?: () => void;
  onReset?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const view = agentPaymentView(state);
  const transactionHash =
    "transactionHash" in state ? state.transactionHash : undefined;
  const canRequest = state.status === "IDLE" && onRequest;
  const canRetry = view.canRetry && onRetry;

  return (
    <section
      className={`agent-payment agent-payment-${view.tone}`}
      aria-labelledby="agent-payment-title"
      aria-live="polite"
    >
      <div className="agent-payment-heading">
        <h2 id="agent-payment-title">{view.title}</h2>
        <strong>AVALANCHE FUJI · TESTNET</strong>
      </div>
      <p>{view.description}</p>

      <dl className="agent-payment-terms">
        <div>
          <dt>HTTP</dt>
          <dd>402 Payment Required</dd>
        </div>
        <div>
          <dt>Fiyat</dt>
          <dd>0,01 test USDC</dd>
        </div>
        <div>
          <dt>Ağ</dt>
          <dd>Avalanche Fuji · 43113</dd>
        </div>
      </dl>

      {transactionHash ? (
        <div className="agent-payment-receipt">
          <span>İşlem hash’i</span>
          <code title={transactionHash}>{shortHash(transactionHash)}</code>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(transactionHash).then(() => {
                setCopied(true);
              });
            }}
          >
            {copied ? "Kopyalandı" : "Hash’i kopyala"}
          </button>
          {state.status === "CONFIRMED" ? (
            <a href={state.explorerUrl} target="_blank" rel="noreferrer">
              Snowtrace’te doğrula
            </a>
          ) : null}
        </div>
      ) : null}

      {state.status === "CONFIRMED" ? (
        <details className="agent-payment-report" open>
          <summary>Doğrulanmış rapor makbuzu</summary>
          <dl>
            <div>
              <dt>Rapor</dt>
              <dd>
                <code>{state.reportId}</code>
              </dd>
            </div>
            <div>
              <dt>Onay</dt>
              <dd>{state.confirmedAt}</dd>
            </div>
            <div>
              <dt>Rapor geçerliliği</dt>
              <dd>{report.expiresAt}</dd>
            </div>
            <div>
              <dt>Karar</dt>
              <dd>{report.decision}</dd>
            </div>
            <div>
              <dt>Şema</dt>
              <dd>{report.schemaVersion}</dd>
            </div>
          </dl>
          <pre>
            {JSON.stringify(
              {
                schemaVersion: report.schemaVersion,
                analysisId: report.analysisId,
                decision: report.decision,
                x402Payment: report.x402Payment,
              },
              null,
              2,
            )}
          </pre>
        </details>
      ) : null}

      {canRequest || canRetry ? (
        <div className="agent-payment-actions">
          {canRequest ? (
            <button type="button" onClick={onRequest}>
              Ödeme isteğini başlat
            </button>
          ) : null}
          {canRetry ? (
            <button type="button" onClick={onRetry}>
              Yeniden dene
            </button>
          ) : null}
        </div>
      ) : null}
      {state.status === "USER_REJECTED" && onReset ? (
        <div className="agent-payment-actions">
          <button type="button" onClick={onReset}>
            Başlangıca dön
          </button>
        </div>
      ) : null}
      {state.status === "INSUFFICIENT_BALANCE" ? (
        <a
          className="agent-payment-faucet"
          href="https://core.app/tools/testnet-faucet"
          target="_blank"
          rel="noreferrer"
        >
          Avalanche Fuji test faucet’ını aç
        </a>
      ) : null}
    </section>
  );
}
