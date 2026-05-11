// Bass Assistant — ChatGPT content script
// Runs on chatgpt.com / chat.openai.com. Provides programmatic prompt submission
// and response extraction to the background service worker.
//
// All selectors have fallbacks; ChatGPT UI changes often.

(function () {
  if (window.__bassAssistantContentLoaded) return;
  window.__bassAssistantContentLoaded = true;
  // DOM marker so page-world JS / tests can detect that the content script ran.
  try { document.documentElement.setAttribute("data-ba-cs", "ready"); } catch {}

  const SELECTORS = {
    prompt: [
      '#prompt-textarea',
      'div#prompt-textarea[contenteditable]',
      'div[contenteditable="true"][data-virtualkeyboard="true"]',
      'form div[contenteditable="true"]',
      'main div[contenteditable="true"]',
      'div.ProseMirror[contenteditable="true"]',
      'textarea[data-id]',
      'textarea#prompt-textarea'
    ],
    sendBtn: [
      'button[data-testid="send-button"]',
      'button[data-testid="fruitjuice-send-button"]',
      'button[aria-label*="Send prompt" i]',
      'button[aria-label*="Send" i]',
      'button[aria-label*="Gönder" i]',
      'button[aria-label*="Submit" i]',
      'form button[type="submit"]',
      'button.send-button'
    ],
    stopBtn: [
      'button[data-testid="stop-button"]',
      'button[aria-label*="Stop generating" i]',
      'button[aria-label*="Stop streaming" i]',
      'button[aria-label*="Stop" i]',
      'button[aria-label*="Durdur" i]'
    ],
    assistantMsg: [
      '[data-message-author-role="assistant"]',
      'article[data-testid^="conversation-turn"] [data-message-author-role="assistant"]',
      'div[data-message-author-role="assistant"]'
    ],
    loginIndicator: [
      'button[data-testid="login-button"]',
      'a[href*="/auth/login"]',
      'a[href*="auth/login"]'
    ]
  };

  const log = (...a) => console.log("[BA-cs]", ...a);

  function pick(list) {
    for (const sel of list) {
      try {
        const el = document.querySelector(sel);
        if (el) return el;
      } catch {}
    }
    return null;
  }

  function pickAll(list) {
    for (const sel of list) {
      try {
        const els = document.querySelectorAll(sel);
        if (els.length) return [...els];
      } catch {}
    }
    return [];
  }

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  async function waitFor(predicate, timeoutMs = 30000, pollMs = 250) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const v = await predicate();
        if (v) return v;
      } catch {}
      await sleep(pollMs);
    }
    return null;
  }

  function isLoggedIn() {
    // Heuristic: if a prompt input exists, user is logged in
    if (pick(SELECTORS.prompt)) return true;
    // If a clear login button is present, user is not logged in
    if (pick(SELECTORS.loginIndicator)) return false;
    // Default to unknown → assume logged in to avoid false negatives
    return true;
  }

  async function insertPrompt(text) {
    const el = pick(SELECTORS.prompt);
    if (!el) throw new Error("Prompt input bulunamadı.");
    el.focus();

    if (el.tagName === "TEXTAREA") {
      const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
      proto.set.call(el, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return el;
    }

    // Contenteditable (ProseMirror). Try paste-like insertion first.
    try {
      const dt = new DataTransfer();
      dt.setData("text/plain", text);
      const evt = new ClipboardEvent("paste", {
        clipboardData: dt,
        bubbles: true,
        cancelable: true
      });
      const dispatched = el.dispatchEvent(evt);
      // If pasting was prevented or failed silently, fall through
      if (dispatched && el.textContent && el.textContent.includes(text.slice(0, 24))) return el;
    } catch {}

    // Fallback: execCommand
    try {
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, text);
      if (el.textContent && el.textContent.includes(text.slice(0, 24))) return el;
    } catch {}

    // Last-ditch: replace innerHTML (loses ProseMirror state but ChatGPT often re-syncs)
    el.innerHTML = "";
    const lines = text.split("\n");
    for (const line of lines) {
      const p = document.createElement("p");
      p.textContent = line || "​";
      el.appendChild(p);
    }
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    return el;
  }

  async function clickSend() {
    // Wait briefly for send button to enable after input
    const btn = await waitFor(() => {
      const b = pick(SELECTORS.sendBtn);
      if (b && !b.disabled) return b;
      return null;
    }, 8000, 200);
    if (!btn) {
      // Fallback: dispatch Enter on prompt
      const promptEl = pick(SELECTORS.prompt);
      if (promptEl) {
        promptEl.dispatchEvent(new KeyboardEvent("keydown", {
          key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true
        }));
        return true;
      }
      throw new Error("Send butonu aktif olmadı.");
    }
    btn.click();
    return true;
  }

  function getLastAssistantText() {
    const msgs = pickAll(SELECTORS.assistantMsg);
    if (!msgs.length) return "";
    const last = msgs[msgs.length - 1];
    // Prefer code block content if present (more likely to be JSON)
    const code = last.querySelector("pre code, pre");
    if (code && code.innerText && code.innerText.trim().startsWith("[")) {
      return code.innerText;
    }
    return last.innerText || last.textContent || "";
  }

  async function waitForResponseComplete(timeoutMs = 180000) {
    const start = Date.now();
    const initialMsgCount = pickAll(SELECTORS.assistantMsg).length;

    // Phase 1: wait until a new assistant message appears
    await waitFor(() => pickAll(SELECTORS.assistantMsg).length > initialMsgCount, 30000, 300);

    // Phase 2: wait until streaming completes (stop button gone for ≥1.5s)
    let lastStopSeenAt = Date.now();
    while (Date.now() - start < timeoutMs) {
      const stopBtn = pick(SELECTORS.stopBtn);
      if (stopBtn) lastStopSeenAt = Date.now();
      else if (Date.now() - lastStopSeenAt > 1500) break;
      await sleep(400);
    }

    // Phase 3: small grace period for final tokens to render
    await sleep(500);
    return getLastAssistantText();
  }

  async function submitPrompt(prompt, timeoutMs) {
    if (!isLoggedIn()) {
      log("not logged in — aborting");
      return { ok: false, error: "ChatGPT'ye giriş yapılmamış." };
    }
    try {
      log("inserting prompt, len=", prompt.length);
      await insertPrompt(prompt);
      await sleep(150);
      log("clicking send");
      await clickSend();
      log("waiting for response complete...");
      const text = await waitForResponseComplete(timeoutMs || 180000);
      log("response complete, len=", text?.length || 0);
      if (!text || text.length < 4) {
        return { ok: false, error: "Yanıt boş veya çok kısa." };
      }
      return { ok: true, text };
    } catch (e) {
      log("submitPrompt error:", e);
      return { ok: false, error: e?.message || String(e) };
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    (async () => {
      try {
        if (msg?.type === "ping") {
          sendResponse({ ok: true, ready: true, url: location.href });
        } else if (msg?.type === "check-auth") {
          sendResponse({ ok: true, loggedIn: isLoggedIn() });
        } else if (msg?.type === "submit-prompt") {
          const result = await submitPrompt(msg.prompt, msg.timeoutMs);
          sendResponse(result);
        } else {
          sendResponse({ ok: false, error: "unknown message type" });
        }
      } catch (e) {
        sendResponse({ ok: false, error: e?.message || String(e) });
      }
    })();
    return true; // async
  });

  log("content script ready on", location.href);
})();
