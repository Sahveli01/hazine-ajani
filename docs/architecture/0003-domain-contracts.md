# ADR 0003 — Sürümlü finansal domain sözleşmeleri

- Durum: Kabul edildi
- Tarih: 2026-10-15

## Bağlam

Hazine Ajanı'nın OKX adapter'ı, fiyatlama motoru, policy motoru, web arayüzü, API ve agent-client süreci aynı analiz gerçeğini paylaşmalıdır. Benzer fakat farklı payloadlar finansal birimleri, timestamp'leri veya karar nedenlerini sessizce kaydırabilir. JavaScript `number` tipi de para ve oranlarda decimal hassasiyetini korumaz.

## Karar

1. Canonical sözleşmeler `@hazine-ajani/report-schema` paketinde Zod runtime şemaları ve bunlardan türetilen TypeScript tipleri olarak tutulur.
2. Dışarıdan giren her payload `parse`/`safeParse` sınırından geçer. Şemalar strict'tir; bilinmeyen alan kontrollü validation hatasıdır.
3. Para, oran, fiyat, Greeks ve miktar değerleri exponent içermeyen decimal string ile taşınır. `scale`, kabul edilen ondalık basamak sayısını açıklar. Band karşılaştırması `BigInt` ile ortak ölçeğe getirilir; `Number` kullanılmaz.
4. Para alanı currency, kontrat miktarı unit taşır. Timestamp'ler timezone içeren ISO 8601 biçimindedir. Expiry, quote ve observed zamanları ayrı alanlardır.
5. `AnalysisReport.schemaVersion` başlangıçta `1.0.0` ve parser tam sürüm eşleşmesiyle fail-closed çalışır.
6. Geriye uyumluluk kuralı:
   - Patch, validation bug düzeltmesi veya açıklama değişikliğidir; payload şekli değişmez.
   - Minor, yalnız yeni optional alan veya yeni consumer özelliğidir. Eski parser'ın unknown-field nedeniyle reddedebilmesi kabul edilir; consumer desteklediği tam sürümü ilan eder ve upgrade edilir.
   - Alan silme, anlam/birim değiştirme, required alan ekleme veya enum daraltma major sürüm gerektirir.
   - Bilinmeyen sürüm otomatik cast edilmez. Açık migration fonksiyonu yazılmadan başka sürüm kabul edilmez.
7. API key, secret, passphrase, auth header, ham hesap/bakiye payloadı ve kişisel hesap kimliği domain raporunda alan değildir. Strict nested object'ler bu alanların sızmasını reddeder.
8. x402 receipt opsiyoneldir; varsa network, chain ID, testnet bayrağı, token/tutar, payer, alıcı, tx hash, HTTPS explorer URL ve confirmation timestamp eksiksiz olmalıdır.

## Canonical tipler

- `DcdOffer`
- `OptionSnapshot`
- `MarketSnapshot`
- `RiskPolicy`
- `ProxyMatch`
- `StressScenario`
- `DataQuality`
- `ExecutionState`
- `X402Payment`
- `AnalysisReport`

`AnalysisReport`, PROJECT.md'deki tek paylaşılmış rapor sözleşmesidir. UI veya agent-client için ikinci bir benzer rapor tipi oluşturulmaz.

## Sonuçlar

- B2 adapter'ları ham OKX alanlarını bu sözleşmeye normalize etmeden uygulama içine veremez.
- Fiyatlama ve policy paketleri decimal stringleri kendi deterministik decimal yardımcılarıyla işler.
- Schema değişikliği contract test ve sürüm kararı olmadan birleştirilemez.
- Test fixture'ları yalnız test kaynaklarında kalır; production runtime tarafından import edilemez.
