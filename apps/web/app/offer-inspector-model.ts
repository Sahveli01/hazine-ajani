import type { AnalysisReport } from "@hazine-ajani/report-schema";

const decisionCopy = {
  ACCEPT: "Politika kontrolleri geçti",
  ASK: "Açık kullanıcı onayı gerekiyor",
  REJECT: "Prim, piyasa bandının altında",
} as const;

const reasonLabels: Record<AnalysisReport["reasonCodes"][number], string> = {
  PREMIUM_BELOW_MARKET_BAND: "Prim, piyasa bandının altında",
  STRESS_LOSS_EXCEEDS_POLICY: "Stres kaybı politika sınırını aşıyor",
  IMPLIED_CONVERSION_EXCEEDS_POLICY: "Dönüşüm olasılığı sınırı aşıyor",
  LIQUIDITY_RESERVE_BREACHED: "Likit rezerv sınırı korunamıyor",
  INSUFFICIENT_MARKET_DATA: "Piyasa verisi karar için yetersiz",
  STALE_QUOTE: "Teklif zamanı geçmiş",
  NO_SUITABLE_PROXY: "Uygun opsiyon proxy’si bulunamadı",
  WRITE_REQUIRES_CONFIRMATION: "Açık kullanıcı onayı gerekiyor",
  REGIONAL_PRODUCT_UNAVAILABLE: "Ürün bu bölgede kullanılamıyor",
  SETTLEMENT_CURRENCY_NOT_ALLOWED: "Settlement para birimi izinli değil",
  INVALID_POLICY: "Risk politikası doğrulanamadı",
  POLICY_CHECKS_PASSED: "Politika kontrolleri geçti",
};

export function buildOfferInspectorView(report: AnalysisReport) {
  const firstReason = report.reasonCodes[0];
  return {
    decision: report.decision,
    reason: firstReason
      ? reasonLabels[firstReason]
      : decisionCopy[report.decision],
    blocksValuation: report.dataQuality.status === "INSUFFICIENT",
    dcdProductId: report.dcdOffer.productId,
    optionInstrumentId: report.optionSnapshot.instrumentId,
    policyVersion: report.riskPolicy.policyVersion,
    expiresAt: report.expiresAt,
    nextStep:
      report.decision === "ACCEPT"
        ? "Koşulları gözden geçir"
        : report.decision === "ASK"
          ? "Politika koşulunu incele"
          : undefined,
  };
}
