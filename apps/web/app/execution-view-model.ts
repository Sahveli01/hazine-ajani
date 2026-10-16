export type ExecutionUiState =
  | { status: "DISABLED" }
  | { status: "AWAITING_CONFIRMATION" }
  | { status: "SUBMITTING" }
  | { status: "SUBMITTED"; orderId?: string }
  | { status: "PENDING"; orderId?: string; okxState?: string }
  | { status: "CONFIRMED"; orderId?: string; sourceReference?: string }
  | { status: "FAILED"; message?: string }
  | { status: "RECONCILIATION_REQUIRED"; orderId?: string }
  | { status: "REJECTED_BY_USER" }
  | { status: "EXPIRED" };

const content = {
  DISABLED: {
    label: "İşlem kapalı",
    title: "Canlı OKX işlemi kapalı",
    description:
      "Bu çalışma yalnız analiz üretiyor. Ayrı, minimum izinli işlem profili yapılandırılmadığı için emir aksiyonu gösterilmiyor.",
  },
  AWAITING_CONFIRMATION: {
    label: "Onay bekliyor",
    title: "İşlemi ayrı olarak onayla",
    description:
      "Bu onay tek kullanımlıdır. Ürün, tutar ve dönüşüm riskini kontrol et.",
  },
  SUBMITTING: {
    label: "Gönderiliyor",
    title: "OKX’e gönderiliyor",
    description: "Onay tüketildi; aynı emir yeniden gönderilemez.",
  },
  SUBMITTED: {
    label: "Gönderildi",
    title: "Emir gönderildi",
    description: "Order ID alındı. Kesin sonuç için OKX durumu doğrulanıyor.",
  },
  PENDING: {
    label: "Sonuç bekleniyor",
    title: "OKX sonucu bekleniyor",
    description:
      "Emir açık veya sonuçlanma aşamasında; OKX durumu yeniden kontrol ediliyor.",
  },
  CONFIRMED: {
    label: "Doğrulandı",
    title: "OKX emri doğrulandı",
    description: "Son durum ayrı OKX order sorgusuyla doğrulandı.",
  },
  FAILED: {
    label: "Tamamlanamadı",
    title: "İşlem tamamlanamadı",
    description: "OKX kesin başarısız durum bildirdi. Yeni emir gönderilmedi.",
  },
  RECONCILIATION_REQUIRED: {
    label: "Kontrol gerekiyor",
    title: "Sonuç belirsiz",
    description:
      "Ağ yanıtı kesin değil. Otomatik tekrar yok; mevcut emir OKX üzerinden sorgulanmalı.",
  },
  REJECTED_BY_USER: {
    label: "Vazgeçildi",
    title: "İşlemden vazgeçildi",
    description: "Vazgeçme hata değildir ve OKX emir çağrısı yapılmadı.",
  },
  EXPIRED: {
    label: "Süresi doldu",
    title: "Teklifin süresi doldu",
    description: "Eski onay kullanılamaz. Yeni canlı analiz alınmalı.",
  },
} as const;

export function executionView(state: ExecutionUiState) {
  return {
    ...content[state.status],
    canConfirm: state.status === "AWAITING_CONFIRMATION",
    canCancel: state.status === "AWAITING_CONFIRMATION",
  };
}

export function executionUiStateFromMachineResult(result: {
  status: string;
  submissionId?: string;
}): ExecutionUiState {
  switch (result.status) {
    case "AWAITING_CONFIRMATION":
      return { status: "AWAITING_CONFIRMATION" };
    case "REJECTED_BY_USER":
      return { status: "REJECTED_BY_USER" };
    case "SUBMITTED":
      return result.submissionId
        ? { status: "SUBMITTED", orderId: result.submissionId }
        : { status: "SUBMITTED" };
    case "SUBMISSION_UNKNOWN":
    case "RECONCILIATION_REQUIRED":
      return { status: "RECONCILIATION_REQUIRED" };
    case "EXPIRED_REANALYSIS_REQUIRED":
      return { status: "EXPIRED" };
    default:
      return { status: "FAILED" };
  }
}

export function executionUiStateFromReconciliation(result: {
  status: "PENDING" | "CONFIRMED" | "FAILED";
  orderId: string;
  okxState: string;
}): ExecutionUiState {
  if (result.status === "CONFIRMED") {
    return {
      status: "CONFIRMED",
      orderId: result.orderId,
      sourceReference: `OKX earn dcd order · live · ${result.okxState}`,
    };
  }
  if (result.status === "PENDING") {
    return {
      status: "PENDING",
      orderId: result.orderId,
      okxState: result.okxState,
    };
  }
  return { status: "FAILED", message: result.okxState };
}
