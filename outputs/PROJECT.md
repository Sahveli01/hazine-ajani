# Hazine Ajanı — Project Source of Truth

> Bu dosya ürünün tek doğruluk kaynağıdır. Claude, Codex, Cursor veya başka bir agent çalışmaya başlamadan önce bu dosyayı ve `ROADMAP.md` dosyasını tamamen okumalıdır. Bir uygulama kararı bu dosyayla çelişirse bu dosya geçerlidir; gerekli değişiklik önce burada gerekçesiyle yapılır.

## 0. Belge durumu

- Ürün adı: **Hazine Ajanı**
- Açıklayıcı ad: **OKX Dual Investment Risk Gate**
- Etkinlik: Agentic Hackathon Ankara, 17 Ekim 2026
- Son araştırma tarihi: 15 Ekim 2026, Europe/Istanbul
- Ürün aşaması: uygulama öncesi, araştırılmış ve kapsamı kilitlenmiş
- Birincil demo: tek BTC/USDT `Buy Low` Dual Investment teklifi
- Veri ilkesi: **mock, uydurma, hard-coded piyasa değeri ve sahte işlem sonucu yasaktır**
- İcra ilkesi: OKX üzerinde para hareketi oluşturan her işlem ayrı ve açık insan onayı ister
- Ağ ilkesi: Avalanche/Fuji her yerde açıkça etiketlenir; testnet verisi mainnet değeri gibi gösterilmez

## 1. Tek cümlelik ürün

Hazine Ajanı, canlı OKX Dual Investment teklifinin gösterdiği getiriyi canlı OKX opsiyon piyasasındaki uygulanabilir değer aralığı ve kullanıcının risk politikasıyla test eder; `ACCEPT / ASK / REJECT` kararı verir, kullanıcı onaylarsa işlemi OKX üzerinden yürütür ve aynı analiz yeteneğini diğer ajanlara Avalanche x402 üzerinden ücretli servis olarak sunar.

## 2. Çözülen problem

Dual Investment yüksek yıllık APR gösterebilir fakat kullanıcı bunun karşılığında dönüşüm riski aldığını, fiilen kısa opsiyon benzeri bir ekonomik pozisyon taşıdığını ve gösterilen primin piyasadaki benzer riske göre yeterli olup olmadığını tek ekranda göremez. OKX ürün şartları Dual Investment kullanıcısının getiri karşılığında OKX'e opsiyon sattığını ve anaparanın garanti edilmediğini açıklar.

Ürün şu soruları tek kararda birleştirir:

1. Bu teklif hangi dönüşüm riskini taşıyor?
2. Aynı veya yakın strike/vadeli işlem yapılabilir OKX opsiyonları bu risk için hangi prim aralığını gösteriyor?
3. Simple Earn fırsat maliyeti çıktıktan sonra teklifin premium verimliliği yeterli mi?
4. Kullanıcının likidite, dönüşüm ve stres zararı sınırları ihlal ediliyor mu?
5. İşlem yapılmalı, kullanıcıdan tekrar karar istenmeli veya kesin biçimde reddedilmeli mi?

## 3. Hedef kullanıcılar

### Birincil kullanıcı

OKX'te USDT tutan, BTC'yi belirli bir fiyattan almaya razı olan fakat yapılandırılmış ürün/opsiyon fiyatlamasını bilmeyen kullanıcı. Ürün “en yüksek APR avcısı” için değil, alacağı dönüşüm riskinin karşılığında yeterli prim almak isteyen kullanıcı içindir.

### İkincil kullanıcı

Dual Investment veya benzer kısa opsiyonlu ürünleri değerlendiren başka bir agent ya da uygulama. Bu istemci aynı analiz raporunu x402 ödemesi sonrasında makinece okunabilir JSON olarak alır.

## 4. Ürün çekirdeği ve kapsam sınırı

### MVP'de zorunlu

- Canlı, kimlikli OKX DCD ürün/teklif okuması.
- Canlı OKX public option instruments, order book, IV/Greeks ve spot/index verisi.
- Tek ürün ailesi: BTC/USDT `Buy Low`.
- DCD teklifi ile en yakın kullanılabilir opsiyon proxy'sinin deterministik eşleştirilmesi.
- DCD dönem getirisi, option-equivalent premium bandı, Simple Earn fırsat maliyeti, risk-nötr implied conversion probability ve üç stres senaryosu.
- Yapılandırılmış kullanıcı risk politikası.
- Deterministik `ACCEPT / ASK / REJECT` kararı ve makine neden kodları.
- LLM'in yalnızca politikayı şemaya dönüştürmesi ve deterministik sonucu sade Türkçeyle açıklaması.
- Ayrı onay ekranı; onaysız OKX yazma işlemi yok.
- Gerçek bir ikinci agent/client tarafından Avalanche Fuji üzerinde x402 test USDC ödemesi, tx hash ve gerçek analiz JSON'u.
- Tek sayfalı, projeksiyonda okunabilir demo paneli.
- Public GitHub repo, canlı demo, kurulum talimatı ve doğrulanabilir kaynak/transaction bağlantıları.

### MVP'de opsiyonel bonus

- Kullanıcının küçük canlı tutarla DCD aboneliğini ayrıca onaylayıp gerçekleştirmesi.
- `Sell High` akışı.
- Birden fazla vade/strike arasında sıralama.
- Vade sonrası yeniden değerlendirme.

### MVP dışında

- Genel portföy yöneticisi veya çoklu borsa desteği.
- Sürekli otomatik yeniden yatırım.
- Gerçek dünya dönüşüm olasılığı tahmin modeli.
- OKX opsiyon emri açmak veya otomatik hedge etmek.
- “Garantili getiri”, “risksiz”, “gerçek adil fiyat” veya “OKX yanlış fiyatlıyor” iddiası.
- Kendi Avalanche L1'ını kurmak.
- CEX icrasını on-chain doğrulanmış gibi göstermek.

## 5. Başarı tanımı ve jüri demosu

Başarılı demo şu kesintisiz hikâyeyi gösterir:

1. Panel gerçek OKX kaynağından BTC/USDT Buy Low teklifini ve veri zamanını getirir.
2. Agent gerçek OKX option chain içinde proxy kontratı bulur ve neden o kontratı seçtiğini gösterir.
3. Kullanıcının politikası okunur: örneğin likit kalması gereken oran, izin verilen implied conversion sınırı ve stres kaybı sınırı.
4. Hesap motoru tek sayı yerine uygulanabilir premium bandı ve veri güvenini üretir.
5. Büyük, anlaşılır bir `ACCEPT`, `ASK` veya `REJECT` sonucu ile iki neden kodu görünür.
6. LLM deterministik sonucu sade Türkçeyle açıklar; hesapları değiştiremez.
7. `ACCEPT` halinde kullanıcı gerçek işlem özetini görür ve ayrı olarak onaylar veya vazgeçer. Vazgeçme hata sayılmaz.
8. İkinci agent x402 endpoint'ini çağırır; Fuji test USDC ödemesi, Avalanche explorer tx hash'i ve aynı şemaya uyan canlı analiz raporu ekranda görünür.

Jürinin otuz saniyede anlaması gereken fark: **yüksek APR gösteren ürünü satan bot değil; alınan primin riski karşılayıp karşılamadığını kontrol eden işlem kapısı.**

## 6. Finansal modelin değişmez doğruları

### 6.1 Dual Investment eşlemesi

- `Buy Low`, USDT teminatlı kısa put benzeri bir payoff üretir.
- `Sell High`, coin teminatlı covered-call benzeri bir payoff üretir.
- “Benzeri” denir; “birebir aynısı” denmez.
- DCD, son 30 dakikalık ortalama endeksle settlement, fiziksel dönüşüm, ikincil piyasa yokluğu, erken çözüm koşulları ve karşı taraf farkları nedeniyle standart vanilla opsiyon değildir.

### 6.2 Gösterilecek metrikler

- DCD başlık APR'si ve gerçek dönem getirisi.
- Yakın strike/vade proxy opsiyonun ücret sonrası işlem yapılabilir bid/ask premium bandı.
- Simple Earn fırsat maliyeti.
- Net premium edge bandı; tek nokta değer yasaktır.
- Risk-nötr implied conversion probability; “gerçek olasılık” etiketi yasaktır.
- Aşağı, yatay ve yukarı fiyat senaryolarında settlement para birimi ve sonuç.
- Proxy eşleşme kalitesi, likidite ve veri tazeliğinden türetilen güven seviyesi.

### 6.3 Proxy eşleştirme kuralları

- Aynı dayanak, settlement para birimi ve yön zorunlu.
- En yakın kullanılabilir expiry ve strike seçilir; farklar kullanıcıya gösterilir.
- Bid/ask olmayan, stale veya likiditesi yetersiz kontrat değerleme için kullanılamaz.
- Exact eşleşme yoksa sonuç `proxy` olarak etiketlenir ve güven düşer.
- Veri kalitesi alt sınırın altındaysa karar `REJECT: INSUFFICIENT_MARKET_DATA` olur.
- DCD ve option snapshot zamanları birlikte kaydedilir; eski snapshot yeni teklif için kullanılamaz.

### 6.4 Minimum neden kodları

- `PREMIUM_BELOW_MARKET_BAND`
- `STRESS_LOSS_EXCEEDS_POLICY`
- `IMPLIED_CONVERSION_EXCEEDS_POLICY`
- `LIQUIDITY_RESERVE_BREACHED`
- `INSUFFICIENT_MARKET_DATA`
- `STALE_QUOTE`
- `NO_SUITABLE_PROXY`
- `WRITE_REQUIRES_CONFIRMATION`
- `REGIONAL_PRODUCT_UNAVAILABLE`

Karar kodları deterministiktir. LLM yeni neden kodu üretemez ve sayısal kararı değiştiremez.

## 7. Ajan davranış sözleşmesi

### Ajanın yapabilecekleri

- Canlı ürünleri ve piyasa verisini okumak.
- Teklifleri deterministik filtrelerden geçirmek.
- Doğal dil politikasını doğrulanan yapılandırılmış şemaya dönüştürmek.
- Alternatif kararlar üretmek: miktarı azalt, likiditeyi koru, başka strike/vade iste veya işlemi reddet.
- Sonucu ve kaynaklarını açıklamak.
- Kullanıcının ayrı onayından sonra OKX write aracını çağırmak.
- Aynı analizi x402 istemcilerine sunmak.

### Ajanın yapamayacakları

- Kullanıcı onayı olmadan para hareketi oluşturmak.
- Para çekmek; API anahtarında withdrawal izni hiçbir zaman verilmez.
- Eksik veriyi tahmin edip gerçekmiş gibi göstermek.
- LLM çıktısını finansal hesap yerine kullanmak.
- Bölgesel kısıtı atlatmak.
- Simülasyonu gerçek işlem veya test tokenını gerçek değer gibi göstermek.

## 8. Önerilen sistem mimarisi

Tek repo ve tek TypeScript çalışma alanı tercih edilir; hackathon sırasında iki dil arasında veri modeli kayması yaratılmamalıdır. Finansal formüller saf, test edilebilir bir domain paketi olarak tutulur. Kullanılan gerçek package sürümleri ilk kurulum adımında registry'den doğrulanıp lockfile'a sabitlenir; burada doğrulanmamış `latest` sürüm numarası yazılmaz.

```text
apps/
  web/                 kullanıcı ve jüri paneli
  api/                 analiz ve x402 HTTP yüzeyi
  agent-client/        ikinci agent'ın gerçek ücretli çağrısı
packages/
  okx-adapter/         ATK/OKX API sınırı ve normalize edilen veri tipleri
  pricing/             eşleştirme, premium bandı, senaryo ve olasılık hesabı
  policy/              politika şeması ve deterministik karar motoru
  report-schema/       UI ve agentlar için sürümlü AnalysisReport sözleşmesi
  avalanche/           x402 network, ödeme ve explorer yardımcıları
  observability/       correlation id, tool trace ve redaction
contracts/             yalnız gerçekten gereken ödeme/receipt kontratı varsa
docs/                  mimari kararlar, doğrulama kanıtı, demo ve kaynaklar
```

### Temel veri sözleşmesi: `AnalysisReport`

Rapor en az şu alanları taşır:

- `schemaVersion`
- `analysisId`
- `createdAt`, `expiresAt`
- `sourceRegion`, `sourceUrls` veya tool-call referansları
- DCD ürün kimliği, yönü, strike, expiry, APR, term yield
- Spot/index snapshot ve zaman damgası
- Proxy option kimliği, bid/ask, IV, strike/expiry farkı
- `proxyYieldBand`, `simpleEarnOpportunityCost`, `netEdgeBand`
- `riskNeutralConversionProbability`
- Stres senaryoları
- `dataQuality` ve alt bileşenleri
- Kullanılan politika özeti
- `decision: ACCEPT | ASK | REJECT`
- `reasonCodes[]`
- Kullanıcıya açıklama
- İcra durumu: `NOT_REQUESTED | AWAITING_CONFIRMATION | REJECTED_BY_USER | SUBMITTED | CONFIRMED | FAILED`
- x402 alanları: ağ, token, tutar, payer, tx hash; yalnız ödeme yapılmışsa

Her tüketici bu sözleşmeyi kullanır. UI'ya özel veya agent-client'a özel ayrı “benzer” rapor şekilleri oluşturulmaz.

## 9. Gerçek veri ve entegrasyon matrisi

| İhtiyaç                                 | Gerçek kaynak                |               Auth | Kullanım              | Başarısızlık davranışı                                  |
| --------------------------------------- | ---------------------------- | -----------------: | --------------------- | ------------------------------------------------------- |
| DCD pairs/products/quote                | OKX Agent Trade Kit Earn DCD | Evet, live profile | Teklif çekirdeği      | Statik payload'a düşme yok; özellik bloklanır           |
| DCD buy/order/redeem                    | OKX ATK Earn DCD             |   Evet + açık onay | Opsiyonel canlı icra  | Dry-run açıkça etiketlenir veya özellik kesilir         |
| Option instruments/order book/IV/Greeks | OKX public market/options    |        Public/read | Proxy değerleme       | Veri yoksa `INSUFFICIENT_MARKET_DATA`                   |
| Spot/index                              | OKX public market            |        Public/read | Senaryo ve eşleştirme | Stale ise analiz reddedilir                             |
| Simple Earn oranı                       | OKX Earn                     |        Hesaba göre | Fırsat maliyeti       | Erişilemiyorsa metrik `unavailable`; sıfır varsayılmaz  |
| x402 ödeme                              | Avalanche Fuji + test USDC   |   Wallet/signature | Agent-to-agent servis | Endpoint ücretsizmiş gibi davranmaz; demo fallback ayrı |
| Tx doğrulama                            | Avalanche explorer/RPC       |             Public | Kanıt                 | Hash doğrulanmadan “paid” gösterilmez                   |

## 10. OKX gerçekleri ve sınırlar

- Agent Trade Kit stable CLI araştırma tarihinde `1.4.8`; implementasyon başlamadan registry ve changelog yeniden kontrol edilip lockfile sabitlenir.
- Resmi kit DCD pairs, products, quote-and-buy, orders/history ve redeem araçlarını içerir.
- DCD simulated/demo mode desteklenmez; canlı profil gerekir.
- Public option verisi okunabilir olsa da OKX TR private DCD erişimi gerçek etkinlik hesabında önceden doğrulanmalıdır.
- Bölgesel erişim aşılamaz ve global endpoint TR ürünü gibi gösterilemez.
- Her write öncesi ürün, tutar, beklenen sonuç ve riskler kullanıcıya gösterilip ayrı onay alınır.
- API anahtarlarında withdrawal kapalı, minimum izin ve IP restriction tercih edilir.

## 11. Avalanche ve x402 rolü

Avalanche hesaplamayı yapmaz; ödeme authorization/settlement katmanıdır. Doğru anlatım:

> Başka bir agent, Hazine Ajanı'nın canlı OKX verisiyle oluşturduğu risk raporunu almak için Avalanche üzerinde x402 ödemesi yapar.

MVP ağı Fuji `43113`; test USDC ve test AVAX açıkça etiketlenir. İkinci agent gerçek 402 challenge almalı, ödeme authorization'ını imzalamalı, gerçek testnet transaction sonucu alınmalı ve explorer bağlantısı rapora eklenmelidir. Ücretsiz çağrı, önceden yazılmış tx hash veya sahte “paid” badge başarı sayılmaz.

Ana analiz, facilitator/faucet arızası halinde yerel kullanıcı için çalışmaya devam edebilir; x402 agent kanalı başarısızsa bu durum dürüstçe gösterilir. Workbook Avalanche deployment'ını eligibility kapısı saydığı için çalışan Fuji kanıtı teslim öncesi zorunludur.

## 12. Güvenlik ve finansal güven

- Secret hiçbir zaman browser bundle, log, hata mesajı, screenshot veya repo içine girmez.
- `.env.example` yalnız isim ve açıklama içerir; değer içermez.
- Read ve write credential ayrılır; write anahtarı yalnız server-side tutulur.
- Withdrawal yetkisi yasaktır.
- Her write için kullanıcı tarafından o anda verilen açık onay gerekir; eski bir “otonom çalış” cümlesi izin değildir.
- Quote expiry, timestamp ve idempotency uygulanır; aynı onay iki kez harcanamaz.
- Kullanıcı reddi hata değildir; sessizce idle duruma döner.
- LLM yalnız şema dönüşümü/açıklama yapar. Hesap, eşleştirme ve limitler saf kod tarafından belirlenir.
- Prompt injection içeren dış metin tool yetkisini genişletemez.
- Loglarda API key, secret, passphrase, wallet private key, auth header ve kişisel hesap verisi redact edilir.
- Kullanıcıya yatırım tavsiyesi verilmez; model çıktısının sınırları, veri zamanı ve proxy niteliği görünürdür.

## 13. Tasarım yönü — Apple-adjacent, finansal olarak ciddi

### Mod ve karakter

`Operate`: kullanıcı tek bir yüksek riskli kararı hızlı ve güvenle tamamlar. Apple hissi blur ve yuvarlak kart taklidiyle değil, içerik önceliği, sessiz chrome, hassas tipografi, tutarlı spacing ve neden-sonuç hareketiyle kurulur.

### Görsel kararlar

- Tema: aydınlık, projeksiyonda yüksek kontrast; koyu tema MVP dışında.
- Vurgu: tek aksiyon rengi, soğuk OKX/Avalanche mavi tonlu accent. Renk yalnız eylem ve seçim için kullanılır.
- Nötrler: saf gri değil, accent hue'ya hafif tint edilmiş OKLCH rampası.
- Semantik durumlar: başarı/uyarı/ret yalnız renkle anlatılmaz; ikon + açık etiket + neden kodu kullanılır.
- Tipografi: lisansı uygun, self-hosted modern grotesk; `Inter`, `Roboto`, `Open Sans` ve lisanssız SF Pro kullanılmaz. Sayısal piyasa alanları tabular numerals kullanır.
- Spacing: 8px temel birim; tüm değerler token'dan gelir.
- Radius: container 20px, kontroller 10px, chip 6px; iç öğe dış kapsayıcıdan daha küçük radius kullanır.
- Derinlik: tonal surface ayrımı; her karta box-shadow verilmez. Translucency yalnız gerçekten altında kayan içerik varsa kullanılır.
- Motion: 200–400 ms, neden bildiren spring tabanlı geçiş; `prefers-reduced-motion` desteklenir.
- Etkileşim alanı: minimum 44×44 px; görünür klavye focus'u.

### Projeksiyon koşulları

- Kritik metin minimum 18px; ana karar ve net edge çok daha büyük.
- Kontrast en az WCAG AA; kritik label ve sayılar 4.5:1 altına düşmez.
- 1280×720 ekranda ana demo scroll olmadan anlaşılır.
- 1024px genişlikte işlev kaybolmaz; yan paneller alt alta dönüşebilir.
- Ana karar ekranında tek baskın sonuç bulunur; üç eşit “feature card” düzeni kullanılmaz.
- İnce gri border, gradient headline, neon glow, anlamsız glassmorphism ve emoji heading yasaktır.

### Demo ekranları

1. **Teklif denetçisi:** canlı DCD teklif özeti, proxy karşılaştırması, politika ve büyük karar sonucu.
2. **İnceleme/onay:** gerçek write özeti, riskler, beklenen settlement, onay/vazgeç.
3. **Agent servisi:** 402 challenge → wallet signature → pending → confirmed → tx hash + rapor JSON.

### Async ve Web3 durumları

Her canlı yüzey `loading / empty / error / stale / success` durumuna sahip olmalıdır. Wallet için `disconnected / no wallet / connecting / wrong chain / connected / account switched`; transaction için `idle / awaiting signature / user rejected / submitted / pending / confirmed / reverted` durumları tasarlanır. `User rejected` kırmızı hata değildir. Network, testnet etiketi, token symbol, timestamp ve kaynak her zaman görünürdür.

Uygulama başladığında Impeccable `init` ile `PRODUCT.md`, ardından planın demo akışına göre `DESIGN.md` ve import edilen token dosyası oluşturulur. Token dışındaki renk veya spacing değeri bug kabul edilir.

## 14. Kalite kapıları

### Domain testleri

- DCD payoff örnekleri sınırın altında, eşit ve üstünde.
- APR → term yield dönüşümü ve ters dönüşüm.
- Bid/ask bandı, ücret ve fırsat maliyeti.
- Exact, yakın ve eşleşmeyen expiry/strike.
- Stale/boş/çapraz/negatif veya sıra dışı veri.
- Risk-nötr probability sınırları.
- Her reason code için karar testi.
- LLM geçersiz policy üretirse fail-closed davranış.

### Entegrasyon testleri

- Gerçek OKX public endpoint smoke testleri.
- Etkinlik hesabıyla DCD read-only smoke testi; secret CI'a konmadan manuel/secure environment.
- Write çağrısının confirmation olmadan yapılamadığının testi.
- x402 402 challenge, ödeme, receipt ve explorer doğrulaması.
- Rate limit, network timeout, regional unavailable ve stale quote.

### UI/E2E

- Canlı veriyle analiz akışı.
- `ACCEPT`, `ASK`, `REJECT` ve veri yetersizliği.
- Kullanıcı write'ı onaylar ve reddeder.
- Wallet yanlış ağ, yetersiz test USDC, pending, confirmed ve reverted.
- 1280×720 projeksiyon ve mobil/desktop responsive kontrolü.
- Keyboard-only, focus, contrast ve reduced motion.

### Teslim kapısı

- Mock/fixture yalnız otomatik test klasörlerinde olabilir; runtime ve demo bunları import edemez.
- Public repo secret taramasından temiz geçer.
- Temiz makinede README ile kurulum ve build çalışır.
- Canlı demo ve fallback video aynı gerçek kaynakları kullanır.
- Avalanche tx ve deploy kanıtları explorer'da açılır.
- README limitleri dürüstçe yazar.

## 15. Kaynak envanteri

### Etkinlik ve puanlama

- [Agentic Ankara topluluk rehberi](https://agentic-ankara.vercel.app)
- [Agentic Ankara vibe-coding rehberi](https://agentic-ankara.vercel.app/vibe-coding) — CLI/MCP ayrımı, `--help` ile komut doğrulama, TR profil hazırlığı, gerçek karar döngüsü ve güvenlik kontrol listesi için; topluluk kaynağıdır, resmî dokümanın yerine geçmez.
- [Resmî organizatör sayfası](https://agentichackathon.team1.network/tr)
- [Kullanıcının öncelik verdiği Scorecard workbook](https://docs.google.com/spreadsheets/d/18YMghoLRhF_qbtGszXGcLeGuhwEj8HjktHZj9VXWCoM/edit)

### OKX ürün ve geliştirici kaynakları

- [OKX Agent Trade Kit repository](https://github.com/okx/agent-trade-kit)
- [OKX Agent Trade Kit API guide](https://www.okx.com/docs-v5/agent_en/)
- [OKX Earn DCD skill](https://github.com/okx/agent-trade-kit/blob/github-main/skills/okx-cex-earn/SKILL.md)
- [OKX Agent Skills](https://github.com/okx/agent-skills)
- [OKX API v5](https://app.okx.com/docs-v5/en)
- [OKX TR API v5](https://tr.okx.com/docs-v5/en/)
- [OKX TR Dual Investment](https://tr.okx.com/en/earn/dual)
- [Dual Investment product terms](https://www.okx.com/en-us/help/dual-investment-product-service-terms)
- [Dual Investment settlement update](https://www.okx.com/en-gb/help/okx-to-update-the-settlement-price-for-dual-investment)
- [Dual Investment FAQ](https://www.okx.com/en-gb/help/dual-currency-win-faq)
- [Trade Kit npm versions](https://www.npmjs.com/package/%40okx_ai/okx-trade-cli?activeTab=versions)
- [Trade Kit changelog](https://raw.githubusercontent.com/okx/agent-trade-kit/github-main/CHANGELOG.md)

### Avalanche ve x402

- [Avalanche x402 use cases](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/02-introduction/04-use-cases)
- [Why Avalanche for x402](https://docs.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/01-why-avalanche)
- [Fuji network setup and test USDC](https://docs.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/02-network-setup)
- [Avalanche x402 facilitators](https://docs.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators)
- [Avalanche C-Chain dapp docs](https://build.avax.network/docs/dapps)
- [Avalanche C-Chain RPC](https://build.avax.network/docs/rpcs/c-chain)
- [OKX supported-chain matrix](https://web3.okx.com/pt-br/onchainos/dev-docs/home/supported-chain)
- [PayAI hosted facilitator documentation](https://docs.payai.network/x402/facilitators/introduction)
- [PayAI live supported capabilities](https://facilitator.payai.network/supported)

### Finansal doğruluk

- [IMF — Black-Scholes assumptions](https://www.imf.org/-/media/Websites/IMF/imported-full-text-pdf/external/pubs/ft/cgmfs/eng/pdf/_cgmfs.ashx)
- [Cboe implied-volatility methodology](https://cdn.cboe.com/api/global/us_indices/governance/Cboe_American_Style_Options_Implied_Volatility_Calculations_Methodology.pdf)
- [St. Louis Fed — option-implied uncertainty/probability](https://files.stlouisfed.org/files/htdocs/econ/cneely/uncertainty.pdf)

### Emsal ve ayrışma

- [Anker Protocol](https://github.com/cl-fi/AnkerProtocol)
- [DUAL Finance](https://www.dual.finance/)
- [Binance Dual Investment Auto-Compound](https://www.binance.com/en-AE/support/faq/detail/09911be9f5754c34806bd3ab4a427e0e)
- [Volametric](https://volametric.com/)
- [Deribit Position Builder](https://support.deribit.com/hc/en-us/articles/31238900906781-Position-Builder)
- [Yield — ETHGlobal](https://ethglobal.com/showcase/yield-z4rt5)
- [IntelliFi — ETHGlobal](https://ethglobal.com/showcase/intellifi-xkhzf)

### Yerel araştırma dosyaları

- `HACKATHON.md`
- `ECOSYSTEM-OKX-2026-10-15.md`
- `IDEAS.md`
- `research_notes/Hazine ajanı fikir incelemesi/teknik.md`
- `research_notes/Hazine ajanı fikir incelemesi/emsaller.md`
- `research_notes/Hazine ajanı fikir incelemesi/urun.md`
- `outputs/Hazine ajanı fikir incelemesi.md`
- `reports/Avalanche x402 facilitator seçimi.md`
- `research_notes/Avalanche x402 facilitator seçimi/`
- `docs/evidence/vibe-coding-guide.md`

## 16. Agent çalışma ve devir protokolü

Her agent çalışmaya başlamadan önce:

1. `PROJECT.md` ve `ROADMAP.md` dosyalarının tamamını oku.
2. Repo varsa `git status`, son commitler, mevcut testler ve ilgili dosyaları incele.
3. `ROADMAP.md` içindeki ilk `IN_PROGRESS` adımı; yoksa ilk bağımlılıkları tamamlanmış `TODO` adımı seç.
4. Başlamadan adımın durumunu `IN_PROGRESS`, agent adını ve başlangıç tarihini yazarak claim et.
5. İlgili resmî belgeleri o adım sırasında yeniden aç; geçmiş araştırmayı güncel gerçek kabul etme.
6. Adımın acceptance ve verification maddelerinin tamamını karşıla.
7. Test çıktısını ve gerçek kanıt bağlantılarını `ROADMAP.md` ilerleme günlüğüne yaz.
8. Tek bir anlamlı commit oluştur ve commit hash'ini adıma ekle.
9. Durumu `DONE` yap veya başarısızsa sapma protokolünü uygula.

Agentlar önceki agent'ın kodunu gerekçesiz yeniden yazamaz, çalışan testleri silemez, kabul kriterini düşüremez ve mock veri ekleyerek engeli gizleyemez. Plan varsayımı yanlışsa `ROADMAP.md` içindeki sapma kaydı doldurulur; tamamlanmış geçmiş adımlar yeniden yazılmaz.

## 17. Açık sorular ve kill criteria

Uygulama başlamadan ilk fazda gerçek hesapla cevaplanmalıdır:

1. OKX TR hesabı `dcd pairs/products/quote` verisini döndürüyor mu?
2. Seçilen gerçek DCD için yeterince yakın ve likit OKX option proxy var mı?
3. Gerçek iki teklif deterministik motorda farklı ve anlaşılır sonuç üretiyor mu?
4. x402 Fuji ödeme akışı gerçek tx hash ve raporla uçtan uca çalışıyor mu?
5. Organizatör Fuji deployment + x402 ödemesini Avalanche eligibility için kabul ediyor mu?

İlk iki sorudan biri olumsuzsa çekirdek fikir yeniden değerlendirilir; statik veriyle “çalışıyor” gösterilmez. Dördüncü soru olumsuzsa agent servisi demodan çıkarılır veya dürüstçe başarısız durum olarak gösterilir; sahte transaction kullanılmaz.
