# Avalanche x402 facilitator seçimi

Araştırma tarihi: 17 Ekim 2026. Kapsam yalnız Avalanche Builder Hub ve Builder Hub'ın doğrudan bağladığı sağlayıcıların resmî belgeleridir.

## Avalanche hangi facilitatorları resmî entegrasyon olarak listeliyor?

### Takeaway
Avalanche Builder Hub dört başlıca x402 seçeneği listeliyor: Thirdweb x402, PayAI, Ultravioleta DAO ve x402-rs. Builder Hub'ın kendi uygulamalı Fuji eğitimi ise başlangıç kiti ve uçtan uca kurulum için Thirdweb facilitator'ı seçiyor.

### Cited Findings
- Builder Hub, Avalanche'ın birden fazla x402 facilitator desteklediğini ve dört başlıca seçeneğin Thirdweb, PayAI, Ultravioleta DAO ve x402-rs olduğunu söylüyor. — [Avalanche Builder Hub: x402 Facilitators on Avalanche](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators)
- Builder Hub karşılaştırmasında Thirdweb, PayAI ve Ultravioleta `Hosted`; x402-rs `Self-Hosted` olarak sınıflandırılıyor. — [Avalanche Builder Hub: x402 Facilitators on Avalanche](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators)
- Avalanche'ın uygulamalı x402 kursu, `ava-labs/x402-starter-kit` ile Thirdweb facilitator kullanıyor; Fuji kurulumu için Thirdweb proje anahtarı ve Fuji üzerinde ERC-4337 server wallet istiyor. — [Avalanche Builder Hub: Environment Setup](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/05-hands-on-implementation/01-environment-setup)
- PayAI entegrasyon sayfası, PayAI'ın Avalanche üzerinde ödeme yönlendiren facilitator ağı işlettiğini ve Fuji için `avalanche-fuji` ağ adını kullandığını belirtiyor. — [Avalanche Builder Hub: PayAI](https://build.avax.network/integrations/payai)
- Ultravioleta entegrasyon sayfası, hosted URL'yi `https://facilitator.ultravioletadao.xyz` olarak veriyor ve hem Avalanche C-Chain hem Fuji desteği belirtiyor. — [Avalanche Builder Hub: Ultravioleta DAO](https://build.avax.network/integrations/ultravioletadao)
- x402-rs sayfası Docker ile çalıştırılan facilitator binary'sini, kendi RPC URL'sini ve signer private key'ini gerektiren self-hosted çözüm olarak belgeliyor. — [Avalanche Builder Hub: x402-rs](https://build.avax.network/integrations/x402-rs)

### Inferences
- “Avalanche tarafından resmî olarak listelenen/entegre edilen seçenekler” demek doğru; “Avalanche'ın tek resmî facilitator'ı” demek doğru değil.
- Railway'e geçişte yerel facilitator'ı kaldırmak hedefleniyorsa hosted üç seçenekten biri seçilmeli; x402-rs aynı işletim sorumluluğunu Railway'e taşır ama ortadan kaldırmaz.

### Gaps
- Builder Hub entegrasyon kataloğunda listelenmek, sağlayıcının Avalanche tarafından işletildiği veya SLA ile garanti edildiği anlamına geldiğine dair bir ifade bulunmuyor.

## Hangileri hosted, Fuji 43113 ve EIP-3009 USDC destekliyor?

### Takeaway
En açık doğrulanmış eşleşmeler Thirdweb ve Ultravioleta'dır: ikisi de hosted olarak listelenir, Fuji 43113 destekler ve USDC için ERC/EIP-3009 yetkilendirmesini belgeler. PayAI hosted ve Fuji 43113 destekliyor; ancak incelenen PayAI “Supported Networks” sayfası token/scheme ayrıntısını ayrı ayrı doğrulamıyor. x402-rs Fuji ve USDC desteğine sahip olsa da self-hosted'dır.

### Cited Findings
- Thirdweb Builder Hub sayfası Fuji Chain ID 43113'ü ve `avalanche-fuji` ağ adını verir; token ERC-3009 `sign with authorization` destekliyorsa, özellikle USDC için, facilitator'ın ödeme işleyebildiğini söyler. — [Avalanche Builder Hub: Thirdweb x402](https://build.avax.network/integrations/thirdweb-x402)
- Thirdweb'in kendi belgeleri facilitator'ın doğrulama ve zincire gönderimi yönettiğini; ödeme tokenının ERC-2612 veya ERC-3009 desteklemesi gerektiğini ve “USDC on all chains” ifadesini kullanır. — [Thirdweb x402 Facilitator](https://portal.thirdweb.com/x402/facilitator)
- Avalanche uygulama eğitimi Thirdweb facilitator'ı Fuji üzerinde kurar, Fuji USDC adresini `0x5425890298aed601595a70AB815c96711a31Bc65` olarak verir ve facilitator gazı ödediği için payer'ın test AVAX'a ihtiyaç duymadığını belirtir. — [Avalanche Builder Hub: Environment Setup](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/05-hands-on-implementation/01-environment-setup)
- Ultravioleta'nın Builder Hub entegrasyonu Fuji desteğini, USDC settlement'ı ve ERC-3009 meta-transaction modelini açıkça belirtir. — [Avalanche Builder Hub: Ultravioleta DAO](https://build.avax.network/integrations/ultravioletadao)
- Ultravioleta'nın kendi facilitator sayfası hosted base URL'yi, EIP-3009 meta-transactions, “no key, no account” kullanımını ve testnet listesinde Avalanche Fuji'yi gösterir. — [Ultravioleta Facilitator](https://facilitator.ultravioletadao.xyz/)
- PayAI'ın resmî supported-networks tablosu Avalanche Fuji'yi hem v1 `avalanche-fuji` hem v2 `eip155:43113` olarak listeler. — [PayAI Supported Networks](https://docs.payai.network/x402/supported-networks)
- Builder Hub PayAI için hosted facilitator URL örneğini `https://facilitator.payai.network` olarak verir ve Fuji ile USDC/AVAX ödeme tokenlarını genel seviyede listeler. — [Avalanche Builder Hub: x402 Facilitators](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators)
- x402-rs, `RPC_URL_AVALANCHE_FUJI` verildiğinde Fuji'yi destekler ve AvalancheFuji USDC deployment'ını sunar; fakat facilitator binary'si ve signer key sizin altyapınızda çalışır. — [Avalanche Builder Hub: x402-rs](https://build.avax.network/integrations/x402-rs)

### Inferences
- Hazine Ajanı için en güçlü “Avalanche'ın kendi eğitim yolunu izliyoruz” seçimi Thirdweb'dir. Bu seçim Railway'de uygulama çalışırken Thirdweb secret key ve Fuji ERC-4337 server wallet adresini Railway secrets olarak gerektirir.
- Ultravioleta teknik olarak en az kurulumlu hosted seçenektir; ancak önceki `upstream_rpc_unavailable` benzeri sağlayıcı arızası yaşandıysa tek hata noktası riski devam eder.
- PayAI agent odaklıdır ve Fuji'yi açıkça listeler; uygulamaya almadan önce canlı `/supported` yanıtında tam token adresi ve `exact`/EIP-3009 scheme doğrulanmalıdır.
- Thirdweb'in genel sayfasındaki EIP-7702 anlatımı Avalanche C-Chain'e doğrudan uygulanmamalıdır. Avalanche'ın facilitator dersinde C-Chain'in EIP-7702 kabul etmediği ve ödemelerin ERC-3009 veya ERC-2612 imzaları kullandığı açıkça yazılıdır. — [Avalanche Builder Hub: x402 Facilitators](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators)

### Gaps
- Sağlayıcıların güncel `/supported` uç noktaları bu araştırmada canlı olarak sorgulanmadı; kod değişikliğinden önce seçilen facilitator'ın Fuji USDC adresi, scheme ve x402 protokol sürümü runtime preflight ile doğrulanmalıdır.
- PayAI'ın incelenen supported-networks tablosu Fuji ağını doğruluyor fakat Fuji USDC contract adresi ve EIP-3009 scheme'ini aynı tabloda göstermiyor.

## Avalanche tarafından işletilen tek bir resmi facilitator var mı?

### Takeaway
Hayır. Avalanche Builder Hub “multiple x402 facilitators” ifadesini kullanıyor ve kullanıcıya ihtiyacına göre facilitator seçmesini söylüyor. Thirdweb, Avalanche'ın uygulamalı kursundaki varsayılan/örnek yol; Avalanche tarafından işletilen tek facilitator olarak tanımlanmıyor.

### Cited Findings
- Builder Hub “Avalanche supports multiple x402 facilitators” der ve geliştiricinin kullanım alanına göre seçim yapmasını ister. — [Avalanche Builder Hub: x402 Facilitators on Avalanche](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators)
- Aynı sayfa dört sağlayıcıyı ayrı güçlü yönleriyle listeler ve birden fazla facilitator kullanmanın da mümkün olduğunu söyler. — [Avalanche Builder Hub: x402 Facilitators on Avalanche](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators)
- Avalanche kursunun uygulama bölümü Thirdweb facilitator ile bir starter kit öğretir; bu, öğretim için seçilmiş resmî yol olduğunu gösterir fakat hizmetin Thirdweb tarafından sağlandığını açıkça belirtir. — [Avalanche Builder Hub: Environment Setup](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/05-hands-on-implementation/01-environment-setup)

### Inferences
- Sunumda doğru ifade: “Avalanche Builder Hub'ın resmî kursunda kullandığı Thirdweb facilitator entegrasyonu.” Yanlış ifade: “Avalanche'ın işlettiği resmî facilitator.”
- Mevcut proje için önerilen karar: önce Thirdweb ile Railway entegrasyonu; deployment öncesinde `supported()` preflight ile `43113 + Fuji USDC + exact/EIP-3009` doğrulaması; başarısızsa ödeme başlatmadan fail-closed davranış.

### Gaps
- Avalanche Builder Hub, listedeki üçüncü taraf sağlayıcılar için uptime garantisi veya Avalanche'a ait operasyonel SLA yayımlamıyor.
