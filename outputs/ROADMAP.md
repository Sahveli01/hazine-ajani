# Hazine Ajanı — Agent-Resilient Build Roadmap

> **Her agent için zorunlu başlangıç:** Önce `PROJECT.md` dosyasını tamamen oku. Bu roadmap görev sırasını ve tamamlanma kanıtını tanımlar; ürün gerçeğini `PROJECT.md` tanımlar. Checkbox ve durum alanları devir noktasıdır.

## 0. Amaç, çalışma biçimi ve durum sözlüğü

**Amaç:** Canlı OKX DCD ve options verisiyle çalışan, kullanıcı politikasına göre deterministik karar veren, açık onayla OKX işlemi yapabilen ve aynı raporu gerçek Avalanche x402 ödemesiyle başka agentlara sunan kaliteli bir hackathon ürünü teslim etmek.

**Mimari:** OKX adapter → normalize snapshot → pricing/proxy engine → policy gate → sürümlü analysis report → web/onay akışı ve x402 agent API. LLM yalnız policy parsing ve açıklama yapar. Bütün finansal ve güvenlik kararları deterministik kodda kalır.

**Durumlar:** `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`, `CUT`.

Her adım tamamlandığında:

- Kabul kriterlerinin tamamı sağlanır.
- Belirtilen doğrulama çalıştırılır ve kanıt günlüğe eklenir.
- Mock/runtime fallback bulunmadığı kontrol edilir.
- Tek anlamlı commit oluşturulur.
- Adımdaki `Durum`, `Sahip`, `Commit`, `Kanıt` alanları güncellenir.

## 1. Global kısıtlar

- Runtime ve demo yalnız gerçek veri kullanır. Fixture yalnız testlerde kullanılabilir ve production bundle tarafından import edilemez.
- DCD live-only kabul edilir; demo hesapta çalışıyormuş gibi gösterilmez.
- Kullanıcıdan ayrı onay alınmadan OKX write çağrısı yapılamaz.
- Withdrawal yetkili API key kullanılamaz.
- “Fair APR” tek nokta, “gerçek dönüşüm olasılığı” ve “on-chain hesaplama” gibi yanlış iddialar kullanılamaz.
- Fuji/test USDC her yüzeyde testnet olarak etiketlenir.
- Source timestamp ve veri tazeliği olmadan finansal sayı gösterilemez.
- UI bütün renk ve spacing değerlerini token dosyasından alır.
- Her async yüzey loading, empty, error ve stale durumlarını kapsar.
- Commit history adım sınırlarını korur; aynı commit içinde ilgisiz roadmap adımları karıştırılmaz.

## 2. Önerilen repo yapısı

Bu yapı başlangıç varsayımıdır. Scaffolding sonrası framework gerçekleri farklıysa sapma kaydıyla güncellenebilir.

```text
apps/web
apps/api
apps/agent-client
packages/okx-adapter
packages/pricing
packages/policy
packages/report-schema
packages/avalanche
packages/observability
contracts
docs/evidence
docs/architecture
tests/e2e
```

Zorunlu repo belgeleri:

```text
PROJECT.md
ROADMAP.md
README.md
AGENTS.md
PRODUCT.md
DESIGN.md
SECURITY.md
.env.example
LICENSE
```

## 3. Demo omurgası

Plan geriye doğru şu demo anından kurulmuştur:

1. Gerçek OKX DCD teklifi görünür.
2. Gerçek OKX option proxy ve executable band görünür.
3. Kullanıcı politikası sonucu `ACCEPT / ASK / REJECT` oluşur.
4. Agent gerekçeyi sade Türkçeyle açıklar.
5. `ACCEPT` sonucu kullanıcı ayrı onay verir veya reddeder.
6. Başka agent x402 ödemesi yapar; gerçek Fuji tx hash ve aynı rapor gelir.

Bu omurgaya doğrudan hizmet etmeyen iş kesme çizgisinin altındadır.

---

# FAZ A — Temel ve öldürücü bilinmeyenler

## A1. Kaynak belgeleri repo köküne yerleştir ve agent sözleşmesini kur

- [x] Durum: `DONE`
- Sahip: Codex
- Commit: `docs: establish project source of truth and agent handoff` (bu adımın commit'i)
- Kanıt: kök `PROJECT.md`, `ROADMAP.md`, `AGENTS.md`, `README.md`; `docs/evidence/vibe-coding-guide.md`; bağımsız repo `codex/hazine-ajani`

**Bitince**

- `PROJECT.md` ve `ROADMAP.md` repo kökündedir.
- `AGENTS.md`, her agentın iki belgeyi okumasını, roadmap adımı claim etmesini, test/kanıt/commit yazmasını ve mock yasağını tekrarlar.
- `docs/evidence/` araştırma notlarını veya değişmez kaynak linklerini içerir.
- `README.md` henüz ürün tamamlanmış gibi konuşmaz; current status ve sonraki roadmap adımını gösterir.
- Git repository başlangıç branch'i oluşturulmuş, uzak repo bağlanmamışsa bunun açık notu vardır.

**Doğrulama:** Temiz bir agent oturumu yalnız repo belgelerini okuyarak ürün cümlesini, demo akışını, veri yasağını ve ilk görevi doğru tekrar edebilir.

**Demo edilir:** Hayır.

**Bağımlılık:** Yok.

**Commit:** `docs: establish project source of truth and agent handoff`

**Başarısızlık:** Belgeler çelişiyorsa uygulama başlamaz; önce çelişki PROJECT.md lehine çözülür.

## A2. Toolchain ve dependency sürümlerini doğrula ve sabitle

- [x] Durum: `DONE`
- Sahip: Codex
- Commit: `build: pin verified toolchain and project workspace` (bu adımın commit'i)
- Kanıt: Node `22.20.0` ve pnpm `11.25.0` sabit; OKX CLI/MCP stable `1.4.8`; `pnpm bootstrap`, format kontrolü ve production audit exit 0; `docs/architecture/0001-toolchain.md`

**Bitince**

- Node/runtime/package manager sürümü repo içinde sabittir.
- OKX Agent Trade Kit/CLI registry, changelog ve resmî kurulum belgeleri tekrar kontrol edilmiştir; seçilen stable sürüm lockfile'dadır.
- Web, API, test, schema validation, wallet/x402 ve formatting araçlarının seçimi ADR olarak kaydedilmiştir.
- `.env.example` değişken adlarını, kullanımını, live/test ayrımını ve minimum izinleri açıklar; secret içermez.
- Tek komutla install, lint, typecheck ve test başlangıç durumu çalışır.
- Production dependency'lerde bilinen kritik açık bulunmaz veya kabul edilen risk SECURITY.md'de yazılıdır.

**Doğrulama:** Temiz checkout üzerinde install; ardından lint/typecheck/test komutları exit 0. Dependency lockfile diff'i kayıt altına alınır.

**Demo edilir:** Hayır.

**Bağımlılık:** A1; repo sözleşmesi ve kayıt yeri gerekir.

**Commit:** `build: pin verified toolchain and project workspace`

**Başarısızlık:** Stable paket resmî docs ile uyuşmuyorsa beta kullanılmaz; doğrudan resmî REST adapter değerlendirilir ve ADR yazılır.

## A3. Gerçek OKX TR DCD erişimini doğrula — KILL GATE 1

- [x] Durum: `DONE`
- Sahip: Codex
- Commit: `spike: verify live OKX TR DCD product access`
- Kanıt: `docs/evidence/okx-tr-dcd-live-2026-10-15.md`; `docs/architecture/0002-okx-tr-dcd-access.md`. Live/read-only `pairs` ve BTC/USDT Buy Low `products` exit 0; gerçek productId/strike/expiry/API timestamp doğrulandı. Olmayan credential profili secret basmadan fail etti; demo DCD read `50026` ile reddedildi. CLI 1.4.8'de quote-only eylemi olmadığı, `quote-and-buy` işleminin write olduğu kaydedildi ve çağrılmadı.

**Bitince**

- Withdrawal kapalı, minimum izinli OKX TR live API profili güvenli ortamda çalışır.
- `dcd pairs`, `dcd products` ve mümkünse quote/read çağrısı en az bir gerçek BTC/USDT Buy Low ürünü döndürür.
- Ham response secret ve hesap kimliği redact edilerek `docs/evidence/` altında zaman damgalı şema örneği olarak kaydedilir; piyasa değerleri dokümana sabitlenip runtime veri yapılmaz.
- Bölge, host, auth gereksinimi, rate limit ve hata kodları ADR'de kaydedilir.
- Demo mode'un DCD write desteklemediği test ve resmî kaynakla belgelenir.

**Doğrulama:** Canlı read-only smoke komutu exit 0; çıktıdaki ürün ID/strike/expiry/API timestamp doğrulanır. Aynı komut yanlış credential ile güvenli biçimde fail eder ve secret basmaz.

**Demo edilir:** Evet; canlı ürün satırı gösterilebilir.

**Bağımlılık:** A2; doğrulanmış adapter/tool sürümü gerekir.

**Commit:** `spike: verify live OKX TR DCD product access`

**Başarısızlık:** Üç kontrollü denemede regional/auth assumption yanlışsa adım `BLOCKED` olur. Mock eklenmez. Organizatör/OKX mentoruna exact endpoint ve hata ile sorulur. Canlı DCD ürünü okunamıyorsa çekirdek demo pivot kararı verilmeden devam edilmez.

## A4. Gerçek option proxy bulunabilirliğini doğrula — KILL GATE 2

- [x] Durum: `DONE`
- Sahip: Codex
- Commit: `spike: prove live option proxy for DCD offer`
- Kanıt: `docs/evidence/okx-option-proxy-live-2026-10-15.md`. `BTC-USDT-261106-79000-P` için exact `BTC-USD-261106-79000-P` bulundu; strike/expiry farkı sıfır. DCD, ticker, iki taraflı order book, index, mark, OI ve Greeks yaklaşık 6,5 saniyelik canlı pencerede doğrulandı. Deterministik kalite kapısı boş/crossed/stale/Greeks eksik veriyi reddediyor; 5 test geçiyor.

**Bitince**

- Public OKX instrument, order book, ticker/index ve IV/Greeks çağrıları gerçek veri döndürür.
- A3'teki gerçek DCD için aynı dayanakta en yakın strike/vade kontratları bulunur.
- En az bir kontratta kullanılabilir bid/ask ve taze timestamp vardır.
- DCD settlement tanımı ile option settlement farkı açıkça kaydedilir.
- Option verisi eksik, boş, crossed veya stale olduğunda kullanılmayacağı kanıtlanır.

**Doğrulama:** Aynı zaman aralığında alınmış DCD ve option snapshot'larıyla manuel inceleme; proxy seçiminin strike/expiry mesafeleri ve bid/ask'ı evidence dosyasındadır.

**Demo edilir:** Evet; gerçek teklif ve gerçek proxy yan yana gösterilebilir.

**Bağımlılık:** A3; gerçek DCD'nin strike/vadesi gerekir.

**Commit:** `spike: prove live option proxy for DCD offer`

**Başarısızlık:** Bir üründe proxy yoksa farklı gerçek DCD denenir. Likit proxy sistematik olarak yoksa “market benchmark” çekirdeği geçersizdir; sahte eşleşme yapılmaz ve proje yeniden seçilir.

## A5. Avalanche Fuji x402 yolunu uçtan uca doğrula — KILL GATE 3

- [ ] Durum: `BLOCKED`
- Sahip: Codex
- Commit: `c5fe6e2` (`spike: establish Fuji x402 payment boundary`; settlement checkpoint'i)
- Kanıt: Canlı Ultravioleta `/supported` yanıtı Fuji `eip155:43113` + test USDC desteğini doğruladı; yerel Hono endpoint gerçek facilitator ile `402` ve `PAYMENT-REQUIRED` döndürdü; 13 Fuji/ağ/API/istemci testi geçiyor. Payer `0x9a2b5BdFd3CA23456957882695Bbf81510430853` henüz test AVAX ve test USDC bakımından boş; gerçek settlement bekliyor.

**Bitince**

- Fuji `43113`, resmî RPC, test AVAX ve resmî/test dokümanında belirtilen test USDC kullanılır.
- Minimal gerçek endpoint 402 challenge döndürür.
- Bağımsız client wallet payment authorization imzalar; facilitator/settlement sonucu gerçek tx hash üretir.
- Tx explorer veya RPC üzerinden confirmed olarak doğrulanır.
- Wrong chain, yetersiz bakiye, kullanıcı reddi, pending ve facilitator error sonuçları tanımlanır.
- Hiçbir anahtar loglanmaz; testnet etiketi her çıktıda görünür.

**Doğrulama:** Client'tan tek uçtan uca çağrı; önce 402, sonra ödeme, confirmed tx ve erişilen gerçek response. Explorer linki evidence'a eklenir.

**Demo edilir:** Evet.

**Bağımlılık:** A2; wallet/x402 dependency'leri sabit olmalıdır. A3/A4'ten bağımsız yürüyebilir.

**Commit:** `spike: prove paid x402 request on Avalanche Fuji`

**Başarısızlık:** Facilitator değiştirme bir kez denenir. Yine çalışmıyorsa assumption failure kaydı açılır; sahte paid response yapılmaz. Eligibility için organizatörden kabul edilen minimum Avalanche deployment doğrulanır.

## A6. Ürün ve tasarım yönünü kilitle

- [x] Durum: `DONE`
- Sahip: Codex
- Commit: `design: lock product identity and demo design system`
- Kanıt: Kök `PRODUCT.md` ve `DESIGN.md`; `apps/web/app/tokens.css` kök layout'tan import ediliyor. Operate/açık projeksiyon yönü, 8px ritim, Onest tipografi, ekran hiyerarşileri, async/wallet/transaction state matrix'i ve 1280×720/1024px davranışı kilitlendi. Impeccable detector 0 bulgu; lint/typecheck/22 test/production build geçti.

**Bitince**

- Impeccable `init` ile `PRODUCT.md` oluşturulur; ürün kimliği Project.md ile uyumludur.
- `DESIGN.md`, Operate modu, aydınlık projeksiyon teması, tek accent, tipografi, 8px spacing, density, motion ve anti-patternleri tanımlar.
- Import edilen token dosyası vardır; renk/spacing hardcode yasağı otomatik kontrol edilebilir.
- Teklif denetçisi, onay ve agent-payment ekranlarının bilgi hiyerarşisi çizilmiştir.
- Loading/empty/error/stale ile tüm wallet/transaction durumlarının görsel davranışı belirlenmiştir.
- 1280×720 ve 1024px safe layout kararı verilmiştir.

**Doğrulama:** Tasarım belgeleri PROJECT.md §13 ile karşılaştırılır; hiçbir kritik bilgi 18px altına veya düşük kontrasta bağlı değildir. Token dışı örnek değer bulunmaz.

**Demo edilir:** Hayır; ekran üretim sözleşmesidir.

**Bağımlılık:** A1 ve demo omurgası; ürün akışı bilinmelidir. A3–A5 sonucu kapsamı değiştirdiyse önce sapma kaydı gerekir.

**Commit:** `design: lock product identity and demo design system`

**Başarısızlık:** Apple hissi gradient/glass/rounded-card süsüne dönüşüyorsa yön kabul edilmez; içerik hiyerarşisi ve tokenlar yeniden çalışılır.

---

# FAZ B — Çekirdek gerçek veri ve karar motoru

## B1. Sürümlü domain sözleşmelerini tanımla

- [x] Durum: `DONE`
- Sahip: Codex
- Commit: `feat: define validated financial domain contracts`
- Kanıt: `packages/report-schema/src/index.ts`, `packages/report-schema/src/contracts.test.ts`, `docs/architecture/0003-domain-contracts.md`. Strict canonical Zod/TypeScript sözleşmeleri; decimal string+scale ve BigInt band karşılaştırması; timezone'lu timestamp; sürüm/uyumluluk kuralı; eksiksiz x402 receipt ve hassas alan reddi. 10 contract testi, repo genelinde 32 test, lint/typecheck/build geçti.

**Bitince**

- `DcdOffer`, `OptionSnapshot`, `MarketSnapshot`, `RiskPolicy`, `ProxyMatch`, `AnalysisReport` ve execution state tipleri tek canonical pakettedir.
- Her external payload şema doğrulamasından geçer; bilinmeyen/eksik alan kontrollü hatadır.
- Birimler, para birimleri, decimal precision ve timestamp açıkça tanımlıdır.
- `AnalysisReport.schemaVersion` ve backward compatibility kuralı vardır.
- Sensitive/raw account alanları domain raporuna sızamaz.

**Doğrulama:** Contract tests geçerli ve hatalı gerçek-şekilli payloadları kapsar; compile/typecheck exit 0.

**Demo edilir:** Hayır.

**Bağımlılık:** A3/A4; gerçek response şekilleri görülmüş olmalıdır.

**Commit:** `feat: define validated financial domain contracts`

**Başarısızlık:** Docs ile runtime payload farklıysa docs'a göre cast yapılmaz; gerçek payload kanıtı ve ADR ile schema güncellenir.

## B2. OKX read adapter'ını gerçek veriyle tamamla

- [x] Durum: `DONE`
- Sahip: Codex
- Commit: `feat: normalize live OKX DCD and options data`
- Kanıt: `packages/okx-adapter/src/read-adapter.ts`, iki live smoke script'i, 10 adapter testi ve `docs/evidence/okx-read-adapter-live-2026-10-15.md`. Gerçek public spot/exact option ile private DCD/Simple Earn okuması geçti; typed error, bounded read retry, exact record seçimi, snapshot provenance/tazelik ve server-side auth sınırı doğrulandı.

**Bitince**

- Adapter DCD products/quote, option instruments/order book/IV, spot/index ve Simple Earn verisini normalize eder.
- Auth yalnız server-side; public/private çağrılar ayrıdır.
- Retry yalnız idempotent read çağrılarında bounded uygulanır.
- Rate limit, regional unavailable, timeout, empty ve stale durumları typed error üretir.
- Her snapshot source, server time, received time ve expiry taşır.
- Runtime adapter'da fixture veya “örnek değer” fallback yoktur.

**Doğrulama:** Public live smoke test CI-safe; private DCD smoke test güvenli ortamda manuel/secret-protected. Network kesintisinde fake data yerine typed error görülür.

**Demo edilir:** Evet; canlı veri kaynağı paneli besler.

**Bağımlılık:** B1; normalize contract'lar gerekir.

**Commit:** `feat: normalize live OKX DCD and options data`

**Başarısızlık:** Rate limit/retry ile çözülemeyen regional erişim A3 assumption failure olarak ele alınır; adapter global veriyi TR ürünü diye değiştiremez.

## B3. DCD getiri ve settlement motorunu doğrula

- [x] Durum: `DONE`
- Sahip: Codex
- Commit: `feat: model DCD term yield and settlement payoff`
- Kanıt: `packages/pricing/src/dcd-settlement.ts`, 12 unit test, `docs/architecture/0004-dcd-yield-and-settlement.md` ve `docs/evidence/dcd-settlement-manual-check-2026-10-15.md`. Actual/365 APR dönüşümü; Buy Low strike altı/eşit/üstü; principal+coupon para birimi; 30 dakikalık index metadata'sı ve fail-closed girdiler doğrulandı.

**Bitince**

- APR ↔ term yield dönüşümü açık day-count ve vade ile yapılır.
- Buy Low payoff; settlement price strike'ın altında, eşit ve üstünde test edilir.
- Kuponun dönüşen anaparaya etkisi ve settlement para birimi doğrudur.
- 30 dakikalık average-index farkı metadata/uyarı olarak rapora taşınır.
- Invalid date, zero/negative amount, malformed APR fail-closed davranır.

**Doğrulama:** OKX ürün şartlarındaki örnek/payoff formülleriyle bağımsız elle hesap karşılaştırması ve unit tests.

**Demo edilir:** Hayır; sonraki ekranda kullanılır.

**Bağımlılık:** B1.

**Commit:** `feat: model DCD term yield and settlement payoff`

**Başarısızlık:** Ürün payload'ı belgelenmeyen barrier taşırsa generic model uygulanmaz; ürün `UNSUPPORTED_PRODUCT_STRUCTURE` ile reddedilir.

## B4. Proxy option eşleştirme ve veri güven motorunu tamamla

- [x] Durum: `DONE`
- Sahip: Codex
- Commit: `feat: select auditable option proxy with confidence`
- Kanıt: `packages/pricing/src/option-proxy.ts`, 6 seçim/sınır testi, `docs/architecture/0005-auditable-option-proxy-selection.md` ve `docs/evidence/option-proxy-selection-check-2026-10-16.md`. A4 exact snapshot, deterministic near ranking, dört bileşenli confidence, mandatory filtreler, stale/book/likidite redleri ve premiumsuz no-match doğrulandı.

**Bitince**

- Yön/dayanak/settlement currency zorunlu filtreleri uygulanır.
- Strike ve expiry mesafesi açık skorla sıralanır.
- Stale, bid/ask olmayan, crossed veya minimum kaliteyi geçmeyen aday elenir.
- Exact/near/no-match ve confidence açıklanır.
- Seçilen proxy ile reddedilen adayların nedenleri trace'te bulunur.

**Doğrulama:** A4 gerçek snapshot'ı + sınır testleri; no-match sonucunda kesinlikle uydurma premium oluşmaz.

**Demo edilir:** Evet; “neden bu option?” açıklaması gösterilebilir.

**Bağımlılık:** B1 ve B2.

**Commit:** `feat: select auditable option proxy with confidence`

**Başarısızlık:** Parametreleri sonucu almak için keyfi gevşetmek yasaktır; ürün reddedilir veya başka gerçek teklif seçilir.

## B5. Premium bandı ve stres senaryolarını üret

- [x] Durum: `DONE`
- Sahip: Codex
- Commit: `feat: compute executable premium band and stress outcomes`
- Kanıt: `packages/pricing/src/premium-valuation.ts`, 8 golden/property/edge testi, `docs/architecture/0006-executable-premium-band-and-model-probability.md` ve `docs/evidence/premium-valuation-check-2026-10-16.md`. A4 canlı snapshot replay'i, hesap oranlı ve %7 tavanlı ücret, bid/ask bandı, Simple Earn fırsat maliyeti, model olasılığı, üç settlement senaryosu, policy etkisi, disclosure ve confidence fail-closed doğrulandı; repo genelinde 68 test geçti.

**Bitince**

- Option bid/ask, ücret ve fırsat maliyeti ile `proxyYieldBand` ve `netEdgeBand` üretilir.
- Mid-price tek doğru değer gibi kullanılmaz.
- Risk-nötr implied conversion probability doğru etiketle 0–1 aralığındadır.
- Üç stres senaryosu settlement varlığını, değerini ve politika etkisini gösterir.
- Basis/averaging, erken çıkış ve likidite farkları disclosure olarak rapordadır.
- Veri confidence düşükse sonuç sayı üretse dahi karar güvenli biçimde reddedilebilir.

**Doğrulama:** Elle hesaplanan golden cases, property tests ve sıra dışı input testleri. Band alt sınırı/üst sınırı ters dönemez.

**Demo edilir:** Evet; ana karşılaştırma budur.

**Bağımlılık:** B3 ve B4.

**Commit:** `feat: compute executable premium band and stress outcomes`

**Başarısızlık:** Black-Scholes/IV entegrasyonu güvenilir değilse teorik sayı sunulmaz; yalnız executable bid/ask bandı ve açık sınırlamalarla kapsam daraltılır.

## B6. Policy şeması ve deterministik risk kapısını tamamla

- [x] Durum: `DONE`
- Sahip: Codex
- Commit: `feat: enforce deterministic user risk policy gate`
- Kanıt: `packages/policy/src/risk-gate.ts`, 14 karar/sınır testi, genişletilmiş canonical policy/reason-code şeması, `docs/architecture/0007-deterministic-risk-gate-precedence.md` ve `docs/evidence/risk-gate-check-2026-10-16.md`. İki gerçek OKX snapshot'ı aynı açık tolerans politikasında REJECT/ACCEPT olarak ayrıştı; repo genelinde 82 test geçti.

**Bitince**

- Policy minimum likit oran, maksimum implied conversion, maksimum stres kaybı, minimum net edge alt sınırı, maksimum allocation ve izinli settlement varlığını kapsar.
- Her karar `ACCEPT / ASK / REJECT` ve en az bir reason code üretir.
- Hard risk ihlali hiçbir LLM açıklamasıyla değiştirilemez.
- Belirsiz veya geçersiz policy fail-closed `ASK`/`REJECT` verir.
- İki gerçek teklif veya iki farklı canlı snapshot anlamlı farklı sonuç üretir; her şey aynı karara gitmez.

**Doğrulama:** Her reason code için unit test; conflicting policy, exact boundary ve missing field testleri; gerçek snapshot replay ile karar karşılaştırması.

**Demo edilir:** Evet; büyük karar kartını besler.

**Bağımlılık:** B5.

**Commit:** `feat: enforce deterministic user risk policy gate`

**Başarısızlık:** Gerçek teklifler ayrışmıyorsa eşikler yalnız demo sonucu için değiştirilmez; policy anlamı ve hedef kullanıcı yeniden değerlendirilir.

## B7. LLM policy parser ve açıklama sınırını kur

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- Doğal dil yalnız versioned `RiskPolicy` şemasına dönüşür.
- Parse sonucu kullanıcıya gösterilir ve riskli/eksik alanlar açıkça teyit ister.
- Açıklama girdisi yalnız canonical `AnalysisReport`; LLM tool result veya hesap uyduramaz.
- Açıklamadaki sayılar raporla birebir eşleşir veya sayılar template tarafından yerleştirilir.
- Prompt injection, policy bypass ve geçersiz JSON testleri fail-closed çalışır.
- LLM servisi yoksa deterministik reason-code açıklaması çalışır; finansal sonuç kaybolmaz.

**Doğrulama:** Türkçe policy örnekleri, belirsiz dil, adversarial text ve provider timeout testleri. Açıklama ile report numeric diff testi sıfır fark verir.

**Demo edilir:** Evet; sade Türkçe gerekçe.

**Bağımlılık:** B1 ve B6.

**Commit:** `feat: constrain LLM to policy parsing and explanation`

**Başarısızlık:** Provider güvenilmezse doğal dil parser demo dışına kesilir; kullanıcı yapılandırılmış policy kontrolleriyle devam eder.

## B8. Uçtan uca analiz orchestration ve trace oluştur

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- Tek analysis request canlı DCD + option + spot + Earn snapshotlarını yakın zaman penceresinde toplar.
- Correlation/analysis ID tüm tool çağrılarını bağlar.
- Stale olursa kısmi eski veriyle karar üretmek yerine typed sonuç verir.
- Canonical `AnalysisReport` UI ve x402 servisinin aynı kaynağıdır.
- Audit trace secret ve PII içermez; tool adı, latency, timestamp ve karar nedeni taşır.

**Doğrulama:** Gerçek read-only end-to-end çağrı; report schema validation; trace kaynakları ve timestamp manuel kontrolü; network failure testi.

**Demo edilir:** Evet. **İlk tam demo edilebilir checkpoint budur.**

**Bağımlılık:** B2–B7.

**Commit:** `feat: orchestrate live OKX risk analysis end to end`

**Başarısızlık:** Bir ikincil kaynak erişilemiyorsa sıfır/örnek varsayılmaz; hangi metrik olmadan karar verilemeyeceği Project.md kurallarına göre uygulanır.

---

# FAZ C — Gerçek icra ve agent-to-agent servis

## C1. OKX write için iki aşamalı onay state machine'i kur

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- `ACCEPT` analizi write hazırlayabilir; `ASK/REJECT` write hazırlayamaz.
- Hazırlanan özet ürün ID, tutar, quote expiry, settlement senaryosu, ana riskler ve live ibaresi taşır.
- Onay tek analysis/quote için ve kısa ömürlüdür; replay/double-submit engellenir.
- Kullanıcı reddi idle'a döner ve kırmızı hata üretmez.
- Confirmation olmadan adapter write metodu çağrılamaz; otomatik test bunu kanıtlar.
- Quote stale olduğunda yeniden analiz gerekir.

**Doğrulama:** State-machine ve authorization tests; double click, expired quote, user reject ve network retry testleri.

**Demo edilir:** Evet.

**Bağımlılık:** B8.

**Commit:** `feat: gate every OKX write behind explicit confirmation`

**Başarısızlık:** Resmî ATK confirm modeli farklıysa daha güvenli olan uygulanır; daha az onaylı davranışa düşülmez.

## C2. DCD icrasını güvenli adapter ile bağla

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- Live quote-and-buy yalnız C1 geçerli confirmation token'ıyla çağrılabilir.
- Idempotency/unique request kimliği, pending ve reconciliation davranışı vardır.
- Success yalnız OKX order/subscription state okunarak gösterilir; yalnız HTTP 200 yeterli değildir.
- Unknown/pending durumda tekrar buy atılmaz; önce order state sorgulanır.
- İcra kapatılabilir feature flag'dir; kapalıyken UI dürüstçe “analiz-only” der.
- Küçük canlı tutar dışındaki bütün işlemler Project.md kapsamı dışındadır.

**Doğrulama:** Önce no-write/dry-run request rendering; canlı küçük işlem yalnız kullanıcı tarafından ayrıca yetkilendirilirse order history ile reconcile edilir. Yetki yoksa step'in live branch'i `BLOCKED`, analiz ürünü tamamlanmış kalır.

**Demo edilir:** Evet, fakat canlı işlem zorunlu değildir; gerçek onay akışı zorunludur.

**Bağımlılık:** C1 ve A3.

**Commit:** `feat: execute and reconcile confirmed DCD subscription`

**Başarısızlık:** DCD demo mode kullanılmaz. Gerçek işlem yetkisi/bakiye yoksa write feature CUT olur; başarısızlık gizlenmez ve demo analiz+onayda biter.

## C3. x402 analiz endpoint'ini canonical rapora bağla

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- Ödemesiz çağrı doğru 402 challenge döndürür.
- Ödeme tamamlanınca endpoint yeni canlı analiz veya geçerlilik süresi içindeki canonical raporu döndürür.
- Fiyat, token, network ve alıcı açık config'den gelir; mainnet/testnet karışamaz.
- Aynı payment replay edilemez.
- Response `AnalysisReport` schemaVersion taşır ve UI raporuyla aynı sözleşmededir.
- Payment tx hash'i RPC/explorer doğrulanmadan paid sayılmaz.

**Doğrulama:** A5 client ile gerçek Fuji payment; schema validation; replay, insufficient balance, wrong chain ve facilitator error testleri.

**Demo edilir:** Evet.

**Bağımlılık:** A5 ve B8.

**Commit:** `feat: sell live risk reports through Avalanche x402`

**Başarısızlık:** Analiz endpoint'i ücretsiz 200 dönerek bypass edilmez. x402 arızası local kullanıcı analizini bozmaz.

## C4. Bağımsız agent client ve makine kullanım örneğini tamamla

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- Ayrı process/client bir analiz talebi oluşturur, 402'yi algılar, ödeme onayı ister ve raporu alır.
- Agent rapordaki `decision`, `reasonCodes`, `expiresAt` ve tx hash'i doğrular.
- Stale veya schema-incompatible rapor agent tarafından kullanılmaz.
- Çıktı human-readable ve JSON seçeneklerine sahiptir.
- Client'ın wallet/private key'i repo veya logda görünmez.

**Doğrulama:** Gerçek Fuji uçtan uca demo; agent logu ile explorer tx aynı kimliği taşır.

**Demo edilir:** Evet; Avalanche sahnesinin görünür istemcisi budur.

**Bağımlılık:** C3.

**Commit:** `feat: add paid agent client for risk reports`

**Başarısızlık:** “Başka agent kullanabilir” iddiası client çalışmadan pitch'e girmez.

---

# FAZ D — Demo yüzeyi ve kaliteli tasarım

## D1. Uygulama kabuğu ve canlı durum yüzeylerini oluştur

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- Header ürün adı, live/test network, veri zamanı ve güvenli account state gösterir; state değişince reflow yapmaz.
- Ana ekran bağlanmadan da ürünün ne yaptığını açıklar.
- Her async blok gerçek içerik şekilli loading, açıklayıcı empty, retry'lı error ve stale durumuna sahiptir.
- 1280×720 ana demo no-scroll; 1024px ve mobile düzenleri işlev kaybetmez.
- Tasarım yalnız token kullanır; Apple-adjacent anti-pattern listesine uyulur.

**Doğrulama:** Desktop/mobile screenshot; a11y/contrast kontrolü; network offline ve slow response görsel testi.

**Demo edilir:** Kısmen.

**Bağımlılık:** A6 ve B8.

**Commit:** `feat: build resilient live-analysis application shell`

**Başarısızlık:** UI gerçek uzun instrument isimleri ve hassas sayılarla bozuluyorsa mock kısa metne dönülmez; layout düzeltilir.

## D2. Teklif denetçisi ana ekranını bitir

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- Gerçek DCD teklif, gerçek option proxy, Simple Earn availability, premium band ve timestamp tek hiyerarşide görünür.
- Ana karar (`ACCEPT/ASK/REJECT`) odanın arkasından okunur; reason codes ve sade açıklama yanında bulunur.
- Risk-nötr probability doğru etiketlidir; tooltip/disclosure teknik sınırı açıklar.
- Proxy farkı, bid/ask, confidence ve source açılabilir detayda görünür.
- Policy düzenlenebilir veya doğal dilden parse edilebilir; parse edilen yapı kullanıcıya gösterilir.
- Veri yetersizliğinde “adil değer” sayı üretmek yerine net bloklayıcı durum görünür.

**Doğrulama:** En az bir gerçek live report; ayrıca test harness ile ACCEPT/ASK/REJECT/stale görsel durumları. Runtime demo yine canlı endpoint kullanır.

**Demo edilir:** Evet; ana demo ekranı.

**Bağımlılık:** D1, B6–B8.

**Commit:** `feat: present live DCD risk decision with evidence`

**Başarısızlık:** Bir ekranda bilgi yükü projeksiyonda okunmuyorsa detay disclosure'a taşınır; ana karar ve iki kanıt korunur.

## D3. Onay ve execution lifecycle ekranını bitir

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- Onay ekranı ürün, tutar, live/dry-run, quote expiry, dönüşüm sonucu ve riskleri tekrarlar.
- `Confirm` ve `Cancel` eşit derecede anlaşılır; cancel hata değildir.
- Awaiting confirmation, submitted, pending, confirmed, failed ve reconciliation durumları yerinde değişir; layout sıçramaz.
- Success gerçek order state ve source reference gösterir.
- Write feature kapalıysa sahte buton yoktur; neden kapalı ve analiz sonucu görünür.

**Doğrulama:** E2E state-machine testi; kullanıcı reddi, quote expiry ve unknown result görsel doğrulaması.

**Demo edilir:** Evet.

**Bağımlılık:** C1; canlı execution gösterilecekse C2.

**Commit:** `feat: ship explicit DCD confirmation and execution states`

**Başarısızlık:** Canlı write güvenli değilse action kaldırılır; dead button bırakılmaz.

## D4. Agent payment ekranını bitir

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- İkinci agent isteği, 402 price/network, wallet confirmation, tx pending/confirmed ve report receipt tek akışta görünür.
- Fuji ve test USDC etiketi baskındır.
- Hash tutarlı biçimde kısaltılır, copyable ve explorer linklidir.
- User rejected, wrong chain, insufficient balance, facilitator error ve reverted farklı davranır.
- Confirm sonrası gerçek report ID, analysis expiry ve JSON preview görünür.

**Doğrulama:** Gerçek Fuji işlem screen recording + explorer doğrulaması; wrong-chain ve rejected durumları.

**Demo edilir:** Evet.

**Bağımlılık:** C4 ve A6.

**Commit:** `feat: visualize paid agent-to-agent risk report flow`

**Başarısızlık:** Tx doğrulanamıyorsa success UI görünemez.

## D5. Erişilebilirlik, responsive ve motion kalite geçişi

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- Klavyeyle tüm demo akışı tamamlanır; focus sırası mantıklı ve görünürdür.
- Form label, error association, aria-live ve aria-busy doğru çalışır.
- Renk tek bilgi taşıyıcısı değildir; contrast AA geçer.
- Reduced-motion tüm kritik geçişleri hareketsiz fakat anlaşılır yapar.
- 1280×720, 1024px, yaygın laptop ve mobil genişliklerde horizontal overflow yoktur.
- Sayısal değerler tabular ve birimlidir; full precision erişilebilir.

**Doğrulama:** Automated a11y scan + keyboard manual pass + iki viewport screenshot pass. Birinci görsel incelemede bulunan kusurlar tek batch'te düzeltilir, en fazla bir confirm pass yapılır.

**Demo edilir:** Hayır; bütün demo kalitesini yükseltir.

**Bağımlılık:** D2–D4.

**Commit:** `fix: harden demo UX across access and screen states`

**Başarısızlık:** Kritik a11y/projection sorunu aşağıya ertelenmez; teslim fazına geçilmez.

---

# FAZ E — Kalite, güvenlik ve teslim

## E1. Finansal doğruluk ve güvenlik incelemesi

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- Bağımsız reviewer payoff, day-count, band, probability etiketi ve stres sonuçlarını örneklerle doğrular.
- Secret scan temizdir; withdrawal izni ve client-side secret yoktur.
- Write confirmation bypass, replay, double-submit, stale quote ve prompt injection testleri geçer.
- Log redaction ve error responses hesap/secret sızdırmaz.
- SECURITY.md threat model, anahtar izinleri, bilinen sınırlar ve disclosure kanalını içerir.

**Doğrulama:** Test suite + secret/dependency scan + manual review checklist; bulgular ve çözümler evidence'a yazılır.

**Demo edilir:** Hayır.

**Bağımlılık:** B ve C fazları.

**Commit:** `security: verify financial controls and secret boundaries`

**Başarısızlık:** High severity bulgu açıkken demo/submission yapılamaz; riskli özellik CUT edilir.

## E2. İlk hack audit ve gerçeklik denetimi

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- Runtime source ağacı mock/fixture/hard-coded piyasa değeri için taranır.
- Dead button, placeholder copy, sahte tx, örnek address, statik chart ve bypass edilmiş token tespit edilmez.
- Her sayısal UI değerinin source + timestamp yolu bulunur.
- Her claim README/pitch/source ile doğrulanır veya yumuşatılır.
- x402 ve OKX entegrasyonları gerçek çalışır; yalnız ekran animasyonu değildir.

**Doğrulama:** Audit raporu `docs/evidence/audit-1.md`; bulunan her material issue kapatılmış veya özellik CUT edilmiştir.

**Demo edilir:** Hayır.

**Bağımlılık:** D5 ve E1.

**Commit:** `audit: remove fake data and dead demo paths`

**Başarısızlık:** Gerçeğe çevrilemeyen özellik kesilir; mockla korunmaz.

## E3. Production deploy ve operasyon kanıtı

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- Web ve API production URL'de HTTPS ile çalışır.
- Secretlar platform secret store'dadır; public env yalnız public chain/config taşır.
- Health/readiness, structured logs ve hata korelasyon kimliği vardır.
- Gerçek OKX read-only analysis production'da çalışır.
- x402 Fuji endpoint production URL üzerinden gerçek ödeme alır.
- Deploy commit hash'i UI/footer veya health metadata'da görünür.

**Doğrulama:** Temiz browser/makineden live flow; curl/client health ve analysis; explorer tx; deploy log.

**Demo edilir:** Evet.

**Bağımlılık:** E2.

**Commit:** `ops: deploy verified live demo and paid agent endpoint`

**Başarısızlık:** Localhost demo teslim sayılmaz. Production blocker çözülmezse kayıtlı fallback video gerçek local+live kaynaklarla çekilir fakat çalışan demo gate'i risk olarak açık yazılır.

## E4. README, mimari ve kaynak dokümantasyonunu tamamla

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- README problem, özgün fark, gerçek demo akışı, mimari, kurulum, env, komutlar, test, deploy, kaynaklar ve limitleri içerir.
- Quickstart temiz makinede çalışır; secret oluşturma/izin adımları güvenlidir.
- Architecture diagram data/decision/write/payment sınırlarını doğru gösterir.
- “Fair value”, risk-neutral probability ve DCD/live-only sınırları doğru açıklanır.
- Avalanche contract/network/address/tx ve OKX tool listesi linklidir.
- Emsaller ve farklar dürüstçe listelenir; “world first” yoktur.
- License ve third-party attribution tamamdır.

**Doğrulama:** Projeyi bilmeyen biri yalnız README ile install/test/run yapar; link checker ve markdown lint geçer.

**Demo edilir:** Hayır.

**Bağımlılık:** E3; gerçek URL/adres/hash gerekir.

**Commit:** `docs: publish reproducible setup architecture and evidence`

**Başarısızlık:** Kurulumda sözlü bilgi gerekiyorsa README tamamlanmış sayılmaz.

## E5. Demo provası ve pitch paketi

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- Demo fiziksel etkinlik koşullarında, 1280×720/projeksiyon varsayımıyla baştan sona yüksek sesle çalıştırılır.
- Akış canlı DCD → proxy → karar → onay → x402 agent payment şeklindedir.
- Wifi yavaşlığı, locked wallet, stale quote ve API error için görünür recovery uygulanmıştır.
- Kısa fallback video aynı gerçek kaynak/tx ile kaydedilmiştir; mock göstermez.
- 90 saniyelik pitch, 10 dakikalık finalist anlatımı ve jüri Q&A notları vardır.
- Pitchte “OKX yanlış fiyatlıyor”, “gerçek olasılık”, “on-chain hesaplıyor” denmez.

**Doğrulama:** Zamanlı iki prova; ikinci prova kritik hata olmadan biter. Başka biri ekranı dört metre uzaktan okuyabilir.

**Demo edilir:** Evet.

**Bağımlılık:** E3 ve E4.

**Commit:** `demo: rehearse live flow and finalize presentation package`

**Başarısızlık:** Provada kırılan optional write kesilebilir; audit, canlı analiz ve x402 kanıtı kesilemez.

## E6. GitHub public teslim ve ikinci audit

- [ ] Durum: `TODO`
- Sahip: —
- Commit: —
- Kanıt: —

**Bitince**

- Repo public, varsayılan branch temiz ve doğru commit'tedir.
- CI install/lint/typecheck/test/build/a11y temel kontrollerini geçer.
- Repo history secret içermez; yalnız son tree değil history de taranır.
- Release/tag oluşturulur; live link, demo video, deck ve explorer kanıtları release/readme'dedir.
- Workbook gate'leri açıkça karşılanır: public repo, working demo, Avalanche deployment, OKX tool.
- İkinci audit E2 kapsamını final tree'de tekrarlar; son dakika mock/dead UI yoktur.
- Submission form alanları kaynak linkleriyle doldurulur ve teslim kanıtı saklanır.

**Doğrulama:** Logged-out browser ile repo/live/video/explorer açılır; CI green; release source tarball temizdir; submission receipt screenshot/link evidence'a eklenir.

**Demo edilir:** Evet; teslimin kendisi.

**Bağımlılık:** E5.

**Commit:** `release: publish hackathon submission`

**Başarısızlık:** CI/redaction/gate eksikken push edilmiş release final sayılmaz; issue kapatılmadan submission tamamlandı işaretlenmez.

---

## KESME ÇİZGİSİ — Minimum geçerli teslim burada tamamlanır

E6'ya kadar olan adımların tamamı minimum teslimdir. Aşağıdaki işler yalnız yukarıdaki akış çalışıyor, audit edilmiş, prova edilmiş ve teslim paketi hazırsa yapılır.

# FAZ F — Bonuslar

## F1. Sell High desteği

- [ ] Durum: `TODO`

Buy Low ile aynı veri, pricing, policy, UI ve test kalitesini sağlar. Kısmi/payoff-only destek eklenmez.

**Commit:** `feat: extend risk gate to Sell High products`

## F2. Çoklu teklif sıralaması

- [ ] Durum: `TODO`

Aynı snapshot penceresinde birden çok gerçek DCD teklifi net edge alt sınırı, confidence ve politika uygunluğuyla sıralanır. “En yüksek APR” varsayılanı yoktur.

**Commit:** `feat: rank live DCD offers by policy-adjusted edge`

## F3. Vade sonrası yeniden değerlendirme

- [ ] Durum: `TODO`

Gerçek order settlement okunur, kullanıcı varlığı ve yeni piyasa durumu tekrar analiz edilir; yeni write yine ayrı onay ister.

**Commit:** `feat: re-evaluate treasury after DCD settlement`

## F4. OKX.AI/listing hazırlığı

- [ ] Durum: `TODO`

Servis metadata, versioned schema, rate/price disclosure, security/review belgeleri ve agent tüketim örneği marketplace şartlarına göre hazırlanır. Gerçek listing yapılmış gibi konuşulmaz.

**Commit:** `docs: prepare risk service for agent marketplace review`

---

## 4. Ana riskler ve fallback

| Risk                                   | İlk ortaya çıkaran adım | Fallback                                                                                                    |
| -------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| OKX TR private DCD read erişimi yok    | A3                      | Mentor/OKX ile endpoint/account uygunluğu çözülür; çözülmezse mock yapılmaz ve fikir pivot edilir           |
| Likit/yakın option proxy yok           | A4                      | Başka gerçek BTC/USDT DCD seçilir; sistematik yoksa fair-value çekirdeği bırakılır                          |
| x402 facilitator/Fuji akışı çalışmıyor | A5                      | Bir alternatif resmî facilitator denenir; yine yoksa organizer eligibility teyidi ve dürüst kapsam daraltma |

## 5. Sapma protokolü

Bir adım başarısız olduğunda önce sınıflandır:

- **Execution failure:** hedef doğru, uygulamada bug var. Planı değiştirmeden düzelt.
- **Assumption failure:** acceptance mevcut gerçeklikle ulaşılamaz. Başarısız adımın değişikliklerini izole et, çalışma ağacını temizle ve planı o adımdan ileri güncelle.

Tamamlanan eski adımlar yeniden yazılmaz. `ROADMAP.md` sonuna şu kayıt eklenir:

```markdown
## Sapma — YYYY-MM-DD, adım X

Neydi: ...
Ne çıktı: ... (kanıt/link)
Geri alınan: ...
Korunan: ...
Yeni plan: ...
Kesme çizgisi: ...
```

Aynı adım üç farklı nedenle başarısız olursa aynı yaklaşım dördüncü kez denenmez. İki adım aynı varsayım yüzünden kırılırsa bütün kalan bağımlılıklar incelenir. Kabul kriteri düşürülmez ve mock veriyle unblock yapılmaz.

## 6. İlerleme günlüğü

Her tamamlanan/engellenen adım için tek satır ekle:

| Tarih      | Agent | Adım | Durum   | Commit                                                      | Doğrulama/kanıt                                                                                                                      | Sonraki adım              |
| ---------- | ----- | ---- | ------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| 2026-10-15 | Codex | A1   | DONE    | `docs: establish project source of truth and agent handoff` | Kök belge/agent sözleşmesi kontrolü; vibe-coding kaynak notu; bağımsız repo                                                          | A2                        |
| 2026-10-15 | Codex | A2   | DONE    | `build: pin verified toolchain and project workspace`       | Kilitli kurulum; lint/typecheck/4 invariant test/production build; Prettier; production audit                                        | A3                        |
| 2026-10-15 | Codex | A3   | BLOCKED | —                                                           | OKX TR KYC/API anahtarı onayı bekleniyor; global endpoint veya mock kullanılmadı                                                     | A5; onay gelince A3'e dön |
| 2026-10-15 | Codex | A3   | DONE    | `spike: verify live OKX TR DCD product access`              | Live TR `pairs` ve BTC/USDT Buy Low `products`; zaman damgalı redakte evidence; güvenli credential/demo failure; erişim ADR'si       | A4                        |
| 2026-10-15 | Codex | A4   | DONE    | `spike: prove live option proxy for DCD offer`              | Exact strike/vade proxy; 6,5 saniyelik DCD+option snapshot; iki taraflı book, index, IV/Greeks, OI; 5 veri kalite testi              | A5/A6                     |
| 2026-10-15 | Codex | A6   | DONE    | `design: lock product identity and demo design system`      | PRODUCT/DESIGN; import edilen tokenlar; ekran+Web3 state matrix; Impeccable detector 0; lint/typecheck/22 test/build                 | B1                        |
| 2026-10-15 | Codex | B1   | DONE    | `feat: define validated financial domain contracts`         | Canonical strict Zod+TS tipleri; decimal/scale/timestamp/version kuralları; 10 contract testi; lint/typecheck/32 test/build          | B2                        |
| 2026-10-15 | Codex | B2   | DONE    | `feat: normalize live OKX DCD and options data`             | Gerçek public spot/exact option ve private DCD/Simple Earn smoke; 10 adapter testi; typed error/bounded retry/provenance; repo check | B3                        |
| 2026-10-15 | Codex | B3   | DONE    | `feat: model DCD term yield and settlement payoff`          | BigInt Actual/365; OKX 10.000 USDT örneği; strike altı/eşit/üstü; 12 test; lint/typecheck/test/build                                 | B4                        |
| 2026-10-16 | Codex | B4   | DONE    | `feat: select auditable option proxy with confidence`       | A4 exact snapshot; deterministic near ranking; 6 sınır testi; red trace; premiumsuz no-match; repo check                             | B5                        |
| 2026-10-16 | Codex | B5   | DONE    | `feat: compute executable premium band and stress outcomes` | Canlı snapshot replay; ücretli bid/ask bandı; fırsat maliyeti; model olasılığı; 3 stres/policy sonucu; 8 test; 68 repo testi          | B6                        |
| 2026-10-16 | Codex | B6   | DONE    | `feat: enforce deterministic user risk policy gate`         | 14 karar/sınır testi; tüm reason code'lar; fail-closed policy; iki gerçek snapshot REJECT/ACCEPT ayrışması; 82 repo testi            | B7                        |

## 7. Yeni agent için devam kontrolü

Yeni oturumda şu sıra izlenir:

1. `PROJECT.md` → `ROADMAP.md` → `AGENTS.md` oku.
2. `git status` ve son 10 commit'i incele; başkasının değişikliğini geri alma.
3. İlerleme günlüğü ile commitlerin uyuştuğunu doğrula.
4. `IN_PROGRESS` adım varsa önce sahibinin notunu ve çalışma ağacını kontrol et.
5. İlk bağımlılıkları tamamlanmış `TODO` adımı claim et.
6. İlgili resmî kaynakları güncel olarak tekrar doğrula.
7. Acceptance tamamlanana kadar yalnız o adımın kapsamını değiştir.
8. Verification çalıştır, kanıtı kaydet, commit et, roadmap'i güncelle.

**İlk uygulanacak adım A1'dir.** Tamamlanmış sayılması için belgeler repo kökünde bulunmalı ve yeni bir agent yalnız bu belgelerle ürün gerçeğini, mock yasağını ve A2'ye geçiş koşulunu doğru anlayabilmelidir.
