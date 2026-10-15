# ADR 0009 — Canlı analiz orchestration sınırı

## Karar

Tek analiz isteği `apps/api` içindeki `createLiveAnalysisService` tarafından yürütülür. Servis private DCD ve Simple Earn ile public spot ve option/index snapshotlarını `okx-adapter` üzerinden toplar; proxy, değerleme ve risk kararını mevcut deterministik paketlere devreder. UI ve x402 route'u aynı servis sonucundaki kanonik `AnalysisReport` nesnesini tüketir.

Her analiz ve correlation kimliği aynı rastgele suffix'i kullanır. `observability` paketi yalnız izin verilen tool adı, başlangıç/bitiş zamanı, latency, typed hata kodu, karar ve neden kodlarını kaydeder. Request/response payload'u, credential, header, profil adı ve kişisel hesap alanı trace API'sine kabul edilmez.

## Gerekçe

Bu sınır hesap mantığının HTTP katmanına veya LLM'e dağılmasını önler. `Promise.allSettled` ilk üç bağımsız kaynağın tamamını gözlemler; kaynaklardan biri başarısız veya stale ise kısmi veriden rapor üretmez. Option çağrısı seçilen gerçek DCD teklifine bağlı olduğu için ikinci aşamada yapılır.

## Sonuçlar

- Runtime fallback değer, fixture veya sıfır oran kullanmaz.
- Source hatası `SOURCE_UNAVAILABLE`, stale veri `STALE_DATA`, eşleşme yokluğu `NO_SUITABLE_PROXY` olur.
- Exact option kimliği DCD ürün kimliği ve OKX underlying alanından deterministik türetilir.
- Simple Earn ve option fee oranı birbirinden ayrıdır; fee rate, kullanıcının gerçek hesap seviyesine göre server-side ayar olarak verilmelidir.
- Bu adım order yazmaz ve para hareketi oluşturmaz.
