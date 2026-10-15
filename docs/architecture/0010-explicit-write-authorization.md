# ADR 0010 — Her OKX write için tek kullanımlık açık onay

## Karar

OKX DCD write işlemi iki aşamalıdır. İlk aşama yalnız kanonik ve süresi geçmemiş `ACCEPT` analizinden canlı işlem özetini hazırlar. İkinci aşama, kullanıcının bu özete verdiği ayrı onayla writer portunu tam bir kez çağırır.

Hazırlanan özet analysis ID, product ID, tutar ve para birimi, minimum yıllık getiri, kısa quote süresi, settlement senaryoları, ana riskler ve `live: true` işaretini taşır. `ASK` ve `REJECT` analizleri, süresi geçmiş raporlar ve notional para birimiyle uyuşmayan tutarlar hazırlık aşamasında reddedilir.

## Güvenlik davranışı

- Confirmation kimliği tek analysis/quote için ve tek kullanımlıktır.
- State, writer çağrısından önce `SUBMITTING` olur; eşzamanlı veya tekrar tıklama ikinci write üretemez.
- Kullanıcı reddi `REJECTED_BY_USER` sonucudur ve hata değildir.
- Quote süresi dolarsa yeniden analiz gerekir.
- Writer network hatası verirse sonuç `SUBMISSION_UNKNOWN` olur. Aynı onayla retry yapılmaz; önce C2 reconciliation gerekir.
- State machine credential, profil veya API payload'u taşımaz.

## Resmî araç doğrulaması

Kurulu `@okx_ai/okx-trade-cli@1.4.8` için `okx earn dcd --help` yeniden çalıştırıldı. Yardım çıktısı `quote-and-buy` komutunu “CAUTION” ile atomik quote + execute write işlemi olarak tanımlar ve `productId`, `sz`, `notionalCcy`, isteğe bağlı `clOrdId` ve `minAnnualizedYield` alanlarını gösterir. C1 bu komutu çağırmaz; yalnız C2 adapter'ının kullanacağı onaylı command capability'sini üretir.
