# B8 canlı analiz orchestration kanıtı — 16 Ekim 2026

## Canlı read-only sonuç

Kayıtlı `okx-tr-read` profiliyle `apps/api/scripts/live-analysis-smoke.ts` çalıştırıldı. Secret veya ham private payload yazdırılmadı.

- Durum: `SUCCESS`
- Analysis ID: `ana_d06a8adbf02b4fcaa9a4af1654e7aefd`
- Oluşturulma: `2026-10-15T22:34:24.971Z`
- Son geçerlilik: `2026-10-15T22:35:22.391Z`
- DCD: `BTC-USDT-261016-81000-P`
- Option proxy: `BTC-USD-261016-81000-P`
- Karar: `REJECT`
- Neden: `PREMIUM_BELOW_MARKET_BAND`
- Rapor şeması: `1.0.0`

Dört gerçek kaynak aynı raporda yer aldı:

1. `OKX_PRIVATE_DCD` — `2026-10-15T22:34:23.609Z`
2. `OKX_SIMPLE_EARN` — `2026-10-15T22:00:00.000Z`
3. `OKX_PUBLIC_INDEX` spot ticker — `2026-10-15T22:34:26.364Z`
4. `OKX_PUBLIC_OPTION` — `2026-10-15T22:34:22.391Z`

Trace aynı analysis/correlation suffix'ini taşıdı. DCD, Earn, spot ve option çağrılarının latency değerleri sırasıyla 1791 ms, 1636 ms, 1629 ms ve 1594 ms olarak kaydedildi. Son event yalnız deterministik karar ve neden kodunu taşıdı. Trace içinde request payload'u, API credential, auth header, profil adı veya PII bulunmadı.

## Hata ve şema doğrulaması

- Network/CLI failure testi kısmi rapor yerine `SOURCE_UNAVAILABLE` ve izin verilen hata kodu döndürdü.
- Stale adapter hatası `STALE_DATA` olarak korunuyor; eski snapshot ile rapor kurulması mümkün değil.
- Başarılı sonuç `parseAnalysisReport` ile iki kez doğrulandı: açıklama öncesi canonical taslak ve açıklama sonrası nihai rapor.
- 91 Vitest testi ve 4 Node invariant testi geçti.
- Tüm workspace TypeScript projeleri `tsc --noEmit` ile geçti.
- ESLint geçti; Next.js production build tamamlandı.

## Çalıştırma

```powershell
$env:OKX_READ_PROFILE = 'okx-tr-read'
.\node_modules\.bin\tsx.cmd apps/api/scripts/live-analysis-smoke.ts
```

Komut yalnız yerel OKX profil adını kullanır. Credential değerleri environment'a veya çıktıya alınmaz.
