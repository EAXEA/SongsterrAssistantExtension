// Bass Assistant — i18n
// Two languages: tr (default), en. Add more by extending TRANSLATIONS.

const TRANSLATIONS = {
  tr: {
    // brand
    "brand.name": "🎸 Bass Assistant",
    "brand.subtitle.popup": "",
    "brand.subtitle.sidepanel": "· Side Panel",

    // status banner
    "status.ready": "Hazır",
    "status.no_data": "Henüz veri yok",
    "status.songs_summary": "{n} şarkı · {ai} AI tonlu",

    // primary CTAs
    "cta.extract": "🎵 Şarkıları Çek",
    "cta.extract.sub": "Songsterr sekmesinden",
    "cta.ai_generate": "⚡ AI Tonları Üret",
    "cta.ai_generate.sub.web": "ChatGPT üzerinden",
    "cta.ai_generate.sub.manual": "Manuel kopyala-yapıştır",

    // open/close panel
    "panel.open": "Side panel'e geç",
    "panel.close": "Side panel'i kapat",

    // search + filter
    "search.placeholder": "Şarkı ara…",
    "search.clear_title": "Aramayı temizle",
    "filter.all": "Hepsi",

    // settings card
    "settings.title": "⚙️ Ayarlar",
    "settings.summary.default": "Varsayılan",
    "settings.summary.web": "ChatGPT Web",
    "settings.summary.manual": "Manuel",
    "settings.provider": "AI Sağlayıcı",
    "settings.provider.web": "ChatGPT Web",
    "settings.provider.manual": "Manuel",
    "settings.provider.status.web_ready": "ChatGPT sekmesi hazır ✓",
    "settings.provider.status.web_no_tab": "ChatGPT sekmesi açık değil — basınca otomatik açılır.",
    "settings.provider.status.web_not_logged_in": "ChatGPT sekmesi açık ama giriş yapılmamış. Önce login ol.",
    "settings.provider.status.manual": "Prompt clipboard'a kopyalanır, JSON yanıtı modal'a yapıştırırsın.",
    "settings.tone_character": "Tone karakteri",
    "settings.tone.lofi": "Lofi",
    "settings.tone.modern": "Modern",
    "settings.tone.mood.lofi": "lofi · yumuşak",
    "settings.tone.mood.warm": "warm · groove",
    "settings.tone.mood.balanced": "dengeye yakın",
    "settings.tone.mood.modern": "modern · net",
    "settings.tone.mood.sharp": "modern · keskin",
    "settings.list_title": "Liste adı",
    "settings.prompt_context": "Prompt başlangıcı",
    "settings.prompt_suffix": "Prompt sonu yönlendirme",
    "settings.sort": "Sıralama",
    "settings.sort.order": "Manuel sıra",
    "settings.sort.oldest": "Eski → Yeni",
    "settings.sort.newest": "Yeni → Eski",
    "settings.sort.rating": "Yıldız (5→0)",
    "settings.language": "Dil / Language",

    // more menu
    "more.title": "⋯ Daha fazla",
    "more.copy_prompt": "📋 Prompt Kopyala",
    "more.copy_names": "🎵 İsimleri Kopyala",
    "more.download_txt": "⬇️ TXT İndir",
    "more.download_json": "⬇️ JSON İndir",
    "more.upload_json": "⬆️ JSON Yükle",
    "more.clear_list": "🗑️ Tüm Listeyi Temizle",

    // ai bridge / manual modal
    "ai.bridge.title": "🤖 AI Köprüsü",
    "ai.bridge.pill.waiting": "JSON bekler",
    "ai.bridge.pill.has_content": "İçerik var",
    "ai.bridge.helper": "JSON, code block veya düz metin olabilir; sistem ayıklar.",
    "ai.bridge.placeholder": "ChatGPT JSON çıktısını yapıştır.",
    "ai.bridge.apply": "Uygula",
    "manual.title": "Manuel AI akışı",
    "manual.step1": "Prompt clipboard'a kopyalandı. ChatGPT'ye yapıştır, JSON cevabı al.",
    "manual.step2": "Cevabı buraya yapıştır:",
    "manual.placeholder": '[{"title":"...","tone":{...},"fx":{...}}]',
    "manual.apply": "Uygula",
    "manual.close": "Kapat",

    // song card
    "song.knobplate.title": "Marcus Miller V3 MA · 2nd Gen 4-string",
    "song.knob.active": "Active",
    "song.knob.tone": "Tone",
    "song.knob.blend": "Blend",
    "song.knob.treble": "Treble",
    "song.knob.mid": "Mid",
    "song.knob.midhz": "Mid Hz",
    "song.knob.bass": "Bass",
    "song.fx.label": "Effects",
    "song.btn.regen_yenile": "↻ AI Yenile",
    "song.btn.regen_uret": "⚡ AI Üret",
    "song.btn.reset_ai": "↺ AI'ya Dön",
    "song.btn.copy_tone": "📋 Tone Kopyala",
    "song.btn.delete": "🗑️ Sil",
    "song.similar.title": "🎚️ Yakın tonlu şarkılar (knob diff < 10)",
    "song.similar.very_close": "● çok yakın",
    "song.similar.close": "● yakın",
    "song.similar.similar": "● benzer",
    "song.tooltip.personalized": "Kişiselleştirilmiş",
    "song.empty.no_songs": "Henüz şarkı yok.",
    "song.empty.cta_extract": "Songsterr sekmesini aç, sonra Şarkıları Çek butonuna bas.",
    "song.empty.no_filter_match": "Filtreye uyan şarkı yok.",
    "song.empty.cta_clear": "Filtreyi temizle",

    // states
    "state.favorite": "Fav",
    "state.listen": "Dinle",
    "state.play": "Çal",
    "state.tried": "Denendi",
    "state.ai_tab": "AI Tab",
    "state.stage": "Sahne",

    // banner messages — extract
    "banner.extracting": "Şarkılar çekiliyor",
    "banner.extracting.detail": "Aktif sekmedeki Songsterr verisi okunuyor…",
    "banner.extracted": "{n} şarkı işlendi",
    "banner.extract_error": "Şarkı çekilemedi",

    // banner messages — ai flow
    "banner.ai.starting": "AI tonları üretiliyor",
    "banner.ai.connecting": "{n} şarkı için ChatGPT'ye bağlanılıyor…",
    "banner.ai.step.flow_start": "Başlatılıyor",
    "banner.ai.step.tab_found": "ChatGPT sekmesi bulundu",
    "banner.ai.step.opening_tab": "ChatGPT sekmesi açılıyor",
    "banner.ai.step.tab_opened": "ChatGPT sekmesi açıldı",
    "banner.ai.step.cs_ready": "ChatGPT sayfası hazır",
    "banner.ai.step.injecting": "Script manuel enjekte ediliyor",
    "banner.ai.step.cs_ready_injected": "Script enjekte edildi, hazır",
    "banner.ai.step.auth_checked": "Login durumu doğrulandı",
    "banner.ai.step.batch_send": "Batch ChatGPT'ye gönderildi",
    "banner.ai.step.batch_response": "ChatGPT yanıtı geldi",
    "banner.ai.step.batch_parsed": "JSON parse edildi",
    "banner.ai.batch_progress": "Batch {cur}/{total} · {p}/{t} şarkı",
    "banner.ai.applied": "{n} şarkıya AI tone uygulandı",
    "banner.ai.summary": "Toplam {total} şarkı · {ai} AI tonlu",
    "banner.ai.failed": "AI üretimi başarısız",
    "banner.ai.empty_response": "Yanıt boş",
    "banner.ai.empty_response_detail": "ChatGPT cevap döndürdü ama uygulanabilir tone bulunamadı.",
    "banner.ai.no_candidates_title": "Tüm şarkılarda AI tone var ✓",
    "banner.ai.no_candidates_detail": "{n} şarkı zaten işlenmiş",
    "banner.ai.need_songs": "Önce şarkı çek",
    "banner.ai.need_songs_detail": 'Şarkı listesi boş. "Şarkıları Çek" ile başla.',

    // banner — manual flow
    "banner.manual.started": "Manuel akış başladı",
    "banner.manual.detail": "Prompt clipboard'a kopyalandı ({n} şarkı). ChatGPT'ye yapıştır, JSON'u modal'a geri ver.",
    "banner.manual.no_json": "JSON yok",
    "banner.manual.no_json_detail": "Yapıştırılacak ChatGPT cevabı bekleniyor.",
    "banner.manual.parsing": "Parse ediliyor",
    "banner.manual.parsing_detail": "ChatGPT cevabı işleniyor…",
    "banner.manual.applied": "AI tonları uygulandı",

    // banner — single song regen
    "banner.regen.busy": "AI tonu üretiliyor",
    "banner.regen.busy_detail": '"{title}" için ChatGPT\'ye bağlanılıyor…',
    "banner.regen.done": '"{title}" güncellendi',
    "banner.regen.done_detail": "AI tonu uygulandı",

    // banner — copy/download
    "banner.copied.names": "Şarkı adları kopyalandı",
    "banner.copied.names_detail": "{n} satır clipboard'a alındı",
    "banner.copied.prompt": "Prompt kopyalandı",
    "banner.copied.prompt_detail": "{n} karakter clipboard'a alındı. ChatGPT'ye yapıştırabilirsin.",
    "banner.copy_error": "Kopyalama hatası",
    "banner.downloaded.txt": "TXT indirildi",
    "banner.downloaded.json": "JSON indirildi",
    "banner.downloaded.detail": "İndirilenler klasörüne kaydedildi.",
    "banner.download_error": "İndirme hatası",

    // banner — clear list
    "banner.cleared": "Liste temizlendi",
    "banner.cleared_detail": "{n} şarkı silindi",
    "banner.empty_list": "Liste zaten boş",
    "banner.empty_list_detail": "Silinecek şarkı yok.",
    "banner.clear_confirm": "{n} şarkı silinecek. Bu geri alınamaz.\n\nDevam edilsin mi?",
    "banner.ai_confirm": "{n} şarkı için ChatGPT'den tone üretilecek.\n\nBu işlem chatgpt.com sekmesini kullanır. Sayfaya müdahale etme.\nDevam edilsin mi?",

    // banner — json import
    "banner.import_json": "JSON yükleniyor",
    "banner.import_json.done": "JSON yüklendi",
    "banner.import_json.done_detail": "{n} kayıt işlendi · {added} yeni · {updated} güncellendi",
    "banner.import_json.error": "JSON yüklenemedi",
    "banner.import_json.no_array": "Geçerli şarkı dizisi bulunamadı.",

    // misc
    "misc.error_prefix": "Hata",
    "misc.error": "Hata",
    "misc.unknown_error": "Bilinmeyen hata",
    "misc.song_deleted": "Şarkı silindi.",
    "misc.song_tone_copied": "Şarkı tonu kopyalandı.",
    "misc.song_line_copied": "Şarkı satırı kopyalandı.",
    "misc.clipboard_error": "Clipboard hatası"
  },
  en: {
    "brand.name": "🎸 Bass Assistant",
    "brand.subtitle.popup": "",
    "brand.subtitle.sidepanel": "· Side Panel",

    "status.ready": "Ready",
    "status.no_data": "No data yet",
    "status.songs_summary": "{n} songs · {ai} with AI tone",

    "cta.extract": "🎵 Extract Songs",
    "cta.extract.sub": "From the Songsterr tab",
    "cta.ai_generate": "⚡ Generate AI Tones",
    "cta.ai_generate.sub.web": "Via ChatGPT",
    "cta.ai_generate.sub.manual": "Manual copy-paste",

    "panel.open": "Open side panel",
    "panel.close": "Close side panel",

    "search.placeholder": "Search songs…",
    "search.clear_title": "Clear search",
    "filter.all": "All",

    "settings.title": "⚙️ Settings",
    "settings.summary.default": "Default",
    "settings.summary.web": "ChatGPT Web",
    "settings.summary.manual": "Manual",
    "settings.provider": "AI Provider",
    "settings.provider.web": "ChatGPT Web",
    "settings.provider.manual": "Manual",
    "settings.provider.status.web_ready": "ChatGPT tab ready ✓",
    "settings.provider.status.web_no_tab": "ChatGPT tab not open — opens automatically when needed.",
    "settings.provider.status.web_not_logged_in": "ChatGPT tab open but not logged in. Sign in first.",
    "settings.provider.status.manual": "Prompt is copied to clipboard; paste the JSON response back into the modal.",
    "settings.tone_character": "Tone character",
    "settings.tone.lofi": "Lofi",
    "settings.tone.modern": "Modern",
    "settings.tone.mood.lofi": "lofi · soft",
    "settings.tone.mood.warm": "warm · groove",
    "settings.tone.mood.balanced": "balanced",
    "settings.tone.mood.modern": "modern · clean",
    "settings.tone.mood.sharp": "modern · sharp",
    "settings.list_title": "List name",
    "settings.prompt_context": "Prompt prefix",
    "settings.prompt_suffix": "Prompt suffix",
    "settings.sort": "Sort",
    "settings.sort.order": "Manual order",
    "settings.sort.oldest": "Oldest → Newest",
    "settings.sort.newest": "Newest → Oldest",
    "settings.sort.rating": "Stars (5→0)",
    "settings.language": "Dil / Language",

    "more.title": "⋯ More",
    "more.copy_prompt": "📋 Copy Prompt",
    "more.copy_names": "🎵 Copy Names",
    "more.download_txt": "⬇️ Download TXT",
    "more.download_json": "⬇️ Download JSON",
    "more.upload_json": "⬆️ Upload JSON",
    "more.clear_list": "🗑️ Clear Entire List",

    "ai.bridge.title": "🤖 AI Bridge",
    "ai.bridge.pill.waiting": "Waiting for JSON",
    "ai.bridge.pill.has_content": "Has content",
    "ai.bridge.helper": "JSON, code block, or plain text — the system parses it.",
    "ai.bridge.placeholder": "Paste ChatGPT JSON output.",
    "ai.bridge.apply": "Apply",
    "manual.title": "Manual AI flow",
    "manual.step1": "Prompt copied to clipboard. Paste it in ChatGPT and get the JSON answer.",
    "manual.step2": "Paste the response here:",
    "manual.placeholder": '[{"title":"...","tone":{...},"fx":{...}}]',
    "manual.apply": "Apply",
    "manual.close": "Close",

    "song.knobplate.title": "Marcus Miller V3 MA · 2nd Gen 4-string",
    "song.knob.active": "Active",
    "song.knob.tone": "Tone",
    "song.knob.blend": "Blend",
    "song.knob.treble": "Treble",
    "song.knob.mid": "Mid",
    "song.knob.midhz": "Mid Hz",
    "song.knob.bass": "Bass",
    "song.fx.label": "Effects",
    "song.btn.regen_yenile": "↻ Regen AI",
    "song.btn.regen_uret": "⚡ Generate AI",
    "song.btn.reset_ai": "↺ Reset to AI",
    "song.btn.copy_tone": "📋 Copy Tone",
    "song.btn.delete": "🗑️ Delete",
    "song.similar.title": "🎚️ Similar-tone songs (knob diff < 10)",
    "song.similar.very_close": "● very close",
    "song.similar.close": "● close",
    "song.similar.similar": "● similar",
    "song.tooltip.personalized": "Personalized",
    "song.empty.no_songs": "No songs yet.",
    "song.empty.cta_extract": "Open a Songsterr tab, then click Extract Songs.",
    "song.empty.no_filter_match": "No songs match the filter.",
    "song.empty.cta_clear": "Clear filter",

    "state.favorite": "Fav",
    "state.listen": "Listen",
    "state.play": "Play",
    "state.tried": "Tried",
    "state.ai_tab": "AI Tab",
    "state.stage": "Stage",

    "banner.extracting": "Extracting songs",
    "banner.extracting.detail": "Reading Songsterr data from the active tab…",
    "banner.extracted": "{n} songs processed",
    "banner.extract_error": "Could not extract songs",

    "banner.ai.starting": "Generating AI tones",
    "banner.ai.connecting": "Connecting to ChatGPT for {n} songs…",
    "banner.ai.step.flow_start": "Starting",
    "banner.ai.step.tab_found": "ChatGPT tab found",
    "banner.ai.step.opening_tab": "Opening ChatGPT tab",
    "banner.ai.step.tab_opened": "ChatGPT tab opened",
    "banner.ai.step.cs_ready": "ChatGPT page ready",
    "banner.ai.step.injecting": "Injecting script manually",
    "banner.ai.step.cs_ready_injected": "Script injected, ready",
    "banner.ai.step.auth_checked": "Login state verified",
    "banner.ai.step.batch_send": "Batch sent to ChatGPT",
    "banner.ai.step.batch_response": "ChatGPT response received",
    "banner.ai.step.batch_parsed": "JSON parsed",
    "banner.ai.batch_progress": "Batch {cur}/{total} · {p}/{t} songs",
    "banner.ai.applied": "AI tone applied to {n} songs",
    "banner.ai.summary": "Total {total} songs · {ai} with AI tone",
    "banner.ai.failed": "AI generation failed",
    "banner.ai.empty_response": "Empty response",
    "banner.ai.empty_response_detail": "ChatGPT replied but no usable tone was found.",
    "banner.ai.no_candidates_title": "All songs already have AI tone ✓",
    "banner.ai.no_candidates_detail": "{n} songs already processed",
    "banner.ai.need_songs": "Extract songs first",
    "banner.ai.need_songs_detail": 'Song list is empty. Start with "Extract Songs".',

    "banner.manual.started": "Manual flow started",
    "banner.manual.detail": "Prompt copied to clipboard ({n} songs). Paste in ChatGPT, return the JSON to the modal.",
    "banner.manual.no_json": "No JSON",
    "banner.manual.no_json_detail": "Waiting for ChatGPT response to paste.",
    "banner.manual.parsing": "Parsing",
    "banner.manual.parsing_detail": "Processing ChatGPT response…",
    "banner.manual.applied": "AI tones applied",

    "banner.regen.busy": "Generating AI tone",
    "banner.regen.busy_detail": 'Connecting to ChatGPT for "{title}"…',
    "banner.regen.done": '"{title}" updated',
    "banner.regen.done_detail": "AI tone applied",

    "banner.copied.names": "Song names copied",
    "banner.copied.names_detail": "{n} lines copied to clipboard",
    "banner.copied.prompt": "Prompt copied",
    "banner.copied.prompt_detail": "{n} characters copied. Paste it into ChatGPT.",
    "banner.copy_error": "Copy error",
    "banner.downloaded.txt": "TXT downloaded",
    "banner.downloaded.json": "JSON downloaded",
    "banner.downloaded.detail": "Saved to your Downloads folder.",
    "banner.download_error": "Download error",

    "banner.cleared": "List cleared",
    "banner.cleared_detail": "{n} songs deleted",
    "banner.empty_list": "List already empty",
    "banner.empty_list_detail": "Nothing to delete.",
    "banner.clear_confirm": "{n} songs will be deleted. This cannot be undone.\n\nProceed?",
    "banner.ai_confirm": "Tone will be generated via ChatGPT for {n} songs.\n\nThis uses the chatgpt.com tab. Don't interact with that page.\nProceed?",

    "banner.import_json": "Loading JSON",
    "banner.import_json.done": "JSON loaded",
    "banner.import_json.done_detail": "{n} records processed · {added} new · {updated} updated",
    "banner.import_json.error": "JSON load failed",
    "banner.import_json.no_array": "No valid song array found.",

    "misc.error_prefix": "Error",
    "misc.error": "Error",
    "misc.unknown_error": "Unknown error",
    "misc.song_deleted": "Song deleted.",
    "misc.song_tone_copied": "Song tone copied.",
    "misc.song_line_copied": "Song line copied.",
    "misc.clipboard_error": "Clipboard error"
  }
};

const I18N_DEFAULT_LANG = "tr";
let __activeLang = I18N_DEFAULT_LANG;

function setLang(lang) {
  __activeLang = (TRANSLATIONS[lang] ? lang : I18N_DEFAULT_LANG);
}

function getLang() {
  return __activeLang;
}

function t(key, params) {
  const table = TRANSLATIONS[__activeLang] || TRANSLATIONS[I18N_DEFAULT_LANG];
  let s = table[key];
  if (s == null) {
    // fallback to the other language; if still missing, return the key itself
    const other = TRANSLATIONS[I18N_DEFAULT_LANG];
    s = other?.[key];
    if (s == null) return key;
  }
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_m, k) => (k in params ? String(params[k]) : `{${k}}`));
}

// Apply data-i18n attributes:
//   data-i18n="key"            → element.textContent = t(key)
//   data-i18n-placeholder="k"  → element.placeholder = t(k)
//   data-i18n-title="k"        → element.title = t(k)
//   data-i18n-aria-label="k"   → element.setAttribute('aria-label', t(k))
function applyTranslations(root) {
  const r = root || document;
  r.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
  r.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  r.querySelectorAll("[data-i18n-title]").forEach(el => {
    el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
  });
  r.querySelectorAll("[data-i18n-aria-label]").forEach(el => {
    el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria-label")));
  });
}

// Make available globally for app.js
window.t = t;
window.setLang = setLang;
window.getLang = getLang;
window.applyTranslations = applyTranslations;
window.TRANSLATIONS = TRANSLATIONS;
