const STORAGE_KEYS = {
  songs: "ba_songs_v31",
  settings: "ba_settings_v31"
};

const DEFAULT_SETTINGS = {
  listTitle: "Bass Assistant Setlist",
  promptContext: "İşte Songsterr favorilerimdeki şarkılar",
  promptSuffix: "Bu liste için warm, groove-first, clicksiz ve defined bass tonları öner. Emin olmadığın yerde bunu açıkça yaz.",
  toneVariation: 35,
  sortMode: "order",
  defaultGenre: "unknown",
  popupViewMode: "compact",
  sidepanelViewMode: "cards",
  aiProvider: "chatgpt-web",
  language: "tr"
};

const STATE_DEFS = {
  favorite: { label: "Fav" },
  listen: { label: "Dinle" },
  play: { label: "Çal" },
  tried: { label: "Denendi" },
  ai_tab: { label: "AI Tab" },
  stage: { label: "Sahne" }
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function round(value) {
  return Math.round(Number(value) || 0);
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function percentToClock(percent) {
  const p = clamp(percent, 0, 100);
  if (p <= 8) return "8:00";
  if (p <= 16) return "9:00";
  if (p <= 28) return "10:00";
  if (p <= 40) return "11:00";
  if (p <= 54) return "12:00";
  if (p <= 66) return "1:00";
  if (p <= 78) return "2:00";
  if (p <= 90) return "3:00";
  return "4:00";
}

async function getSongs() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.songs);
  return Array.isArray(result[STORAGE_KEYS.songs]) ? result[STORAGE_KEYS.songs] : [];
}

async function saveSongs(songs) {
  await chrome.storage.local.set({ [STORAGE_KEYS.songs]: songs });
}

async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.settings);
  return {
    ...DEFAULT_SETTINGS,
    ...(result[STORAGE_KEYS.settings] || {})
  };
}

async function saveSettings(settings) {
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: {
    ...DEFAULT_SETTINGS,
    ...(settings || {})
  }});
}

function songKey(song) {
  if (!song) return "song:empty";
  if (song.id) return String(song.id);
  // v5.2: prefer title+artist (stable across URLs); fall back to URL when no artist.
  const t = normalizeText(song.title || "");
  const a = normalizeText(song.artist || "");
  if (t && a) return `ta:${t}__${a}`;
  if (song.url) return `url:${song.url}`;
  if (t) return `t:${t}`;
  return "song:empty";
}

// All possible keys for a song (used when matching incoming song against existing
// records that may have been keyed differently in older versions).
function songMatchKeys(song) {
  const keys = new Set();
  if (!song) return keys;
  if (song.id) keys.add(String(song.id));
  const t = normalizeText(song.title || "");
  const a = normalizeText(song.artist || "");
  if (t && a) keys.add(`ta:${t}__${a}`);
  if (song.url) keys.add(`url:${song.url}`);
  if (t) keys.add(`t:${t}`);
  // Legacy v3-v5.1 key shape (kept for backward compat)
  keys.add(`title:${t}|artist:${a}`);
  return keys;
}

function normalizeSong(input) {
  const title = String(input?.title || input?.name || input?.song || "").trim();
  const artist = String(input?.artist || "").trim();
  const base = {
    title,
    artist,
    url: String(input?.url || "").trim(),
    source: String(input?.source || "songsterr"),
    genre: String(input?.genre || DEFAULT_SETTINGS.defaultGenre).trim() || DEFAULT_SETTINGS.defaultGenre,
    note: String(input?.note || "").trim(),
    toneNotee: String(input?.toneNotee || "").trim(),
    states: Array.isArray(input?.states) ? [...new Set(input.states.filter(Boolean))] : [],
    addedAt: Number.isFinite(input?.addedAt) ? input.addedAt : Date.now(),
    order: Number.isFinite(input?.order) ? input.order : null,
    aiImportedAt: input?.aiImportedAt || null,
    aiSuggestion: input?.aiSuggestion || null,
    aiTone: input?.aiTone || null,
    aiFx: input?.aiFx || null,
    // v5.3: user customization layer (preserved alongside AI)
    userTone: input?.userTone || null,
    userFx: input?.userFx || null,
    userToneUpdatedAt: input?.userToneUpdatedAt || null,
    rating: Number.isFinite(input?.rating) ? Math.max(0, Math.min(5, input.rating)) : 0,
    // v5.3: per-card UI state (collapsed by default)
    expanded: input?.expanded === true
  };
  base.id = songKey(input?.id ? input : base);
  return base;
}

function sortSongsByOrder(songs, mode = "order") {
  const list = [...(songs || [])];
  if (mode === "newest") {
    return list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  }
  if (mode === "oldest") {
    return list.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
  }
  if (mode === "rating") {
    return list.sort((a, b) => {
      const ra = a.rating || 0, rb = b.rating || 0;
      if (rb !== ra) return rb - ra;
      return (a.addedAt || 0) - (b.addedAt || 0);
    });
  }
  return list.sort((a, b) => {
    const ao = Number.isFinite(a.order) ? a.order : 999999;
    const bo = Number.isFinite(b.order) ? b.order : 999999;
    if (ao !== bo) return ao - bo;
    return (a.addedAt || 0) - (b.addedAt || 0);
  });
}

async function upsertSongs(newSongs) {
  const existing = await getSongs();
  const map = new Map(existing.map(s => [songKey(s), normalizeSong(s)]));
  // Build secondary lookup that finds any existing record by ANY of its possible keys
  const keyAlias = new Map(); // alias key → primary key
  for (const [primary, song] of map.entries()) {
    for (const k of songMatchKeys(song)) keyAlias.set(k, primary);
  }
  let maxOrder = existing.reduce((max, song) => {
    const ord = Number.isFinite(song.order) ? song.order : -1;
    return Math.max(max, ord);
  }, -1);

  for (const item of newSongs || []) {
    const normalized = normalizeSong(item);
    const newKeys = songMatchKeys(normalized);
    // Find any existing primary key that matches one of the new keys
    let prevKey = null;
    for (const k of newKeys) {
      if (keyAlias.has(k)) { prevKey = keyAlias.get(k); break; }
    }
    const key = prevKey || songKey(normalized);
    const prev = map.get(key);
    if (prev) {
      // AI tone preserved from previous if incoming doesn't have one
      const merged = {
        ...prev,
        ...normalized,
        id: prev.id || normalized.id,
        order: Number.isFinite(prev.order) ? prev.order : (Number.isFinite(normalized.order) ? normalized.order : prev.order),
        addedAt: prev.addedAt || normalized.addedAt,
        states: [...new Set([...(prev.states || []), ...(normalized.states || [])])],
        aiTone: normalized.aiTone || prev.aiTone || null,
        aiFx: normalized.aiFx || prev.aiFx || null,
        aiSuggestion: normalized.aiSuggestion || prev.aiSuggestion || null,
        aiImportedAt: normalized.aiImportedAt || prev.aiImportedAt || null,
        // v5.3: user customization NEVER overwritten by re-import
        userTone: prev.userTone || normalized.userTone || null,
        userFx: prev.userFx || normalized.userFx || null,
        userToneUpdatedAt: prev.userToneUpdatedAt || normalized.userToneUpdatedAt || null,
        rating: Math.max(prev.rating || 0, normalized.rating || 0),
        expanded: prev.expanded || normalized.expanded || false,
        lastUpdatedAt: Date.now()
      };
      map.set(key, merged);
      // Refresh aliases for the merged record
      for (const k of songMatchKeys(merged)) keyAlias.set(k, key);
    } else {
      if (!Number.isFinite(normalized.order)) {
        maxOrder += 1;
        normalized.order = maxOrder;
      } else {
        maxOrder = Math.max(maxOrder, normalized.order);
      }
      map.set(key, normalized);
    }
  }

  const merged = sortSongsByOrder([...map.values()], "order").map((song, index) => ({
    ...song,
    order: index
  }));

  await saveSongs(merged);
  return merged;
}

async function removeSong(songId) {
  const songs = await getSongs();
  const next = songs.filter(song => songKey(song) !== songId);
  const ordered = sortSongsByOrder(next, "order").map((song, index) => ({ ...song, order: index }));
  await saveSongs(ordered);
  return ordered;
}

async function updateSongById(songId, updates) {
  const songs = await getSongs();
  const next = songs.map(song => {
    if (songKey(song) !== songId) return song;
    return {
      ...song,
      ...updates,
      id: song.id || songId,
      lastUpdatedAt: Date.now()
    };
  });
  await saveSongs(next);
  return next;
}

async function toggleState(songId, state) {
  const songs = await getSongs();
  const next = songs.map(song => {
    if (songKey(song) !== songId) return song;
    const states = Array.isArray(song.states) ? song.states : [];
    return {
      ...song,
      states: states.includes(state) ? states.filter(s => s !== state) : [...states, state],
      lastUpdatedAt: Date.now()
    };
  });
  await saveSongs(next);
  return next;
}

async function moveSong(songId, direction) {
  const songs = sortSongsByOrder(await getSongs(), "order");
  const idx = songs.findIndex(song => songKey(song) === songId);
  if (idx < 0) return songs;
  const nextIndex = idx + direction;
  if (nextIndex < 0 || nextIndex >= songs.length) return songs;
  [songs[idx], songs[nextIndex]] = [songs[nextIndex], songs[idx]];
  const reordered = songs.map((song, index) => ({ ...song, order: index, lastUpdatedAt: Date.now() }));
  await saveSongs(reordered);
  return reordered;
}

function computeStateCounts(songs) {
  const counts = {};
  Object.keys(STATE_DEFS).forEach(key => counts[key] = 0);
  for (const song of songs || []) {
    const states = Array.isArray(song.states) ? song.states : [];
    for (const state of states) {
      if (counts[state] !== undefined) counts[state] += 1;
    }
  }
  return counts;
}

function computeGenreCounts(songs) {
  const map = new Map();
  for (const song of songs || []) {
    const genre = normalizeText(song.genre || "unknown") || "unknown";
    map.set(genre, (map.get(genre) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([genre, count]) => ({ genre, count }));
}

function extractKeywords(song) {
  return normalizeText([
    song?.title || "",
    song?.artist || "",
    song?.genre || "",
    song?.note || "",
    song?.toneNotee || "",
    song?.source || "",
    Array.isArray(song?.states) ? song.states.join(" ") : ""
  ].join(" "));
}

function hasAny(text, terms) {
  return terms.some(term => text.includes(term));
}

function buildHeuristicToneProfile(song, settings = DEFAULT_SETTINGS, index = 0, songs = []) {
  const keywords = extractKeywords(song);
  const has = (...terms) => hasAny(keywords, terms);

  let profile = {
    active: "pasif",
    volume: 72,
    miniTone: 42,
    blendNeck: 68,
    treble: 34,
    mid: 57,
    midFreqHz: 320,
    bass: 58,
    warmth: 72,
    brightness: 36,
    attack: 46,
    chorus: false,
    reverb: "çok az",
    compression: {
      ratio: "3:1",
      attack: "orta-yavaş",
      release: "orta",
      gainReduction: "3-4 dB"
    },
    confidence: "orta",
    style: "warm groove"
  };

  if (has("soul", "neo soul", "r&b", "rb", "lofi", "chill", "jazzy", "ballad")) {
    profile = {
      ...profile,
      active: "pasif",
      blendNeck: 80,
      treble: 22,
      mid: 60,
      midFreqHz: 260,
      bass: 62,
      warmth: 88,
      brightness: 22,
      attack: 50,
      style: "warm / neck-heavy",
      compression: { ratio: "4:1", attack: "orta-yavaş", release: "orta", gainReduction: "4 dB" }
    };
  }

  if (has("pop", "disco", "dance", "funk", "groove", "neo", "synth", "tiktok")) {
    profile = {
      ...profile,
      active: "aktif",
      volume: 76,
      miniTone: 47,
      blendNeck: 58,
      treble: 46,
      mid: 62,
      midFreqHz: 420,
      bass: 54,
      warmth: 62,
      brightness: 48,
      attack: 58,
      style: "defined / dance-ready",
      compression: { ratio: "3:1", attack: "orta", release: "orta", gainReduction: "3 dB" }
    };
  }

  if (has("indie", "alt", "alternative", "dream", "ambient", "shoe", "post", "folk")) {
    profile = {
      ...profile,
      active: "pasif",
      blendNeck: 70,
      treble: 38,
      mid: 55,
      midFreqHz: 390,
      bass: 56,
      warmth: 68,
      brightness: 42,
      attack: 44,
      style: "airy but full",
      chorus: has("dream", "ambient") ? true : false
    };
  }

  if (has("funk", "pocket", "slap", "groove", "tight", "percussive")) {
    profile = {
      ...profile,
      active: "aktif",
      volume: 78,
      miniTone: 52,
      blendNeck: 48,
      treble: 52,
      mid: 66,
      midFreqHz: 700,
      bass: 50,
      warmth: 52,
      brightness: 54,
      attack: 60,
      style: "punchy / mid-forward",
      compression: { ratio: "4:1", attack: "orta-hızlı", release: "orta", gainReduction: "3-5 dB" }
    };
  }

  if (has("turkish", "türk", "anatolian", "istanbul", "arabesk", "folk", "meydan")) {
    profile = {
      ...profile,
      blendNeck: Math.max(profile.blendNeck, 74),
      treble: Math.min(profile.treble, 36),
      mid: Math.max(profile.mid, 60),
      midFreqHz: 280,
      warmth: Math.max(profile.warmth, 80),
      style: "warm / melodic / local pocket"
    };
  }

  if (has("warm", "round", "mellow", "dark", "soft")) {
    profile = {
      ...profile,
      blendNeck: Math.min(84, profile.blendNeck + 8),
      treble: Math.max(18, profile.treble - 8),
      warmth: Math.min(94, profile.warmth + 10),
      brightness: Math.max(14, profile.brightness - 8)
    };
  }

  if (has("modern", "tight", "clear", "bright", "clean", "punch")) {
    profile = {
      ...profile,
      active: "aktif",
      miniTone: Math.min(58, profile.miniTone + 6),
      blendNeck: Math.max(44, profile.blendNeck - 10),
      treble: Math.min(58, profile.treble + 8),
      attack: Math.min(72, profile.attack + 8),
      brightness: Math.min(68, profile.brightness + 10)
    };
  }

  if (song?.states?.includes("stage")) {
    profile = {
      ...profile,
      active: "aktif",
      volume: Math.max(profile.volume, 80),
      treble: Math.min(58, profile.treble + 5),
      attack: Math.min(72, profile.attack + 5),
      compression: { ratio: "3.5:1", attack: "orta", release: "orta", gainReduction: "3-4 dB" },
      confidence: "orta-yüksek"
    };
  }

  if (song?.states?.includes("favorite")) {
    profile = {
      ...profile,
      blendNeck: Math.min(84, profile.blendNeck + 4),
      warmth: Math.min(95, profile.warmth + 4)
    };
  }

  if (song?.states?.includes("listen")) {
    profile = {
      ...profile,
      treble: Math.max(22, profile.treble - 2)
    };
  }

  if (song?.states?.includes("ai_tab")) {
    profile = {
      ...profile,
      active: "aktif",
      attack: Math.min(70, profile.attack + 2),
      confidence: "orta"
    };
  }

  const flow = clamp(Number(settings.toneVariation ?? DEFAULT_SETTINGS.toneVariation), 0, 100);
  const variation = (flow - 50) / 50;
  const total = Math.max(1, songs.length || 1);
  const stateBias = songs.length > 0 ? (index / Math.max(1, total - 1)) : 0.5;

  profile = {
    ...profile,
    volume: clamp(profile.volume + round(variation * 5), 60, 90),
    miniTone: clamp(profile.miniTone + round(variation * 4), 20, 70),
    blendNeck: clamp(profile.blendNeck - round(variation * 6) + round((stateBias - 0.5) * 4), 35, 85),
    treble: clamp(profile.treble + round(variation * 4), 15, 70),
    mid: clamp(profile.mid + round(variation * 2), 35, 75),
    bass: clamp(profile.bass + round(variation * 2), 35, 75),
    warmth: clamp(profile.warmth - round(variation * 4), 20, 95),
    brightness: clamp(profile.brightness + round(variation * 4), 15, 85),
    attack: clamp(profile.attack + round(variation * 3), 20, 80)
  };

  if (flow <= 30) {
    profile = {
      ...profile,
      active: "pasif",
      treble: Math.max(18, profile.treble - 4),
      blendNeck: Math.min(86, profile.blendNeck + 4),
      warmth: Math.min(96, profile.warmth + 4),
      reverb: "çok az"
    };
  } else if (flow >= 70) {
    profile = {
      ...profile,
      active: "aktif",
      treble: Math.min(64, profile.treble + 4),
      blendNeck: Math.max(40, profile.blendNeck - 4),
      brightness: Math.min(85, profile.brightness + 5),
      compression: { ratio: "3:1", attack: "orta-hızlı", release: "orta", gainReduction: "3 dB" },
      reverb: "minimal"
    };
  }

  const lowConfidence = !normalizeText(song?.genre || "") || normalizeText(song?.genre || "") === "unknown";
  if (lowConfidence && !song?.note && !song?.toneNotee) {
    profile.confidence = song?.source === "manual" ? "kullanıcı girdisi" : "düşük";
  } else if (!profile.confidence) {
    profile.confidence = "orta";
  }

  const neck = clamp(profile.blendNeck, 0, 100);
  const bridge = 100 - neck;
  return {
    ...profile,
    blendNeck: neck,
    blendBridge: bridge,
    blendText: `${neck}% neck / ${bridge}% bridge`,
    frequencyText: `${profile.midFreqHz} Hz`,
    activeText: profile.active === "aktif" ? "aktif" : "pasif",
    source: "heuristic"
  };
}

function normalizeAiTone(tone, fallback = {}) {
  const raw = tone || {};
  const activeValue = raw.active;
  const active = typeof activeValue === "boolean"
    ? (activeValue ? "aktif" : "pasif")
    : String(activeValue || fallback.activeText || "pasif").includes("aktif") ? "aktif" : "pasif";

  const blendText = String(raw.blend || raw.blendText || "");
  let neck = Number.isFinite(raw.blendNeck) ? raw.blendNeck : null;
  if (neck === null && blendText) {
    const m = blendText.match(/(\d{1,3})\s*%?\s*neck/i);
    if (m) neck = Number(m[1]);
  }
  if (neck === null && Number.isFinite(raw.neck)) neck = raw.neck;
  if (neck === null && Number.isFinite(raw.blend)) neck = raw.blend;

  const midFreq = Number.isFinite(raw.midFreqHz) ? raw.midFreqHz
    : Number.isFinite(raw.mid_freq) ? raw.mid_freq
    : Number.isFinite(raw.midFreq) ? raw.midFreq
    : fallback.midFreqHz || 320;

  const profile = {
    active,
    volume: clamp(raw.volume ?? fallback.volume ?? 72, 0, 100),
    miniTone: clamp(raw.miniTone ?? raw.tone ?? fallback.miniTone ?? 42, 0, 100),
    blendNeck: clamp(neck ?? fallback.blendNeck ?? 68, 0, 100),
    treble: clamp(raw.treble ?? fallback.treble ?? 34, 0, 100),
    mid: clamp(raw.mid ?? fallback.mid ?? 57, 0, 100),
    midFreqHz: clamp(midFreq, 80, 2000),
    bass: clamp(raw.bass ?? fallback.bass ?? 58, 0, 100),
    warmth: clamp(raw.warmth ?? fallback.warmth ?? 72, 0, 100),
    brightness: clamp(raw.brightness ?? fallback.brightness ?? 36, 0, 100),
    attack: clamp(raw.attack ?? fallback.attack ?? 46, 0, 100),
    chorus: Boolean(raw.chorus ?? fallback.chorus ?? false),
    reverb: String(raw.reverb ?? fallback.reverb ?? "çok az"),
    compression: raw.compression || fallback.compression || {
      ratio: "3:1",
      attack: "orta",
      release: "orta",
      gainReduction: "3 dB"
    },
    confidence: "chatgpt",
    style: raw.style || "ai assisted",
    source: "ai"
  };

  profile.blendBridge = 100 - profile.blendNeck;
  profile.blendText = `${profile.blendNeck}% neck / ${profile.blendBridge}% bridge`;
  profile.frequencyText = `${profile.midFreqHz} Hz`;
  profile.activeText = profile.active === "aktif" ? "aktif" : "pasif";
  return profile;
}

function formatKnobPreset(profile) {
  return [
    `AKTİF: ${profile.activeText}`,
    `VOLUME: ${profile.volume}% | ${percentToClock(profile.volume)}`,
    `mini TONE: ${profile.miniTone}% | ${percentToClock(profile.miniTone)}`,
    `BLEND: ${profile.blendText} | ${percentToClock(profile.blendNeck)}`,
    `TREBLE: ${profile.treble}% | ${percentToClock(profile.treble)}`,
    `MID: ${profile.mid}% | ${percentToClock(profile.mid)}`,
    `mini MID FREQ: ${profile.frequencyText} | ${percentToClock(profile.midFreqHz / 10)}`,
    `BASS: ${profile.bass}% | ${percentToClock(profile.bass)}`
  ].join("\n");
}

function formatEffectNotee(profile, song) {
  const title = song?.title ? `"${song.title}" için` : "Bu şarkı için";
  const confidenceText = profile.confidence === "düşük"
    ? "Bu bölüm tahmin; kayıt veya kaynak net değil."
    : profile.confidence === "chatgpt"
      ? "Bu bölüm ChatGPT sonucu olarak içeri alındı."
      : profile.confidence === "kullanıcı girdisi"
        ? "Bu bölüm kullanıcı notu ile besleniyor."
        : "Bu bölüm yerel ton tahminiyle yazıldı.";

  const chorusLine = profile.chorus
    ? "- Chorus: çok hafif, sadece genişlik için."
    : "- Chorus: gerekmez. Indie veya ambient kayıt ise çok hafif denenebilir.";

  const reverbLine = profile.reverb === "minimal"
    ? "- Reverb: minimal. Canlıda neredeyse kapalı."
    : "- Reverb: çok az. Sadece hava için.";

  const comp = profile.compression || {};
  const compText = comp.ratio ? `${comp.ratio}, attack ${comp.attack || "orta"}, release ${comp.release || "orta"}, yaklaşık ${comp.gainReduction || "3 dB"} gain reduction.` : "hafif compression";
  return [
    `EFEKT NOTU (${title})`,
    `- Compression: ${compText}`,
    `- EQ: low-mid'i hafif tut, sert üstleri törpüle, küçük frekans dokunuşları yeter.`,
    chorusLine,
    reverbLine,
    `- Güven: ${profile.confidence}. ${confidenceText}`
  ].join("\n");
}

function buildToneCard(song, settings, index = 0, songs = []) {
  const heuristic = buildHeuristicToneProfile(song, settings, index, songs);
  const aiTone = song?.aiTone ? normalizeAiTone(song.aiTone, heuristic) : null;
  const profile = aiTone || heuristic;
  const effectProfile = song?.aiFx ? {
    ...profile,
    compression: song.aiFx.compression || profile.compression,
    chorus: typeof song.aiFx.chorus === "boolean" ? song.aiFx.chorus : profile.chorus,
    reverb: song.aiFx.reverb || profile.reverb,
    confidence: "chatgpt"
  } : profile;

  return {
    profile,
    heuristic,
    knobText: formatKnobPreset(profile),
    effectText: formatEffectNotee(effectProfile, song),
    isAi: Boolean(aiTone || song?.aiFx)
  };
}

function buildNamesOnly(songs) {
  const list = sortSongsByOrder(songs, "order");
  if (!list.length) return "Liste boş.";
  return list.map((song, index) => `${index + 1}. ${song.title}`).join("\n");
}

function buildPromptBundle(songs, settings) {
  const sorted = sortSongsByOrder(songs, settings.sortMode || DEFAULT_SETTINGS.sortMode);
  const counts = computeStateCounts(sorted);
  const genres = computeGenreCounts(sorted);
  const flow = Number(settings.toneVariation ?? DEFAULT_SETTINGS.toneVariation);
  const intro = [
    `${settings.promptContext || DEFAULT_SETTINGS.promptContext}`,
    `List title: ${settings.listTitle || DEFAULT_SETTINGS.listTitle}`,
    `Toplam şarkı: ${sorted.length}`,
    `Lofi ↔ Modern: ${flow}/100`,
    `Durum sayıları: fav ${counts.favorite}, dinle ${counts.listen}, çal ${counts.play}, denendi ${counts.tried}, AI Tab ${counts.ai_tab}, sahne ${counts.stage}`
  ];

  if (genres.length) {
    intro.push(`Öne çıkan genre/etiketler: ${genres.map(g => `${g.genre} (${g.count})`).join(", ")}`);
  }

  const lines = sorted.map((song, index) => {
    const genre = song.genre && song.genre !== "unknown" ? song.genre : "unknown";
    const states = Array.isArray(song.states) && song.states.length
      ? ` [${song.states.map(state => STATE_DEFS[state]?.label || state).join(", ")}]`
      : "";
    const note = song.note ? ` | not: ${song.note}` : "";
    const toneNotee = song.toneNotee ? ` | ton notu: ${song.toneNotee}` : "";
    return `${index + 1}. ${song.title} | genre: ${genre}${states}${note}${toneNotee}`;
  });

  const tail = settings.promptSuffix || DEFAULT_SETTINGS.promptSuffix;

  return [
    intro.join("\n"),
    "",
    "Şarkı listesi:",
    lines.join("\n"),
    "",
    "ÇIKTI KURALLARI:",
    "- Her şarkı için warm, groove-first, defined bass yaklaşımı kullan.",
    "- Sire Marcus Miller V3 knob sırası zorunlu: ACTIVE → VOLUME → mini TONE → BLEND → TREBLE → MID → mini MID FREQ → BASS.",
    "- Her şarkı için efekt notu yaz. Compression çok sık kullanılır; belirsizse açıkça belirt.",
    "- Harsh, clicky ve gösterişçi tonlardan kaçın.",
    "- Emin olmadığın yerde 'emin değilim' de.",
    "- Sadece JSON döndür. Açıklama yazma.",
    "",
    tail
  ].join("\n");
}

function buildSongAnalysisBundle(song, settings, index = 0, songs = []) {
  const tone = buildToneCard(song, settings, index, songs);
  const genre = song.genre && song.genre !== "unknown" ? song.genre : "unknown";
  const stateText = Array.isArray(song.states) && song.states.length
    ? song.states.map(state => STATE_DEFS[state]?.label || state).join(", ")
    : "yok";
  return [
    `ŞARKI: ${song.title}`,
    `Genre: ${genre}`,
    `Durum: ${stateText}`,
    `Source: ${song.source || "songsterr"}`,
    `Ton eğilimi: ${tone.profile.style}`,
    "",
    "KNOB PRESET",
    tone.knobText,
    "",
    tone.effectText
  ].join("\n");
}

function extractJsonBlock(text) {
  const raw = String(text || "").trim();
  const withoutFence = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  if (withoutFence.startsWith("[") || withoutFence.startsWith("{")) return withoutFence;
  const arrMatch = raw.match(/\[[\s\S]*\]/);
  if (arrMatch) return arrMatch[0];
  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0];
  return withoutFence;
}

function normalizeImportedToneItem(item) {
  const title = String(item?.title || item?.song || item?.name || "").trim();
  const tone = item?.tone || item?.knob || item?.preset || {};
  const fx = item?.fx || item?.effects || item?.effect || {};
  return {
    title,
    tone,
    fx,
    raw: item
  };
}

function titleMatches(a, b) {
  const x = normalizeText(a);
  const y = normalizeText(b);
  if (!x || !y) return false;
  if (x === y) return true;
  return x.includes(y) || y.includes(x);
}

async function importAiResults(text) {
  const jsonText = extractJsonBlock(text);
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new Error("JSON okunamadı.");
  }

  const entries = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.songs) ? parsed.songs : []);
  if (!entries.length) throw new Error("AI sonucu içinde liste bulunamadı.");

  const normalized = entries.map(normalizeImportedToneItem).filter(item => item.title);
  const songs = await getSongs();
  const next = songs.map(song => {
    const match = normalized.find(entry => titleMatches(entry.title, song.title));
    if (!match) return song;
    const aiTone = normalizeAiTone(match.tone, buildHeuristicToneProfile(song, DEFAULT_SETTINGS, song.order || 0, songs));
    const aiFx = match.fx || {};
    return {
      ...song,
      aiSuggestion: match.raw,
      aiTone,
      aiFx,
      aiImportedAt: Date.now(),
      lastUpdatedAt: Date.now()
    };
  });
  await saveSongs(next);
  return next;
}

async function exportSongsAsJson() {
  const songs = await getSongs();
  return JSON.stringify(sortSongsByOrder(songs, "order"), null, 2);
}

async function exportSongsAsText() {
  const songs = await getSongs();
  const settings = await getSettings();
  return buildPromptBundle(songs, settings);
}

async function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatShortDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

function songCounterText(songs) {
  return `${songs.length} şarkı işlendi`;
}
