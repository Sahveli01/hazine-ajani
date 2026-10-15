# ADR 0011 — DCD write adapter ve reconciliation

## Karar

Canlı DCD aboneliği yalnız C1 state machine'inin `ConfirmedExecutionWriter` portundan çağrılan ayrı bir adapter üzerinden yapılır. Adapter varsayılan olarak kapalıdır ve üç server-side ayar ister: ayrı write profili, açık execution flag'i ve işlem başına maksimum canlı tutar.

Adapter confirmation ID'den SHA-256 ile 32 karakterlik alfanümerik `clOrdId` üretir. Aynı onayın tekrar kullanılması aynı idempotency kimliğini üretir. Kanonik ondalık yıllık getiri, CLI'nin istediği yüzde biçimine deterministik çevrilir; örneğin `0.0745` değeri `7.45` olarak gönderilir.

## İcra ve durum doğrulama

- `quote-and-buy` atomik write çağrısı otomatik retry edilmez.
- Timeout veya transport hatası `SUBMISSION_UNKNOWN` olur; ikinci buy yapılmaz.
- Write cevabındaki `ordId` yalnız `SUBMITTED` kanıtıdır.
- `earn dcd order --ordId` ile state okunmadan `CONFIRMED` sonucu üretilmez.
- `initial`, `pending_settle` ve `pending_redeem` pending; `rejected` failed; diğer tanınan terminal/aktif durumlar confirmed olarak eşlenir.
- Response `env: live`, order ID ve tanınan state taşımıyorsa başarı sayılmaz.

## Canlı işlem sınırı

Bu adımda gerçek abonelik yapılmadı. Mevcut kullanıcı talebi geliştirmeye devam etme yetkisi verir; belirli ürün ve tutar için finansal işlem onayı vermez. Ayrıca güncel canlı analiz `REJECT` ürettiği için C1 zaten işlem hazırlayamaz. Adapter ve dry-run request renderer hazırdır; canlı write flag'i kapalı kalır.
