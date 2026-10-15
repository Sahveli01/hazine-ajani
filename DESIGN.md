# Tasarım yönü — Hazine Ajanı

## Kararlar

- **Mod — Operate:** Kullanıcı tek bir yüksek riskli kararı kanıtlarıyla tamamlar; chrome geri çekilir, canlı teklif ve karar öne çıkar.
- **Palet — soğuk güven mavisi:** Tek aksiyon accent'i OKX veri disiplini ile Avalanche ödeme katmanını bağlar. Nötrler aynı hue'ya hafif tintlidir. Success, warning ve danger yalnız semantik durumlar içindir.
- **Tipografi — Onest:** Açık lisanslı modern grotesk, projeksiyonda geniş ve temiz harf şekilleri sağlar. Sayısal alanlar tabular numerals kullanır; adres ve hash için yalnız `--font-mono` kullanılır.
- **Spacing — 8px temel birim:** Bütün boşluklar `tokens.css` ölçeğinden gelir. Kompakt market verisi ile geniş karar yüzeyi aynı ritmi paylaşır.
- **Yoğunluk — odaklı veri aracı:** Ana karar geniş nefes alır; delil satırları kompakt kalır. Eşit ağırlıklı feature-card panosu kullanılmaz.
- **Derinlik — tonal katman:** Surface tonları ve tek güçlü ayırıcı hiyerarşi kurar. Statik zeminde blur, her karta gölge ve iç içe kart yığınları yoktur.
- **Motion — nedene bağlı:** 200–400ms aralığındaki tokenlar yalnız kullanıcının eylemi veya durum değişimini açıklar. Scroll giriş animasyonu, bounce ve dekoratif loop yoktur.

## Demo koşulları

- Fiziksel Ankara etkinliği ve aydınlık oda/projeksiyon varsayılır.
- Ana hedef `1280×720` no-scroll; `1024px` genişlikte işlev kaybetmeden kanıt bölgeleri tek sütuna iner.
- Kritik bilgi en az `--type-body-lg`; ana karar `--type-decision`; yardımcı teknik metadata masaüstünde dahi okunabilir ölçüdedir.
- Metin ve kritik kontroller WCAG AA 4.5:1 altına inmez. İnce border tek ayrım aracı değildir.
- Kenarlarda `--space-safe-inline` güvenli alanı korunur; overscan yüzünden kritik aksiyon viewport kenarına dayanmaz.
- Ağ gecikmesinde boş panel görünmez. Gerçek içeriğin şeklini koruyan skeleton ve açık “OKX verisi bekleniyor” metni kullanılır.

`PLAN.md` bulunmuyor. Demo akışı için kanonik `PROJECT.md` §5/§13 ve `outputs/ROADMAP.md` D1–D4 kullanılmıştır. `HACKATHON.md`, `IDEAS.md` ve `ECOSYSTEM-OKX-2026-10-15.md` ek bağlam sağlar.

## Token dosyası

- Kaynak: `apps/web/app/tokens.css`.
- Import sınırı: `apps/web/app/layout.tsx` token dosyasını bir kez yükler; bütün sayfalar ve bileşenler CSS custom property'lerini kullanır.
- Renk, spacing, radius, typography, motion, touch target, stroke ve layout ölçüsü token olmadan yazılamaz. Token dışındaki renk veya spacing değeri bug kabul edilir.
- Semantik adlar (`--surface-*`, `--text-*`, `--status-*`, `--action-*`) bileşenlerde ham palet kullanımının önüne geçer.

## Demo ekranları ve bilgi hiyerarşisi

### 1. Teklif denetçisi

1. Sabit yükseklikte header: Hazine Ajanı, OKX TR `LIVE`, son veri zamanı ve güvenli hesap durumu.
2. Büyük karar alanı: `ACCEPT / ASK / REJECT`, iki insan-okur nedeni, analysis expiry ve veri güveni.
3. Kanıt şeridi: canlı DCD APR/dönem getirisi, uygulanabilir option bid–ask bandı, net edge bandı ve risk-nötr conversion probability.
4. Karşılaştırma gövdesi: strike/vade eşleşmesi, index, proxy farkları, settlement disclosure ve kaynak zamanları.
5. Politika özeti: likidite rezervi, conversion sınırı ve stres kaybı limiti; doğal dil parse edildiyse doğrulanan yapı da görünür.
6. Tek baskın aksiyon: karar `ACCEPT` ise incelemeye geç; `ASK` ise değiştirilecek koşulu göster; `REJECT` ise write aksiyonu üretme.

### 2. İnceleme ve OKX onayı

1. Ürün, tutar, live/dry-run, quote expiry ve beklenen settlement para birimi.
2. Dönüşüm riski ve iki temel reason code.
3. Ayrı `Onayla` ve `Vazgeç` aksiyonları; onay düğmesi quote stale olduğunda yerinde kapanır.
4. Execution state aynı bölgede ilerler; layout yüksekliği değişmez.
5. Write kapalıysa buton taklidi yoktur. Analiz korunur ve neden kapalı olduğu açıklanır.

### 3. Agent ödeme kanalı

1. İkinci agent isteği ve rapor kimliği.
2. `402` fiyatı, `Avalanche Fuji` ve `test USDC` etiketi.
3. Wallet imzası ve transaction lifecycle.
4. Confirmed hash, explorer linki, ödeme doğrulaması ve aynı `AnalysisReport` JSON önizlemesi.
5. Ücretsiz başarı veya önceden yazılmış hash görünemez.

## Canlı veri durumları

Her DCD, option, policy ve report yüzeyi aynı yükseklikte şu durumları taşır:

- `loading`: gerçek satırların ölçüsünde skeleton, `aria-busy=true`, kaynak adı görünür.
- `empty`: hangi gerçek verinin bulunamadığını ve analizin neden üretilemediğini söyler.
- `error`: OKX, RPC veya facilitator hatasını ayırır; aynı bölgede retry verir.
- `stale`: son başarılı değeri karar girdisi yapmaz; zamanı ve yenile eylemini gösterir.
- `success`: kaynak, timestamp ve precision bilgisiyle gerçek değeri gösterir.

## Web3 durumları

Wallet kontrolü header'ın sabit genişlikli sağ alanındadır; address geldiğinde header reflow yapmaz.

- `disconnected`: sayfa anlaşılır kalır; agent ödeme sahnesinde bağlan eylemi görünür.
- `no wallet`: desteklenen wallet açıklaması ve kurulum yolu; disconnected ile karışmaz.
- `connecting`: “Cüzdan penceresini kontrol et” mesajı; sessiz spinner yoktur.
- `wrong chain`: kaybolmayan banner ve Fuji'ye geç eylemi.
- `connected`: `0x1234…7890` biçiminde copyable, explorer-linked address ve disconnect.
- `account switched`: eski payer verisi anında geçersizleşir; yeni hesaba göre bakiye/receipt refetch edilir.
- `locked mid-demo`: mevcut analiz kalır, yeni ödeme imzası durur ve yeniden bağlanma istenir.

Transaction aynı sabit bölgede ilerler:

- `idle`: tutar, token, network ve alıcı açık; aksiyon hazır.
- `awaiting signature`: wallet'ta onay istendiği söylenir; cancel yolu kalır.
- `user rejected`: kırmızı hata gösterilmez; sakin biçimde idle'a döner.
- `submitted`: hash hemen copyable ve explorer-linked görünür.
- `pending`: ekranın geri kalanı bloklanmaz; elapsed state görünür.
- `confirmed`: RPC ile doğrulanan tx ve alınan rapor birlikte güncellenir.
- `reverted`: düz dilde neden, aynı yerde retry.
- `insufficient balance`: gereken test AVAX/test USDC ve Fuji faucet yolu.
- `facilitator error`: ağ problemi olarak ayrılır; kullanıcı suçlanmaz.

## Responsive davranış

- `1280×720`: karar ve kanıt şeridi ilk viewport'ta; detay disclosure kapalı başlayabilir.
- `1024px`: karar üstte, kanıt ve politika altında tek sütuna dönüşür; ana değerler hâlâ no-scroll görünür.
- Mobil: demo ana hedefi değildir; bilgi sırası korunur, tablolar satır listesine dönüşür, yatay scroll kritik içerikte kullanılmaz.
- Uzun product ID, yüksek precision, boş reason listesi ve birden fazla reason code gerçek uzunluklarıyla tasarlanır; metin kısaltılırsa tam değer erişilebilir kalır.

## Impeccable

`PRODUCT.md` ürün kimliğini, kullanıcıyı, doğruluk sınırını ve dili yönetir. Bu dosya görsel sistem, demo koşulu, ekran hiyerarşisi ve Web3 state matrix'ini yönetir. İki belge aynı kararı farklı kelimelerle tekrar etmez; çelişkide ürün gerçeği `PRODUCT.md`'den alınır.

## Anti-pattern sözleşmesi

- Gradient headline, neon glow, emoji heading, anlamsız glassmorphism ve sponsor renklerinden dekoratif karışım yoktur.
- Üç eşit feature card, kart-içinde-kart ve her kutuya shadow yoktur.
- Renk tek başına durum anlatmaz; ikon, başlık ve açık metin eşlik eder.
- Teknik implementation ayrıntıları kullanıcı copy'sine taşınmaz.
- Testnet mainnet gibi, risk-nötr değer gerçek olasılık gibi, CEX sonucu on-chain kanıt gibi gösterilmez.

## Kapsanmayanlar

- Dark mode, Sell High, çoklu teklif sıralaması ve vade sonrası ekranlar MVP yönünün dışındadır.
- Bu adım ekran component'lerini oluşturmaz; D1–D4 aynı token ve hiyerarşiyi gerçek verilerle uygular.
- Logo/illüstrasyon üretilmez. Ürün kimliği tipografi ve karar yüzeyindeki disiplinle kurulur.
