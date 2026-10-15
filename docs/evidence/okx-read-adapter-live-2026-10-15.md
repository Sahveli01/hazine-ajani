# OKX read adapter canlı doğrulama — 2026-10-15

Bu kanıt B2 adımındaki runtime adaptörünün gerçek OKX verisiyle çalıştığını kaydeder. Buradaki zamanlar ve adetler yalnız doğrulama anına aittir; uygulama bunları fixture veya fallback olarak kullanmaz.

## Uygulanan sınır

- `packages/okx-adapter/src/read-adapter.ts` yalnız allowlist içindeki read komutlarını çalıştırır.
- Private DCD ve Simple Earn çağrıları server-side `OKX_READ_PROFILE` profili ister. Public spot, index, option instrument, order book, mark ve Greeks çağrıları credential taşımaz.
- CLI shell üzerinden çalıştırılmaz; kurulu `@okx_ai/okx-trade-cli@1.4.8` JavaScript giriş noktası mevcut Node executable ile çağrılır.
- Rate limit, timeout ve geçici CLI hataları yalnız idempotent okumada en fazla iki kez yeniden denenir. Auth, regional, invalid, empty ve stale sonuçlar yeniden denenmez.
- Her normalize snapshot source, server time, received time ve expiry taşır. DCD/market quote üst sınırı 60 saniye; saatlik Simple Earn serisi üst sınırı iki saattir.
- Runtime kodunda sabit piyasa değeri, fixture veya örnek veri fallback'i yoktur.

## Public live smoke

Komut:

```powershell
pnpm --filter @hazine-ajani/okx-adapter smoke:public BTC-USD-261106-79000-P
```

Exit `0` verdi. Gerçek `BTC-USDT` spot snapshot'ı ile exact `BTC-USD-261106-79000-P` option snapshot'ı normalize edildi. Option akışı instrument, order book, IV/Greeks, mark ve `BTC-USD` index okumalarını birleştirdi. Doğrulama snapshot zamanları:

- Spot server time: `2026-10-15T19:44:50.575Z`
- Option birleşik server time: `2026-10-15T19:44:44.123Z`
- Kaynaklar: `OKX_PUBLIC_INDEX`, `OKX_PUBLIC_OPTION`

Script credential gerektirmediği için CI-safe'tir. Option ID zamanla vadesi dolacağından CI veya sonraki manuel koşuda güncel, canlı bir option ID argümanı verilmelidir; geçersiz ID için fixture'a düşmez.

## Private live smoke

Profil yalnız process environment üzerinden verildi:

```powershell
$env:OKX_READ_PROFILE = 'okx-tr-read'
pnpm --filter @hazine-ajani/okx-adapter smoke:private
```

Exit `0` verdi. Read-only OKX TR profiliyle 208 gerçek BTC/USDT put yönlü DCD ürünü ve gerçek USDT Simple Earn saatlik oranı normalize edildi.

- DCD server time: `2026-10-15T19:45:50.512Z`
- DCD received time: `2026-10-15T19:45:53.404Z`
- Simple Earn server time: `2026-10-15T19:00:00.000Z`
- Kaynaklar: `OKX_PRIVATE_DCD`, `OKX_SIMPLE_EARN`

API key, secret, passphrase, auth header ve hesap kimliği komuta, çıktıya veya bu kanıta yazılmadı. Withdrawal veya herhangi bir write komutu kullanılmadı.

## Otomatik doğrulama

`read-adapter.test.ts` gerçek-şekilli payloadlarla DCD, option/book/Greeks/mark/index, spot ve Simple Earn normalizasyonunu; typed malformed/empty/stale hatalarını; bounded retry'ı; non-retry regional sonucu; private/public ayrımını; exact option seçimini ve shell'siz CLI invocation'ı kapsar.

## Doğrulanan CLI sözleşmeleri

- `okx earn dcd products --baseCcy <ccy> --quoteCcy <ccy> --optType <C|P>`
- `okx earn savings rate-history --ccy <ccy> --limit <n>`
- `okx market ticker <instId>`
- `okx market instruments --instType OPTION --uly <uly> --instId <id>`
- `okx market orderbook <instId>`
- `okx option greeks --uly <uly> --expTime <YYMMDD>`
- `okx market mark-price --instType OPTION --instId <id>`
- `okx market index-ticker --instId <id>`

Parametreler kurulu CLI'nin `--help` çıktısından yeniden doğrulandı.
