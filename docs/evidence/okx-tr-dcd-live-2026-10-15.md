# OKX TR canlı DCD okuma kanıtı — 2026-10-15

Bu dosya A3 kill gate'inin redakte edilmiş, tarihsel kanıtıdır. Aşağıdaki piyasa değerleri yalnız doğrulama anını gösterir; uygulama bunları import edemez veya çalışma zamanı verisi olarak kullanamaz.

## Ortam ve güvenlik

- Kurulu araç: `@okx_ai/okx-trade-cli@1.4.8`
- Bölge/site: `tr`, API host: `https://tr.okx.com`
- Profil: `okx-tr-read`; live ve ilk anahtar read-only
- Withdrawal: kapalı
- Credential değerleri ve hesap kimliği bu dosyaya, komut çıktısına veya Git'e alınmadı.
- Doğrulama zamanı: 2026-10-15 (Europe/Istanbul)

## Başarılı read-only smoke

Komutlar kurulu CLI'nin `--help` çıktısıyla doğrulandıktan sonra çalıştırıldı:

```powershell
pnpm okx --profile okx-tr-read --live --json --env earn dcd pairs
pnpm okx --profile okx-tr-read --live --json --env earn dcd products --baseCcy BTC --quoteCcy USDT --optType P --expDate 2026-11-06 --strikeNear 79000
```

Her iki komut da exit `0` verdi. `pairs`, BTC/USDT için hem `C` hem `P` yönlerini içerdi. `products`, gerçek BTC/USDT Buy Low (`optType: P`) ürünleri döndürdü.

Temsilî, hesap bilgisi içermeyen ürün şeması:

```json
{
  "absYield": "0.01577558",
  "annualizedYield": "0.2673",
  "baseCcy": "BTC",
  "expTime": "1793952000000",
  "maxSize": "6000000.0000000000000000",
  "minSize": "10.0000000000000000",
  "notionalCcy": "USDT",
  "optType": "P",
  "productId": "BTC-USDT-261106-79000-P",
  "quoteCcy": "USDT",
  "quoteTime": "1792087850661",
  "stepSz": "1",
  "strike": "79000",
  "uly": "BTC-USD"
}
```

- API quote zamanı: `2026-10-15T18:10:50.661Z`
- Vade: `2026-11-06T08:00:00.000Z`
- A4, bu gerçek ürünün `79000` strike ve vadesini option proxy aramasında başlangıç noktası olarak kullanabilir; yeni analiz yine canlı DCD verisini tekrar çekmelidir.

CLI 1.4.8'de ayrı bir quote/read eylemi yoktur. `quote-and-buy`, yardım çıktısında açıkça abonelik yapan atomik write işlemi olarak tanımlanır. Kullanıcı bu belirli işlem için ayrıca onay vermediği için çağrılmadı.

## Güvenli başarısızlıklar

Olmayan profil ile aynı read çağrısı exit `1` verdi ve yalnız “No credentials found” mesajı üretti. Çıktıda API key, secret, passphrase, auth header veya hesap kimliği yoktu.

`--demo` ile DCD `pairs` read çağrısı exit `1`, API kodu `50026` verdi. Bu kurulumda DCD demo yolu kullanılabilir veri sağlamıyor. Kurulu resmî paket ayrıca Earn/DCD özelliklerinin simulated trading modunda kullanılamadığını bildiriyor. DCD write eylemi bu kanıt için denenmedi.

## Kaynaklar

- [OKX Agent Trade Kit yapılandırması](https://github.com/okx/agent-trade-kit/blob/github-main/docs/configuration.md)
- [OKX TR API rehberi](https://tr.okx.com/docs-v5/en/)
- [OKX Agent Trade Kit deposu](https://github.com/okx/agent-trade-kit)
