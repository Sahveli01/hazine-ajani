# Hazine Ajanı — Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Birincil kullanıcı, OKX TR üzerinde USDT tutan ve BTC'yi belirli bir fiyattan almaya razı olan fakat Dual Investment teklifindeki dönüşüm riskinin aldığı prime değip değmediğini hızlıca anlamak isteyen kişidir.

İkincil kullanıcı, aynı canlı ve kaynaklı risk analizini makinece okunabilir biçimde satın alan başka bir agent veya uygulamadır.

## Product Purpose

Hazine Ajanı, canlı OKX TR Buy Low Dual Investment teklifini aynı dayanak, strike ve vadeye yakın işlem yapılabilir OKX option piyasasıyla ve kullanıcının risk politikasıyla karşılaştırır. Deterministik motor `ACCEPT`, `ASK` veya `REJECT` kararı üretir; kullanıcı onayı olmadan para hareketi başlatmaz.

Başarı, jürinin tek ekranda gerçek teklifi, option proxy'yi, karar nedenini ve veri zamanını anlayabilmesi; ardından ayrı agent kanalının Fuji üzerinde gerçek x402 test ödemesiyle aynı rapor sözleşmesini alabilmesidir.

## Positioning

Ürün yüksek APR'li teklifi satan bir bot değildir. Alınan primin gözlenen option piyasası, fırsat maliyeti ve kullanıcının sınırları karşısında yeterli olup olmadığını işlemden önce kontrol eden risk kapısıdır. Option karşılaştırması uygulanabilir bir banttır; “gerçek fair value” veya gerçek dünya olasılığı iddiası değildir.

## Operating Context

- Fiziksel hackathon demosu; 1280×720 projeksiyon ana koşul, 1024px güvenli alt genişliktir.
- Demo sırası: canlı DCD teklifini denetle → proxy ve politikayı göster → deterministik kararı açıkla → gerekiyorsa ayrı işlem onayı → ikinci agent'ın Fuji x402 ödemesini ve rapor makbuzunu göster.
- OKX özel erişimi TR bölgesinde ve server-side kullanılır. İlk anahtar read-only'dir.
- Avalanche rolü agent-to-agent ödeme ve receipt katmanıdır. Fuji ve test USDC her yerde testnet olarak etiketlenir.
- Mekân ağı güvenilmez kabul edilir; yükleme, eski veri ve yeniden deneme durumları ürün akışının parçasıdır.

## Capabilities and Constraints

- MVP yalnız BTC/USDT Buy Low ürün ailesini kapsar.
- Runtime gerçek veri kullanır; production kodu mock veya fixture import edemez.
- DCD ile option aynı ürün değildir. Strike/vade eşleşmesi, settlement penceresi ve para birimi farkları görünür kalır.
- Finansal hesaplar, eşleştirme, limitler ve karar kodları deterministik kodda kalır. LLM yalnız doğrulanmış politikayı yapılandırır ve sonucu açıklar.
- Her OKX write işlemi o işlem için ayrı, açık kullanıcı onayı ister. Withdrawal izni yasaktır.
- Analiz verisi eski, boş, crossed veya yetersizse sayı uydurulmaz; analiz reddedilir.
- x402 success yalnız gerçek Fuji settlement sonucu ve RPC/explorer doğrulamasından sonra görünür.
- Kullanıcı reddi hata değildir.

## Brand Commitments

- Ürün adı: **Hazine Ajanı**.
- Açıklayıcı ad: **OKX Dual Investment Risk Gate**.
- Dil sade, ciddi ve kanıta dayalıdır. “Garantili”, “risksiz”, “gerçek olasılık”, “OKX yanlış fiyatlıyor” ve “on-chain hesaplıyor” ifadeleri kullanılmaz.
- Apple-adjacent talep, görsel süs değil; içerik önceliği, sessiz chrome, hassas tipografi, tutarlı ritim ve neden-sonuç hareketi anlamına gelir.
- OKX veya Avalanche logosu ürünün kendi logosu gibi kullanılmaz. Sponsor markaları yalnız kaynak/ağ bağlamında doğru adlarıyla gösterilir.

## Evidence on Hand

- Canlı OKX TR DCD erişimi: `docs/evidence/okx-tr-dcd-live-2026-10-15.md`.
- Canlı exact strike/vade option proxy, order book, index ve Greeks: `docs/evidence/okx-option-proxy-live-2026-10-15.md`.
- Fuji x402 402 challenge ve istemci sınırı çalışıyor; gerçek settlement payer bakiyesi beklediği için A5 bloklu.
- Henüz kullanıcı referansı, üretim kullanım metriği veya on-chain confirmed payment receipt yoktur; bunlar uydurulamaz.

## Product Principles

1. Karardan önce kanıt: Her sayı kaynağını ve zamanını taşır.
2. Belirsizliği görünür kıl: Tek nokta “adil değer” yerine bant, eşleşme kalitesi ve veri güveni göster.
3. Fail closed: Veri veya onay eksikse işlem yapma.
4. Bir ekranda bir karar: Jürinin gördüğü en baskın öğe sonuç ve onu açıklayan iki kanıttır.
5. Agent yeteneği doğrulanabilir olsun: Ücret, ağ, receipt ve rapor kimliği makine tarafından kontrol edilebilir.

## Accessibility & Inclusion

Demo yolu WCAG AA kontrastını, minimum 44×44 px etkileşim alanını, görünür klavye focus'unu, semantik durum metinlerini ve `prefers-reduced-motion` desteğini korur. Kritik projeksiyon metni 18px altına inmez; renk hiçbir zaman tek bilgi taşıyıcısı değildir.
