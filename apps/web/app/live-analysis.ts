import {
  analysisReportSchema,
  type AnalysisReport,
} from "@hazine-ajani/report-schema";

export type ShellReport = AnalysisReport;
export type AnalysisViewState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; reason: "NETWORK_UNAVAILABLE" | "INVALID_RESPONSE" }
  | { status: "stale"; report: ShellReport }
  | { status: "success"; report: ShellReport };

type RequestAnalysis = () => Promise<Response>;

export async function loadLiveAnalysis(
  request: RequestAnalysis,
  now = new Date(),
): Promise<AnalysisViewState> {
  try {
    const response = await request();
    if (response.status === 204 || response.status === 422) {
      return { status: "empty" };
    }
    if (!response.ok) {
      return { status: "error", reason: "NETWORK_UNAVAILABLE" };
    }
    const parsed = analysisReportSchema.safeParse(await response.json());
    if (!parsed.success) {
      return { status: "error", reason: "INVALID_RESPONSE" };
    }
    return Date.parse(parsed.data.expiresAt) <= now.getTime()
      ? { status: "stale", report: parsed.data }
      : { status: "success", report: parsed.data };
  } catch {
    return { status: "error", reason: "NETWORK_UNAVAILABLE" };
  }
}

export function analysisStateContent(state: AnalysisViewState): {
  eyebrow: string;
  title: string;
  description: string;
  action?: string;
  busy?: boolean;
} {
  switch (state.status) {
    case "loading":
      return {
        eyebrow: "CANLI ANALİZ",
        title: "OKX verisi bekleniyor",
        description:
          "Dual Investment teklifi, opsiyon piyasası ve getiri oranı aynı zaman penceresinde toplanıyor.",
        busy: true,
      };
    case "empty":
      return {
        eyebrow: "ÜRÜN BULUNAMADI",
        title: "Şu anda denetlenebilir teklif yok",
        description:
          "Uygun BTC/USDT Buy Low teklifi veya kullanılabilir opsiyon proxy’si bulunamadı. Sistem değer uydurmadı.",
        action: "Yeniden kontrol et",
      };
    case "error":
      return {
        eyebrow: "BAĞLANTI KESİLDİ",
        title:
          state.reason === "INVALID_RESPONSE"
            ? "Rapor doğrulanamadı"
            : "Canlı kaynaklara ulaşılamıyor",
        description:
          "Sonuç üretmek için gerekli gerçek veri alınamadı. Bağlantıyı yenileyip güvenli biçimde tekrar deneyebilirsin.",
        action: "Tekrar dene",
      };
    case "stale":
      return {
        eyebrow: "KARAR DURDURULDU",
        title: "Veri eskidi",
        description:
          "Bu analiz artık işlem kararı için kullanılamaz. Güncel teklif ve piyasa verisi yeniden alınmalı.",
        action: "Analizi yenile",
      };
    case "success":
      return {
        eyebrow: "CANLI RAPOR HAZIR",
        title: "İşlemden önce riski ölç",
        description:
          "Hazine Ajanı, alınan primin canlı opsiyon piyasası ve senin risk sınırların karşısında yeterli olup olmadığını denetler.",
        action: "Raporu incele",
      };
  }
}

export function shellConnectionContent(state: AnalysisViewState): {
  marketState: "LIVE" | "ESKİ" | "KONTROL" | "TEKLİF YOK" | "ERİŞİLEMİYOR";
  accountTitle: string;
  accountDetail: string;
  verified: boolean;
} {
  if (state.status === "success") {
    const verified = state.report.sources.some(
      ({ kind }) => kind === "OKX_PRIVATE_DCD",
    );
    return {
      marketState: "LIVE",
      accountTitle: verified ? "Salt okunur kaynak" : "Hesap doğrulanamadı",
      accountDetail: verified ? "Private read doğrulandı" : "Write kapalı",
      verified,
    };
  }
  if (state.status === "stale") {
    return {
      marketState: "ESKİ",
      accountTitle: "Kaynak yeniden doğrulanmalı",
      accountDetail: "Write kapalı",
      verified: false,
    };
  }
  if (state.status === "loading") {
    return {
      marketState: "KONTROL",
      accountTitle: "Hesap kontrol ediliyor",
      accountDetail: "Credential sunucuda",
      verified: false,
    };
  }
  return {
    marketState: state.status === "empty" ? "TEKLİF YOK" : "ERİŞİLEMİYOR",
    accountTitle: "Hesap doğrulanamadı",
    accountDetail: "Write kapalı",
    verified: false,
  };
}
