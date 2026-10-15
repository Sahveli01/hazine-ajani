# Hazine Ajanı — bütün agentlar için çalışma sözleşmesi

Bu kurallar Claude, Codex, Cursor, Copilot ve başka bütün agentlar için geçerlidir.

## Başlamadan önce

1. `PROJECT.md`, `outputs/PROJECT.md`, `ROADMAP.md`, `outputs/ROADMAP.md` ve bu dosyanın tamamını oku.
2. `git status`, son commitler ve kanonik roadmap'in ilerleme günlüğünü incele.
3. Önce varsa `IN_PROGRESS`, yoksa bağımlılıkları tamamlanmış ilk `TODO` adımını seç.
4. Adımı kanonik roadmap'de `IN_PROGRESS` yapmadan ürün kodu yazma.
5. İlgili resmî dokümanı yeniden aç; komut veya API adını hafızadan tahmin etme. OKX CLI kullanırken ilgili `okx ... --help` çıktısıyla parametreleri doğrula.

## Değişmez kurallar

- Runtime ve demo gerçek veri kullanır. Mock/fixture yalnız otomatik testlerde bulunabilir ve production tarafından import edilemez.
- Secret, API key, passphrase, wallet private key, auth header veya kişisel hesap bilgisi koda, `.env.example` dosyasına, loga, sohbete ya da Git geçmişine girmez.
- İlk OKX anahtarı read-only olur. Write için ayrı minimum izinli anahtar kullanılır. Withdrawal izni hiçbir zaman açılmaz.
- Para hareketi oluşturan her OKX işlemi o işlem için ayrı ve açık kullanıcı onayı ister.
- Testnet her yerde testnet olarak etiketlenir; Fuji test USDC gerçek para gibi gösterilmez.
- LLM finansal hesap veya güvenlik kararı vermez. Hesaplar, eşleştirme, limitler ve `ACCEPT / ASK / REJECT` deterministik kodda kalır.
- Çalışmayan özelliği mockla veya dead button ile saklama; özelliği kes ve sapmayı kaydet.
- Önceki agentın çalışan kodunu gerekçesiz yeniden yazma veya testlerini silme.
- Bir adımın acceptance kriterini tamamlanmış göstermek için düşürme.

## Çalışma biçimi

- Bir seferde tek roadmap adımı üzerinde çalış.
- Ürün kodunda yeni davranış için önce başarısız testi yaz, doğru nedenle başarısız olduğunu gör, sonra minimum uygulamayı yap.
- Her adım sonunda roadmap'deki doğrulamayı çalıştır ve çıktıyı oku.
- Adımın `Durum`, `Sahip`, `Commit` ve `Kanıt` alanlarını; ayrıca ilerleme günlüğünü güncelle.
- Her adımı kendi anlamlı commit sınırında bırak. İlgisiz değişiklikleri aynı commite koyma.
- Komut üç farklı denemede aynı varsayım yüzünden çalışmıyorsa rastgele değişiklik yapma; roadmap'deki sapma protokolünü uygula.

## Plan değişikliği

Planın ürün kapsamını, demo omurgasını, güvenlik politikasını veya veri ilkesini değiştirmek gerekiyorsa kullanıcıya sor. Execution bug'ı plan değişikliği değildir; en küçük doğrulanmış düzeltmeyi yap. Resmî kaynak ile plan çelişirse kanıtı kaydet ve kapsam değişikliğinden önce kullanıcıya bildir.

## Bitirme raporu

Her tamamlanan adımda kullanıcıya kolay dille şunları söyle:

1. Birkaç cümlede ne yapıldı.
2. Nasıl doğrulandı.
3. Sıradaki roadmap adımı nedir.
4. Kullanıcıdan gereken bir bilgi veya işlem varsa yalnız o anda sor.
