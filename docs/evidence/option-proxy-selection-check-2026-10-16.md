# Option proxy seçim motoru doğrulaması — 2026-10-16

Bu belge B4 eşleştirme motorunun A4'te kaydedilen gerçek-şekilli snapshot ve sınır vakalarıyla doğrulanmasını özetler. Değerler runtime fallback değildir; yalnız otomatik test girdisidir.

## A4 exact vaka

- DCD: `BTC-USDT-261106-79000-P`
- Option: `BTC-USD-261106-79000-P`
- Yön: Buy Low ↔ PUT
- Underlying: `BTC-USD`
- Settlement currency: `BTC`
- Strike mesafesi: `0`
- Expiry mesafesi: `0 ms`
- Book: `0.0195 / 0.0200 BTC`, boyut `6090 / 5173` kontrat
- Snapshot farkı: yaklaşık 1,2 saniye; 30 saniyelik policy içinde

Motor bu adayı `EXACT`, `HIGH` confidence ve `SELECTED` olarak verir. DCD ile option'ın settlement window/mechanism, early redemption ve counterparty farkları sonuçta açık kalır.

## Near sıralama

Test, iki kullanılabilir adayı ters giriş sırasıyla verir:

- exact expiry, strike farkı `200 USDT`,
- exact strike, expiry farkı `1 gün`.

Açık dört bileşenli skor exact-expiry adayını seçer. Diğer aday `LOWER_RANK` ile trace'te korunur. Girdi sırası sonucu değiştirmez.

## Fail-closed vakaları

Altı test şu durumları kapsar:

- yön, underlying ve settlement currency uyuşmazlığı,
- stale DCD teklifi veya stale option snapshot'ı,
- boş ve crossed order book,
- minimum altı bid/ask likiditesi,
- strike veya expiry policy sınırının aşılması,
- minimum confidence altı aday,
- no-match sonucunda selected option veya premium fallback olmaması.

Komut:

```powershell
pnpm --filter @hazine-ajani/pricing test -- option-proxy.test.ts
```

Sonuç: `6/6` test geçti.
