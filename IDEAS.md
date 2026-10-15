# OKX / Agentic Ankara — fikir eleme kaydı

Tarih: 15 Ekim 2026. Kullanıcı: hackathon demo çekirdeği; yeterli ekip; hızlı vibe coding; aylar süren MVP istenmiyor. Araştırma girdileri paralel scope/stack çalışmasından alındı. Ayrıntılı kaynak ve sorgular: [prior_art.md](work/research_notes/OKX%20hackathon%20proje%20araştırması/prior_art.md).

## Üretim geçişi — 10 aday, 5 mekanizma

### 1. Mandate Gate
Agent işlemlerini bağımsız harcama politikasıyla sınırlar.
Dayanak: OKX agent-trade-kit gerçek trade yetkileri.
Mekanizma: Policy enforcement.
Demo çekirdeği: Gerçek piyasa verisiyle hazırlanan ikinci emir limite takılır.

### 2. Shared Capital
İki agent'ın aynı sermayeyi aynı anda kullanmasını engeller.
Dayanak: MCP araçlarıyla birden fazla istemci erişimi; risk rezervleme ihtiyacı.
Mekanizma: Policy enforcement.
Demo çekirdeği: İki agent tek kasaya talep yapar, yalnız fonlanabilen kabul edilir.

### 3. Crash Recovery
Timeout sonrası gerçekleşmiş emri yeniden göndermeden gerçek durumu uzlaştırır.
Dayanak: OKX emir/fill sorguları.
Mekanizma: Recoverable state machine.
Demo çekirdeği: Cevabı kaybolan demo order tek fill ile geri bulunur.

### 4. Intent Rescue
Yarım kalmış çok-adımlı swap görevinin ilk kullanıcı şartlarını koruyarak devam eder veya durur.
Dayanak: Swap quote yenilenmesi ve Avalanche escrow.
Mekanizma: Recoverable state machine.
Demo çekirdeği: İkinci deneme ilk minimum çıktıyı düşürmeye çalışır, escrow izin vermez.

### 5. Strategy Falsifier
Trading iddiasını canlı veri karşısında falsification koşullarına tabi tutar.
Dayanak: OKX piyasa verisi ve agent araştırma araçları.
Mekanizma: Counterfactual evaluation.
Demo çekirdeği: Agent iddiasının veriyle uyuşmayan önkoşulu gösterilir ve trade durur.

### 6. Veto Ledger
Reddedilen işlemleri de aynı değerlendirme ufkunda kaydederek filtre etkisini ölçer.
Dayanak: Gerçekleşen trade PnL'sinin seçilim yanlılığı.
Mekanizma: Counterfactual evaluation.
Demo çekirdeği: Aynı geçmiş veri aralığında kabul ve ret örnekleri birlikte görünür.

### 7. Commitment Treasury
Yeni ödeme taahhüdünü mevcut yükümlülükleri ve fiilen elde edilebilir stablecoin miktarını gözeterek kabul eder.
Dayanak: BadgerDAO runway kararı; OKX quote; Avalanche fon ayırma.
Mekanizma: Asset-liability matching.
Demo çekirdeği: İki ödeme talebinden biri fonlanır; ilk rezervi yiyen ikinci talep reddedilir.

### 8. Refund Reserve
Volatil tokenla ödenmiş satışın iade para birimi yükümlülüğünü satış geliri harcanmadan rezervler.
Dayanak: Crypto refund escrow ve farklı settlement para birimleri.
Mekanizma: Asset-liability matching.
Demo çekirdeği: İade hakkı sürerken agent'ın gelir çekişi kontrat tarafından engellenir.

### 9. Agent Netting
Karşıt agent swap taleplerini netleyerek yalnız artık pozisyonu piyasaya gönderir.
Dayanak: Ortak kasa, OKX swap quote, Avalanche settlement.
Mekanizma: Joint allocation/netting.
Demo çekirdeği: İki karşıt niyetten tek küçük dış swap oluşur.

### 10. Finish Budget
Agent'ın ücretli servis işini bitirebilmesi için son adımlara para ayırır; ucuz başlangıcın pahalı yarım işe dönüşmesini engeller.
Dayanak: Agent iş escrow'ları ve alt-agent bütçe mirası.
Mekanizma: Joint allocation/netting.
Demo çekirdeği: Servis alımı, teslimi tamamlayacak rezervi tüketiyorsa engellenir.

## Ayrı eleme geçişi

| Aday | Sonuç | Gerekçe / en yakın emsal |
|---|---|---|
| Mandate Gate | Elendi | [AgentMandate](https://ethglobal.com/showcase/agentmandate-u1g6j), [Leash](https://ethglobal.com/showcase/leash-ti1m5) ve diğerleri aynı temel ürün. |
| Shared Capital | Elendi | [T3 Trade](https://ethglobal.com/showcase/t3-trade-xk94f) risk reservations; [The Solvent](https://ethglobal.com/showcase/the-solvent-84emi) liquidity reservations. |
| Crash Recovery | Elendi | T3 Trade deterministic IDs/reconciliation; [RECON](https://ethglobal.com/showcase/recon-fpvtz) claimed/actual/allowed. Avalanche rolü CEX tarafında zayıf. |
| Intent Rescue | Elendi | [SwapGuard](https://ethglobal.com/showcase/swapguard-km1v7) original-output/cumulative-cost persistence; Solvent recoverable lifecycle. |
| Strategy Falsifier | Elendi | T3 Forge/T3 Trade evidence detectors; kalıcı değerlendirme verisi/demo süresi sorunu. Kanıtlanabilir yeni mekanizma gösterilmedi. |
| Veto Ledger | Elendi | Literatür/piyasa örnekleri var; hakeme otuz saniyede güvenilir edge kanıtı yok; Avalanche merkezi rolü yok. |
| Commitment Treasury genel biçim | Elendi; daraltılmış biçim koşullu | [AutoCFO](https://ethglobal.com/showcase/autocfo-s0gwv), [ArcFlow](https://ethglobal.com/showcase/arcflow-rwysr), [Atlas](https://atlasfi.in/) ödeme öncesi tampon hazırlıyor. |
| Refund Reserve | Öneri eşiğine ulaşmadı | [Clawback](https://ethglobal.com/showcase/clawback-12heg) refund reserve/unlock. Dar para-birimi riski için müşteri kanıtı yok. |
| Agent Netting | Elendi | [Nette-Fi](https://ethglobal.com/showcase/nette-fi-rhf52) netted payroll swaps; genel CoW-style netting özgün değil. |
| Finish Budget | Öneri eşiğine ulaşmadı | [Agent's List](https://ethglobal.com/showcase/agents-list-z7fie) milestones+sibling budget, [OpenGotchi](https://ethglobal.com/showcase/opengotchi-1vp0i) reserves. Başarı/işi bitirme maliyeti önden güvenilir bilinmeyebilir. |

## Koşullu araştırma adayı: taahhüt kabulü ve fon ayırma

En dar farklılık: yeni ödeme emrinin önceki ödemelerin ayrılmış parasına verdiği etkiyi işlem öncesinde hesapla; brüt token fiyatını değil OKX gerçek satış teklifini kullan; Avalanche kasası ödeme başına gerçek USDC'yi ayırsın ve tekrar harcanmasını engellesin. Agent durum değişiminde başka izinli varlık/işlem büyüklüğü seçebilsin veya yetersizliği bildirsin. Kullanıcıya fonlanmış ile yalnız tahmin edilen tutar farklı gösterilsin.

Bu bir yenilik garantisi değildir. Atlas'ın kodu ve Request Network ürün kapsamı ile karşılaştırmadan 'ilk' denemez. Temel muhasebe yeni değil. Asıl farklılık, yeni agent taahhüdünün kabulü sırasında mevcut hakların korunmasıdır; bunun müşteriye değerini doğrulamak gerekir.

Tek demo yolu: gerçek kasa bakiyesi → iki açıkça kullanıcı tanımlı yükümlülük → canlı quote → izinli bounded exact-in dönüşümü → gerçekleşen output kadar fon ayırma → ayrılmış parayı yeniden harcamayı kontratın reddetmesi → ilk alıcının ödemesi. Fuji ile mainnet quote farklı ortamlardır; gerçek OKX swap yapılmadan yapılmış gibi gösterilmez. CEX fonları kontrat tarafından korunuyormuş iddiası yok.

Ana riskler: yeniliğin yalnız ürün paketlemesi olarak kalması; token likiditesinin yeterli olmaması; quote geçerliliği; demo environment bölünmesi; agent kararının göstermelik olması. Finansal getiri veya garanti edilen gelecekteki ödeme vaadi yok.

## Sonuç

10 aday, 5 mekanizma; 8 genel aday elendi, 2 aday yeterli kanıtı geçemedi. Yalnız Commitment Treasury'nin daha dar taahhüt kabulü biçimi ek sınamaya değer. Üç zayıf alternatif üretmek için eşik düşürülmedi.
