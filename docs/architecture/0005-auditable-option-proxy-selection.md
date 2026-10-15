# ADR 0005 — Denetlenebilir option proxy seçimi ve güven skoru

- Durum: Kabul edildi
- Tarih: 2026-10-16
- Roadmap: B4

## Karar

Proxy seçimi saf ve deterministik bir pricing fonksiyonudur. Buy Low yalnız PUT, Sell High yalnız CALL adaylarını değerlendirir. Underlying birebir eşleşmeli; option settlement currency DCD base currency ile aynı olmalıdır. Bu zorunlu filtrelerden geçmeyen aday skorlanmaz.

Kalan adaylar şu dört eşit bileşenden toplam `0–1` güven skoru alır:

- strike yakınlığı: `%25`, policy içindeki maksimum strike mesafesine göre doğrusal,
- expiry yakınlığı: `%25`, maksimum vade mesafesine göre doğrusal,
- tazelik: `%25`, DCD ve option snapshot'ları birlikte taze olmak zorunda,
- likidite: `%25`, iki taraflı book ve minimum bid/ask kontrat boyutları; minimumun iki katında tam puan.

Adayın bid veya ask'ı boşsa, book crossed ise, minimum likiditeyi karşılamıyorsa, mesafe sınırını aşıyorsa ya da toplam güven policy tabanının altındaysa aday reddedilir. Skorlar eşitse lexicographic `instrumentId` sırası deterministik tie-break'tir.

Exact kalite yalnız strike ve expiry ikisi de birebir eşleştiğinde verilir. Near seçimin strike/vade farkları rapora taşınır. Her eşleşmede settlement window, settlement mechanism, early redemption ve counterparty farkları korunur; “aynı ürün” denmez.

## Trace sözleşmesi

Her aday `SELECTED` veya `REJECTED` olarak kaydedilir. Reddedilen aday zorunlu filtre, veri kalitesi, policy sınırı, minimum güven ya da `LOWER_RANK` nedenini taşır. Seçilen ve sıralamada kalan adaylarda toplam skor ile dört bileşen bulunur.

Hiç aday kalmazsa sonuç `quality: NONE` olur; seçilmiş option veya premium alanı üretilmez. Sonraki valuation adımı bu sonucu kullanarak sayı uyduramaz.

## Dayanak

- `docs/evidence/okx-option-proxy-live-2026-10-15.md`
- `outputs/PROJECT.md` bölüm 6.3
- OKX public option instrument, order book ve Greeks snapshot'ları
