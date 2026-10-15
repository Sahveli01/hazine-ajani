# Agentic Ankara vibe-coding rehberi — kullanılacak bulgular

Kaynak: [Vibe Coding Rehberi](https://agentic-ankara.vercel.app/vibe-coding)

Okuma tarihi: 15 Ekim 2026

Statü: PRU Blockchain Community rehberi; OKX TR, Team1 Türkiye veya Avalanche'ın resmî dokümanı değildir. Sayfa komutların 5 Ekim 2026 tarihli resmî ATK deposundan alındığını, sürümlerin değişebileceğini söylüyor. Her komut kullanılmadan önce resmî doküman ve `--help` ile yeniden doğrulanacaktır.

## Projede kesin kullanılacak bilgiler

### Kurulum ve doğrulama

- ATK için Node.js 18+ ön koşulu var; A2'de gerçek runtime sürümü seçilip sabitlenecek.
- Resmî paketlerin rehberdeki kurulum komutu: `npm install -g @okx_ai/okx-trade-mcp @okx_ai/okx-trade-cli`. A2'de npm registry ve resmî changelog yeniden kontrol edilmeden çalıştırılmayacak.
- TR profili `okx config init` ile oluşturuluyor ve `~/.okx/config.toml` içinde `site = "tr"` olması gerekiyor.
- İlk gerçek smoke kontrolleri `okx market ticker BTC-USDT` ve read-only account balance ile yapılabilir.
- Agent/client bağlantısı kurulduktan sonra ATK tool-call ile gerçek piyasa verisi getirdiği doğrulanmalı.

### CLI ve MCP ayrımı

- Rehber bir günlük proje için `okx` CLI + `--json` yolunu daha basit ve dilden bağımsız başlangıç olarak öneriyor; exit code 0 başarı, 1 hata.
- MCP daha güçlü tool-selection otonomisi sağlayabilir fakat kurulum/hata ayıklaması daha uzun olabilir.
- MCP tool adları ile CLI komut adları farklıdır. Hiçbir agent birini diğerine tahmin ederek çeviremez.
- Kullanılacak gerçek komut, ilgili `okx <grup> --help` çıktısıyla doğrulanır; özellikle `sz` birimi tahmin edilmez.
- Anahtarların yerel `~/.okx/config.toml` dosyasında kalması, uygulama/LLM tarafından okunmaması tercih edilir. Production deploy mimarisi A2/E3 sırasında ayrıca kararlaştırılır.

### Agent ürün mimarisi

- Geliştirme asistanının ATK kullanması ile ürün içindeki agentın ATK kullanması farklıdır. Jüri ürün agentının `algıla → karar ver → uygula → izle` döngüsünü görmelidir.
- Karar ve gerekçe ekranda görünür olmalı; limit nedeniyle işlem göndermemek de gerçek bir agent kararıdır.
- Hata saklanmamalı; agentın typed failure/recovery davranışı görünmelidir.
- Karar elle tetiklenen bir düğmeye veya rastgeleliğe indirgenmemelidir.

Bu kurallar Project.md'deki DCD okuma → option proxy → policy gate → confirmation → reconciliation akışıyla uyumludur.

### Güvenlik

- İlk API anahtarı read-only; write gerekirse ayrı minimum izinli anahtar; withdrawal hiçbir zaman yok.
- API anahtarları sohbete, repoya, `.env.example` dosyasına veya loglara yazılmaz.
- Push öncesi diff ve secret kontrolü yapılır.
- Skill/MCP yalnız resmî kaynaklardan kurulur.
- Gerçek para içeren kod, küçük tutar ve ayrı açık kullanıcı onayı olmadan çalıştırılmaz.

### Fuji

- Ağ: Avalanche Fuji C-Chain testnet.
- Chain ID: `43113`.
- RPC: `https://api.avax-test.network/ext/bc/C/rpc`.
- Faucet: `https://build.avax.network/console/primary-network/faucet`.
- Yalnız bu proje için boş test wallet kullanılır; ana wallet kullanılmaz.
- Kontrat/ödeme üründen kopuk bonus olarak değil, agent-to-agent risk raporu ödemesinin parçası olarak gösterilir.

### Demo disiplini

- Kurulum etkinlikten önce bitmeli.
- İlk canlı veriyi ekranda görmeden başka özelliğe geçilmemeli.
- Yeni özellikler teslimden önce dondurulmalı; prova, README ve gerçek veriyle fallback video teslim işidir.
- Venue internet riski için video tutulur fakat video da gerçek veri ve gerçek transaction kanıtı kullanır.

## Bu proje için doğrudan alınmayan öneriler

- Rehber bütün emir çağrılarında `--demo` öneriyor; fakat resmî DCD skill'i simulated mode'un desteklenmediğini söylüyor. Hazine Ajanı DCD'yi demo modunda çalışmış gibi göstermeyecek. Önce canlı read-only veri, sonra kullanıcı açıkça isterse küçük canlı write kullanılacak.
- Rehber genel spot emir örnekleri veriyor. Bu proje spot bot değildir; komutlar DCD/option kapsamı için resmî Earn skill ve gerçek `--help` çıktısıyla belirlenecek.
- Rehberin %35 otonomi ağırlığı public scoring anlatımıdır. Kullanıcının sağladığı workbook önceliklidir; proje her iki kriter setini de karşılayacak biçimde tasarlanır.

## A2 için kontrol listesi

- [ ] `node -v` ve package manager doğrulandı.
- [ ] npm registry/changelog ile stable ATK sürümü doğrulandı ve sabitlendi.
- [ ] CLI ve MCP'nin gerçek help çıktıları kaydedildi.
- [ ] `site = "tr"` profili secret göstermeden doğrulandı.
- [ ] Read-only market ticker smoke testi çalıştı.
- [ ] Kullanılacak agent bağlantı yöntemi ADR ile seçildi.
