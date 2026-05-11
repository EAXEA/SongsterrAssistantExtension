// Bass Assistant — service worker
// Coordinates ChatGPT web automation: tab discovery, batch queue, retry, persistence.

const CHATGPT_URLS = ["https://chatgpt.com/*", "https://chat.openai.com/*"];
const CHATGPT_HOSTS = ["chatgpt.com", "chat.openai.com"];

const LOG_PREFIX = "[BA-bg]";
const log = (...a) => console.log(LOG_PREFIX, ...a);
const logErr = (...a) => console.error(LOG_PREFIX, ...a);

async function broadcastStep(step, detail = "") {
  log(step, detail);
  try { await chrome.runtime.sendMessage({ type: "auto-import:step", step, detail }); } catch {}
}

const QUEUE_KEY = "ba_chatgpt_queue_v1";
const PROGRESS_KEY = "ba_chatgpt_progress_v1";

// ---------- Tab management ----------

async function findChatGPTTab() {
  const tabs = await chrome.tabs.query({});
  return tabs.find(t => {
    if (!t.url) return false;
    try {
      const u = new URL(t.url);
      return CHATGPT_HOSTS.includes(u.hostname);
    } catch { return false; }
  }) || null;
}

async function ensureChatGPTTab() {
  let tab = await findChatGPTTab();
  if (tab) {
    await broadcastStep("tab-found", `id=${tab.id} url=${tab.url}`);
    return tab;
  }
  await broadcastStep("opening-chatgpt-tab");
  tab = await chrome.tabs.create({ url: "https://chatgpt.com/", active: false });
  await waitForTabComplete(tab.id, 30000);
  await sleep(1500);
  await broadcastStep("tab-opened", `id=${tab.id}`);
  return tab;
}

function waitForTabComplete(tabId, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = async () => {
      if (Date.now() - start > timeoutMs) return reject(new Error("Tab load timeout"));
      try {
        const t = await chrome.tabs.get(tabId);
        if (t.status === "complete") return resolve(t);
      } catch (e) { return reject(e); }
      setTimeout(check, 300);
    };
    check();
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---------- Content script messaging ----------

async function pingContentScript(tabId) {
  try {
    const res = await chrome.tabs.sendMessage(tabId, { type: "ping" });
    return res?.ok === true ? res : null;
  } catch { return null; }
}

async function ensureContentScriptReady(tabId, timeoutMs = 20000) {
  const start = Date.now();
  let lastErr = "";
  while (Date.now() - start < timeoutMs) {
    const r = await pingContentScript(tabId);
    if (r) {
      await broadcastStep("content-script-ready", `url=${r.url}`);
      return r;
    }
    await sleep(400);
  }
  // Try to manually inject as a last resort
  try {
    await broadcastStep("manual-inject-attempt");
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["chatgpt-content.js"]
    });
    await sleep(800);
    const r2 = await pingContentScript(tabId);
    if (r2) {
      await broadcastStep("content-script-ready-after-inject", `url=${r2.url}`);
      return r2;
    }
    lastErr = "ping after manual inject failed";
  } catch (e) {
    lastErr = e?.message || String(e);
  }
  throw new Error(`ChatGPT content script hazır değil (${lastErr}). Sayfayı manuel yenileyip tekrar dene.`);
}

async function sendPromptToTab(tabId, prompt, timeoutMs = 180000) {
  return await chrome.tabs.sendMessage(tabId, {
    type: "submit-prompt",
    prompt,
    timeoutMs
  });
}

// ---------- Progress + queue ----------

async function saveProgress(progress) {
  await chrome.storage.local.set({ [PROGRESS_KEY]: progress });
  // Also broadcast to popup/sidepanel
  try { await chrome.runtime.sendMessage({ type: "auto-import:progress", progress }); } catch {}
}

async function loadProgress() {
  const r = await chrome.storage.local.get(PROGRESS_KEY);
  return r[PROGRESS_KEY] || null;
}

async function clearProgress() {
  await chrome.storage.local.remove(PROGRESS_KEY);
  try { await chrome.runtime.sendMessage({ type: "auto-import:progress", progress: null }); } catch {}
}

// ---------- Auto import flow ----------

let activeImport = null; // { id, abort: false }

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function runAutoImport({ batchSize = 25, songs, settings }) {
  if (activeImport) throw new Error("Bir auto-import zaten çalışıyor.");
  const importId = `imp_${Date.now()}`;
  activeImport = { id: importId, abort: false };

  try {
    if (!Array.isArray(songs) || !songs.length) {
      throw new Error("Gönderilecek şarkı yok.");
    }

    await broadcastStep("flow-start", `songs=${songs.length} batchSize=${batchSize}`);
    const tab = await ensureChatGPTTab();
    await ensureContentScriptReady(tab.id);

    const auth = await chrome.tabs.sendMessage(tab.id, { type: "check-auth" }).catch((e) => {
      logErr("check-auth failed", e);
      return null;
    });
    if (auth && auth.loggedIn === false) {
      throw new Error("ChatGPT'ye giriş yapılmamış. Önce chatgpt.com sekmesinde login ol.");
    }
    await broadcastStep("auth-checked", `loggedIn=${auth?.loggedIn}`);

    const batches = chunk(songs, batchSize);
    const total = songs.length;
    let processed = 0;
    const allParsed = [];

    for (let i = 0; i < batches.length; i++) {
      if (activeImport?.abort) throw new Error("İptal edildi.");

      const batch = batches[i];
      await saveProgress({
        importId,
        status: "running",
        currentBatch: i + 1,
        totalBatches: batches.length,
        processedSongs: processed,
        totalSongs: total,
        batchSize
      });

      const prompt = buildBatchPrompt(batch, settings);
      await broadcastStep("batch-send", `i=${i + 1}/${batches.length} size=${batch.length}`);
      let response;
      try {
        response = await sendPromptToTab(tab.id, prompt);
      } catch (e) {
        throw new Error(`Batch ${i + 1} gönderilemedi: ${e.message || e}`);
      }
      await broadcastStep("batch-response", `ok=${response?.ok} len=${response?.text?.length || 0}`);
      if (!response || !response.ok) {
        throw new Error(`Batch ${i + 1} başarısız: ${response?.error || "bilinmeyen hata"}`);
      }

      // Parse JSON
      const parsed = extractJsonArray(response.text);
      await broadcastStep("batch-parsed", `parsed=${parsed.length}`);
      if (!parsed.length) {
        throw new Error(`Batch ${i + 1}: JSON ayıklanamadı. İlk 200 char: ${(response.text || "").slice(0, 200)}`);
      }
      allParsed.push(...parsed);
      processed += batch.length;
    }

    await saveProgress({
      importId,
      status: "complete",
      currentBatch: batches.length,
      totalBatches: batches.length,
      processedSongs: processed,
      totalSongs: total,
      batchSize,
      results: allParsed.length
    });

    return { ok: true, results: allParsed };
  } finally {
    if (activeImport?.id === importId) activeImport = null;
  }
}

function buildBatchPrompt(batch, settings) {
  const lines = batch.map((s, i) => `${i + 1}. ${s.title}${s.artist ? ` — ${s.artist}` : ""}${s.genre && s.genre !== "unknown" ? ` | genre: ${s.genre}` : ""}`).join("\n");
  const ctx = settings?.promptContext || "İşte bass tonu önereceğin şarkılar";
  const suffix = settings?.promptSuffix || "Warm, groove-first, clicksiz tonlar öner.";
  return `${ctx}

${lines}

ÇIKTI KURALLARI:
- Yalnızca JSON dizisi döndür, açıklama yazma.
- Her şarkı için: { "title": "...", "tone": { "active": true, "volume": 0-100, "miniTone": 0-100, "blendNeck": 0-100, "treble": 0-100, "mid": 0-100, "midFreqHz": 200-800, "bass": 0-100 }, "fx": { ... } }
- Sire Marcus Miller V3 knob sırasına uy: ACTIVE → VOLUME → mini TONE → BLEND → TREBLE → MID → mini MID FREQ → BASS.

${suffix}`;
}

function extractJsonArray(text) {
  if (!text) return [];
  // Try fenced code block first
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [];
  if (fenced) candidates.push(fenced[1]);
  candidates.push(text);

  for (const c of candidates) {
    try {
      const arr = JSON.parse(c.trim());
      if (Array.isArray(arr)) return arr;
    } catch {}
    // Try to find first [ and last ]
    const first = c.indexOf("[");
    const last = c.lastIndexOf("]");
    if (first >= 0 && last > first) {
      try {
        const arr = JSON.parse(c.slice(first, last + 1));
        if (Array.isArray(arr)) return arr;
      } catch {}
    }
  }
  return [];
}

// ---------- Message router ----------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === "auto-import:start") {
        const result = await runAutoImport(msg.payload || {});
        sendResponse({ ok: true, result });
      } else if (msg?.type === "auto-import:status") {
        const p = await loadProgress();
        sendResponse({ ok: true, progress: p, running: !!activeImport });
      } else if (msg?.type === "auto-import:abort") {
        if (activeImport) activeImport.abort = true;
        sendResponse({ ok: true });
      } else if (msg?.type === "auto-import:clear") {
        await clearProgress();
        sendResponse({ ok: true });
      } else if (msg?.type === "chatgpt:check") {
        const tab = await findChatGPTTab();
        if (!tab) { sendResponse({ ok: true, present: false }); return; }
        const auth = await chrome.tabs.sendMessage(tab.id, { type: "check-auth" }).catch(() => null);
        sendResponse({ ok: true, present: true, tabId: tab.id, loggedIn: auth?.loggedIn ?? null });
      } else {
        sendResponse({ ok: false, error: "unknown message type" });
      }
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || String(e) });
    }
  })();
  return true; // async
});
