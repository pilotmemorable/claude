# CLAUDE.md

Bu dosya, bu depoda çalışan Claude oturumlarına (Claude Code, masaüstü, mobil, web) yol gösterir.

## Proje: OMNIA

Turizm sektörü için yapay zekâ destekli müşteri platformu. Şirket kendi turlarını satıyor; platform müşteri takibi, otomatik yanıtlar, yorum analizi, AI mesajlaşma ve rezervasyonu tek yerde topluyor. "OMNIA" geçici çalışma adı, ileride değişebilir.

### Mesajlaşma kanalları
Instagram, WhatsApp, Telegram, WeChat, RedNote (Xiaohongshu). Yeni kanal eklemek mevcut kanalları etkilememeli: her kanal ortak bir mesaj arayüzünün arkasında ayrı bir adaptör olmalı.

### Yol haritası (6 aşama)
1. Mesajlaşma ve rezervasyon
2. AI içerik üretimi (görsel, video, reels) ve ömür boyu müşteri ajanı (doğum günü hediyeleri dahil)
3. Geri bildirim toplama asistanı
4. Muhasebe ve raporlama
5. iOS / iPad / Android / web uygulaması
6. Cloudflare barındırma, yedekleme ve güvenlik testleri

## Mimari ilkeler

- **n8n yok.** Otomasyon Claude + MCP sunucuları + skills ile kurulur. n8n iş akışı önerme.
- **Değişime açık tasarım.** Her aşamada yeni müşteri talepleri gelecek. Modüler yapı, özellik bayrakları ve gevşek bağlı modüller tercih et; tek bir büyük akışa gömülü mantıktan kaçın.
- **Aracı modülü (otel / uçuş komisyonculuğu):** Kodu hazır tutulur ama varsayılan olarak **kapalıdır**. Bir özellik bayrağının arkasında olmalı ve kapalıyken diğer modüller ona bağımlı olmamalı.
- **Barındırma:** Cloudflare (Workers, D1, KV, R2). Altyapı kararlarında önce Cloudflare seçeneklerine bak.
- **Çoklu ortam:** Proje Claude masaüstü, mobil ve web üzerinden eşzamanlı yürütülüyor. Kararları ve bağlamı bu dosyada ve depoda tut; tek bir oturumun hafızasına güvenme.

## Komutlar

- `npm install`: bağımlılıkları kur
- `npm test`: Vitest testlerini çalıştır
- `npm run typecheck`: tarayıcı ve Worker kodunu ayrı ayrı tip kontrolünden geçir
- `npm run check`: tip kontrolü + testler (commit'ten önce bunu çalıştır)

## Klasör yapısı

- `src/feedback/`: geri bildirim modülü (Aşama 3)
  - `types.ts`: ortak model ve `validateFeedback` (tarayıcı + Worker paylaşır)
  - `widget.ts`: framework'süz geri bildirim butonu, `mountFeedbackButton(el, { endpoint })`; varsayılan etiketler Türkçe (`LABELS_TR`), `LABELS_EN` de var
  - `store.ts`: `FeedbackStore` arayüzü; `D1FeedbackStore` (üretim) ve `MemoryFeedbackStore` (test)
- `src/worker/`: Cloudflare Worker girişi (`index.ts`) ve rota işleyicileri; `POST /api/feedback` → `feedback.ts`
- `migrations/`: D1 SQL migration'ları
- `test/`: Vitest testleri; DOM testleri dosya başında `// @vitest-environment jsdom` ile jsdom'da çalışır

## Teknik notlar

- Tip kontrolü iki projeye ayrık: `tsconfig.browser.json` (DOM) ve `tsconfig.worker.json` (`@cloudflare/workers-types`). İkisi aynı projede çakışır. Yeni dosyayı doğru projenin `include` listesine ekle; paylaşılan kod (ör. `types.ts`) iki ortamın globallerine de bağımlı olmamalı.
- Henüz `wrangler.toml` yok; Worker'ı yayınlamadan önce D1 veritabanı oluşturulup `DB` bağlamasıyla eklenmeli ve `migrations/` uygulanmalı.

## Depo durumu

- CodeQL `actions` ve `javascript-typescript` dillerini tarar.
- **Bu depo herkese açık (public).** API anahtarı, token, müşteri verisi veya `.env` dosyası commit'leme. Gizli değerler Cloudflare secrets / ortam değişkenlerinde tutulur.

## Çalışma kuralları

- Kullanıcıyla Türkçe iletişim kur.
- Büyük değişikliklerden önce hangi aşamaya ait olduğunu belirt.
- Kod eklendiğinde bu dosyayı güncel tut: komutlar, klasör yapısı, önemli kararlar.
