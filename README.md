# Hazine Ajanı

**Durum:** Repo sözleşmesi ve doğrulanmış TypeScript çalışma alanı hazır. Sıradaki kanonik roadmap adımı A3'tür.

Hazine Ajanı, canlı OKX Dual Investment teklifini canlı OKX opsiyon piyasasındaki uygulanabilir değer aralığı ve kullanıcının risk politikasıyla test eder. `ACCEPT / ASK / REJECT` kararı verir, kullanıcı ayrıca onaylarsa OKX işlemini yürütür ve aynı analiz raporunu başka agentlara Avalanche x402 üzerinden sunar.

## Şu anda nereden başlamalı?

1. [PROJECT.md](PROJECT.md) yönlendirmesini ve [kanonik proje belgesini](outputs/PROJECT.md) oku.
2. [ROADMAP.md](ROADMAP.md) yönlendirmesini ve [kanonik roadmap'i](outputs/ROADMAP.md) oku.
3. [AGENTS.md](AGENTS.md) çalışma/devir kurallarını uygula.
4. Kanonik roadmap'in ilk tamamlanmamış adımından devam et.

## Değişmez ilkeler

- Demo ve runtime mock piyasa verisi kullanmaz.
- OKX write işlemleri ayrı kullanıcı onayı ister.
- Withdrawal yetkisi kullanılmaz.
- Fuji ve test USDC açıkça testnet olarak gösterilir.
- Finansal model tek bir “gerçek adil APR” iddia etmez; kaynak, zaman ve model sınırlarını gösterir.

## Belgeler

- [Ürün kaynağı](outputs/PROJECT.md)
- [Uygulama roadmap'i](outputs/ROADMAP.md)
- [Fikir incelemesi](outputs/Hazine%20ajanı%20fikir%20incelemesi.md)
- [Etkinlik kapsamı](HACKATHON.md)
- [OKX/Avalanche ekosistem araştırması](ECOSYSTEM-OKX-2026-10-15.md)
- [Fikir eleme kaydı](IDEAS.md)
- [Vibe-coding rehberi araştırma notu](docs/evidence/vibe-coding-guide.md)

## Kurulum

Node.js `22.20.0` ve pnpm `11.25.0` kullanılır. Sürümler `.node-version`, `.nvmrc`, `package.json` ve kilit dosyasında sabittir.

```powershell
corepack enable
pnpm bootstrap
```

`pnpm bootstrap`; kilitli bağımlılık kurulumunu, lint, TypeScript, test ve üretim derlemesini tek komutta çalıştırır. Sonraki kontrollerde kurulum yapmadan yalnız `pnpm check` kullanılabilir. Ortam değişkenlerinin açıklamalı fakat boş listesi `.env.example` dosyasındadır. Gerçek anahtarlar bu dosyaya veya Git'e yazılmaz.

Mimari seçimler ve tarihli bağımlılık riskleri [ADR 0001](docs/architecture/0001-toolchain.md) içinde kayıtlıdır.
