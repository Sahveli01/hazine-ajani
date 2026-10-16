# A5 — Avalanche Fuji x402 settlement kanıtı

- Tarih: 2026-10-16
- Ağ: Avalanche Fuji Testnet (`eip155:43113`, chain id `43113`)
- Akış: x402 v2 `exact`; yerel facilitator resmî `@x402/core` ve `@x402/evm` paketleriyle çalıştı
- Payer: `0x65e257B601b9545a6575801B967C527B35E2720d`
- Pay-to: `0x9a2b5BdFd3CA23456957882695Bbf81510430853`
- Token: Fuji test USDC `0x5425890298aed601595a70AB815c96711a31Bc65`
- EIP-712 domain: `USD Coin`, version `2` (zincirden ödeme öncesi doğrulandı)
- Tutar: `0.01` test USDC (`10000` atomic unit)
- Ücretli response: `PAID_RESPONSE_RECEIVED`
- Canlı OKX analiz kimliği: `ana_192fe2eb04034adaae2c1d49b432f0df`
- Analiz kararı: `REJECT — PREMIUM_BELOW_MARKET_BAND`
- Transaction: [`0x5887defa349207d091eaa155fb124ec5c0dacd3438b64322401c9e2447439d19`](https://testnet.snowtrace.io/tx/0x5887defa349207d091eaa155fb124ec5c0dacd3438b64322401c9e2447439d19)
- Receipt: `success`
- Blok: `59557495`
- Blok zamanı: `2026-10-16T13:31:13.000Z`
- Gas used: `100340`
- Zincir sonrası payer bakiyesi: `0.99` test USDC
- Zincir sonrası alıcı bakiyesi: `0.01` test USDC

## Kanıtın anlamı

Bağımsız agent client önce gerçek HTTP 402 challenge aldı, EIP-3009 authorization imzaladı, facilitator authorization'ı doğrulayıp Fuji üzerinde settlement yaptı ve aynı çağrıda canlı OKX DCD/option verilerinden üretilmiş analiz JSON'unu aldı. Receipt ve bakiye değişimi ayrı bir Fuji RPC sorgusuyla doğrulandı. Bu dosyada secret, private key veya auth header bulunmaz.

## Public facilitator sapması

Public Ultravioleta facilitator iki ayrı settlement denemesinde `upstream_rpc_unavailable` döndürdü ve verdiği hash'ler zincirde bulunmadı. Resmî x402.org facilitator Fuji sunmadığı için kullanıcı onayıyla aynı protokolün resmî SDK'larını kullanan yerel facilitator'a geçildi. Son settlement mock değildir; Fuji üzerinde confirmed transaction ve gerçek bakiye değişimi vardır.
