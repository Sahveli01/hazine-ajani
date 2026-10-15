# Hazine Ajanı — teknik ve finansal geçerlilik

## Dual Investment gerçekten cash-secured put / covered call mıdır; payoff nasıl farklıdır?

### Takeaway
Ekonomik sezgi doğrudur: OKX de ürünü açıkça “OKX’e opsiyon satmak” olarak tanımlar. Fakat birebir standart vanilla opsiyon değildir. Buy Low, USDT teminatlı kısa put; Sell High, coin teminatlı kısa call benzeri bir payoff üretir. Kuponun dönüşen anaparaya eklenmesi, 30 dakikalık ortalama endeks fiyatıyla tetiklenen fiziksel dönüşüm, OKX’in hesaplama/karşı taraf rolü ve ikincil piyasa olmaması birebir eşleştirmeyi bozar.

### Cited Findings
- OKX ürün şartları, Dual Investment abonesinin toplam getiri karşılığında OKX’e dayanak çift üzerinde fiilen opsiyon sattığını açıkça söyler. Ürün anapara garantili değildir. — [OKX Dual Investment Product Terms](https://www.okx.com/en-us/help/dual-investment-product-service-terms)
- Buy Low’da vade fiyatı hedefin üzerindeyse sonuç `N(1+r)` USDT; hedefte veya altındaysa `N/K × (1+r)` coin’dir. Sell High’da vade fiyatı hedefin altındaysa coin `Q(1+r)` olarak kalır; hedefte veya üstündeyse `QK(1+r)` quote para alınır. — [OKX Dual Investment Product Terms](https://www.okx.com/en-us/help/dual-investment-product-service-terms)
- OKX’in 2026 kuralında “vade fiyatı”, vade öncesindeki son 30 dakikada her 200 ms’de alınan endeks noktalarının ortalamasıdır; tek bir spot kapanış değildir. — [OKX settlement-price update](https://www.okx.com/en-gb/help/okx-to-update-the-settlement-price-for-dual-investment)
- OKX, sözleşmede ürünlerin türev, fiziksel teslim ve “barrier features” içerebildiğini; erken çözmenin yalnızca OKX takdirinde, mark-to-market ve çözme masraflarıyla olabileceğini; ikincil pazar bulunmadığını belirtir. — [OKX Dual Investment Product Terms](https://www.okx.com/en-us/help/dual-investment-product-service-terms)
- OKX’in kendi FAQ’sı getirinin müşteriye call veya put sattırma mantığından geldiğini söyler. — [OKX Dual Investment FAQ](https://www.okx.com/en-gb/help/dual-currency-win-faq)

### Inferences
- Buy Low’un USDT cinsinden vade değeri `V_T=N(1+r)-[N(1+r)/K](K-S_avg)^+` biçimindedir. Bu, `N(1+r)/K` adet kısa put ile `N(1+r)` vadeli risksiz nakit payoff’unun bileşimidir; standart “N/K adet put + N nakit + ayrı premium” gösterimine yakın olsa da kupon da dönüşüme katıldığı için ölçek tam aynı değildir.
- Sell High simetrik biçimde coin üzerinde covered-call benzeridir. “Cash-secured put / covered call benzeri” ifadesi doğru; jüri önünde “birebir aynıdır” denmemelidir.
- Listed OKX vanilla option tek andaki endeks/teslim fiyatına bağlıyken DCD 30 dakikalık ortalamaya bağlıysa listed kontrat doğrudan hedge değildir. Bu basis/averaging riski küçük vadelerde dahi gerçektir; modelde açıkça “proxy fair value” denmelidir.

### Gaps
- Her canlı DCD teklifinin ek ürün şartlarında ayrıca knock-in/knock-out bariyeri olup olmadığı yalnız ürün bazında görülebilir. Genel payoff tablosu yalnız vade eşiğini gösteriyor; canlı product payload test edilmeden “barrier yoktur” denemez.

## Gösterilen APR’yi vanilla option / Black-Scholes adil değeriyle karşılaştırmak doğru mudur?

### Takeaway
Karşılaştırma yön olarak çok değerli, fakat “ekran APR’si adil APR’den yüksek/düşük” hükmü yalnız Black-Scholes çıktısıyla verilirse yanıltıcı olur. En savunulabilir ölçüt, aynı strike ve yakın vadedeki OKX opsiyonunun **işlem yapılabilir bid/ask’ı ve IV smile’ı** ile üretilen yaklaşık replikasyon değeri; ayrıca stablecoin fırsat maliyeti, 30 dakikalık averaging farkı, fiziksel dönüşüm, likidite/erken çıkış ve OKX kredi riskinin ayrı kalemler olarak gösterilmesidir.

### Cited Findings
- Black-Scholes’in klasik varsayımları sabit faiz ve varyans, kesintisiz işlem/fiyat yolu ve işlem maliyeti-vergi olmamasını içerir; fiyat volatilite tahminine hassastır. — [IMF, Black-Scholes model assumptions](https://www.imf.org/-/media/Websites/IMF/imported-full-text-pdf/external/pubs/ft/cgmfs/eng/pdf/_cgmfs.ashx)
- Cboe, farklı strike ve vade için implied volatility smile’ını spline ile interpolate, SABR ile extrapolate eden resmi bir metodoloji kullanır; tek sabit volatilite bütün zinciri temsil etmez. — [Cboe IV Calculation Methodology](https://cdn.cboe.com/api/global/us_indices/governance/Cboe_American_Style_Options_Implied_Volatility_Calculations_Methodology.pdf)
- OKX şartlarına göre APR sabittir, dönüşüm zararını telafi etmeyebilir; abonelikten faiz başlangıcına kadar getiri işlemeyebilir; erken unwind maliyet içerir ve ikincil piyasa yoktur. — [OKX Dual Investment Product Terms](https://www.okx.com/en-us/help/dual-investment-product-service-terms)
- Opsiyon fiyatlarından çıkarılan olasılıklar gerçek-dünya olasılıkları değil, risk tercihlerini de içeren risk-neutral olasılıklardır. — [IMF, market-based probabilities](https://www.elibrary.imf.org/view/journals/001/2006/104/article-A001-en.xml)
- OKX public option trades cevabı forward price, index price, mark price ve trade implied volatility (`fillVol`) alanlarını; market endpoints de bid/ask ve option instrument verisini sunar. — [OKX API documentation](https://app.okx.com/docs-v5/en)

### Inferences
- En doğru demo metriği “adil APR” yerine üçlü ayrımdır: (1) DCD net term yield, (2) eşleşen listed option executable premium’den türetilen **proxy option-equivalent yield**, (3) Simple Earn/funding fırsat maliyeti sonrası **net edge bandı**. Tek nokta yerine bid–ask aralığı gösterilmelidir.
- Kullanıcı opsiyon sattığı için kıyasın muhafazakâr işlem fiyatı, teorik mid değil, benzer riski gerçekten satarak elde edebileceği bid (ücret sonrası) olmalıdır. DCD tarafındaki gizli spread/OKX marjı ancak bu şekilde görünür hale gelir.
- Vanilla strike/vade tam eşleşmiyorsa IV smile ve term structure üzerinden interpolasyon yapılmalı; Black-Scholes yalnız fiyat dönüştürücü olarak kullanılmalı. DCD’nin averaging payoff’u için kısa Monte Carlo veya yaklaşık Asian option düzeltmesi daha dürüst olur.
- “Strike’a gelme olasılığı” etiketi risk-neutral ise öyle yazılmalıdır. Kullanıcıya gerçek olasılık diye sunmak kavramsal hatadır; gerçek-dünya olasılığı için ayrı tarihsel/forecast model ve kalibrasyon gerekir.
- Fiziksel dönüşüm başlı başına ekstra ekonomik zarar değildir; kısa put/call payoff’unun teslim biçimidir. Fakat kullanıcının coin’i hemen USDT’ye çevirmesi halinde spot spread/fee ve operasyonel gecikme eklenir. Ürün karşı taraf/likidite/erken çıkış özellikleri listed option fiyatında birebir bulunmaz.

### Gaps
- DCD quote payload’ındaki fiyatın OKX tarafından hangi hedge, spread ve ücret bileşenleriyle üretildiğine dair açık bir metodoloji bulunamadı. Bu nedenle “OKX şu kadar fazla marj alıyor” iddiası kanıtlanamaz; yalnız piyasa-proxy farkı ölçülebilir.

## OKX Agent TradeKit/API/TR/demo ile gerçekte hangi veri ve işlemler mümkün?

### Takeaway
Fikir teknik olarak yapılabilir ve mevcut resmi Agent Trade Kit artık DCD’yi doğrudan destekliyor. Ancak DCD **demo modunda desteklenmiyor**; bu en büyük demo engeli. En güvenilir hackathon akışı: canlı kimlikli read-only ürün/quote okuma + public option chain + yerel simüle karar/settlement; gerçek DCD subscription’ı isteğe bağlı, küçük canlı bakiye ve açık onayla yapılmalıdır.

### Cited Findings
- Resmi OKX Agent Trade Kit deposu 167 araç/11 modül arasında 24 Earn aracı ve Dual Currency Deposit için 6 araç listeler. — [OKX Agent Trade Kit README](https://github.com/okx/agent-trade-kit/blob/github-main/README.md)
- Resmi Earn skill; `dcd pairs`, `dcd products`, atomik `quote-and-buy`, order/order history ve iki adımlı early redeem araçlarını listeler. DCD’nin demo/simulated modunu desteklemediğini ve canlı profil gerektiğini açıkça belirtir. — [OKX Earn Skill](https://github.com/okx/agent-trade-kit/blob/github-main/skills/okx-cex-earn/SKILL.md)
- Agent Trade Kit option modülü option chain ve kontrat başına IV/Greeks okuyabilir, option emirleri verebilir; market ticker/orderbook araçları public ve anahtarsızdır. — [OKX Agent Trade Kit docs](https://www.okx.com/docs-v5/agent_en/)
- TradeKit yalnız hesabın/bölgenin OKX üzerinde zaten yetkili olduğu ürünleri çalıştırabilir; bölgesel derivatives kısıtlarını aşamaz. — [OKX Agent Trade Kit FAQ](https://www.okx.com/docs-v5/agent_en/)
- OKX TR’de Dual Investment ürün sayfası mevcuttur ve settlement kurallarını yayınlar. — [OKX TR Dual Investment](https://tr.okx.com/en/earn/dual)
- OKX TR API dokümanı `OPTION` instrument alanlarını ve public market data uçlarını dokümante eder; market data authentication gerektirmez. — [OKX TR API docs](https://tr.okx.com/docs-v5/en/)

### Inferences
- Proje dosyasındaki “earn skill sadece al/boz/listele” boşluk iddiası güncel değil: DCD ürün ve subscribe araçları resmi kitte zaten var. Özgünlük, entegrasyon aracında değil, DCD’yi option chain ile değerleyip politika altında seçen karar katmanındadır.
- `--demo --modules all` yazmak DCD işlemini çalıştırmaz. Demo sunumunda canlı DCD subscribe sözü verilmemeli. DCD product read endpoint’i de auth/live profil isteyebilir; etkinlik öncesi TR hesabında `dcd pairs/products` mutlaka denenmelidir.
- Public option zinciri erişilebilir olsa bile TR hesabının option **trade** yetkisi ayrı meseledir. Değerleme yalnız public global/TR market data ile yapılabilir; option emri vermeye ihtiyaç yoktur.
- Product quote çok kısa ömürlü olabileceğinden DCD APR ve option snapshot aynı timestamp yakınlığında kaydedilmeli; aksi halde “mispricing” piyasa hareketinden kaynaklanabilir.

### Gaps
- OKX TR hesabında `earn.dcd` private endpoints’in fiilen açıldığı, hangi host/site konfigürasyonunun gerektiği ve hackathon hesabının ürün uygunluğu dokümandan kesinleşmiyor; fiziksel hesap testi şart.
- Demo profilinde public option data çalışsa da DCD products çağrısının salt read olarak canlı kimlik olmadan dönüp dönmediği resmi skill “auth required/live” dediği için varsayılmamalı.

## Avalanche x402 uygulanabilir mi ve ürünün merkezinde mi?

### Takeaway
x402/Avalanche teknik olarak hızlı ve yapılabilir; Fuji’de test USDC, hazır middleware ve facilitator vardır. Fakat son kullanıcı Hazine Ajanı probleminde ekonomik olarak merkezi değildir. Başka ajanların aynı değerleme endpoint’ini gerçekten çağırdığı bir akış gösterilmezse jüri açısından dekoratif entegrasyon görünür.

### Cited Findings
- Avalanche’ın resmi eğitiminde Fuji chain ID 43113, Fuji RPC, Circle test USDC faucet’i ve Fuji USDC adresi verilir. — [Avalanche x402 Network Setup](https://docs.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/02-network-setup)
- Resmi Avalanche dokümanı Thirdweb, Ultravioleta ve Rust facilitator seçeneklerini, Express/Hono middleware’lerini ve Avalanche/Fuji network adlarını gösterir; C-Chain’de EIP-7702 yoktur, ödemeler ERC-3009 veya ERC-2612 imzalarıyla yapılır. — [Avalanche x402 Facilitators](https://docs.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators)
- Avalanche dokümanı C-Chain’de yaklaşık bir saniye finality, resmi Circle USDC ve düşük ücretleri x402 için gerekçe gösterir. — [Why Avalanche for x402](https://docs.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/01-why-avalanche)

### Inferences
- x402’yi “fiyatlama Avalanche üzerinde çalışıyor” diye anlatmak teknik olarak yanlış olur: hesaplama web sunucusunda yapılır; Avalanche ödeme authorization/settlement katmanıdır.
- En iyi konumlandırma: Hazine Ajanı kendi `fair-value` API’sini bir kez x402 client olarak satın alır veya ikinci bir sahte/mini ajan aynı endpoint’i ödeyerek çağırır; ödeme tx hash’i ve dönen audit JSON’u panelde görünür. Böylece Avalanche ajanlar arası pazarın gerçek parçasıdır.
- Hackathon MVP’de x402 servisini çekirdek karar yoluna zorunlu koymak erişilebilirlik ve faucet/facilitator arızasını tek hata noktasına çevirir. Local ücretsiz fallback bulunmalı; Avalanche bölümü ücretli üçüncü-taraf erişim kanalı olarak sunulmalıdır.

### Gaps
- Hackathon rubriğinin Avalanche deployment’ı yalnız x402 transferiyle kabul edip etmeyeceği teknik dokümandan anlaşılamaz; organizatör teyidi gerekir.

## Sert engeller, zorunlu düzeltmeler ve en küçük inandırıcı demo

### Takeaway
Fikir OKX için mantıklı ve değerli; en büyük risk fikir değil, sunumdaki aşırı iddialardır. DCD demo işlemi yok, vanilla Black-Scholes “gerçek adil fiyat” değildir ve x402 hesaplamayı on-chain yapmaz. Bunlar düzeltilirse tek günlük hackathon için güçlü, savunulabilir bir karar ajanı demosu çıkar.

### Cited Findings
- DCD live-only’dir; resmi skill simulated mode’u açıkça engeller. — [OKX Earn Skill](https://github.com/okx/agent-trade-kit/blob/github-main/skills/okx-cex-earn/SKILL.md)
- OKX ürün şartları 30 dakikalık average settlement, fiziksel dönüşüm, ikincil piyasa yokluğu ve OKX takdirindeki unwind koşullarını içerir. — [OKX Dual Investment Product Terms](https://www.okx.com/en-us/help/dual-investment-product-service-terms)
- TradeKit public market/option zinciri araçlarını ve DCD ürün araçlarını sunar; bölgesel/account yetkisi yine belirleyicidir. — [OKX Agent Trade Kit docs](https://www.okx.com/docs-v5/agent_en/); [OKX Agent Trade Kit README](https://github.com/okx/agent-trade-kit/blob/github-main/README.md)

### Inferences
- **Hard blockers:** (1) DCD için demo subscription yok; (2) TR hesabında private DCD read/quote yetkisi etkinlikten önce test edilmezse canlı teklif alınamayabilir; (3) DCD ile listed option’ın settlement tanımı birebir değil; (4) gerçek dönüşme olasılığı yalnız option IV’den çıkarılamaz.
- **Metin düzeltmeleri:** “adil fiyat” → “piyasa-referanslı proxy değer aralığı”; “strike’a gelme olasılığı” → “risk-neutral implied conversion probability” veya ayrıca tarihsel tahmin; “aynı opsiyon” → “yakın strike/vade listed option proxy’si”; “Avalanche üzerinde çalışan hesap” → “Avalanche x402 ile ücretlenen API”.
- **En küçük inandırıcı demo:** canlı/auth `dcd products`tan tek BTC/USDT Buy Low teklifi; public OKX option instruments + bid/ask/IV snapshot; term APR’yi mutlak kupona çevirme; aynı/komşu strike-vade IV interpolasyonu ve bid–ask bazlı proxy option premium; Simple Earn fırsat maliyeti; açık üç risk etiketi (30 dk average basis, fiziksel dönüşüm, likidite/erken çıkış); kullanıcının “en az %50 likit, implied conversion ≤ %20” politikasına deterministik ACCEPT/REJECT; ardından **simüle** allocation/settlement. İkinci bir ajan `/fair-value` endpoint’ine Fuji USDC ile x402 ödeme yapar ve tx hash’i görünür.
- Gerçek DCD `quote-and-buy` bonus demo olmalı; küçük canlı bakiye, ayrı işlem onayı ve net “live” etiketi gerektirir. Ana jüri akışı buna bağımlı olmamalıdır.

### Gaps
- Canlı OKX TR credentials olmadan ürün listesi/quote payload alanları ve rate limits uçtan uca doğrulanamadı.
