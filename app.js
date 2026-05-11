// State keys are stable; labels resolved via t() at render time
const STATE_KEYS = ["favorite", "listen", "play", "tried", "ai_tab", "stage"];
function stateLabel(key) {
  return (typeof t === "function") ? t(`state.${key}`) : key;
}
// Legacy shape kept for any existing code reads
const STATES = STATE_KEYS.map(k => ({ key: k, get label() { return stateLabel(k); } }));

const els = {
  status: document.getElementById("status"),
  songList: document.getElementById("song-list"),
  extractBtn: document.getElementById("extract-btn"),
  copyNamesBtn: document.getElementById("copy-names-btn"),
  copyPromptBtn: document.getElementById("copy-prompt-btn"),
  importAiBtn: document.getElementById("import-ai-btn"),
  importAiBridgeBtn: document.getElementById("import-ai-bridge-btn"),
  downloadTxtBtn: document.getElementById("download-txt-btn"),
  downloadJsonBtn: document.getElementById("download-json-btn"),
  openPanelBtn: document.getElementById("open-panel-btn"),
  searchInput: document.getElementById("search-input"),
  sortMode: document.getElementById("sort-mode"),
  toneVariation: document.getElementById("tone-variation"),
  toneVariationLabel: document.getElementById("tone-variation-label"),
  toneVariationMood: document.getElementById("tone-variation-mood"),
  summary: document.getElementById("summary"),
  filterChips: document.getElementById("filter-chips"),
  counts: document.getElementById("counts"),
  clearSearchBtn: document.getElementById("clear-search-btn"),
  promptTitle: document.getElementById("prompt-title"),
  promptContext: document.getElementById("prompt-context"),
  promptSuffix: document.getElementById("prompt-suffix"),
  aiImport: document.getElementById("ai-import"),
  aiStatus: document.getElementById("ai-status"),
  aiBridgeCard: document.getElementById("ai-bridge-card"),
  aiBridgePill: document.getElementById("ai-bridge-pill"),
  setupCard: document.getElementById("setup-card"),
  setlistModeBtn: document.getElementById("setlist-mode-btn"),
  compactModeBtn: document.getElementById("compact-mode-btn"),
  autoImportBtn: document.getElementById("auto-import-btn"),
  providerSegment: document.getElementById("provider-segment"),
  providerStatus: document.getElementById("provider-status"),
  viewModeSegment: document.getElementById("view-mode-segment"),
  toastContainer: document.getElementById("toast-container"),

  // v5 elements
  statusBanner: document.getElementById("status-banner"),
  statusIcon: document.getElementById("status-icon"),
  statusTitle: document.getElementById("status-title"),
  statusMeta: document.getElementById("status-meta"),
  statusProgress: document.getElementById("status-progress"),
  statusProgressFill: document.getElementById("status-progress-fill"),
  aiGenerateBtn: document.getElementById("ai-generate-btn"),
  aiGenerateSub: document.getElementById("ai-generate-sub"),
  extractSub: document.getElementById("extract-sub"),
  manualAiModal: document.getElementById("manual-ai-modal"),
  manualAiClose: document.getElementById("manual-ai-close"),
  manualAiInput: document.getElementById("manual-ai-input"),
  manualAiApply: document.getElementById("manual-ai-apply"),
  settingsCard: document.getElementById("settings-card"),
  settingsSummary: document.getElementById("settings-summary"),
  clearListBtn: document.getElementById("clear-list-btn"),
  importJsonBtn: document.getElementById("import-json-btn"),
  importJsonInput: document.getElementById("import-json-input"),
  languageSegment: document.getElementById("language-segment")
};

const CTX = (document.body?.dataset?.context === "sidepanel") ? "sidepanel" : "popup";
const DEFAULT_VIEW_MODE = "cards"; // v5.1: single mode, no UI toggle

const state = {
  songs: [],
  settings: {},
  filter: "all",
  search: "",
  viewMode: DEFAULT_VIEW_MODE,
  aiProvider: "manual"
};

// === v5 Status Banner — single source of truth for visible status ===
const BANNER_STATES = { idle: "●", busy: "⟳", success: "✓", error: "!" };
let bannerResetTimer = null;
let bannerProgressTimer = null;

function bannerSet(stateKey, title, meta = "", { progress, sticky = false } = {}) {
  if (els.statusBanner) {
    els.statusBanner.setAttribute("data-state", stateKey);
  }
  if (els.statusIcon) {
    els.statusIcon.textContent = BANNER_STATES[stateKey] || "●";
  }
  if (els.statusTitle) els.statusTitle.textContent = title;
  if (els.statusMeta) els.statusMeta.textContent = meta;
  if (els.statusProgress && els.statusProgressFill) {
    if (typeof progress === "number") {
      els.statusProgress.hidden = false;
      els.statusProgressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
    } else {
      els.statusProgress.hidden = true;
      els.statusProgressFill.style.width = "0%";
    }
  }
  // Legacy hidden status span — keep for tests
  if (els.status) els.status.textContent = title;

  clearTimeout(bannerResetTimer);
  if (!sticky && (stateKey === "success" || stateKey === "error")) {
    bannerResetTimer = setTimeout(() => bannerToIdle(), 6000);
  }
}

function bannerToIdle() {
  const songCount = state.songs?.length || 0;
  const aiCount = (state.songs || []).filter(s => s.aiTone || s.aiFx).length;
  bannerSet("idle", t("status.ready"),
    songCount === 0 ? t("status.no_data")
                    : t("status.songs_summary", { n: songCount, ai: aiCount }));
}

// Legacy setStatus → routes to banner so old code paths still update something visible
function setStatus(text, type = "") {
  // Map old types to banner states
  const stateKey = type === "ok" ? "success"
                 : type === "error" ? "error"
                 : type === "busy" ? "busy"
                 : "idle";
  // For idle/info messages without explicit type, leave banner alone (use as label)
  if (!type && els.statusBanner?.getAttribute("data-state") === "busy") return;
  bannerSet(stateKey, text);
}

function toast(message, type = "") {
  if (!els.toastContainer) {
    setStatus(message, type);
    return;
  }
  const t = document.createElement("div");
  t.className = `toast ${type ? "toast-" + type : ""}`.trim();
  t.textContent = message;
  els.toastContainer.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transition = "opacity 200ms";
    setTimeout(() => t.remove(), 220);
  }, 2400);
}

function songId(song) {
  return song.id || (song.url ? `url:${song.url}` : `title:${String(song.title || "").trim().toLowerCase()}`);
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeText(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function filteredSongs() {
  const query = normalizeText(state.search);
  let list = sortSongsByOrder(state.songs, state.settings.sortMode || DEFAULT_SETTINGS.sortMode);

  if (state.filter !== "all") {
    list = list.filter(song => Array.isArray(song.states) && song.states.includes(state.filter));
  }

  if (query) {
    list = list.filter(song => {
      const hay = normalizeText([
        song.title,
        song.artist,
        song.genre,
        song.note,
        song.toneNotee,
        song.source,
        Array.isArray(song.states) ? song.states.join(" ") : "",
        song.aiTone ? "ai imported" : ""
      ].join(" "));
      return hay.includes(query);
    });
  }

  return list;
}

function syncSettingsUI() {
  if (els.promptTitle) els.promptTitle.value = state.settings.listTitle || DEFAULT_SETTINGS.listTitle;
  if (els.promptContext) els.promptContext.value = state.settings.promptContext || DEFAULT_SETTINGS.promptContext;
  if (els.promptSuffix) els.promptSuffix.value = state.settings.promptSuffix || DEFAULT_SETTINGS.promptSuffix;
  if (els.sortMode) els.sortMode.value = state.settings.sortMode || DEFAULT_SETTINGS.sortMode;
  const toneValue = state.settings.toneVariation ?? DEFAULT_SETTINGS.toneVariation;
  if (els.toneVariation) els.toneVariation.value = String(toneValue);
  if (els.toneVariationLabel) els.toneVariationLabel.textContent = String(toneValue);
  if (els.toneVariationMood) els.toneVariationMood.textContent = moodLabel(toneValue);

  state.viewMode = DEFAULT_VIEW_MODE;
  state.aiProvider = state.settings.aiProvider || "chatgpt-web";

  // Sync language radio to current lang
  if (els.languageSegment) {
    const curLang = (typeof getLang === "function") ? getLang() : (state.settings.language || "tr");
    els.languageSegment.querySelectorAll('input[type="radio"]').forEach(r => {
      r.checked = (r.value === curLang);
    });
  }

  syncViewModeUI();
  syncProviderUI();
}

function computeOverview() {
  const songs = state.songs;
  const counts = computeStateCounts(songs);
  const genres = computeGenreCounts(songs);
  const flow = Number(state.settings.toneVariation ?? DEFAULT_SETTINGS.toneVariation);
  const topGenre = genres[0] ? `${genres[0].genre} (${genres[0].count})` : "yok";
  const aiCount = songs.filter(song => song.aiTone || song.aiFx).length;

  return [
    `${songs.length} şarkı`,
    `${filteredSongs().length} görünür`,
    `Favori ${counts.favorite}`,
    `Stage ${counts.stage}`,
    `AI ${aiCount}`,
    `Lofi ↔ Modern ${flow}/100`,
    `Üst genre: ${topGenre}`
  ];
}

function renderFilterChips() {
  if (!els.filterChips) return;
  const chips = [{ key: "all", label: t("filter.all") }, ...STATE_KEYS.map(k => ({ key: k, label: stateLabel(k) }))];
  els.filterChips.innerHTML = chips.map(chip => {
    const active = state.filter === chip.key ? "active" : "";
    return `<button class="chip ${active}" data-filter="${escapeHtml(chip.key)}">${escapeHtml(chip.label)}</button>`;
  }).join("");
  els.filterChips.querySelectorAll("[data-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.filter = btn.getAttribute("data-filter");
      renderFilterChips();
      renderSongs();
      renderCounts();
    });
  });
}

function renderCounts() {
  if (!els.counts) return;
  const items = computeOverview();
  els.counts.innerHTML = items.map(item => `<span class="pill accent">${escapeHtml(item)}</span>`).join("");
}

// === v5.3: Marcus Miller V3 knob component ===
// v5.4: Volume removed (master output, not tone-defining)
const KNOB_SPECS = [
  { key: "miniTone",   label: "Tone",    min: 0, max: 100, bipolar: false },
  { key: "blendNeck",  label: "Blend",   min: 0, max: 100, bipolar: false, fmt: (v) => v < 45 ? `N${50 - v}` : v > 55 ? `B${v - 50}` : "—" },
  { key: "treble",     label: "Treble",  min: 0, max: 100, bipolar: true,  fmt: (v) => fmtBipolar(v) },
  { key: "mid",        label: "Mid",     min: 0, max: 100, bipolar: true,  fmt: (v) => fmtBipolar(v) },
  { key: "midFreqHz",  label: "Mid Hz",  min: 200, max: 800, bipolar: false, fmt: (v) => `${v}Hz` },
  { key: "bass",       label: "Bass",    min: 0, max: 100, bipolar: true,  fmt: (v) => fmtBipolar(v) }
];

function fmtBipolar(v) {
  const off = Math.round((v || 50) - 50);
  if (off === 0) return "0";
  return (off > 0 ? "+" : "") + off;
}

function knobValueToAngle(value, spec) {
  const v = Math.max(spec.min, Math.min(spec.max, Number(value) || (spec.bipolar ? (spec.min + spec.max) / 2 : spec.min)));
  const norm = (v - spec.min) / (spec.max - spec.min);  // 0..1
  return -135 + norm * 270;  // -135deg .. +135deg
}

function buildKnob(spec, currentValue, aiValue) {
  const v = currentValue ?? (spec.bipolar ? (spec.min + spec.max) / 2 : spec.min);
  const angle = knobValueToAngle(v, spec);
  const display = spec.fmt ? spec.fmt(v) : Math.round(v);
  const aiDifferent = aiValue != null && Math.abs(Number(aiValue) - Number(v)) > 0.01;
  const tickMark = spec.bipolar ? `<line x1="30" y1="3" x2="30" y2="9" class="knob-tick" />` : "";
  return `
    <div class="knob" data-knob="${spec.key}" data-min="${spec.min}" data-max="${spec.max}" data-bipolar="${spec.bipolar}" data-ai-value="${aiValue ?? ''}">
      <svg class="knob-svg" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="26" class="knob-bg" />
        <circle cx="30" cy="30" r="22" fill="url(#knobGradient)" />
        ${tickMark}
        <line x1="30" y1="30" x2="30" y2="12" class="knob-indicator" transform="rotate(${angle} 30 30)" />
      </svg>
      <div class="knob-readout ${aiDifferent ? 'modified' : ''}" title="${aiDifferent ? `AI: ${aiValue}` : ''}">${display}</div>
      <div class="knob-label">${spec.label}</div>
    </div>
  `;
}

function buildActiveSwitch(isOn, aiActive) {
  return `
    <div class="knob-switch" data-knob="active" data-ai-value="${aiActive ?? ''}">
      <button class="knob-switch-toggle ${isOn ? 'on' : ''}" data-action="toggle-active" aria-pressed="${isOn}" title="Active EQ on/off"></button>
      <div class="knob-readout">${isOn ? 'ON' : 'OFF'}</div>
      <div class="knob-label">Active</div>
    </div>
  `;
}

function buildStarRating(rating) {
  const r = Math.max(0, Math.min(5, rating || 0));
  let html = '<div class="star-rating" role="radiogroup" aria-label="Yıldız puanı">';
  for (let i = 1; i <= 5; i++) {
    html += `<button type="button" class="star ${i <= r ? 'on' : ''}" data-action="set-rating" data-rating="${i}" title="${i} yıldız">★</button>`;
  }
  html += "</div>";
  return html;
}

function buildKnobPlate(song) {
  const finalTone = effectiveTone(song);
  const aiTone = song.aiTone || {};
  const isActive = finalTone.active !== false;
  // v5.4: passive row = Active + Tone + Blend (3 items, Volume removed)
  return `
    <div class="knob-plate">
      <div class="knob-plate-title">Marcus Miller V3 MA · 2nd Gen 4-string</div>
      <div class="knob-row passive cols-3">
        ${buildActiveSwitch(isActive, aiTone.active)}
        ${buildKnob(KNOB_SPECS[0], finalTone.miniTone, aiTone.miniTone)}
        ${buildKnob(KNOB_SPECS[1], finalTone.blendNeck, aiTone.blendNeck)}
      </div>
      <div class="knob-row active">
        ${buildKnob(KNOB_SPECS[2], finalTone.treble, aiTone.treble)}
        ${buildKnob(KNOB_SPECS[3], finalTone.mid, aiTone.mid)}
        ${buildKnob(KNOB_SPECS[4], finalTone.midFreqHz, aiTone.midFreqHz)}
        ${buildKnob(KNOB_SPECS[5], finalTone.bass, aiTone.bass)}
      </div>
    </div>
  `;
}

function effectiveTone(song) {
  const ai = song.aiTone || {};
  const user = song.userTone || {};
  return {
    active: (user.active != null) ? user.active : (ai.active != null ? ai.active : true),
    miniTone: user.miniTone ?? ai.miniTone ?? 50,
    blendNeck: user.blendNeck ?? ai.blendNeck ?? 50,
    treble: user.treble ?? ai.treble ?? 50,
    mid: user.mid ?? ai.mid ?? 50,
    midFreqHz: user.midFreqHz ?? ai.midFreqHz ?? 500,
    bass: user.bass ?? ai.bass ?? 55
  };
}

// v5.4.1: Strict similarity for "Yakın tonlu şarkılar"
// HARD requirements (otherwise NOT similar):
//   1. Active state matches (passive vs active EQ → tonally different worlds)
//   2. Blend pickup side matches (neck-heavy vs bridge-heavy = totally different feel)
//   3. Every knob diff < 10 units (10% of range; freq: 60Hz of 200-800)

const BLEND_NEUTRAL_LO = 45;
const BLEND_NEUTRAL_HI = 55;

function blendSide(blendNeck) {
  if (blendNeck < BLEND_NEUTRAL_LO) return "neck";
  if (blendNeck > BLEND_NEUTRAL_HI) return "bridge";
  return "balanced";
}

function isToneSimilar(a, b) {
  if (a.active !== b.active) return false;
  if (blendSide(a.blendNeck) !== blendSide(b.blendNeck)) return false;
  const knobs = ["miniTone", "blendNeck", "treble", "mid", "bass"];
  for (const k of knobs) {
    if (Math.abs((a[k] ?? 50) - (b[k] ?? 50)) >= 10) return false;
  }
  // 60 Hz = ~10 units of 200-800Hz range (600 wide)
  if (Math.abs((a.midFreqHz ?? 500) - (b.midFreqHz ?? 500)) >= 60) return false;
  return true;
}

function maxKnobDiff(a, b) {
  const knobs = ["miniTone", "blendNeck", "treble", "mid", "bass"];
  let max = 0;
  for (const k of knobs) {
    const d = Math.abs((a[k] ?? 50) - (b[k] ?? 50));
    if (d > max) max = d;
  }
  const fd = Math.abs((a.midFreqHz ?? 500) - (b.midFreqHz ?? 500)) / 6;
  if (fd > max) max = fd;
  return max;
}

function findSimilarSongs(target, allSongs, k = 6) {
  const targetId = songId(target);
  if (!target.aiTone && !target.userTone) return [];
  const targetTone = effectiveTone(target);
  return allSongs
    .filter(s => songId(s) !== targetId && (s.aiTone || s.userTone))
    .map(s => ({ song: s, tone: effectiveTone(s) }))
    .filter(({ tone }) => isToneSimilar(targetTone, tone))
    .map(o => ({ ...o, diff: maxKnobDiff(targetTone, o.tone) }))
    .sort((a, b) => a.diff - b.diff)
    .slice(0, k);
}

function buildSimilarSongsSection(targetSong) {
  const similar = findSimilarSongs(targetSong, state.songs);
  if (!similar.length) return "";
  const items = similar.map(({ song, diff }) => {
    const sid = songId(song);
    const stars = (song.rating || 0);
    const starHtml = stars > 0 ? "★".repeat(stars) : "";
    const closeness = diff < 3 ? t("song.similar.very_close")
                    : diff < 6 ? t("song.similar.close")
                               : t("song.similar.similar");
    return `
      <button class="similar-song-row" data-action="goto-song" data-id="${escapeHtml(sid)}">
        <div class="similar-song-title">${escapeHtml(song.title)}</div>
        <div class="similar-song-meta">
          ${starHtml ? `<span class="similar-stars">${starHtml}</span>` : ""}
          <span class="similar-dist">${closeness}</span>
        </div>
      </button>
    `;
  }).join("");
  return `
    <div class="similar-songs-section">
      <div class="similar-songs-title">${escapeHtml(t("song.similar.title"))}</div>
      <div class="similar-songs-list">${items}</div>
    </div>
  `;
}

// SVG gradient defs — referenced by all knobs, injected once per render
const KNOB_DEFS_SVG = `
  <svg width="0" height="0" style="position:absolute;pointer-events:none">
    <defs>
      <radialGradient id="knobGradient" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stop-color="#5a5249"/>
        <stop offset="50%" stop-color="#3a342d"/>
        <stop offset="100%" stop-color="#1a1612"/>
      </radialGradient>
    </defs>
  </svg>
`;

function buildSongCard(song, index, songs) {
  const id = songId(song);
  const genre = song.genre && song.genre !== "unknown" ? song.genre : "unknown";
  const tone = buildToneCard(song, state.settings, index, songs);
  const aiBadge = tone.isAi ? `<span class="pill warn">AI</span>` : `<span class="pill">Heuristic</span>`;
  const order = Number.isFinite(song.order) ? song.order + 1 : index + 1;
  const dateText = formatShortDate(song.addedAt);

  const hasAi = !!(song.aiTone || song.aiFx);
  const expanded = song.expanded === true;
  const fxText = (tone.effectText || "").trim();
  const stateBadges = (song.states || []).slice(0, 3).map(s => {
    if (!STATE_KEYS.includes(s)) return "";
    return `<span class="pill ok">${escapeHtml(stateLabel(s))}</span>`;
  }).join("");
  const hasUserEdit = !!song.userTone && Object.keys(song.userTone).length > 0;

  // v5.4: subtitle = artist + genre (no source fallback)
  const subPieces = [];
  if (song.artist) subPieces.push(song.artist);
  if (genre !== 'unknown') subPieces.push(genre);
  const subText = subPieces.join(" · ");

  return `
    <div class="song ${tone.isAi ? 'song-ai' : ''} ${hasAi ? 'has-ai' : ''} ${expanded ? 'is-expanded' : ''}" data-song-id="${escapeHtml(id)}" draggable="true">
      <div class="song-row-head" data-action="toggle-expand" data-id="${escapeHtml(id)}">
        <span class="chevron">▶</span>
        <div class="song-row-title">
          <div class="song-name">${escapeHtml(song.title)}</div>
          ${subText ? `<div class="song-artist">${escapeHtml(subText)}</div>` : ''}
          ${buildStarRating(song.rating || 0)}
        </div>
        <div class="song-row-meta">
          ${stateBadges}
          ${aiBadge}
          ${hasUserEdit ? `<span class="pill accent" title="${escapeHtml(t("song.tooltip.personalized"))}">●</span>` : ''}
        </div>
      </div>

      <div class="song-body">
        ${buildKnobPlate(song)}

        ${fxText ? `
        <div class="song-fx-section">
          <div class="label">Effects</div>
          <div>${escapeHtml(fxText)}</div>
        </div>
        ` : ''}

        <div class="song-body-controls">
          <button data-action="regen-ai" data-id="${escapeHtml(id)}" class="primary">${hasAi ? escapeHtml(t("song.btn.regen_yenile")) : escapeHtml(t("song.btn.regen_uret"))}</button>
          ${hasUserEdit ? `<button data-action="reset-knobs" data-id="${escapeHtml(id)}" class="reset-knob-btn">${escapeHtml(t("song.btn.reset_ai"))}</button>` : ''}
          <button data-action="copy-song-prompt" data-id="${escapeHtml(id)}">${escapeHtml(t("song.btn.copy_tone"))}</button>
          ${STATE_KEYS.map(k => {
            const on = Array.isArray(song.states) && song.states.includes(k);
            return `<button data-action="toggle-state" data-id="${escapeHtml(id)}" data-state="${escapeHtml(k)}" aria-pressed="${on}" class="${on ? 'is-on' : ''}">${escapeHtml(stateLabel(k))}</button>`;
          }).join("")}
          <button data-action="move-up" data-id="${escapeHtml(id)}">▲</button>
          <button data-action="move-down" data-id="${escapeHtml(id)}">▼</button>
          <button data-action="remove" data-id="${escapeHtml(id)}" class="danger">${escapeHtml(t("song.btn.delete"))}</button>
        </div>

        ${buildSimilarSongsSection(song)}
      </div>
    </div>
  `;
}

function renderSongs() {
  if (!els.songList) return;
  const songs = filteredSongs();
  if (!songs.length) {
    const totalSongs = state.songs.length;
    els.songList.innerHTML = totalSongs === 0
      ? `<div class="empty">
          <div>${escapeHtml(t("song.empty.no_songs"))}</div>
          <div class="helper">${escapeHtml(t("song.empty.cta_extract"))}</div>
        </div>`
      : `<div class="empty">
          <div>${escapeHtml(t("song.empty.no_filter_match"))}</div>
          <button class="empty-cta" id="empty-clear-cta">${escapeHtml(t("song.empty.cta_clear"))}</button>
        </div>`;
    renderCounts();
    const extCta = document.getElementById("empty-extract-cta");
    if (extCta) extCta.addEventListener("click", () => els.extractBtn?.click());
    const clrCta = document.getElementById("empty-clear-cta");
    if (clrCta) clrCta.addEventListener("click", () => els.clearSearchBtn?.click());
    return;
  }

  const displaySongs = songs;
  els.songList.className = `song-list ${state.viewMode === "setlist" ? "setlist-mode" : state.viewMode === "compact" ? "compact-mode" : ""}`.trim();
  els.songList.innerHTML = KNOB_DEFS_SVG + displaySongs.map((song, index) => buildSongCard(song, index, songs)).join("");

  bindSongActions();
  bindKnobDrag();
}

function bindSongActions() {
  // Toggle expand/collapse on song row head click
  els.songList.querySelectorAll('[data-action="toggle-expand"]').forEach(head => {
    head.addEventListener("click", async (e) => {
      // Don't toggle if click was on a star or other interactive child
      if (e.target.closest('.star') || e.target.closest('button')) return;
      const id = head.getAttribute("data-id");
      const song = state.songs.find(s => songId(s) === id);
      if (!song) return;
      song.expanded = !song.expanded;
      await saveSongs(state.songs);
      renderSongs();
    });
  });

  // Star rating
  els.songList.querySelectorAll('[data-action="set-rating"]').forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const ratingStr = btn.getAttribute("data-rating");
      const newRating = parseInt(ratingStr, 10);
      const head = btn.closest('.song-row-head');
      const id = head?.getAttribute("data-id");
      if (!id) return;
      const song = state.songs.find(s => songId(s) === id);
      if (!song) return;
      // Click same rating again → clear
      song.rating = (song.rating === newRating) ? 0 : newRating;
      await saveSongs(state.songs);
      renderSongs();
    });
  });

  // Active switch
  els.songList.querySelectorAll('[data-action="toggle-active"]').forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const songEl = btn.closest('.song');
      const id = songEl?.getAttribute("data-song-id");
      if (!id) return;
      const song = state.songs.find(s => songId(s) === id);
      if (!song) return;
      const cur = effectiveTone(song);
      song.userTone = { ...(song.userTone || {}), active: !cur.active };
      song.userToneUpdatedAt = Date.now();
      await saveSongs(state.songs);
      renderSongs();
    });
  });

  // v5.4: jump to similar song (collapse current, expand target, scroll into view)
  els.songList.querySelectorAll('[data-action="goto-song"]').forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute("data-id");
      const target = state.songs.find(s => songId(s) === targetId);
      if (!target) return;
      // Collapse all others, expand target
      state.songs.forEach(s => { s.expanded = (songId(s) === targetId); });
      await saveSongs(state.songs);
      renderSongs();
      // Scroll target into view
      requestAnimationFrame(() => {
        const targetEl = els.songList.querySelector(`.song[data-song-id="${CSS.escape(targetId)}"]`);
        if (targetEl) targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  });

  // Reset knobs to AI
  els.songList.querySelectorAll('[data-action="reset-knobs"]').forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      const song = state.songs.find(s => songId(s) === id);
      if (!song) return;
      song.userTone = null;
      song.userFx = null;
      song.userToneUpdatedAt = null;
      await saveSongs(state.songs);
      renderSongs();
    });
  });

  els.songList.querySelectorAll('[data-action="toggle-state"]').forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await toggleState(btn.getAttribute("data-id"), btn.getAttribute("data-state"));
      await loadState();
    });
  });

  els.songList.querySelectorAll('[data-action="genre-input"]').forEach(input => {
    input.addEventListener("change", async () => {
      await updateSongById(input.getAttribute("data-id"), { genre: input.value.trim() || "unknown" });
      await loadState();
    });
  });

  els.songList.querySelectorAll('[data-action="note-input"]').forEach(input => {
    input.addEventListener("change", async () => {
      await updateSongById(input.getAttribute("data-id"), { note: input.value.trim() });
      await loadState();
    });
  });

  els.songList.querySelectorAll('[data-action="tone-note-input"]').forEach(input => {
    input.addEventListener("change", async () => {
      await updateSongById(input.getAttribute("data-id"), { toneNotee: input.value.trim() });
      await loadState();
    });
  });

  els.songList.querySelectorAll('[data-action="remove"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      await removeSong(btn.getAttribute("data-id"));
      await loadState();
      setStatus("Şarkı silindi.", "ok");
    });
  });

  els.songList.querySelectorAll('[data-action="move-up"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      await moveSong(btn.getAttribute("data-id"), -1);
      await loadState();
    });
  });

  els.songList.querySelectorAll('[data-action="move-down"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      await moveSong(btn.getAttribute("data-id"), 1);
      await loadState();
    });
  });

  els.songList.querySelectorAll('[data-action="copy-song-prompt"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const song = state.songs.find(item => songId(item) === id);
      if (!song) return;
      const idx = filteredSongs().findIndex(item => songId(item) === id);
      const text = buildSongAnalysisBundle(song, state.settings, Math.max(0, idx), filteredSongs());
      await navigator.clipboard.writeText(text);
      setStatus("Şarkı tonu kopyalandı.", "ok");
    });
  });

  els.songList.querySelectorAll('[data-action="regen-ai"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const song = state.songs.find(item => songId(item) === id);
      if (!song) return;
      await runAiGenerateForSong(song);
    });
  });

  els.songList.querySelectorAll('[data-action="copy-song-line"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const song = state.songs.find(item => songId(item) === id);
      if (!song) return;
      const line = `${song.title} | ${song.genre || "unknown"}${song.note ? ` | ${song.note}` : ""}${song.toneNotee ? ` | ${song.toneNotee}` : ""}`;
      await navigator.clipboard.writeText(line);
      setStatus("Şarkı satırı kopyalandı.", "ok");
    });
  });
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

async function extractCurrentTabSongs() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("Active tab not found.");

  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const selectors = [
        'a[href*="/a/wsa/"]',
        'a[href*="/tabs/"]',
        'a[href*="/song/"]'
      ];

      const anchors = new Set();
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(a => anchors.add(a));
      });

      const items = [...anchors]
        .map((a, index) => {
          const text = (a.innerText || a.textContent || "").trim().replace(/\s+/g, " ");
          const lines = text.split("\n").map(part => part.trim()).filter(Boolean);
          const title = lines[0] || "";
          const artist = lines[1] || "";
          return {
            title,
            artist,
            url: a.href,
            source: "songsterr",
            genre: "unknown",
            states: [],
            order: index
          };
        })
        .filter(x => x.title && x.url);

      return Array.from(new Map(items.map(i => [i.url, i])).values());
    }
  });

  return result?.[0]?.result || [];
}

async function handleSidePanelToggle() {
  if (CTX === "sidepanel") {
    // Close self. Toolbar icon click reopens popup naturally.
    window.close();
    return;
  }
  // Popup → open side panel, then close popup.
  try {
    if (chrome.sidePanel?.open) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.windowId) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
        // Give Chrome a tick, then close popup so it doesn't overlap the panel.
        setTimeout(() => window.close(), 80);
        return;
      }
    }
  } catch (_err) {
    // fall through to floating window
  }
  await openBigPanel();
  setTimeout(() => window.close(), 80);
}

async function openBigPanel() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    if (chrome.sidePanel?.open && tab?.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
      setStatus("Side panel opened.");
      return;
    }
  } catch (_err) {}

  const url = chrome.runtime.getURL("sidepanel.html");
  const width = 820;
  const height = 920;
  const left = Math.max(0, (screen.availWidth || 1400) - width - 12);
  const top = Math.max(0, (screen.availHeight || 900) - height - 80);

  await chrome.windows.create({
    url,
    type: "popup",
    width,
    height,
    left,
    top
  });
  setStatus("Large popup window opened.");
}

async function saveSettingsFromUI() {
  const viewKey = CTX === "sidepanel" ? "sidepanelViewMode" : "popupViewMode";
  const next = {
    ...state.settings,
    listTitle: (els.promptTitle?.value || DEFAULT_SETTINGS.listTitle).trim() || DEFAULT_SETTINGS.listTitle,
    promptContext: (els.promptContext?.value || DEFAULT_SETTINGS.promptContext).trim() || DEFAULT_SETTINGS.promptContext,
    promptSuffix: (els.promptSuffix?.value || DEFAULT_SETTINGS.promptSuffix).trim() || DEFAULT_SETTINGS.promptSuffix,
    sortMode: els.sortMode?.value || DEFAULT_SETTINGS.sortMode,
    toneVariation: clamp(Number(els.toneVariation?.value ?? DEFAULT_SETTINGS.toneVariation), 0, 100),
    [viewKey]: state.viewMode || DEFAULT_VIEW_MODE,
    aiProvider: state.aiProvider || "manual",
    language: (typeof getLang === "function" ? getLang() : (state.settings.language || "tr"))
  };
  state.settings = next;
  await saveSettings(next);
  syncSettingsUI();
}

function moodLabel(value) {
  const v = Number(value) || 0;
  if (v <= 25) return t("settings.tone.mood.lofi");
  if (v <= 45) return t("settings.tone.mood.warm");
  if (v <= 60) return t("settings.tone.mood.balanced");
  if (v <= 78) return t("settings.tone.mood.modern");
  return t("settings.tone.mood.sharp");
}

function syncProviderUI() {
  const provider = state.aiProvider || "chatgpt-web";
  if (els.providerSegment) {
    els.providerSegment.querySelectorAll('input[type="radio"]').forEach(r => {
      r.checked = (r.value === provider);
    });
  }
  if (els.aiGenerateSub) {
    els.aiGenerateSub.textContent = provider === "chatgpt-web"
      ? "ChatGPT üzerinden"
      : "Manuel kopyala-yapıştır";
  }
  if (els.settingsSummary) {
    els.settingsSummary.textContent = provider === "chatgpt-web" ? t("settings.summary.web") : t("settings.summary.manual");
  }
  if (els.providerStatus) {
    if (provider === "chatgpt-web") {
      els.providerStatus.textContent = t("settings.provider.status.web_no_tab");
      checkChatGPTReadiness();
    } else {
      els.providerStatus.textContent = t("settings.provider.status.manual");
    }
  }
}

async function checkChatGPTReadiness() {
  if (!els.providerStatus) return;
  try {
    const res = await chrome.runtime.sendMessage({ type: "chatgpt:check" });
    if (!res?.ok) return;
    if (!res.present) {
      els.providerStatus.textContent = t("settings.provider.status.web_no_tab");
    } else if (res.loggedIn === false) {
      els.providerStatus.textContent = t("settings.provider.status.web_not_logged_in");
    } else {
      els.providerStatus.textContent = t("settings.provider.status.web_ready");
    }
  } catch (e) {}
}

async function runChatGPTAutoImport() {
  const candidates = state.songs.filter(s => !s.aiTone && !s.aiFx);
  if (!candidates.length) {
    bannerSet("success", t("banner.ai.no_candidates_title"),
      t("banner.ai.no_candidates_detail", { n: state.songs.length }));
    return;
  }

  const confirmed = window.confirm(t("banner.ai_confirm", { n: candidates.length }));
  if (!confirmed) return;

  bannerSet("busy", t("banner.ai.starting"), t("banner.ai.connecting", { n: candidates.length }));
  els.aiGenerateBtn?.setAttribute("disabled", "true");
  els.autoImportBtn?.setAttribute("disabled", "true");

  // Progress + step listener (labels resolved via t() per call)
  const STEP_KEY = {
    "flow-start": "banner.ai.step.flow_start",
    "tab-found": "banner.ai.step.tab_found",
    "opening-chatgpt-tab": "banner.ai.step.opening_tab",
    "tab-opened": "banner.ai.step.tab_opened",
    "content-script-ready": "banner.ai.step.cs_ready",
    "manual-inject-attempt": "banner.ai.step.injecting",
    "content-script-ready-after-inject": "banner.ai.step.cs_ready_injected",
    "auth-checked": "banner.ai.step.auth_checked",
    "batch-send": "banner.ai.step.batch_send",
    "batch-response": "banner.ai.step.batch_response",
    "batch-parsed": "banner.ai.step.batch_parsed"
  };
  const STEP_PROGRESS = {
    "flow-start": 5,
    "opening-chatgpt-tab": 10,
    "tab-opened": 18,
    "tab-found": 18,
    "content-script-ready": 28,
    "content-script-ready-after-inject": 28,
    "auth-checked": 32,
    "batch-send": 50,
    "batch-response": 80,
    "batch-parsed": 90
  };
  const totalCandidates = candidates.length;
  const progressListener = (msg) => {
    if (msg?.type === "auto-import:step") {
      const labelKey = STEP_KEY[msg.step];
      const label = labelKey ? t(labelKey) : msg.step;
      const pct = STEP_PROGRESS[msg.step];
      bannerSet("busy", t("banner.ai.starting"), label + (msg.detail ? ` · ${msg.detail}` : ""), { progress: pct });
      console.log("[BA-popup] step:", msg.step, msg.detail);
    } else if (msg?.type === "auto-import:progress" && msg.progress) {
      const p = msg.progress;
      if (p.status === "running") {
        const pct = 35 + Math.round((p.processedSongs / Math.max(1, p.totalSongs)) * 60);
        bannerSet("busy", t("banner.ai.starting"),
          t("banner.ai.batch_progress", { cur: p.currentBatch, total: p.totalBatches, p: p.processedSongs, t: p.totalSongs }),
          { progress: pct });
      }
    }
  };
  chrome.runtime.onMessage.addListener(progressListener);

  try {
    const res = await chrome.runtime.sendMessage({
      type: "auto-import:start",
      payload: {
        batchSize: 25,
        songs: candidates,
        settings: state.settings
      }
    });

    if (!res?.ok) {
      const errMsg = res?.error || t("misc.unknown_error");
      bannerSet("error", t("banner.ai.failed"), errMsg);
      return;
    }

    const arr = res.result?.results || [];
    if (!arr.length) {
      bannerSet("error", t("banner.ai.empty_response"), t("banner.ai.empty_response_detail"));
      return;
    }
    await importAiResults(JSON.stringify(arr));
    await loadState();
    bannerSet("success", t("banner.ai.applied", { n: arr.length }),
      t("banner.ai.summary", { total: state.songs.length, ai: state.songs.filter(s => s.aiTone || s.aiFx).length }));
  } catch (e) {
    const msg = e?.message || String(e);
    bannerSet("error", t("misc.error"), msg);
  } finally {
    chrome.runtime.onMessage.removeListener(progressListener);
    els.aiGenerateBtn?.removeAttribute("disabled");
    els.autoImportBtn?.removeAttribute("disabled");
  }
}

// === v5.2: Per-song AI generate (force regenerate, just one song) ===
async function runAiGenerateForSong(song) {
  if (!song) return;
  const provider = state.aiProvider || "chatgpt-web";
  const oneSong = [song];

  if (provider === "manual") {
    await openManualAiFlow(oneSong);
    return;
  }

  bannerSet("busy", t("banner.regen.busy"), t("banner.regen.busy_detail", { title: song.title }));
  const progressListener = (msg) => {
    if (msg?.type === "auto-import:step") {
      bannerSet("busy", t("banner.regen.busy"), msg.step + (msg.detail ? ` · ${msg.detail}` : ""));
    }
  };
  chrome.runtime.onMessage.addListener(progressListener);
  try {
    const res = await chrome.runtime.sendMessage({
      type: "auto-import:start",
      payload: {
        batchSize: 1,
        songs: oneSong,
        settings: state.settings
      }
    });
    if (!res?.ok) {
      bannerSet("error", t("banner.ai.failed"), res?.error || t("misc.unknown_error"));
      return;
    }
    const arr = res.result?.results || [];
    if (!arr.length) {
      bannerSet("error", t("banner.ai.empty_response"), t("banner.ai.empty_response_detail"));
      return;
    }
    await importAiResults(JSON.stringify(arr));
    await loadState();
    bannerSet("success", t("banner.regen.done", { title: song.title }), t("banner.regen.done_detail"));
  } catch (e) {
    bannerSet("error", t("misc.error"), e?.message || String(e));
  } finally {
    chrome.runtime.onMessage.removeListener(progressListener);
  }
}

// === v5: Unified AI generate flow (auto OR manual depending on provider) ===
async function runAiGenerate() {
  const provider = state.aiProvider || "chatgpt-web";
  const candidates = state.songs.filter(s => !s.aiTone && !s.aiFx);

  if (!state.songs.length) {
    bannerSet("error", t("banner.ai.need_songs"), t("banner.ai.need_songs_detail"));
    return;
  }
  if (!candidates.length) {
    bannerSet("success", t("banner.ai.no_candidates_title"),
      t("banner.ai.no_candidates_detail", { n: state.songs.length }));
    return;
  }

  if (provider === "manual") {
    await openManualAiFlow(candidates);
  } else {
    await runChatGPTAutoImport();
  }
}

async function openManualAiFlow(candidates) {
  if (!els.manualAiModal) return;
  await saveSettingsFromUI();
  const text = buildPromptBundle(candidates, state.settings);
  try {
    await navigator.clipboard.writeText(text);
    bannerSet("busy", t("banner.manual.started"),
      t("banner.manual.detail", { n: candidates.length }), { sticky: true });
  } catch (e) {
    bannerSet("error", t("misc.clipboard_error"), String(e));
  }
  if (els.manualAiInput) els.manualAiInput.value = "";
  els.manualAiModal.hidden = false;
  els.manualAiInput?.focus();
}

function closeManualAiFlow() {
  if (els.manualAiModal) els.manualAiModal.hidden = true;
  bannerToIdle();
}

async function applyManualAiInput() {
  const raw = els.manualAiInput?.value || "";
  if (!raw.trim()) {
    bannerSet("error", t("banner.manual.no_json"), t("banner.manual.no_json_detail"));
    return;
  }
  bannerSet("busy", t("banner.manual.parsing"), t("banner.manual.parsing_detail"));
  try {
    await importAiResults(raw);
    await loadState();
    const aiCount = state.songs.filter(s => s.aiTone || s.aiFx).length;
    closeManualAiFlow();
    bannerSet("success", t("banner.manual.applied"),
      t("banner.ai.summary", { total: state.songs.length, ai: aiCount }));
  } catch (e) {
    bannerSet("error", t("misc.error"), e?.message || String(e));
  }
}

function syncViewModeUI() {
  if (!els.viewModeSegment) return;
  els.viewModeSegment.querySelectorAll("button[data-view]").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-view") === state.viewMode);
    btn.setAttribute("aria-pressed", btn.getAttribute("data-view") === state.viewMode ? "true" : "false");
  });
}

function syncAiBridgeOpenState() {
  if (!els.aiBridgeCard) return;
  const hasContent = !!(els.aiImport && els.aiImport.value && els.aiImport.value.trim().length > 0);
  if (hasContent) els.aiBridgeCard.setAttribute("open", "");
  if (els.aiBridgePill) {
    els.aiBridgePill.textContent = hasContent ? "İçerik var" : "JSON bekler";
    els.aiBridgePill.className = hasContent ? "pill ok" : "pill accent";
  }
}

async function applyAiImport() {
  try {
    const raw = els.aiImport?.value || "";
    if (!String(raw).trim()) {
      setAiStatus("Yapıştırılacak JSON bekleniyor.");
      return;
    }
    setAiStatus("Parse ediliyor...");
    await importAiResults(raw);
    await loadState();
    setAiStatus("AI tonu uygulandı.");
    setStatus("AI sonucu içeri alındı.");
  } catch (err) {
    setAiStatus(`Hata: ${err?.message || String(err)}`);
    setStatus(`Hata: ${err?.message || String(err)}`);
  }
}

function setAiStatus(text) {
  if (els.aiStatus) els.aiStatus.textContent = text;
}

async function loadState() {
  state.songs = await getSongs();
  state.settings = await getSettings();
  syncSettingsUI();
  renderFilterChips();
  renderSongs();
  renderCounts();
  renderSummary();
}

function renderSummary() {
  if (!els.summary) return;
  if (!state.songs.length) {
    els.summary.innerHTML = `<div class="empty compact">Henüz veri yok. İlk şarkıları çekip prompt motorunu ateşleyelim.</div>`;
    return;
  }

  const sample = state.songs.slice(0, Math.min(state.songs.length, 4));
  const minis = sample.map((song, index) => {
    const tone = buildToneCard(song, state.settings, index, sample);
    return `
      <div class="mini-summary ${tone.isAi ? 'mini-summary-ai' : ''}">
        <div class="mini-summary-title">${escapeHtml(song.title)}</div>
        <div class="mini-summary-meta">${escapeHtml(song.genre || "unknown")} • ${escapeHtml(tone.profile.style)} • ${escapeHtml(tone.profile.confidence)}</div>
      </div>
    `;
  }).join("");

  const genres = computeGenreCounts(state.songs).map(g => `${g.genre} (${g.count})`).join(", ") || "yok";
  const counts = computeStateCounts(state.songs);
  const aiCount = state.songs.filter(song => song.aiTone || song.aiFx).length;
  els.summary.innerHTML = `
    <div class="summary-grid">
      <div class="summary-main">
        <div class="summary-title">Agent Overview</div>
        <div class="summary-text">${escapeHtml(buildSummaryText(state.songs, aiCount))}</div>
      </div>
      <div class="summary-side">
        <div class="summary-title">Öne çıkanlar</div>
        <div class="summary-text">${escapeHtml(genres)}</div>
        <div class="summary-text small-gap">AI: ${aiCount} • Fav: ${counts.favorite} • Stage: ${counts.stage}</div>
      </div>
    </div>
    <div class="summary-songs">${minis}</div>
  `;
}

function buildSummaryText(songs, aiCount) {
  const toneFlow = Number(state.settings.toneVariation ?? DEFAULT_SETTINGS.toneVariation);
  const counts = computeStateCounts(songs);
  const mood = toneFlow >= 70 ? "modern ve daha net" : toneFlow <= 30 ? "lofi ve yumuşak" : "dengeye yakın";
  return `Bu liste şu an ${mood} bir hatta gidiyor. Hedef warm, groove-first, clicksiz ve defined kalmak. Durum dağılımı: fav ${counts.favorite} / dinle ${counts.listen} / çal ${counts.play} / denendi ${counts.tried} / AI ${counts.ai_tab} / sahne ${counts.stage}. AI ile içeri alınmış ton sayısı ${aiCount}.`;
}

function bindCommonActions() {
  els.extractBtn?.addEventListener("click", async () => {
    try {
      bannerSet("busy", t("banner.extracting"), t("banner.extracting.detail"));
      const data = await extractCurrentTabSongs();
      await upsertSongs(data);
      await loadState();
      bannerSet("success", t("banner.extracted", { n: data.length }), songCounterText(data));
    } catch (err) {
      bannerSet("error", t("banner.extract_error"), err?.message || String(err));
    }
  });

  els.aiGenerateBtn?.addEventListener("click", async () => {
    await runAiGenerate();
  });

  els.manualAiClose?.addEventListener("click", closeManualAiFlow);
  els.manualAiApply?.addEventListener("click", applyManualAiInput);
  els.manualAiModal?.addEventListener("click", (e) => {
    if (e.target === els.manualAiModal) closeManualAiFlow();
  });

  els.importJsonBtn?.addEventListener("click", () => {
    els.importJsonInput?.click();
  });

  els.importJsonInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    bannerSet("busy", t("banner.import_json"), file.name);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming = Array.isArray(parsed) ? parsed
                     : Array.isArray(parsed?.songs) ? parsed.songs
                     : null;
      if (!incoming) throw new Error(t("banner.import_json.no_array"));
      const before = state.songs.length;
      await upsertSongs(incoming);
      await loadState();
      const after = state.songs.length;
      const added = after - before;
      bannerSet("success", t("banner.import_json.done"),
        t("banner.import_json.done_detail", { n: incoming.length, added, updated: incoming.length - added }));
    } catch (err) {
      bannerSet("error", t("banner.import_json.error"), err?.message || String(err));
    } finally {
      e.target.value = "";
    }
  });

  els.clearListBtn?.addEventListener("click", async () => {
    const songCount = state.songs.length;
    if (songCount === 0) {
      bannerSet("idle", t("banner.empty_list"), t("banner.empty_list_detail"));
      return;
    }
    const ok = window.confirm(t("banner.clear_confirm", { n: songCount }));
    if (!ok) return;
    await saveSongs([]);
    await loadState();
    bannerSet("success", t("banner.cleared"), t("banner.cleared_detail", { n: songCount }));
  });

  els.copyNamesBtn?.addEventListener("click", async () => {
    try {
      await saveSettingsFromUI();
      const text = buildNamesOnly(state.songs);
      await copyText(text);
      bannerSet("success", t("banner.copied.names"), t("banner.copied.names_detail", { n: state.songs.length }));
    } catch (err) {
      bannerSet("error", t("banner.copy_error"), err?.message || String(err));
    }
  });

  els.copyPromptBtn?.addEventListener("click", async () => {
    try {
      await saveSettingsFromUI();
      const text = buildPromptBundle(state.songs, state.settings);
      await copyText(text);
      bannerSet("success", t("banner.copied.prompt"), t("banner.copied.prompt_detail", { n: text.length }));
    } catch (err) {
      bannerSet("error", t("banner.copy_error"), err?.message || String(err));
    }
  });

  els.importAiBtn?.addEventListener("click", applyAiImport);
  els.importAiBridgeBtn?.addEventListener("click", applyAiImport);

  els.downloadTxtBtn?.addEventListener("click", async () => {
    try {
      await saveSettingsFromUI();
      const text = buildPromptBundle(state.songs, state.settings);
      await downloadTextFile(`${state.settings.listTitle || DEFAULT_SETTINGS.listTitle}.txt`, text);
      bannerSet("success", t("banner.downloaded.txt"), t("banner.downloaded.detail"));
    } catch (err) {
      bannerSet("error", t("banner.download_error"), err?.message || String(err));
    }
  });

  els.downloadJsonBtn?.addEventListener("click", async () => {
    try {
      const json = await exportSongsAsJson();
      await downloadTextFile(`${state.settings.listTitle || DEFAULT_SETTINGS.listTitle}.json`, json);
      bannerSet("success", t("banner.downloaded.json"), t("banner.downloaded.detail"));
    } catch (err) {
      bannerSet("error", t("banner.download_error"), err?.message || String(err));
    }
  });

  els.openPanelBtn?.addEventListener("click", async () => {
    try {
      await handleSidePanelToggle();
    } catch (err) {
      setStatus(`Hata: ${err?.message || String(err)}`, "error");
      toast(`Hata: ${err?.message || String(err)}`, "error");
    }
  });

  els.autoImportBtn?.addEventListener("click", async () => {
    await runChatGPTAutoImport();
  });

  els.providerSegment?.querySelectorAll('input[type="radio"]')?.forEach(radio => {
    radio.addEventListener("change", async () => {
      if (!radio.checked) return;
      state.aiProvider = radio.value;
      await saveSettingsFromUI();
      syncProviderUI();
    });
  });

  // v5.5: language radio
  els.languageSegment?.querySelectorAll('input[type="radio"]')?.forEach(radio => {
    radio.addEventListener("change", async () => {
      if (!radio.checked) return;
      if (typeof setLang === "function") setLang(radio.value);
      if (typeof applyTranslations === "function") applyTranslations();
      // Refresh dynamic strings (mood label, provider status, banner, song cards)
      const toneValue = state.settings.toneVariation ?? DEFAULT_SETTINGS.toneVariation;
      if (els.toneVariationMood) els.toneVariationMood.textContent = moodLabel(toneValue);
      syncProviderUI();
      bannerToIdle();
      renderSongs();
      renderCounts();
      renderFilterChips();
      await saveSettingsFromUI();
    });
  });

  els.viewModeSegment?.querySelectorAll("button[data-view]")?.forEach(btn => {
    btn.addEventListener("click", async () => {
      const view = btn.getAttribute("data-view");
      if (!view || view === state.viewMode) return;
      state.viewMode = view;
      syncViewModeUI();
      renderSongs();
      await saveSettingsFromUI();
    });
  });

  els.aiImport?.addEventListener("input", () => {
    syncAiBridgeOpenState();
  });

  els.searchInput?.addEventListener("input", () => {
    state.search = els.searchInput.value || "";
    renderSongs();
    renderCounts();
  });

  els.clearSearchBtn?.addEventListener("click", () => {
    state.search = "";
    if (els.searchInput) els.searchInput.value = "";
    renderSongs();
    renderCounts();
  });

  els.sortMode?.addEventListener("change", async () => {
    await saveSettingsFromUI();
    renderSongs();
    renderCounts();
  });

  els.toneVariation?.addEventListener("input", async () => {
    if (els.toneVariationLabel) els.toneVariationLabel.textContent = String(els.toneVariation.value);
    if (els.toneVariationMood) els.toneVariationMood.textContent = moodLabel(els.toneVariation.value);
  });

  els.toneVariation?.addEventListener("change", async () => {
    await saveSettingsFromUI();
    renderSummary();
    renderSongs();
  });

  els.promptTitle?.addEventListener("change", saveSettingsFromUI);
  els.promptContext?.addEventListener("change", saveSettingsFromUI);
  els.promptSuffix?.addEventListener("change", saveSettingsFromUI);

  els.setlistModeBtn?.addEventListener("click", () => {
    state.viewMode = state.viewMode === "cards" ? "setlist" : "cards";
    els.setlistModeBtn.textContent = state.viewMode === "cards" ? "Setlist Modu" : "Kart Modu";
    renderSongs();
  });

  els.compactModeBtn?.addEventListener("click", () => {
    state.viewMode = state.viewMode === "cards" ? "compact" : "cards";
    els.compactModeBtn.textContent = state.viewMode === "cards" ? "Kompakt Mod" : "Kart Modu";
    renderSongs();
  });
}

// === v5.3: Knob drag/wheel interaction ===
let knobDragSession = null;

function bindKnobDrag() {
  els.songList.querySelectorAll('.knob').forEach(knobEl => {
    const svg = knobEl.querySelector('.knob-svg');
    if (!svg) return;

    svg.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const songEl = knobEl.closest('.song');
      const id = songEl?.getAttribute('data-song-id');
      const knobKey = knobEl.getAttribute('data-knob');
      const min = parseFloat(knobEl.getAttribute('data-min'));
      const max = parseFloat(knobEl.getAttribute('data-max'));
      const song = state.songs.find(s => songId(s) === id);
      if (!song) return;
      const startVal = effectiveTone(song)[knobKey] ?? (min + max) / 2;
      knobDragSession = {
        knobEl, knobKey, min, max, song, startY: e.clientY, startVal
      };
      document.body.style.cursor = 'ns-resize';
    });

    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const songEl = knobEl.closest('.song');
      const id = songEl?.getAttribute('data-song-id');
      const knobKey = knobEl.getAttribute('data-knob');
      const min = parseFloat(knobEl.getAttribute('data-min'));
      const max = parseFloat(knobEl.getAttribute('data-max'));
      const song = state.songs.find(s => songId(s) === id);
      if (!song) return;
      const cur = effectiveTone(song)[knobKey] ?? (min + max) / 2;
      const range = max - min;
      const step = e.shiftKey ? range / 100 : range / 50;
      const next = Math.max(min, Math.min(max, cur + (e.deltaY < 0 ? step : -step)));
      applyKnobValueLive(knobEl, knobKey, song, next, min, max);
    }, { passive: false });

    svg.addEventListener('dblclick', async (e) => {
      e.preventDefault();
      // Reset just this knob to AI value, or to default if no AI
      const songEl = knobEl.closest('.song');
      const id = songEl?.getAttribute('data-song-id');
      const knobKey = knobEl.getAttribute('data-knob');
      const aiValStr = knobEl.getAttribute('data-ai-value');
      const song = state.songs.find(s => songId(s) === id);
      if (!song) return;
      if (song.userTone && knobKey in song.userTone) {
        const next = { ...song.userTone };
        delete next[knobKey];
        song.userTone = Object.keys(next).length ? next : null;
        await saveSongs(state.songs);
        renderSongs();
      }
    });
  });
}

document.addEventListener('mousemove', (e) => {
  if (!knobDragSession) return;
  const { knobEl, knobKey, min, max, song, startY, startVal } = knobDragSession;
  const dy = startY - e.clientY;  // up = positive
  const range = max - min;
  // 200px drag = full range; shift for fine
  const sensitivity = e.shiftKey ? range / 800 : range / 200;
  const next = Math.max(min, Math.min(max, startVal + dy * sensitivity));
  applyKnobValueLive(knobEl, knobKey, song, next, min, max);
});

document.addEventListener('mouseup', async () => {
  if (!knobDragSession) return;
  const { song } = knobDragSession;
  knobDragSession = null;
  document.body.style.cursor = '';
  await saveSongs(state.songs);
});

function applyKnobValueLive(knobEl, knobKey, song, nextVal, min, max) {
  const isInt = (knobKey === 'midFreqHz' || max - min > 50);
  const v = isInt ? Math.round(nextVal) : nextVal;
  const spec = KNOB_SPECS.find(s => s.key === knobKey);
  if (!spec) return;
  // Update userTone
  song.userTone = { ...(song.userTone || {}), [knobKey]: v };
  song.userToneUpdatedAt = Date.now();
  // Live-update DOM (don't re-render whole list — too slow on drag)
  const indicator = knobEl.querySelector('.knob-indicator');
  const readout = knobEl.querySelector('.knob-readout');
  if (indicator) indicator.setAttribute('transform', `rotate(${knobValueToAngle(v, spec)} 30 30)`);
  if (readout) {
    readout.textContent = spec.fmt ? spec.fmt(v) : Math.round(v);
    readout.classList.add('modified');
  }
}

function initDragDrop() {
  let draggedId = null;
  els.songList?.addEventListener("dragstart", (e) => {
    const card = e.target.closest?.(".song");
    if (!card) return;
    draggedId = card.getAttribute("data-song-id");
    e.dataTransfer.effectAllowed = "move";
  });

  els.songList?.addEventListener("dragover", (e) => {
    e.preventDefault();
    const card = e.target.closest?.(".song");
    if (card) card.classList.add("drag-over");
  });

  els.songList?.addEventListener("dragleave", (e) => {
    const card = e.target.closest?.(".song");
    if (card) card.classList.remove("drag-over");
  });

  els.songList?.addEventListener("drop", async (e) => {
    e.preventDefault();
    const card = e.target.closest?.(".song");
    if (!draggedId || !card) return;
    const targetId = card.getAttribute("data-song-id");
    if (!targetId || targetId === draggedId) return;
    const songs = sortSongsByOrder(state.songs, "order");
    const from = songs.findIndex(s => songId(s) === draggedId);
    const to = songs.findIndex(s => songId(s) === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = songs.splice(from, 1);
    songs.splice(to, 0, moved);
    const reordered = songs.map((song, index) => ({ ...song, order: index, lastUpdatedAt: Date.now() }));
    await saveSongs(reordered);
    await loadState();
    draggedId = null;
  });
}

function applyManifestVersion() {
  const v = chrome.runtime?.getManifest?.()?.version;
  if (!v) return;
  const brand = document.querySelector(".brand-mark");
  const heroH1 = document.querySelector(".hero h1");
  if (brand) {
    // preserve any extra spans (e.g., "· Side Panel")
    const extra = brand.querySelector(".helper");
    brand.textContent = `🎸 Bass Assistant v${v}`;
    if (extra) brand.appendChild(extra);
  }
  if (heroH1) heroH1.textContent = `🎸 Bass Assistant v${v}`;
  document.title = `Bass Assistant v${v}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  // i18n: read language from storage BEFORE first render so static strings render in correct lang
  try {
    const stored = await getSettings();
    if (typeof setLang === "function") setLang(stored.language || "tr");
    if (typeof applyTranslations === "function") applyTranslations();
  } catch (e) {}
  applyManifestVersion();
  bindCommonActions();
  initDragDrop();
  await loadState();
  syncAiBridgeOpenState();
  bannerToIdle();
});
