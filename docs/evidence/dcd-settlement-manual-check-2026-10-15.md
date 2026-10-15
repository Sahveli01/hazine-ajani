# DCD settlement bağımsız elle hesap kontrolü — 2026-10-15

Bu belge B3'ün saf hesap motorunu OKX'in yayımladığı örnekle bağımsız olarak karşılaştırır. Piyasa verisi fixture'ı değildir ve runtime tarafından import edilmez.

## OKX örneği

- Yön: Buy Low BTC/USDT
- Yatırım: `10,000 USDT`
- Target price: `50,000 USDT/BTC`
- Term rate: `1.24% = 0.0124`

### Target ulaşıldı: expiry price ≤ 50,000

```text
principal BTC = 10,000 / 50,000 = 0.2 BTC
yield BTC     = 0.2 × 0.0124 = 0.00248 BTC
total BTC     = 0.2 × (1 + 0.0124) = 0.20248 BTC
```

Motor sonucu: `0.20000000 BTC` principal + `0.00248000 BTC` yield = `0.20248000 BTC`. Eşitlik durumunda da conversion gerçekleştiği ayrıca test edildi.

### Target ulaşılmadı: expiry price > 50,000

```text
principal USDT = 10,000 USDT
yield USDT     = 10,000 × 0.0124 = 124 USDT
total USDT     = 10,000 × (1 + 0.0124) = 10,124 USDT
```

Motor sonucu: `10000.00 USDT` principal + `124.00 USDT` yield = `10124.00 USDT`.

## APR ↔ term rate kontrolü

Actual/365 fixed ile 10 tam gün ve `0.365` yıllık oran:

```text
term rate = 0.365 × 10 / 365 = 0.01000000
annual rate = 0.01000000 × 365 / 10 = 0.365000
```

Motor iki yönde aynı sonuçları verdi. Ara hesaplar tam `bigint` rasyonellerle yapıldı; `number` finansal aritmetik için kullanılmadı.

## Otomatik kanıt

`packages/pricing/src/dcd-settlement.test.ts` içindeki 12 test:

- APR/term rate iki yönlü dönüşümü,
- strike altı, eşitliği ve üstü settlement,
- principal ile kuponun doğru para biriminde uzlaşmasını,
- 30 dakika/200 ms average-index metadata'sını,
- malformed decimal, negatif oran, ters veya var olmayan tarih,
- sıfır/negatif amount, sıfır price ve currency mismatch

durumlarını doğrular.

## Resmî kaynaklar

- [OKX Dual Investment Product Terms](https://www.okx.com/en-us/help/dual-investment-product-service-terms)
- [OKX Dual Investment canlı ürün sayfası ve örnekleri](https://www.okx.com/en-gb/earn/dual)
- [OKX 30 dakikalık settlement index duyurusu](https://www.okx.com/en-us/help/okx-to-update-the-settlement-price-for-dual-investment)
