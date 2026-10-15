# OKX canlı option proxy kanıtı — 2026-10-15

Bu dosya A4 kill gate'inin zaman damgalı, tarihsel kanıtıdır. Değerler yalnız 2026-10-15 canlı inceleme penceresini gösterir; runtime fixture veya sabit piyasa verisi değildir.

## Eşleştirilen gerçek ürünler

| Alan         | DCD Buy Low                | Option proxy               |
| ------------ | -------------------------- | -------------------------- |
| Kimlik       | `BTC-USDT-261106-79000-P`  | `BTC-USD-261106-79000-P`   |
| Yön          | Buy Low / put-benzeri      | European put               |
| Underlying   | `BTC-USD`                  | `BTC-USD`                  |
| Strike       | `79000`                    | `79000`                    |
| Expiry       | `2026-11-06T08:00:00.000Z` | `2026-11-06T08:00:00.000Z` |
| Strike farkı | —                          | `0`                        |
| Vade farkı   | —                          | `0 ms`                     |

Exact strike ve expiry eşleşmesi vardır. Bu nedenle kontrat seçim kalitesi `exact` olarak sınıflandırılabilir; ekonomik payoff ve settlement ayrımları nedeniyle iki ürün yine birebir aynı ürün değildir.

## Aynı toplama penceresindeki canlı snapshot

Tüm aşağıdaki okumalar `2026-10-15T18:24:30.209Z` ile `2026-10-15T18:24:36.743Z` arasındaki yaklaşık 6,5 saniyelik pencerede alındı.

### DCD

- Quote zamanı: `2026-10-15T18:24:35.479Z`
- APR: `0.2678`
- Dönem getirisi (`absYield`): `0.01580509`
- Minimum/notional: `10 USDT`

### Option instrument ve piyasa

- Instrument state: `live`
- Contract: inverse, `ctMult=0.01`, settlement currency `BTC`
- Best bid: `0.0195 BTC`, boyut `6090`
- Best ask: `0.0200 BTC`, boyut `5173`
- Spread: `0.0005 BTC`; crossed değil ve iki taraflı likidite var
- Last: `0.0200 BTC`, 24 saatlik hacim `1234` kontrat
- Mark: `0.0196678995968725 BTC`
- Open interest: `1974` kontrat / `19.74 BTC` / yaklaşık `1,618,723.428 USD`
- BTC-USD index: `82002.2`
- Order book zamanı: `2026-10-15T18:24:36.703Z`
- Index zamanı: `2026-10-15T18:24:36.574Z`

### IV ve Greeks

- Greeks zamanı: `2026-10-15T18:24:30.209Z`
- Bid IV: `0.3790375622558594`
- Ask IV: `0.38453071533203126`
- Mark IV: `0.38083259140351755`
- Delta: `-0.3329985324793777`
- Gamma BS: `0.00004667476288524289`
- Theta BS: `-58.009097007114406`
- Vega BS: `70.62369008097316`
- Forward: `82281.33732471214806`

## Settlement farkı

OKX TR Dual Investment Buy Low ürünü, vade gününde 07:30–08:00 UTC arasındaki BTC index ortalamasını target price ile karşılaştırır. Fiyat target'ın üzerindeyse USDT anapara ve dönem getirisi USDT olarak; eşit veya altındaysa target üzerinden BTC'ye çevrilmiş tutar ve getiri BTC olarak ödenir.

OKX BTC option kontratı European, cash-settled ve BTC settlementlıdır. Resmî option spesifikasyonunda settlement price, vade öncesi son bir saatin index TWAP'idir; ITM kontratlar otomatik exercise edilir. Bir kontrat `0.01 BTC` büyüklüğündedir.

Bu nedenle proxy şu konularda eşleşir: underlying, put yönü, strike ve expiry. Şu konularda ayrışır: settlement ölçüm penceresi (30 dakika / 1 saat), DCD'nin USDT'den BTC'ye fiziksel benzeri dönüşüm sonucu, option'ın cash settlement yapısı, erken çözüm/ikincil piyasa ve taraf/ürün şartları. UI ve rapor bunu “exact instrument proxy” olarak gösterebilir; “aynı ürün” veya “gerçek fair value” diyemez.

## Veri kalite kapısı

`packages/okx-adapter/src/index.ts` içindeki deterministik kapı:

- bid veya ask yoksa `EMPTY_BOOK`,
- bid ask'e eşit/üstüyse `CROSSED_BOOK`,
- book veya index izin verilen yaştan eskiyse `STALE_QUOTE`,
- Greeks yoksa `MISSING_GREEKS`,
- index geçersizse `INVALID_INDEX`

üretir ve proxy'yi kullanmaz. Beş test fresh exact eşleşme ile dört temel red yolunu doğrular. Runtime eşik değeri ileriki adapter adımında config'den gelir; testte açıkça `30 saniye` kullanılmıştır.

## Komut yüzeyi ve gözlem

Kurulu `@okx_ai/okx-trade-cli@1.4.8` ile yalnız public/read komutları kullanıldı: `market instruments`, `ticker`, `orderbook`, `index-ticker`, `mark-price`, `open-interest` ve `option greeks`. Hiçbir option emri verilmedi.

CLI yardımında `expTime` yalnız “date” olarak anlatılıyor; kurulu resmî tool şeması kesin biçimin `YYMMDD` (ör. `241227`) olduğunu gösteriyor. `option instruments` çağrısında server-side expiry filtresi beklenenden geniş sonuç verdiği için exact instrument metadata ayrıca `market instruments --uly ... --instId ...` ile doğrulandı. Adapter bu filtreye güvenip ilk sonucu seçmemelidir; `instId`, `stk` ve `expTime` alanlarını kendisi doğrulamalıdır.

## Resmî kaynaklar

- [OKX TR API guide](https://tr.okx.com/docs-v5/en/)
- [OKX TR Dual Investment kuralları](https://tr.okx.com/en/earn/dual)
- [OKX option contract specifications](https://www.okx.com/en-gb/help/whats-options-trading)
- [OKX options başlangıç rehberi](https://www.okx.com/en-ae/help/get-started-with-okx-options)
