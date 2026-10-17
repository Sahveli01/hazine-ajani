# Hazine Ajanı için hosted x402 facilitator karşılaştırması

## Auth/API key/onboarding gereksinimleri

### Takeaway
PayAI, sıradan `exact` ödemelerde hesap ve API anahtarı olmadan başlanabilen tek açıkça belgelenmiş seçenek; Thirdweb hesap, proje secret key'i ve server wallet ister. Ultravioleta'nın canlı uçları anahtarsız yanıt veriyor, ancak kullanım kotası ve fiyat sözleşmesi açıkça belgelenmemiş.

### Cited Findings
- PayAI `@payai/facilitator` yapılandırmasını doğrudan `@x402/core/server` içindeki `HTTPFacilitatorClient` ile kullanıyor; ordinary exact payments ücretsiz katmanda API anahtarı olmadan çalışıyor. Ücretsiz sınırın ötesinde anahtar için `PAYAI_API_KEY_ID` ve `PAYAI_API_KEY_SECRET` kullanılabiliyor. — [PayAI Facilitator Introduction](https://docs.payai.network/x402/facilitators/introduction)
- PayAI kimlik doğrulaması ordinary exact payments için isteğe bağlı; anahtar gönderilirse kısa ömürlü Ed25519/EdDSA JWT ile doğrulanıyor. — [PayAI Authentication](https://docs.payai.network/x402/facilitators/authentication)
- Thirdweb facilitator kurulumu bir Thirdweb client secret key ve dashboard'da oluşturulan server wallet adresi istiyor. — [Thirdweb Facilitator](https://portal.thirdweb.com/x402/facilitator)
- Avalanche'ın uygulamalı Thirdweb rehberi hesap/proje, client ID, secret key ve ERC-4337 Smart Account oluşturulmasını istiyor. — [Avalanche Environment Setup](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/05-hands-on-implementation/01-environment-setup)
- Ultravioleta'nın canlı `GET /health` ve `GET /supported` uçları 17 Ekim 2026 tarihinde kimlik doğrulamasız HTTP 200 verdi. — [Ultravioleta health](https://facilitator.ultravioletadao.xyz/health); [Ultravioleta supported](https://facilitator.ultravioletadao.xyz/supported)

### Inferences
- Railway'e en az secret ve en az onboarding ile geçiş için PayAI en düşük operasyon yüküne sahip.
- Thirdweb, dashboard görünürlüğü sağlar fakat hackathon demosu için fazladan hesap, secret ve server-wallet yaşam döngüsü ekler.

### Gaps
- Ultravioleta için resmî bir kota, SLA veya facilitator kullanım fiyatı sayfası bulunamadı.
- Thirdweb pricing sayfası genel platform planlarını listeliyor; x402 Fuji settlement için açık bir birim fiyat bulunamadı.

## Fuji desteği ve canlı kanıt

### Takeaway
PayAI canlı `/supported` yanıtında x402 v2 `exact` + `eip155:43113` ve EIP-3009 için sıfır testnet fiyatını açıkça yayınlıyor. Ultravioleta da Fuji USDC'yi canlı yayınlıyor; Thirdweb desteği resmî Avalanche rehberinde gösteriliyor fakat bağımsız, anahtarsız bir canlı `/supported` kanıtı yok.

### Cited Findings
- PayAI'nin destek tablosunda Avalanche Fuji hem v1 `avalanche-fuji` hem v2 `eip155:43113` olarak yer alıyor. — [PayAI Supported Networks](https://docs.payai.network/x402/supported-networks)
- PayAI canlı `/supported` yanıtı 17 Ekim 2026 tarihinde x402 v2, `exact`, `eip155:43113` kind'ını ve `transferMethod: eip3009`, `credits: 0.00` fiyat kaydını döndürdü. — [PayAI live supported](https://facilitator.payai.network/supported)
- Ultravioleta canlı `/supported` yanıtı Fuji için hem v1 `avalanche-fuji` hem v2 `eip155:43113` exact desteğini ve Fuji USDC `0x5425890298aed601595a70AB815c96711a31Bc65` adresini döndürdü. — [Ultravioleta live supported](https://facilitator.ultravioletadao.xyz/supported)
- Avalanche resmî rehberi Thirdweb için Fuji ağ adını `avalanche-fuji`, chain ID'yi 43113 olarak veriyor ve uygulama örneğinde `avalancheFuji` ile Fuji USDC kullanıyor. — [Avalanche facilitator comparison](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators); [Avalanche implementation](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/05-hands-on-implementation/03-understanding-implementation)

### Inferences
- Hazine Ajanı'nın mevcut `@x402/*` v2, CAIP-2 `eip155:43113` ve EIP-3009 tasarımı PayAI'nin canlı ilan ettiği sözleşmeyle birebir örtüşüyor.
- Ultravioleta teknik olarak uyumlu olsa da projede daha önce yaşanan `upstream_rpc_unavailable` hatası, canlı sağlayıcı riski açısından PayAI'yi daha güçlü aday yapıyor; bu geçmiş hata dış kaynak iddiası değil, proje çalıştırma kanıtıdır.

### Gaps
- Thirdweb için kimlik doğrulamasız bir `/supported` URL'si belgelenmedi; gerçek Fuji desteğini denemek için Thirdweb projesi ve credentials gerekir.

## SDK/protokol uyumluluğu

### Takeaway
PayAI mevcut mimariye en küçük değişiklikle uyar: resmî `@x402/core` `HTTPFacilitatorClient` kullanır ve canlı uç v2'yi ilan eder. Ultravioleta v2 ilan etse de Avalanche rehberindeki örnekleri eski `x402-hono`/`x402-client` isimlerini kullanıyor; Thirdweb ise kendi SDK adaptörünü ekler.

### Cited Findings
- PayAI'nin önerilen TypeScript bağlantısı `@payai/facilitator` + `HTTPFacilitatorClient` from `@x402/core/server` biçimindedir. — [PayAI Facilitator Introduction](https://docs.payai.network/x402/facilitators/introduction)
- PayAI auth örneğinin istek gövdesi açıkça `x402Version: 2` kullanır. — [PayAI Authentication](https://docs.payai.network/x402/facilitators/authentication)
- Thirdweb kendi `thirdweb/x402` facilitator adaptörünü sunar ve `x402-hono`, `x402-next`, `x402-express` ile uyumluluk bildirir. — [Thirdweb Facilitator](https://portal.thirdweb.com/x402/facilitator)
- Ultravioleta'nın canlı `/supported` sözleşmesi v2 Fuji exact desteğini ilan eder; Avalanche rehberi `/verify` ve `/settle` uçlarının EIP-3009 çalıştırdığını belirtir. — [Ultravioleta supported](https://facilitator.ultravioletadao.xyz/supported); [Avalanche facilitator comparison](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators)

### Inferences
- Hazine Ajanı'nın sabitlenmiş `@x402/core`, `@x402/evm`, `@x402/fetch`, `@x402/hono` 2.28.0 yapısı için PayAI drop-in HTTP facilitator yaklaşımı en az kod ve bağımlılık riskidir.
- Thirdweb seçimi protokolü bozmaz, ancak `thirdweb` SDK'sını, secrets ve server wallet yönetimini mevcut koda ekleyerek değişiklik yüzeyini büyütür.

### Gaps
- Ultravioleta'nın v2 için resmî migration rehberi veya `@x402/core` 2.28.0 ile sürüm matrisi bulunamadı.

## Fiyat, ücretsiz test ve operasyon riski

### Takeaway
Fuji için PayAI açık biçimde ücretsiz ve API keysizdir; limitleri ve hata davranışını da belgeler. Bu nedenle hackathon güvenilirliği ve ücretsiz kullanım şartları altında önerilen hosted facilitator **PayAI**'dir. Ultravioleta ikinci seçenek, Thirdweb ise dashboard/enterprise özellikleri gerektiğinde düşünülmelidir.

### Cited Findings
- PayAI testnet settlement'larının ücretsiz olduğunu, allowance tüketmediğini ve ordinary exact payments için API key gerekmediğini belirtir. — [PayAI Pricing](https://docs.payai.network/x402/facilitators/pricing)
- PayAI ücretsiz katmanında receiving wallet başına ömür boyu 1.000 kredi vardır; shared cloud host/IP havuzları bu sınırı daha erken tüketebilir. Testnetler daima 0 ücretlidir. — [PayAI Pricing](https://docs.payai.network/x402/facilitators/pricing)
- PayAI `/settle` için 100 r/s ve 250 eşzamanlı bağlantı, `/verify` ve `/supported` için 200 r/s ve 100 eşzamanlı bağlantı sınırlarını; 429/503 ve timeout recovery davranışını belgeler. — [PayAI Capacity & Limits](https://docs.payai.network/x402/facilitators/capacity-and-limits)
- Avalanche rehberi Ultravioleta'nın kullanıcı gazını tamamen karşıladığını, fakat facilitator ücreti için sağlayıcı dokümantasyonuna bakılması gerektiğini söyler. — [Avalanche facilitator comparison](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators)
- Avalanche rehberi Thirdweb fiyatı için yalnızca genel Thirdweb pricing sayfasına yönlendirir. — [Avalanche facilitator comparison](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators)

### Inferences
- Karar: Railway deployment için birincil facilitator `https://facilitator.payai.network`; protokol v2, ağ `eip155:43113`, scheme `exact`, Fuji USDC ve EIP-3009. Başlangıçta API key yok; `/supported` readiness kontrolü deployment öncesi ve demo öncesi çalıştırılmalı.
- Failover'ı ilk deploy içinde otomatikleştirmek settlement idempotency/replay riskini artırabilir. Ultravioleta yalnız belgelenmiş manuel fallback olarak tutulmalı; aynı payment authorization iki facilitator'a paralel gönderilmemeli.
- Railway shared IP ücretsiz mainnet allowance'ını etkileyebilir, fakat Fuji settlement'ları ücretsiz ve allowance dışı olduğundan hackathon testnet demosunu etkilememelidir.

### Gaps
- Hosted sağlayıcıların hiçbiri resmî SLA yayımlamıyor; demo öncesi canlı `/supported` ve küçük gerçek Fuji settlement smoke testi yine gereklidir.
- PayAI'nin testnet ücretsiz politikasının gelecekte değişmeyeceğine dair süre garantisi yok; deployment anında `/supported.pricing` yeniden doğrulanmalıdır.
