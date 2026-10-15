# ADR 0004 — DCD getiri ve Buy Low settlement aritmetiği

- Durum: Kabul edildi
- Tarih: 2026-10-15
- Roadmap: B3

## Karar

Hazine Ajanı, OKX Dual Investment oranlarını ondalık kesir olarak taşır: `0.365`, yüzde `36.5` APR demektir. Term yield `annualRate × elapsedMilliseconds / (365 × 24 × 60 × 60 × 1000)` ile hesaplanır. Day-count açıkça **Actual/365 fixed** olarak adlandırılır; başlangıç, OKX order terms içindeki interest accrual time; bitiş expiration time'dır.

Finansal aritmetik IEEE-754 `number` ile yapılmaz. Decimal string'ler `bigint` kesirlere çevrilir, ara işlemler tam rasyonel kalır ve yalnız çıktı ölçeğinde half-up yuvarlanır. Çıktı ölçeği çağıran domain akışı tarafından açıkça verilir.

Buy Low settlement:

- `expiryPrice <= targetPrice`: principal ve yield birlikte target/base currency'ye target price üzerinden çevrilir.
- `expiryPrice > targetPrice`: principal ve yield investment/quote currency'de kalır.
- Yuvarlanan `yieldAmount`, yuvarlanan `settlementAmount - principalAmount` olarak üretilir; gösterilen bileşenler toplamla daima uzlaşır.

Settlement price metadata'sı `OKX_INDEX`, `ARITHMETIC_AVERAGE`, 30 dakika ve 200 ms sampling interval taşır. Bu fiyatın tek bir spot tick olmadığı uyarısı her sonuçta bulunur.

## Fail-closed kuralları

- Base-10 dışı decimal, declared scale aşımı ve negatif oran reddedilir.
- Interest accrual/expiry timezone içeren geçerli ISO-8601 olmalıdır; olmayan takvim günü ve ters/sıfır term reddedilir.
- Sıfır/negatif amount veya price reddedilir.
- Buy Low yatırım, target ve expiry price para birimleri quote currency ile eşleşmelidir.

## Sonuç

Hesaplar LLM'den ve UI'dan bağımsız, saf ve tekrarlanabilir olur. DCD'nin 30 dakikalık settlement index'i spot fiyat gibi sunulmaz. Erken unwind bu modelin parçası değildir; ayrı OKX quote gerektirir.

## Resmî dayanaklar

- [OKX Dual Investment Product Terms](https://www.okx.com/en-us/help/dual-investment-product-service-terms)
- [OKX Dual Investment settlement örnekleri](https://www.okx.com/en-gb/earn/dual)
- [30 dakikalık settlement price güncellemesi](https://www.okx.com/en-us/help/okx-to-update-the-settlement-price-for-dual-investment)
