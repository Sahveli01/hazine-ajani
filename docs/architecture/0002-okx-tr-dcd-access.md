# ADR 0002 — OKX TR canlı DCD erişim sınırı

- Durum: Kabul edildi
- Tarih: 2026-10-15

## Bağlam

Hazine Ajanı'nın çekirdeği gerçek OKX TR Dual Investment ürününe dayanır. Global veya demo verisini TR ürünü gibi göstermek; DCD ürününü sabit fixture ile çalıştırmak; read ve write yetkisini tek kontrolsüz yolda birleştirmek ürünün veri ve güvenlik sözleşmesini bozar.

## Karar

1. Private DCD erişimi `site=tr` ve `https://tr.okx.com` üzerinden yapılır. Başka bölgeye otomatik fallback yoktur.
2. İlk profil `okx-tr-read` olur ve minimum read-only izinle kullanılır. Withdrawal hiçbir anahtarda açılmaz. İleride write gerekirse ayrı, minimum izinli anahtar ve her işlem için ayrı kullanıcı onayı gerekir.
3. Credential yalnız kullanıcının yerel OKX secret/config alanında kalır. Repo, log, browser bundle ve evidence dosyaları profile adından başka credential bilgisi taşımaz.
4. A3 ve normal analiz yalnız `pairs` ve `products` read eylemlerini kullanır. CLI 1.4.8'de `quote-and-buy` quote-only değildir; atomik abonelik/write eylemidir ve açık işlem onayı olmadan çağrılamaz.
5. DCD demo yolu kullanılmaz. Gerçek testte `--demo` read çağrısı `50026` ile reddedildi; paket davranışı Earn/DCD'nin simulated trading modunda desteklenmediğini belirtir.
6. Rate-limit davranışı fail-closed olur. OKX'in genel API kuralında public REST limitleri IP, private REST limitleri User ID tabanlıdır; `50011` rate limit kodudur. Adapter bu durumda statik/önceki teklifi yeniymiş gibi sunmaz, kontrollü retry/backoff uygular ve ardından açık unavailable/stale sonucu üretir.
7. Bölgesel/özellik erişim hataları ayrı sınıflandırılır. Kurulu CLI'nin bildirdiği `50038`, DCD Open API özelliğinin hesap için kapalı olduğunu ifade eder; `50026` genel DCD sistem hatasıdır. Auth eksikliği, rate limit, regional/feature unavailable ve geçici sistem hatası birbirine çevrilmez.
8. Canlı response şeması adapter katmanında doğrulanır. `productId`, `baseCcy`, `quoteCcy`, `optType`, `strike`, `expTime`, `quoteTime`, `annualizedYield`, `absYield`, boyut sınırları ve underlying kaybolmadan normalize edilir. Piyasa değerleri kaynak koda sabitlenmez.

## Sonuçlar

- Gerçek TR DCD erişimi yoksa ana analiz bloklanır; global endpoint veya mock fallback yapılmaz.
- A4 proxy çalışması, A3 kanıtındaki gerçek strike/vadeyi kullanabilir fakat çalışma anında teklifi yeniden okur.
- Write özelliği geldiğinde read profilinden ve analiz yolundan fiziksel olarak ayrılmalıdır.
- Rate limit ya da eski quote durumunda sistem sayı uydurmak yerine karar üretemediğini gösterir.

## Dayanak

- [OKX Agent Trade Kit configuration](https://github.com/okx/agent-trade-kit/blob/github-main/docs/configuration.md): TR site/host eşlemesi, bölgesel site zorunluluğu, credential profilleri ve read-only çalışma modu.
- [OKX TR API guide](https://tr.okx.com/docs-v5/en/): authentication ve rate-limit kuralları; `50011` rate-limit hatası.
- Kurulu `@okx_ai/okx-trade-cli@1.4.8` yardım/çalışma çıktısı: DCD read ve atomik write eylemlerinin kesin adları, demo ve hata davranışı.
