# C1 write authorization kanıtı — 16 Ekim 2026

## Kapsam

Bu adım gerçek OKX write çağrısı yapmadı ve para hareketi oluşturmadı. Amaç, C2'de eklenecek write adapter'ının açık kullanıcı onayı olmadan çağrılamadığını kanıtlayan güvenlik sınırını kurmaktı.

## Doğrulanan davranışlar

Altı state-machine testi şu sınırları doğruladı:

1. Yalnız `ACCEPT` ve geçerli analiz canlı işlem özeti hazırlayabilir.
2. Özet ürün, tutar, quote expiry, settlement senaryosu, ana riskler ve live işaretini taşır.
3. Eksik confirmation writer portunu hiç çağırmaz.
4. Confirmation tek kullanımlıdır; ikinci gönderim `ALREADY_CONSUMED` olur.
5. Kullanıcı reddi `REJECTED_BY_USER` olarak hata üretmeden kapanır.
6. Süresi dolmuş quote yeniden analiz ister.
7. Network belirsizliğinde otomatik retry yapılmaz; `RECONCILIATION_REQUIRED` gerekir.
8. Süresi geçmiş analiz ve yanlış notional para birimi hazırlık aşamasında bloklanır.

Test ilk olarak eksik modül nedeniyle kırmızı oldu. Expired/currency sınırı ayrıca davranış kaldırılarak kırmızı görüldü, sonra minimum uygulama geri eklendi. Policy typecheck ve ilgili ESLint kontrolü geçti.

## Komut doğrulaması

`okx earn dcd --help` ve `okx earn dcd quote-and-buy --help` çalıştırıldı. Kurulu CLI, `quote-and-buy` işleminin atomik abonelik olduğunu doğruladı. State machine bu komutu çağırmaz; onaylı, tek kullanımlık `ExecutionCommand` üretip writer portunun arkasında tutar.
