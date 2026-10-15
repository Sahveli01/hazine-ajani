# C2 güvenli DCD write adapter kanıtı — 16 Ekim 2026

## Resmî komut doğrulaması

Kurulu `@okx_ai/okx-trade-cli@1.4.8` yardım ve tool şeması yeniden incelendi:

- `quote-and-buy` gerçek quote + execute işlemini atomik yapar.
- Gerekli alanlar `productId`, `sz` ve `notionalCcy` değerleridir.
- `clOrdId` idempotency içindir.
- `minAnnualizedYield` yüzde olarak gönderilir; response oranları ondalık kesirdir.
- `order --ordId` yalnız güncel order state'i okumak için kullanılır.

## Otomatik kanıt

Altı test şunları doğruladı:

1. Execution flag kapalıyken transport sıfır kez çağrılır.
2. Dry-run renderer gerçek CLI argüman sırasını, 32 karakterlik stabil idempotency ID'yi ve doğru yüzde dönüşümünü üretir.
3. Submit cevabı yalnız `SUBMITTED` sayılır; ayrıca order-state okuması `CONFIRMED` üretir.
4. Initial/pending ve rejected durumları doğru ayrılır.
5. Belirsiz write yalnız bir kez denenir; hata gövdesi dışarı taşınmaz ve otomatik retry yapılmaz.
6. Bozuk veya eksik response başarı sayılmaz.
7. Server-side maksimum canlı tutar, kullanıcı onayı olsa bile transport çağrısından önce uygulanır.

## Canlı branch durumu

Gerçek OKX aboneliği çalıştırılmadı. Belirli ürün/tutar için ayrı kullanıcı onayı bulunmuyor ve son canlı B8 analizi `REJECT / PREMIUM_BELOW_MARKET_BAND` sonucundaydı. `OKX_EXECUTION_ENABLED` kapalı kalır. Bu, roadmap'in izin verdiği analiz-only güvenli davranıştır; mock order veya sahte success üretilmedi.
