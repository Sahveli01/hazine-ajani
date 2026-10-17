# PayAI ile hosted x402'ye geçin

**Hazine Ajanı için Railway öncesi seçilmesi gereken hosted facilitator PayAI'dir; ancak seçim, canlı `/supported` ve gerçek Fuji settlement kapıları geçildiğinde kesinleşmelidir.** Thirdweb, Avalanche Builder Hub'ın resmî uygulamalı kursunda kullandığı sağlayıcı olduğu için en güçlü “resmî kurs uyumu”na sahiptir; buna karşılık PayAI mevcut `@x402/core` v2, `exact`, `eip155:43113` ve EIP-3009 mimarisine standart HTTP facilitator olarak doğrudan uyar. PayAI'nin canlı `/supported` yanıtı Fuji için bu sözleşmeyi yayımlıyor ve testnet settlement'ları API anahtarı olmadan ücretsiz çalışıyor. Bu, Railway'e geçerken Thirdweb SDK'sı, proje secret'ı ve server wallet yaşam döngüsü eklemekten kaçınır. Avalanche'ın işlettiği tek bir “resmî facilitator” bulunmadığı için sunumda PayAI'yi “Avalanche Builder Hub'da resmî olarak listelenen hosted facilitator” diye tanımlamak gerekir. Railway kurulumu ancak aşağıdaki doğrulamalar yerelde tamamlandıktan sonra yapılmalıdır.

## “Resmî” tek sağlayıcı değil, resmî listelenmiş seçenekler demektir

Avalanche Builder Hub, Avalanche'ın **birden fazla x402 facilitator desteklediğini** söylüyor ve Thirdweb, PayAI, Ultravioleta DAO ile x402-rs seçeneklerini birlikte listeliyor. İlk üçü hosted, x402-rs ise kendi RPC ve signer anahtarınızı işletmenizi gerektiren self-hosted çözümdür. Bu nedenle “Avalanche'ın resmî facilitator'ı” ifadesi yanıltıcıdır; sağlayıcıların hiçbiri Avalanche tarafından işletilen tek hizmet olarak sunulmuyor. Doğru ifade, **“Avalanche Builder Hub tarafından resmî olarak listelenen x402 entegrasyonu”**dur. ([Avalanche Builder Hub: Facilitators](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators))

Thirdweb'in ayrı bir üstünlüğü vardır: Avalanche'ın uygulamalı Fuji kursu `ava-labs/x402-starter-kit` içinde Thirdweb'i seçer ve Thirdweb proje anahtarı ile Fuji ERC-4337 server wallet kurulumu öğretir. Bu, Thirdweb'i **Avalanche'ın resmî kursuyla en güçlü biçimde hizalanan yol** yapar; hizmetin Avalanche'a ait olduğu anlamına gelmez. ([Avalanche Builder Hub: Environment setup](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/05-hands-on-implementation/01-environment-setup))

## PayAI mevcut v2 mimarisine doğrudan oturuyor

Hazine Ajanı'nın mevcut ödeme sunucusu standart `HTTPFacilitatorClient` ve x402 v2 bileşenlerini kullanıyor. PayAI, `@x402/core/server` içindeki aynı HTTP istemcisiyle bağlantı öneriyor; böylece hosted geçişi esas olarak facilitator URL'sini değiştirmek ve yetenekleri başlatma sırasında doğrulamakla sınırlı kalıyor. Thirdweb ise `thirdweb/x402` adaptörü, Thirdweb client secret key'i ve dashboard'da oluşturulan server wallet adresi istiyor. **Thirdweb protokol açısından geçerli olsa da kod, secret ve operasyon yüzeyini büyütüyor.** ([PayAI facilitator](https://docs.payai.network/x402/facilitators/introduction); [Thirdweb facilitator](https://portal.thirdweb.com/x402/facilitator))

PayAI'nin ağ belgesi Avalanche Fuji'yi hem legacy `avalanche-fuji` hem de x402 v2'nin kanonik CAIP-2 tanımı `eip155:43113` olarak listeliyor. Daha güçlü kanıt, canlı [`/supported`](https://facilitator.payai.network/supported) yanıtının araştırma tarihinde **x402 v2 + `exact` + `eip155:43113` + EIP-3009** desteğini ve testnet için sıfır fiyatı ilan etmesidir. PayAI ordinary exact ödemelerde API anahtarını isteğe bağlı tutuyor ve testnet settlement'larının allowance tüketmeden ücretsiz olduğunu belgeliyor. ([PayAI supported networks](https://docs.payai.network/x402/supported-networks); [PayAI pricing](https://docs.payai.network/x402/facilitators/pricing))

Bu veriler iki ölçütün neden farklı sonuç verdiğini açıklar. **Kurs uyumu ölçütünde Thirdweb birincidir; mevcut Hazine Ajanı'na drop-in operasyonel uyum ölçütünde PayAI birincidir.** Hackathon demosunda gerçek Fuji settlement, az secret, az kod değişikliği ve bilgisayardan bağımsız çalışma daha belirleyici olduğu için nihai öneri PayAI'dir. Thirdweb ancak jüri anlatısında Avalanche kursunu birebir izlemek, Thirdweb dashboard görünürlüğü veya sağlayıcının hesap yönetimi özellikle isteniyorsa seçilmelidir.

## Ultravioleta yedek, x402-rs ise hedef dışıdır

Ultravioleta teknik olarak uygun bir hosted alternatiftir: canlı [`/supported`](https://facilitator.ultravioletadao.xyz/supported) yanıtı Fuji için v1 ve v2 `exact` desteğini ve Circle Fuji USDC adresini yayımlar; sağlayıcı kendisini anahtarsız ve hesapsız olarak sunar. ([Ultravioleta facilitator](https://facilitator.ultravioletadao.xyz/); [Avalanche integration](https://build.avax.network/integrations/ultravioletadao)) Bununla birlikte projede bu sağlayıcıyla `upstream_rpc_unavailable` settlement hatası yaşanmıştır ve açık kota/SLA belgesi bulunmamaktadır. Bu nedenle Ultravioleta otomatik paralel failover olarak kullanılmamalı; **aynı authorization iki facilitator'a gönderilmeden**, runbook'ta manuel yedek olarak tutulmalıdır.

x402-rs gerçek ve resmî listelenmiş bir entegrasyondur, fakat hosted değildir; Railway'de RPC, signer private key ve facilitator servisini yine ekibin işletmesini gerektirir. Yerel facilitator bağımlılığını kaldırma hedefini karşılamadığı için bu geçişin adayı değildir. ([Avalanche Builder Hub: x402-rs](https://build.avax.network/integrations/x402-rs))

## Railway'den önce sekiz kapı geçilmelidir

| Kapı | Railway öncesi beklenen kanıt |
|---|---|
| Sağlayıcı sağlığı | `https://facilitator.payai.network/supported` HTTP 200 dönmeli; yanıtta x402 v2, `exact` ve `eip155:43113` birlikte bulunmalı. Fiyat kaydı testnet için yeniden kontrol edilmeli. |
| 402 sözleşmesi | İmzasız paid route HTTP 402 ve geçerli `PAYMENT-REQUIRED` dönmeli; network `eip155:43113`, asset `0x5425890298aed601595a70AB815c96711a31Bc65`, amount `10000` ve `payTo` beklenen adresle eşleşmeli. |
| Token domain'i | Fuji RPC üzerinden USDC `name=USD Coin`, `version=2`, `decimals=6` okunmalı; uyumsuzlukta imza istenmemeli. Circle aynı Fuji test token adresini yayımlar. ([Circle contracts](https://developers.circle.com/stablecoins/usdc-contract-addresses)) |
| Fail-closed güvenlik | Yanlış ağ, asset, recipient, aşırı tutar ve süresi geçmiş authorization paid sonuç üretmeden reddedilmeli. |
| Gerçek settlement | Ayrı kullanıcı onayıyla `10000` base-unit, yani **0,01 Fuji test USDC**, PayAI üzerinden ödenmeli; sonuç HTTP 200, `PAYMENT-RESPONSE`, `success=true`, doğru network ve transaction hash içermeli. |
| Zincir kanıtı | Fuji receipt başarılı olmalı; USDC `Transfer` logu payer → doğru `payTo`, amount `10000` göstermeli ve hash API sonucuyla eşleşmeli. |
| Replay ve kesinti | Aynı authorization yeniden gönderildiğinde ikinci transfer oluşmamalı; timeout, 429, 503 veya upstream hatasında arayüz paid göstermemeli. PayAI kapasite ve hata davranışını ayrıca belgeler. ([PayAI limits](https://docs.payai.network/x402/facilitators/capacity-and-limits)) |
| Public tekrar | Bu kapılar yerelde geçtikten sonra Railway'e deploy edilmeli; aynı kontroller public HTTPS URL üzerinden yeniden çalıştırılıp transaction hash kanıt olarak kaydedilmeli. |

Bu testlerde ödeyen agent'ın private key'i **Railway'e veya API servisine konmamalıdır**; istemci/cüzdan tarafında kalmalıdır. PayAI ile başlangıçta facilitator API secret'ı da gerekmez. Railway yalnız public facilitator URL'sini, public alıcı adresini ve uygulamanın mevcut OKX read-only secret'larını tutmalıdır. Hosted sağlayıcıların Avalanche tarafından garanti edilen bir SLA'sı bulunmadığından canlı `/supported` kontrolü deployment readiness ve demo öncesi preflight olarak korunmalıdır.

## Conclusion

PayAI seçimi Avalanche'ın resmî kursundan uzaklaşmak anlamına gelmez; Builder Hub'ın resmî olarak sunduğu seçeneklerden, Hazine Ajanı'nın mevcut protokol sözleşmesine en uygun olanı seçmek anlamına gelir. Thirdweb anlatı ve eğitim uyumunda güçlüdür, fakat bu proje için ek SDK ve credential yükü ölçülebilir bir fayda sağlamadan hata yüzeyini büyütür.

Karar koşulludur: PayAI canlı v2/Fuji yeteneğini yayımlamaya devam etmeli ve yerel gerçek settlement sekiz kapıyı geçmelidir. Bu şartlardan biri başarısız olursa Railway'e geçilmemeli; önce Thirdweb, kendi `supported()` doğrulaması ve gerçek Fuji smoke testiyle ikinci aday olarak değerlendirilmelidir.
