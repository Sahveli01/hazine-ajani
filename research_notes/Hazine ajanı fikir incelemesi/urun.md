# Hazine Ajanı — ürün, OKX ve hackathon uyumu

## Gerçek kullanıcı acısı ve talep var mı?

### Takeaway
Sorun gerçek ve anlaşılır: Dual Investment bir tasarruf ürünü gibi keşfediliyor ancak ekonomik olarak gömülü kısa opsiyon içeriyor; APR'nin yüksekliği tek başına kullanıcının aldığı dönüşüm riskinin karşılığını göstermez. Buna rağmen OKX'e özgü kullanıcı talebi veya kullanıcıların “adil prim denetimi” için ödeme isteğini kanıtlayan güvenilir kullanım verisi bulunmadı.

### Cited Findings
- OKX'in kendi ürün şartları Dual Investment'ı anapara garantisiz yapılandırılmış ürün olarak tanımlar; kullanıcı fiilen OKX'e opsiyon satar, dönüşümde önemli hatta uç koşullarda neredeyse tam değer kaybı yaşayabilir ve sabit getiri bu zararı karşılamayabilir. — [OKX Dual Investment Product Terms](https://www.okx.com/en-us/help/dual-investment-product-service-terms)
- OKX TR ürünü “Buy low, sell high, and earn attractive returns” başlığıyla sunar ve sonucu hedef fiyatın aşılıp aşılmamasına göre iki farklı para biriminde açıklar; sayfa APR'yi yıllıklaştırılmış getiri olarak gösterir. — [OKX TR Dual Investment](https://tr.okx.com/en/earn/dual)
- OKX'in 2026 eğitim sayfasındaki örnekte 10.000 USDT, BTC 85.000'e düştüğünde hedef 90.000'den BTC'ye dönüşerek 9.554 USDT eşdeğeri olur; bu, “getiri her durumda alınır” ifadesinin sermaye zararını önlemediğini görünür kılar. — [OKX Learn: What Is Dual Investment?](https://www.okx.com/en-us/learn/dual-investment)
- Bağımsız tartışmalarda kullanıcılar ürünün opsiyon niteliğini, boğa piyasasında fırsat maliyetini ve yüksek APY'nin nasıl yorumlanacağını tekrar tekrar soruyor; bunlar nitel anekdotlardır, talep veya kayıp oranı değildir. — [Binance kullanıcı deneyimi](https://www.reddit.com/r/binance/comments/s5bct6/binance_dual_investment_a_quick_summary_of_my/); [risk soruları](https://www.reddit.com/r/binance/comments/pyv2bv); [fırsat maliyeti uyarısı](https://www.reddit.com/r/binance/comments/nbn27j)
- OKX, Q2 2026'dan itibaren Dual Investment notional'ını opsiyon işlem hacmine saydığını söylüyor; bu, ürünün OKX'in Earn ve Options alanları arasında stratejik bir köprü olduğuna dair doğrudan işaret, fakat kullanıcı sayısı değildir. — [OKX Learn: Dual Investment and VIP Tier](https://www.okx.com/en-us/learn/dual-investment)

### Inferences
- En güçlü hedef kullanıcı “boştaki USDT'sine en yüksek getiriyi arayan herkes” değil; BTC'yi belirli bir fiyattan almaya zaten razı, fakat aldığı primin piyasa ile tutarlı olup olmadığını ve kuyruk riskini görmek isteyen bilinçli perakende kullanıcıdır.
- Kullanıcı içgörüsü “ürünün ne olduğunu bilmiyor”dan daha keskin kurulmalı: yıllık APR ile kısa vadeli gerçek dönem getirisi, dönüşüm zararı ve fırsat maliyeti aynı ekranda karşılaştırılamıyor.
- Pazar doğrulaması henüz zayıf. Pitch “çok sayıda kullanıcı zarar ediyor” veya “OKX haksız fiyatlıyor” dememeli; bunu destekleyen veri yok.

### Gaps
- OKX Dual Investment kullanıcı sayısı, hacmi, dönüşüm sonrası zarar oranı, destek talebi ve adil değer aracına ödeme isteği için güvenilir açık veri bulunamadı.
- Bağımsız şikâyetlerin çoğu Binance ürününe aittir; aynı ekonomik yapıyı doğrular ama OKX'e özgü memnuniyetsizliği kanıtlamaz.

## Teknik iddia doğru mu ve otonom yürütme gerekli mi?

### Takeaway
Opsiyon piyasasıyla çapraz kontrol teknik olarak anlamlıdır; fakat “Black-Scholes ile gerçek dönüşme olasılığı ve beklenen kayıp” iddiası düzeltilmelidir. Otonom tarama, karşılaştırma ve politika uygulama değerlidir; gerçek para ile otomatik DCD aboneliği güven ve regülasyon yükünü artırır ve hackathon demosunun ana değerini kanıtlamak için gerekli değildir.

### Cited Findings
- Agent Trade Kit DCD ürün listesini, APR/strike/term bilgilerini, atomik aboneliği, erken çözmeyi ve emir geçmişini sunar; ayrıca options modülünde opsiyon zinciri, IV ve Greeks vardır. Bu nedenle ana çapraz-modül veri yolu bugün mevcuttur. — [Agent Trade Kit earn module](https://github.com/okx/agent-trade-kit/blob/github-main/docs/modules/earn.md); [Agent Trade Kit repository](https://github.com/okx/agent-trade-kit)
- DCD demo/simulated trading modunda desteklenmez ve canlı profil gerektirir. Resmî skill ayrıca tüm yazma işlemlerinde kullanıcıya özet gösterilip açık onay alınmasını zorunlu tutar; “just do it” geçerli onay sayılmaz. — [OKX CEX Earn skill](https://github.com/okx/agent-trade-kit/blob/github-main/skills/okx-cex-earn/SKILL.md)
- OKX option API/Trade Kit kontrat başına IV ve Black-Scholes Greeks sağlar; böylece aynı/komşu strike ve vadeler için piyasa işaretleri çekilebilir. — [OKX Agent API guide](https://www.okx.com/docs-v5/agent_en/)
- Black-Scholes'tan türeyen risk-nötr olasılık, varlığın yükseleceğine dair objektif/gerçek dünya olasılığı değildir. — [Federal Reserve Bank of St. Louis eğitim notu](https://files.stlouisfed.org/files/htdocs/econ/cneely/uncertainty.pdf)
- OKX, Mart 2026'dan beri delivery/exercise/settlement fiyatını son 30 dakikadaki endeks fiyatlarının ortalamasıyla hesaplar; bire bir replikasyon vade, strike, dayanak endeksi ve settlement penceresi eşleşmesini gerektirir. — [OKX settlement methodology update](https://www.okx.com/en-eu/help/okx-announcement-on-the-adjustment-to-the-calculation-method-of-delivery)

### Inferences
- Motor iki ayrı çıktı vermeli: (1) piyasa-implied prim ve risk-nötr dönüşüm olasılığı; (2) kullanıcı için senaryo/stres zararları. İkincisine “beklenen kayıp” denmemeli; gerçek dünya dağılım modeli yoksa bu sayı sahte kesinlik üretir.
- “Adil APR” tek doğru sayı gibi sunulmamalı. Daha dürüst metrik: `DCD dönem getirisi − eşlenmiş opsiyonun gerçekleştirilebilir primi − Simple Earn fırsat maliyeti`, bid/ask ve eşleşme kalitesiyle birlikte. Likit olmayan ya da tam eşleşmeyen kontratta sonuç “yetersiz veri” olabilmeli.
- LLM fiyatlama ve emir limiti belirlememeli. Kullanıcı dilini yapılandırılmış politikaya çevirebilir; hesaplama, eşleştirme, limitler ve sonuç kararı deterministik olmalı.
- Otonomi için doğru sınır: ajan ürünleri sürekli tarar, uygun olmayanı otomatik eler, en iyi 1–3 adayı açıklar ve abonelik öncesi açık onay ister. Bu hem OKX'in resmî işlem akışına hem kullanıcı güvenine uygundur.

### Gaps
- Etkinlik hesabında TR bölgesi için DCD ve option zinciri uçlarının fiilen çalıştığı doğrulanmadı; dokümantasyon yetenek kanıtıdır, canlı bölgesel erişim kanıtı değildir.
- DCD ürünüyle aynı strike/vadede likit bir OKX opsiyon kontratının her zaman bulunacağı doğrulanmadı.

## Emsalleri var mı ve fikir özgün mü?

### Takeaway
Genel parçalar özgün değil: dual investment/dual currency ürünleri, opsiyon açıklayıcıları, portföy ajanları ve opsiyon görselleştirmeleri mevcut. Ancak bu araştırmada “OKX DCD teklifini aynı borsanın canlı opsiyon zinciriyle karşılaştırıp kullanıcı politikasına göre veto eden ajan”ın bire bir emsali bulunmadı; bu bir yokluk garantisi değildir.

### Cited Findings
- Binance kullanıcıları ve bağımsız eğitim içerikleri yıllardır dual investment'ı kısa opsiyon olarak açıklıyor; temel finansal içgörü yeni değildir. — [Dual Investment discussion](https://www.reddit.com/r/CryptoCurrency/comments/q9q9yl); [covered-call comparison](https://www.reddit.com/r/BitcoinCoveredCalls/comments/1ledcbd/bitcoin_covered_calls_vs_binance_dual_investment/)
- ETHGlobal Tokyo 2026 projesi Ticket, canlı opsiyon verisini P&L ısı haritası ve sezgisel arayüzle açıklar; “opsiyonu anlaşılır yapma” alanında yakın ürün emsalidir ancak DCD prim denetimi veya OKX yürütmesi yapmaz. — [ETHGlobal Ticket](https://ethglobal.com/showcase/ticket-nj88t)
- ETHGlobal IntelliFi bir LLM ajanının risk profiline göre portföy yönetmesi fikrini uygular; genel “risk politikasıyla otonom portföy” iddiası bu nedenle ayırt edici değildir. — [ETHGlobal IntelliFi](https://ethglobal.com/showcase/intellifi-xkhzf)
- OKX Agent Trade Kit'in kendisi DCD listeleme/filtreleme/abonelik ve options zinciri/IV/Greeks araçlarını zaten sunar; yalnızca bu araçları bir sohbet arayüzüne bağlamak yeni ürün sayılmaz. — [Agent Trade Kit](https://github.com/okx/agent-trade-kit)

### Inferences
- Özgün çekirdek “AI treasury manager” değil, `embedded-option policy gate`: yapılandırılmış Earn teklifini trade edilip hedge edilebilir piyasa karşılığıyla denetleme ve kötü prim/risk kombinasyonunu işlemden önce durdurma.
- Bu farkı ispatlayan demo yan yana olmalı: OKX başlık APR'si, dönem getirisi, eşlenmiş opsiyon bid/mark/ask primi, prim verimliliği, risk-nötr dönüşüm olasılığı ve stres senaryosu.
- “Başka projede hiç yok” yerine “aramada bire bir ürün bulamadık; yakın emsaller opsiyon UX'i ve genel portföy ajanları” demek savunulabilir.

### Gaps
- GitHub/ETHGlobal/web aramalarında bire bir eşleşme bulunmadı; kapalı kaynak banka/wealth-tech araçları ve borsa içi prototipler görülemez.
- Patent ve ticari veri tabanı taraması yapılmadı; hackathon özgünlüğü için gerekli görünmüyor.

## OKX, Avalanche, rubrik ve 9 saatlik demo uyumu

### Takeaway
OKX uyumu güçlü, ürün anlatımı doğru kurulursa sponsor için anlamlıdır. Hackathon uyumu orta-üst seviyededir; şu anki iki ürünlü kapsam ve gerçek DCD yürütme iddiası 9 saat için risklidir. Avalanche x402 servisi uygun bir gelir demosu verir fakat yalnızca “ödeme aldık” düzeyinde kalırsa on-chain logic central kriterinde zayıf görünür.

### Cited Findings
- İçeriden sağlanan workbook ağırlıkları: Innovation & Real-World Value %25, Agentic Design %20, Demo & Presentation %20, Technical Execution %15, OKX Integration %10 ve Avalanche Integration %10; eligibility için public repo, çalışan demo, Avalanche deployment ve en az bir OKX aracı gerekir. — [Kullanıcının scorecard workbook'u](https://docs.google.com/spreadsheets/d/18YMghoLRhF_qbtGszXGcLeGuhwEj8HjktHZj9VXWCoM/edit)
- Scorecard Avalanche bölümünde “on-chain logic central” ve “why Avalanche”, OKX bölümünde entegrasyon derinliği, OKX.AI listing-ready ve market data/liquidity ayrı ayrı puanlanır. — [Scorecard tab](https://docs.google.com/spreadsheets/d/18YMghoLRhF_qbtGszXGcLeGuhwEj8HjktHZj9VXWCoM/edit#gid=2072538089)
- DCD ve on-chain Earn demo modunda çalışmaz; DCD aboneliği canlı hesap ve açık işlem onayı ister. — [Agent Trade Kit earn module](https://github.com/okx/agent-trade-kit/blob/github-main/docs/modules/earn.md); [OKX Earn skill](https://github.com/okx/agent-trade-kit/blob/github-main/skills/okx-cex-earn/SKILL.md)
- OKX TR üzerinde Dual Investment bugün listelenir, dolayısıyla problem sponsorun gerçek ürün yüzeyine doğrudan bağlıdır. — [OKX TR Dual Investment](https://tr.okx.com/en/earn/dual)

### Inferences
- Sponsor dili “OKX'in teklifinin adil olmadığını yakalıyoruz” olmamalı. Önerilen konum: “OKX Earn için pre-trade suitability and premium-efficiency copilot.” OKX açısından değer; daha bilinçli abonelik, daha düşük yanlış anlama/destek yükü ve Earn→Options eğitim köprüsüdür.
- 9 saatlik güçlü kesit: tek BTC/USDT Buy Low ürünü; canlı DCD ürün okuma; en yakın OKX option kontratını bulma; dönem getirisi ve piyasa-implied prim kıyası; üç stres senaryosu; deterministik ACCEPT/REJECT; kullanıcı onayı ekranı; abonelik yerine güvenli dry-run veya önceden hazırlanmış çok küçük canlı işlem.
- Kesilecekler: genel portföy optimizasyonu, vade sonrası yeniden karar döngüsü, çoklu Earn dağılımı, erken redeem, “gerçek olasılık”, tam Black-Scholes araştırma motoru, OKX.AI marketplace yayını. Bunlar ana kanıtı bulanıklaştırır.
- Avalanche için en küçük dürüst akış: ikinci bir örnek ajan x402 ile USDC test ödemesi yapar, endpoint aynı deterministik risk raporunu döndürür ve tx linki UI'da görünür. Bunu ana kullanıcı akışının üstüne eklenen dağıtım kanalı olarak anlatmak gerekir; fiyatlamayı “on-chain hesaplandı” diye yanlış sunmamak gerekir.
- Otuz saniyelik demo: “APR %X” kartı → ajan canlı opsiyon eşini bulur → prim verimliliği/stres kaybı kırmızı görünür → politika ihlali nedeniyle işlem bloklanır → aynı raporu başka ajan Avalanche üzerinden ücretli çağırır. Görsel durum değişimi nettir.

### Gaps
- x402 servisinin workbook'taki “on-chain logic central” alanında tam puan alacağı garanti değildir; ödeme ana hesaplamanın dışındadır.
- Testnet deployment'ın eligibility için yeterli olup olmadığı workbook'ta açık değildir.

## Skorlu karar ve önerilen yeniden çerçeve

### Takeaway
Karar: **devam etmeye değer, fakat mevcut “otonom hazine yöneticisi + kesin adil değer + x402 pazaryeri” kapsamıyla değil.** En güçlü sürüm, OKX Dual Investment için piyasa verisine dayalı, politika kontrollü pre-trade risk kapısıdır.

### Cited Findings
- Puanlama kategorileri ve gereksinimler kullanıcının öncelik verdiği workbook'tan alınmıştır. — [Workbook](https://docs.google.com/spreadsheets/d/18YMghoLRhF_qbtGszXGcLeGuhwEj8HjktHZj9VXWCoM/edit)
- Ürünün gömülü kısa opsiyon niteliği ve ciddi dönüşüm riski OKX'in kendi şartlarında doğrulanır. — [OKX Product Terms](https://www.okx.com/en-us/help/dual-investment-product-service-terms)
- Gerekli DCD ve option veri/işlem araçları Agent Trade Kit'te vardır, fakat DCD demo modunda yoktur. — [Earn module](https://github.com/okx/agent-trade-kit/blob/github-main/docs/modules/earn.md); [Agent Trade Kit](https://github.com/okx/agent-trade-kit)

### Inferences
- Fikir kalitesi (yeniden çerçevelenmiş): **8/10**.
- Gerçek problem ve değer: **8/10** — risk gerçek ve bir cümlede anlatılır; nicel talep kanıtı eksik.
- Özgünlük: **7.5/10** — parçalar bilindik, aynı-borsa DCD→options policy gate birleşimi farklı.
- OKX stratejik uyum: **9/10** — Earn, options market data ve ATK'yı tek zorunlu kullanıcı kararında birleştirir.
- Agentic design: **8/10** — tarama/eşleştirme/veto/izleme ajan için gerekçeli; gerçek abonelik öncesi insan onayı korunmalı.
- 30 saniyelik demo netliği: **9/10** — yüksek APR'nin kırmızı REJECT'e dönüşmesi görünür ve akılda kalır.
- 9 saatlik uygulanabilirlik: **6.5/10** — canlı DCD/demo kısıtı ve kontrat eşleme riski var; tek ürün ve dry-run ile 8/10'a çıkar.
- Avalanche uyumu: **5.5/10** — x402 ticari servis mantıklı ama ana hesaplama off-chain; eligibility sağlar, merkezilik puanı tartışmalı.
- Güven/regülasyon: **5/10 mevcut haliyle; 8/10 insan onaylı risk kapısıyla** — tam otonom yapılandırılmış ürün aboneliği gereksiz yük oluşturur.
- Önerilen tek cümle: **“Hazine Ajanı, OKX Dual Investment teklifinin gösterdiği APR'yi canlı OKX opsiyon piyasasındaki karşılığı ve kullanıcının zarar sınırıyla test eder; prim riski karşılamıyorsa işlemi daha imzalanmadan durdurur.”**
- Önerilen isim/alt başlık: **Hazine Ajanı — Dual Investment Risk Gate** veya **APR X-Ray for OKX Earn**. “Adil değil” hükmü yerine “premium efficiency”, “market-implied benchmark” ve “policy violation” terimleri kullanılmalı.
- Demo kararı iki neden koduyla deterministik olmalı: `PREMIUM_BELOW_MARKET_BAND`, `STRESS_LOSS_EXCEEDS_POLICY`. LLM yalnızca bu sonucu sade Türkçeyle açıklar.

### Gaps
- Puanlar araştırma bulgularından üretilen uzman değerlendirmesidir; jüri puanı tahmini değildir.
- Canlı endpoint testi yapılmadan 9 saatlik uygulanabilirlik nihai kabul edilmemeli.
