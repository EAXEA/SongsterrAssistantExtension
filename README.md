# 🎸 Bass Assistant

> A Chrome extension for bassists: import your Songsterr setlist, generate tone presets via ChatGPT, and fine-tune each song on a virtual Marcus Miller V3 MA · 2nd Gen 4-string knob plate.

[**Türkçe ↓**](#türkçe) · **English** ↓

![version](https://img.shields.io/badge/version-5.5.0-blue) ![manifest](https://img.shields.io/badge/manifest-v3-orange) ![lang](https://img.shields.io/badge/lang-TR%20%2F%20EN-green)

---

## English

### What is Bass Assistant?

Bass Assistant is a workflow tool for bassists. The cycle:

1. **Import** your Songsterr favorite/tab list
2. **Generate AI tone presets** with ChatGPT (Web automation or manual copy-paste)
3. **Visualize & customize** each song's tone on a Marcus Miller V3 MA · 2nd Gen 4-string knob plate
4. **Rate, star, sort, group** by similar tones — build a coherent setlist
5. **Save your personal tweaks** alongside the AI suggestion — never lose your custom EQ

The product is opinionated for one bass: **Sire Marcus Miller V3 MA · 2nd Gen 4-string** (Active/Passive switch, mini Tone, Blend, Treble, Mid, Mid Freq, Bass).

### Features

- 🎵 **Songsterr import** — extract song list from any Songsterr tab in one click
- ⚡ **AI tone generation** — two modes:
  - **ChatGPT Web (automated)** — opens chatgpt.com, inserts the prompt, parses the JSON response, applies to all songs
  - **Manual** — copies the prompt to clipboard, you paste it into ChatGPT yourself, paste the response back into the modal
- 🎛️ **Marcus Miller V3 MA knob plate** — SVG-based rotary knobs in the actual V3 MA layout (passive top row, active EQ bottom row), with bipolar center detents on Treble/Mid/Bass and a clean digital-mixer feel
- 🎚️ **Drag/scroll/double-click** to edit knob values (vertical drag, scroll wheel for fine, double-click resets to AI value)
- 💾 **AI vs user tone layers** — `aiTone` (AI suggestion, immutable) + `userTone` (your customizations); final = userTone ?? aiTone per parameter
- ⭐ **5-star rating** per song, sort by stars
- 🎚️ **Similar-tone discovery** — when you expand a song, see other songs with knob settings within ±10 units (Active state + Blend side hard-locked, EQ tightly bounded)
- 🟢 **Status banner** — large semantic-colored banner (idle/busy/success/error) with live progress bar during AI generation
- ✓ **Per-song AI check** — green ✓ badge on the title when AI tone applied
- 📦 **Collapsed-by-default cards** — see just titles and stars; tap to expand and reveal the knob plate
- 🌐 **TR/EN language toggle** — full UI in Turkish or English
- 🪟 **Side panel + popup** — quick popup launcher, full side panel workspace; toggle between them with a single button
- 📋 **Cache-first dedup** — songs deduped by `title__artist`; re-imports update existing entries instead of duplicating
- 💾 **Export/import JSON** — backup your library, restore from file
- 🗑️ **Clear list with confirm** — irreversible action protected

### Installation

1. Download or clone this repository to your machine
2. Open Chrome → `chrome://extensions`
3. Toggle **Developer mode** on (top right)
4. Click **Load unpacked** → select the cloned folder
5. Pin the Bass Assistant icon to your toolbar
6. Click the icon to open the popup, or click `↗` to switch to the side panel

### Usage Guide

#### 1. Import songs from Songsterr

- Open [songsterr.com](https://www.songsterr.com), log in, navigate to your favorites or any tab list
- Click the Bass Assistant icon
- Click **🎵 Extract Songs** — the songs from the active tab will be imported
- The green status banner will confirm how many songs were processed

#### 2. Generate AI tone presets

**Option A — ChatGPT Web (automated):**

- In Settings (⚙️), make sure AI Provider is **ChatGPT Web** (default)
- Open `chatgpt.com` in another tab and log in
- The settings panel should show **"ChatGPT tab ready ✓"**
- Click **⚡ Generate AI Tones**
- Confirm the prompt → the extension opens/uses the ChatGPT tab, inserts the prompt, waits for the response, parses the JSON, and applies tones to all songs
- Status banner shows live progress: `Batch 1/2 · 25/50 songs`
- On success, the banner turns green and each song card shows a ✓ badge

**Option B — Manual (copy/paste):**

- In Settings, switch AI Provider to **Manual**
- Click **⚡ Generate AI Tones** → a modal opens; the prompt is already in your clipboard
- Paste the prompt into ChatGPT (any model, any account)
- Copy the JSON response, paste into the modal textarea, click **Apply**

#### 3. Customize tones on the knob plate

- Click on a song title to expand the card
- The Marcus Miller V3 MA knob plate appears with the AI suggestion
- **Drag** any knob vertically (up = increase, down = decrease) to set your own value
- **Scroll wheel** on a knob — finer increments
- **Shift + drag/scroll** — even finer
- **Double-click** a knob — reset that single knob to the AI value
- Click **↺ Reset to AI** — reset all knobs to the AI version
- Your personal values are saved separately from the AI suggestion; if you re-generate AI later, your customizations stay intact

#### 4. Rate, sort, find similar

- Click stars on a song to rate it (1–5)
- Click the same star again to clear
- In Settings → Sort dropdown, pick **Stars (5→0)** to put your favorites on top
- When a song is expanded, scroll to **🎚️ Similar-tone songs** — clicking one collapses the current card, expands the target, and smooth-scrolls to it

#### 5. Side panel workflow

- Click **↗** in the popup to open the side panel
- The popup auto-closes; the side panel gives you a wider workspace with multi-column song grid at >880px and >1200px
- Click **✕** in the side panel to close it (popup is reopened via the toolbar icon)

#### 6. Backup / restore

- In **⋯ More**:
  - **📋 Copy Prompt** — copy the full ChatGPT prompt to clipboard
  - **🎵 Copy Names** — copy just song titles
  - **⬇️ Download TXT/JSON** — save your library to disk
  - **⬆️ Upload JSON** — restore from a previous backup (merges with existing, never duplicates)
  - **🗑️ Clear Entire List** — irreversible, requires confirmation

### Knob Layout — Marcus Miller V3 MA · 2nd Gen 4-string

```
┌─────────────────────────────────────────────┐
│  PASSIVE                                    │
│  ┌────────┬────────┬────────┐               │
│  │ Active │  Tone  │  Blend │               │
│  │  ⊙⊙    │   ⊙    │   ⊙    │               │
│  └────────┴────────┴────────┘               │
│                                             │
│  ACTIVE EQ                                  │
│  ┌────────┬────────┬────────┬────────┐      │
│  │ Treble │   Mid  │ Mid Hz │  Bass  │      │
│  │   ⊙    │   ⊙    │   ⊙    │   ⊙    │      │
│  │ bipolar│ bipolar│ 200-800│ bipolar│      │
│  └────────┴────────┴────────┴────────┘      │
└─────────────────────────────────────────────┘
```

- **Active switch** — toggles the active EQ section on/off (passive-only mode bypasses Treble/Mid/Bass)
- **Tone** (passive) — 0-100, single sweep, rolls off treble in passive mode
- **Blend** — 0-100, 0=neck only, 50=balanced, 100=bridge only. *Songs on opposite sides of 50 have fundamentally different characters and are never marked similar.*
- **Treble / Mid / Bass** — 0-100 bipolar, center=50=flat, ±50 offset displayed as `+/-`
- **Mid Hz** — 200-800 Hz, the active mid frequency selector

### Privacy & security

- All data lives in `chrome.storage.local` — never leaves your machine
- The ChatGPT Web flow uses **your own ChatGPT session** (no API key, no data sent to OpenAI by us)
- ChatGPT may have anti-automation (Cloudflare bot detection) — the manual mode is the bulletproof fallback
- No telemetry, no analytics, no remote calls except the ChatGPT tab you're already using

### Tech notes

- Manifest V3 Chrome extension
- Service worker (`background.js`) for tab coordination, batch queue, retry, progress checkpointing
- Content script (`chatgpt-content.js`) for chatgpt.com DOM automation with multi-selector fallbacks
- Side panel + popup share the same HTML/CSS/JS bundle
- No build step; pure ES — load unpacked as-is

---

## Türkçe

### Bass Assistant nedir?

Bass Assistant, basçılar için workflow aracı. Akış:

1. Songsterr favori/tab listesini **içe aktar**
2. ChatGPT ile **AI tone preset'i üret** (Web otomasyonu veya manuel kopyala-yapıştır)
3. Her şarkı için Marcus Miller V3 MA · 2nd Gen 4 telli **knob plate'inde görsel olarak düzenle**
4. **Yıldız ver, sırala, benzer tonları bul** — tutarlı bir setlist kur
5. **Kişisel ayarlarını AI önerisiyle birlikte sakla** — özelleştirdiğin EQ asla kaybolmaz

Ürün tek bas için optimize: **Sire Marcus Miller V3 MA · 2nd Gen 4 telli** (Active/Passive switch, mini Tone, Blend, Treble, Mid, Mid Freq, Bass).

### Özellikler

- 🎵 **Songsterr import** — herhangi bir Songsterr sekmesindeki şarkıları tek tıkla içe aktar
- ⚡ **AI tone üretimi** — iki mod:
  - **ChatGPT Web (otomatik)** — chatgpt.com'u açar, prompt'u yazar, JSON cevabını parse eder, tüm şarkılara uygular
  - **Manuel** — prompt'u clipboard'a kopyalar, ChatGPT'ye sen yapıştırırsın, cevabını modal'a geri verirsin
- 🎛️ **Marcus Miller V3 MA knob plate** — gerçek V3 MA layoutuyla SVG rotary knob'lar (üstte passive sıra, altta active EQ sırası), Treble/Mid/Bass için bipolar merkez detentleri, dijital mikser hissi
- 🎚️ **Drag/scroll/double-click** ile knob düzenleme (dikey drag, ince ayar için scroll wheel, double-click AI değerine sıfırlar)
- 💾 **AI ve user tone katmanları** — `aiTone` (AI önerisi, değişmez) + `userTone` (senin kişiselleştirmen); her parametre için final = userTone ?? aiTone
- ⭐ **Şarkı başına 5 yıldız** — yıldıza göre sıralama
- 🎚️ **Yakın tonlu şarkı keşfi** — bir şarkıyı genişlettiğinde, knob diff < 10 olan diğer şarkıları görürsün (Active state + Blend tarafı hard-lock'lu, EQ'ler sıkı sınırlı)
- 🟢 **Status banner** — büyük semantic renkli banner (idle/busy/success/error), AI üretirken canlı progress bar
- ✓ **Per-song AI check** — AI tonu uygulanmış şarkıların başlığında yeşil ✓ rozet
- 📦 **Default collapsed kartlar** — sadece title + yıldız görürsün; tıklayınca knob plate açılır
- 🌐 **TR/EN dil seçeneği** — tüm arayüz Türkçe ya da İngilizce
- 🪟 **Side panel + popup** — hızlı popup launcher, geniş side panel workspace; tek butonla geçiş
- 📋 **Cache-first dedup** — şarkılar `title__artist` ile dedup'lanır; tekrar import duplicate yaratmaz, mevcut kayıtları update eder
- 💾 **JSON export/import** — kütüphaneni yedekle, dosyadan geri yükle
- 🗑️ **Onaylı liste temizleme** — geri alınamayan işlem confirm ile korunur

### Kurulum

1. Bu repository'i bilgisayarına indir veya klonla
2. Chrome → `chrome://extensions` aç
3. Sağ üstte **Geliştirici modu**'nu aç
4. **Paketlenmemiş öğe yükle** (Load unpacked) → klasörü seç
5. Bass Assistant ikonunu toolbar'a sabitle
6. İkona tıkla popup açılır, `↗` ile side panel'e geç

### Kullanım Kılavuzu

#### 1. Songsterr'den şarkı çek

- [songsterr.com](https://www.songsterr.com)'a git, login ol, favorilere veya bir tab listesine git
- Bass Assistant ikonuna tıkla
- **🎵 Şarkıları Çek** butonuna bas — aktif sekmedeki şarkılar import edilir
- Yeşil status banner kaç şarkı işlendiğini söyler

#### 2. AI tone preset'i üret

**Seçenek A — ChatGPT Web (otomatik):**

- Settings (⚙️)'ten AI Sağlayıcı **ChatGPT Web** seçili olmalı (default)
- Başka bir sekmede `chatgpt.com` aç ve login ol
- Settings panel'i **"ChatGPT sekmesi hazır ✓"** göstermeli
- **⚡ AI Tonları Üret** butonuna bas
- Confirm'i onayla → extension ChatGPT sekmesini açar/kullanır, prompt'u yazar, cevabı bekler, JSON'u parse eder, tüm şarkılara tone uygular
- Status banner canlı progress gösterir: `Batch 1/2 · 25/50 şarkı`
- Başarıda banner yeşile döner ve her şarkı kartında ✓ rozet çıkar

**Seçenek B — Manuel (kopyala/yapıştır):**

- Settings'te AI Sağlayıcı'yı **Manuel**'e al
- **⚡ AI Tonları Üret** → modal açılır; prompt clipboard'a kopyalanmış olur
- Prompt'u ChatGPT'ye yapıştır (hangi model, hangi hesap olursa)
- JSON cevabını al, modal textarea'ya yapıştır, **Uygula**'ya bas

#### 3. Knob plate'inde toneları kişiselleştir

- Bir şarkı title'ına tıkla — kart açılır
- Marcus Miller V3 MA knob plate'i AI önerisiyle birlikte görünür
- Herhangi bir knob'u **dikey sürükle** (yukarı = artır, aşağı = azalt) kendi değerini koy
- Knob üzerinde **scroll wheel** — daha ince increment
- **Shift + drag/scroll** — çok daha ince
- Knob'a **double-click** — o tek knob'u AI değerine sıfırla
- **↺ AI'ya Dön** — tüm knob'ları AI versiyonuna geri al
- Kişisel değerlerin AI önerisinden ayrı kaydedilir; AI'yı sonra yenilersen, kişiselleştirmen kaybolmaz

#### 4. Yıldız ver, sırala, benzer bul

- Bir şarkının yıldızlarına tıkla (1-5)
- Aynı yıldıza tekrar tıkla → temizler
- Settings → Sort: **Yıldız (5→0)** seç → favorilerin tepeye çıkar
- Bir şarkı açıldığında **🎚️ Yakın tonlu şarkılar** bölümüne bak — bir tanesine tıkla, mevcut kart kapanır, hedefe smooth scroll olur

#### 5. Side panel akışı

- Popup'taki **↗** ikonuyla side panel'i aç
- Popup otomatik kapanır; side panel geniş workspace verir (>880px'te 2-kolon, >1200px'te 3-kolon şarkı grid'i)
- Side panel'deki **✕** ile kapat (popup'u toolbar icon ile yeniden açarsın)

#### 6. Backup / restore

- **⋯ Daha fazla** altında:
  - **📋 Prompt Kopyala** — tam ChatGPT prompt'unu clipboard'a kopyala
  - **🎵 İsimleri Kopyala** — sadece şarkı başlıklarını kopyala
  - **⬇️ TXT/JSON İndir** — kütüphaneyi diske kaydet
  - **⬆️ JSON Yükle** — önceki bir yedekten geri yükle (mevcut listeyle merge eder, duplicate yaratmaz)
  - **🗑️ Tüm Listeyi Temizle** — geri alınamaz, confirm gerektirir

### Knob Layout — Marcus Miller V3 MA · 2 nesil 4 telli

```
┌─────────────────────────────────────────────┐
│  PASSIVE                                    │
│  ┌────────┬────────┬────────┐               │
│  │ Active │  Tone  │  Blend │               │
│  │  ⊙⊙    │   ⊙    │   ⊙    │               │
│  └────────┴────────┴────────┘               │
│                                             │
│  ACTIVE EQ                                  │
│  ┌────────┬────────┬────────┬────────┐      │
│  │ Treble │   Mid  │ Mid Hz │  Bass  │      │
│  │   ⊙    │   ⊙    │   ⊙    │   ⊙    │      │
│  │ bipolar│ bipolar│ 200-800│ bipolar│      │
│  └────────┴────────┴────────┴────────┘      │
└─────────────────────────────────────────────┘
```

- **Active switch** — active EQ'yu açar/kapatır (passive-only modunda Treble/Mid/Bass bypass)
- **Tone** (passive) — 0-100, tek yön, passive modunda treble roll-off
- **Blend** — 0-100, 0=sadece neck, 50=dengeli, 100=sadece bridge. *50'nin iki yanındaki şarkılar temelde farklı karakterdedir, asla benzer işaretlenmez.*
- **Treble / Mid / Bass** — 0-100 bipolar, merkez=50=flat, ±50 offset `+/-` olarak gösterilir
- **Mid Hz** — 200-800 Hz, aktif mid frekans seçici

### Gizlilik & güvenlik

- Tüm veri `chrome.storage.local`'da — makineni hiç terk etmez
- ChatGPT Web akışı **senin kendi ChatGPT session'ını** kullanır (API key yok, bizim OpenAI'a hiç veri göndermemiz yok)
- ChatGPT'de anti-automation olabilir (Cloudflare bot detection) — manuel mod bulletproof fallback
- Telemetri yok, analytics yok, kullandığın ChatGPT sekmesi dışında uzak çağrı yok

### Teknik notlar

- Manifest V3 Chrome extension
- Service worker (`background.js`) tab koordinasyonu, batch queue, retry, progress checkpoint
- Content script (`chatgpt-content.js`) chatgpt.com DOM otomasyonu, multi-selector fallback'li
- Side panel + popup aynı HTML/CSS/JS bundle'ını paylaşır
- Build step yok; saf ES — olduğu gibi unpacked yükle

---

## Update Notes / Sürüm Notları

### v5.5.0 — 2026-05
- 🌐 **TR/EN language toggle** in Settings — full UI translation with live switch
- All status banner messages, button labels, and song card text now use `i18n.js` translation table
- New `i18n.js` module with `t(key, params)` helper and `data-i18n` HTML attributes

### v5.4.1
- **Strict similar-tone filter:** knob diff < 10, Active state must match, Blend side must match (neck <45 / balanced 45-55 / bridge >55)
- Tier labels: `çok yakın` (<3) · `yakın` (<6) · `benzer` (<10)

### v5.4.0
- ⭐ Stars moved under song title (cleaner long-title display)
- Removed source label fallback ("songsterr")
- Removed Volume knob from V3 plate (master output, not tone-defining) → passive row 3-column
- 🎚️ **Similar-tone songs** section in expanded card — click any to jump

### v5.3.1
- Bug fix: `render is not defined` crash when clicking filter chip

### v5.3.0
- 🎛️ **Marcus Miller V3 MA · 2nd Gen 4-string knob plate** — SVG rotary knobs, Active switch, bipolar EQ with center detent
- Drag/scroll/double-click knob interaction
- ⭐ **5-star rating** per song
- 💾 **userTone** layer — saves your customizations alongside AI suggestion
- 📦 **Collapsed-by-default** song cards — click title to expand
- New sort option: "Stars (5→0)"

### v5.2.0
- ↻ Per-song "Regen AI" button
- ⬆️ JSON re-import (file picker, merge logic)
- Better dedup: title+artist primary key; URL changes won't duplicate songs

### v5.1.0
- 🗑️ "Clear Entire List" button (with confirm)
- Removed Liste/Detay view-mode segment (always cards now)

### v5.0.0
- 🟢 **Status Banner** — big semantic-colored banner replaces small status badge (idle/busy/success/error with live progress)
- ✓ Per-song AI check badge on title
- Unified single AI flow: ⚡ AI Generate button picks provider from Settings
- AI Bridge separate card removed (manual flow now via inline modal)
- Setlist mode dropped; 2 view modes total

### v4.0.x
- ⚡ ChatGPT Web automation (background SW + content script)
- Provider selector: ChatGPT Web | Manual
- Service worker, batch queue, retry, progress checkpoint
- Improved selector fallbacks for ChatGPT page

### v3.2.0
- Collapsible cards (AI Bridge, Settings)
- Provider segment (Manual/ChatGPT Web)
- View mode segment (Liste/Detay/Setlist)
- Tone slider with mood label
- Toast pattern
- Side panel grid for wide screens
- Sidepanel toggle: open from popup auto-closes popup

### v3.1.x
- Fix duplicate `id="import-ai-btn"` (popup.html line 28 + 65 → bridge button dead)
- Dynamic version display from manifest

### v3.1.0 (initial public)
- Songsterr import, manual AI bridge (paste + Uygula), drag-drop reorder, song states, tone variation slider, JSON/TXT download, side panel

---

## License

MIT

## Author

[Den0 / @EAXEA](https://github.com/EAXEA)
