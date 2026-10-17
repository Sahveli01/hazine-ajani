# Avalanche x402 hosted facilitator geçişi

## Mevcut `@x402/hono` sunucusu hosted facilitator'a doğrudan bağlanabilir mi?

### Takeaway
Evet: mevcut `HTTPFacilitatorClient({ url })` standart `/supported`, `/verify` ve `/settle` yüzeyine sahip bir hosted facilitator'a doğrudan bağlanabilir. Projenin varsayılan URL'si zaten Avalanche Builder Hub'da listelenen Ultravioleta DAO facilitator'dır; bu seçenek için kod değişikliği veya provider secret gerekmez. Thirdweb ise yalnızca URL değiştirerek kullanılan bir HTTP endpoint olarak belgelenmemiştir; `thirdweb/x402` içinden oluşturulan bir facilitator nesnesi ve Thirdweb kimlik bilgileri ister.

### Cited Findings
- x402 v2'nin resmî TypeScript örnekleri `new HTTPFacilitatorClient({ url })`, `x402ResourceServer` ve `ExactEvmScheme` bileşimini kullanıyor; resource server, facilitator'ın desteklediği ağ/şema çiftlerini `initialize()` sırasında alıyor. — [x402 Foundation TypeScript source](https://github.com/x402-foundation/x402/blob/main/typescript/packages/core/src/server/x402ResourceServer.ts); [x402 example](https://github.com/x402-foundation/x402/blob/main/typescript/packages/extensions/src/bazaar/README.md)
- x402 protokolünde resource server imzayı facilitator'ın `/verify` endpoint'ine, settlement'ı da `/settle` endpoint'ine yollar. — [x402 Foundation](https://github.com/x402-foundation/x402)
- Avalanche Builder Hub, Ultravioleta için doğrudan `url: 'https://facilitator.ultravioletadao.xyz'` Hono entegrasyonunu; `/supported`, `/verify` ve `/settle` endpoint'lerini gösteriyor. — [Avalanche Builder Hub facilitator guide](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators)
- Ultravioleta'nın kendi sayfası base URL'yi `https://facilitator.ultravioletadao.xyz`, modeli de "0% fee, no key, no account" olarak yayınlıyor ve Avalanche Fuji'yi testnet listesinde gösteriyor. — [Ultravioleta facilitator](https://facilitator.ultravioletadao.xyz/)
- Thirdweb'in resmî akışı `facilitator({ client, serverWalletAddress })` nesnesini middleware'e geçiriyor; `client` bir Thirdweb secret key ile oluşturuluyor. — [Thirdweb facilitator docs](https://portal.thirdweb.com/x402/facilitator)

### Inferences
- En az değişiklikle hosted geçiş Ultravioleta'dır: Railway'de `X402_FACILITATOR_URL=https://facilitator.ultravioletadao.xyz` yeterlidir; mevcut `apps/api/src/index.ts` zaten bunu destekler.
- Thirdweb seçilirse mevcut `facilitatorUrl` konfigürasyonu yeterli değildir. `thirdweb` paketi eklenmeli; `createThirdwebClient` ve `facilitator()` ile oluşturulan nesne `x402ResourceServer` tarafına uygun adapter olarak verilmelidir ya da route Thirdweb'in `settlePayment()` akışına taşınmalıdır. Bu daha büyük bir uygulama değişikliğidir.
- "Avalanche'ın tek resmî facilitator'ı" yoktur. Avalanche resmî sitesi birden fazla entegrasyonu listeler; Ultravioleta ve Thirdweb bunlar arasındadır.

### Gaps
- Ultravioleta'nın `/supported` cevabı bu araştırma ortamından DNS kısıtı nedeniyle canlı okunamadı. Railway geçişinden önce endpoint'in `x402Version: 2`, `scheme: exact`, `network: eip155:43113` üçlüsünü gerçekten ilan ettiği zorunlu preflight ile doğrulanmalıdır.

## Fuji ağı, USDC kontratı/domain'i ve endpoint'ler

### Takeaway
Kanonik x402 v2 ağ tanımlayıcısı `eip155:43113`, token `0x5425890298aed601595a70AB815c96711a31Bc65` ve tutar 6 ondalıklı USDC taban birimidir; `0.01` için `10000` kullanılır. Hosted facilitator'ın base URL'sinin standart `/supported`, `/verify`, `/settle` endpoint'lerini sunması gerekir.

### Cited Findings
- Avalanche Builder Hub Fuji için chain ID `43113` ve network string `avalanche-fuji` verir; x402 v2'nin zincirden bağımsız kanonik tanımlaması CAIP-2 `eip155:43113` biçimidir. — [Avalanche facilitator guide](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators); [x402 Foundation](https://github.com/x402-foundation/x402)
- Circle'ın resmî kontrat tablosu Avalanche Fuji test USDC adresini `0x5425890298aed601595a70AB815c96711a31Bc65` olarak listeler ve testnet tokenlarının finansal değeri olmadığını belirtir. — [Circle USDC contract addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)
- Avalanche, C-Chain'de x402 USDC ödemelerinin ERC-3009 imzaları kullanabildiğini ve Thirdweb'in ERC-3009/2612 tokenları desteklediğini belirtir. — [Avalanche Builder Hub](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators); [Thirdweb docs](https://portal.thirdweb.com/x402/facilitator)
- Standart facilitator yüzeyi `/supported`, `/verify`, `/settle` endpoint'lerinden oluşur. — [Avalanche Builder Hub](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators); [x402 Foundation](https://github.com/x402-foundation/x402)

### Inferences
- Mevcut proje sabitleri (`eip155:43113`, Circle Fuji USDC adresi, `USD Coin`, version `2`, amount `10000`) korunmalıdır. Provider'ın `avalanche-fuji` gibi legacy network string'i kullanması, v2 `@x402/*` middleware içinde CAIP-2 tanımlayıcısını değiştirme gerekçesi değildir.
- `/supported` cevabı varlık/token adresini ilan etmese bile bir imzasız 402 challenge ve `verify` preflight ile exact/Fuji/token uyumluluğu ayrıca kanıtlanmalıdır.

### Gaps
- Thirdweb dokümanı Fuji için chain ID ve genel token standardını doğruluyor ancak Fuji USDC'ye özel canlı `supported()` çıktısını yayınlamıyor. Thirdweb seçilirse `supported({ chainId: 43113, tokenAddress })` deploy öncesi çalıştırılmalıdır.

## Gerekli secret'lar ve sahiplik

### Takeaway
Ultravioleta hosted seçeneğinde API/facilitator secret veya gas-wallet private key gerekmez; Railway API servisi yalnızca alıcı public adresini ve facilitator URL'sini tutar. Ödeyen agent'ın private key'i agent tarafında kalır ve Railway/API'ye verilmez. Thirdweb seçeneği Railway'de `THIRDWEB_SECRET_KEY` ve bir Thirdweb server-wallet public adresi gerektirir.

### Cited Findings
- Ultravioleta servisi "no key, no account" olarak sunulur ve facilitator ağ gas'ını üstlenir. — [Ultravioleta facilitator](https://facilitator.ultravioletadao.xyz/)
- Thirdweb facilitator `createThirdwebClient({ secretKey })` ve `serverWalletAddress` ister; işlemler Thirdweb proje dashboard'unda izlenebilir. — [Thirdweb facilitator docs](https://portal.thirdweb.com/x402/facilitator)
- x402 akışında client payment payload'ı imzalar; facilitator doğrular ve zincire yollar. — [x402 Foundation](https://github.com/x402-foundation/x402)

### Inferences
- Ultravioleta/Railway değişkenleri: `X402_FACILITATOR_URL` (secret değil), `X402_PAY_TO_ADDRESS` (public), API'nin mevcut OKX read-only kimlik bilgileri (secret). `X402_CLIENT_PRIVATE_KEY` ve facilitator private key Railway'e konmamalıdır.
- Thirdweb/Railway değişkenleri: `THIRDWEB_SECRET_KEY` (Railway API servisi secret), `THIRDWEB_SERVER_WALLET_ADDRESS` (public), `X402_PAY_TO_ADDRESS` (public). Thirdweb hesabı/server wallet Thirdweb tarafında yönetilir; ham server-wallet private key koda veya Railway'e eklenmemelidir.
- Browser cüzdanı payment authorization'ı kendi içinde imzalamalıdır; resource server kullanıcı private key'ini hiçbir zaman almamalıdır.

### Gaps
- Thirdweb'in proje planı/fiyat kotası ve server-wallet oluşturma UI'sı zamanla değişebilir; uygulamadan önce Thirdweb dashboard'da mevcut plan ve Fuji desteği kontrol edilmelidir.

## Railway'den önce zorunlu preflight testleri

### Takeaway
Railway'e geçmeden hosted facilitator, x402 v2 exact/Fuji desteği, token domain'i ve gerçek zincir settlement'ı ayrı kapılardan geçmelidir. En kritik kapı bir gerçek `0.01` Fuji test USDC settlement'ının hem HTTP 200 + `PAYMENT-RESPONSE` hem de zincir receipt/Transfer loguyla doğrulanmasıdır.

### Cited Findings
- x402 kaynak sunucusu başlatılırken facilitator'ın `/supported` cevabındaki version/network/scheme yeteneklerini eşleştirir. — [x402 resource server source](https://github.com/x402-foundation/x402/blob/main/typescript/packages/core/src/server/x402ResourceServer.ts)
- Başarılı akış facilitator zincir onayını bekledikten sonra resource server'ın HTTP 200 ve `PAYMENT-RESPONSE` dönmesiyle biter. — [x402 Foundation flow](https://github.com/x402-foundation/x402)
- Thirdweb settlement bekleme davranışını `simulated`, `submitted` veya varsayılan `confirmed` olarak sunar. — [Thirdweb facilitator docs](https://portal.thirdweb.com/x402/facilitator)

### Inferences
- Kapı 1 — `GET <facilitator>/health` başarılı; `GET <facilitator>/supported` içinde tam olarak x402 v2 + `exact` + `eip155:43113` var. Yoksa deployment durur.
- Kapı 2 — API secretsiz başlar, `GET /health` 200 ve `/ready` 200; paid route imzasız çağrıda 402 ve geçerli `PAYMENT-REQUIRED` header döner. Header'da scheme, network, asset, amount ve payTo beklenen sabitlerle birebir eşir.
- Kapı 3 — Fuji RPC'den USDC `name`, `version`, `decimals` okunur: domain mevcut deterministik preflight ile `USD Coin` / `2`; decimals 6 olmalıdır. Uyumsuzlukta imza/transfer denenmez.
- Kapı 4 — Yanlış ağ, yanlış asset, aşırı tutar, yanlış recipient ve süresi geçmiş authorization reddedilir; hiçbirinde paid sonuç üretilmez.
- Kapı 5 — Ayrı ve açık kullanıcı onayıyla tek bir `10000` base-unit test USDC payment yapılır. Sonuç: HTTP 200, parse edilebilir `PAYMENT-RESPONSE`, `success=true`, `network=eip155:43113`, non-empty transaction hash.
- Kapı 6 — Fuji RPC/explorer'da receipt `status=success`; token kontratındaki `Transfer` logu payer → beklenen payTo ve amount `10000`; rapordaki transaction hash ile aynıdır.
- Kapı 7 — Aynı authorization yeniden gönderildiğinde çift transfer oluşmaz; facilitator hata/timeout durumunda UI paid göstermez. Provider upstream RPC hatası kontrollü 402/503 olarak kalır.
- Kapı 8 — Bu kapılar geçmeden Railway konfigürasyonu yapılmaz. Railway sonrası aynı testler public HTTPS URL üzerinden tekrarlanır ve kanıt hash'i kaydedilir.

### Gaps
- Hosted provider'ın idempotency ve rate-limit davranışı yayınlanan sayfalarda yeterince ayrıntılı değil; negatif/replay testi ile ölçülmeli ve demo runbook'una provider outage fallback'i eklenmelidir.
