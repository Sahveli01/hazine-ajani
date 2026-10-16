import type { AnalysisReport } from "@hazine-ajani/report-schema";

export type AgentPaymentState =
  | { status: "IDLE" }
  | { status: "AWAITING_SIGNATURE" }
  | { status: "USER_REJECTED" }
  | { status: "WRONG_CHAIN" }
  | { status: "INSUFFICIENT_BALANCE" }
  | { status: "SUBMITTED"; transactionHash?: string }
  | { status: "PENDING"; transactionHash?: string }
  | {
      status: "CONFIRMED";
      transactionHash: string;
      explorerUrl: string;
      reportId: string;
      confirmedAt: string;
    }
  | { status: "FACILITATOR_ERROR" }
  | { status: "REVERTED"; transactionHash?: string };

const content = {
  IDLE: {
    title: "Ödeme isteği hazır",
    description: "İkinci agent canlı raporu almak için 0,01 test USDC öder.",
    tone: "neutral",
    canRetry: false,
  },
  AWAITING_SIGNATURE: {
    title: "Cüzdan onayı bekleniyor",
    description: "Fuji testnet ödeme ayrıntılarını cüzdanda kontrol et.",
    tone: "attention",
    canRetry: false,
  },
  USER_REJECTED: {
    title: "İstek iptal edildi",
    description: "Cüzdan reddi hata değildir; test tokenı harcanmadı.",
    tone: "neutral",
    canRetry: false,
  },
  WRONG_CHAIN: {
    title: "Fuji ağına geç",
    description: "Bu servis yalnız Avalanche Fuji testnet üzerinde çalışır.",
    tone: "attention",
    canRetry: true,
  },
  INSUFFICIENT_BALANCE: {
    title: "Test bakiyesi yetersiz",
    description: "Ödeme için test USDC, ağ ücreti için test AVAX gerekir.",
    tone: "attention",
    canRetry: true,
  },
  SUBMITTED: {
    title: "İşlem gönderildi",
    description: "Hash alındı; Fuji receipt henüz kesinleşmedi.",
    tone: "attention",
    canRetry: false,
  },
  PENDING: {
    title: "Fuji onayı bekleniyor",
    description: "Ekranın geri kalanı kullanılabilir; RPC doğrulaması sürüyor.",
    tone: "attention",
    canRetry: false,
  },
  CONFIRMED: {
    title: "Ücretli rapor doğrulandı",
    description: "Test USDC transferi RPC ile doğrulandı ve rapora bağlandı.",
    tone: "success",
    canRetry: false,
  },
  FACILITATOR_ERROR: {
    title: "Ödeme servisine ulaşılamadı",
    description:
      "Fuji ağı veya ödeme servisi yanıt vermedi; paid sonucu üretilmedi.",
    tone: "danger",
    canRetry: true,
  },
  REVERTED: {
    title: "Testnet işlemi geri döndü",
    description: "Receipt başarısız; rapor ücretli olarak işaretlenmedi.",
    tone: "danger",
    canRetry: true,
  },
} as const;

export function agentPaymentView(state: AgentPaymentState) {
  return content[state.status];
}

export function agentPaymentStateFromReport(
  report: AnalysisReport,
): AgentPaymentState {
  const payment = report.x402Payment;
  if (!payment) return { status: "IDLE" };
  return {
    status: "CONFIRMED",
    transactionHash: payment.transactionHash,
    explorerUrl: payment.explorerUrl,
    reportId: report.analysisId,
    confirmedAt: payment.confirmedAt,
  };
}
