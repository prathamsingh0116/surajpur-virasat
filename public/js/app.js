(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const config = window.TP_CONFIG || {};
  const lang = config.lang === "hi" ? "hi" : "en";
  const isHindi = lang === "hi";

  function toast(message) {
    const element = $("#toast");
    if (!element) return;
    element.textContent = message;
    element.classList.add("show");
    window.clearTimeout(window.__svToastTimer);
    window.__svToastTimer = window.setTimeout(() => element.classList.remove("show"), 2800);
  }

  // Theme toggle follows the visitor's saved preference.
  const themeToggle = $("#themeToggle");
  const storedTheme = (() => {
    try { return localStorage.getItem("surajpur-virasat-theme"); } catch (_) { return null; }
  })();
  if (storedTheme === "dark" || (!storedTheme && window.matchMedia?.("(prefers-color-scheme: dark)")?.matches)) {
    document.documentElement.classList.add("dark");
  }
  function updateThemeIcon() {
    const icon = $("#themeIcon");
    if (!icon) return;
    icon.setAttribute("data-lucide", document.documentElement.classList.contains("dark") ? "sun" : "moon");
    window.lucide?.createIcons();
  }
  updateThemeIcon();
  themeToggle?.addEventListener("click", () => {
    const dark = document.documentElement.classList.toggle("dark");
    try { localStorage.setItem("surajpur-virasat-theme", dark ? "dark" : "light"); } catch (_) { /* storage optional */ }
    updateThemeIcon();
  });

  // Location selector lets a visitor open another QR destination without scanning it.
  $("#locationExplorer")?.addEventListener("change", (event) => {
    const target = event.currentTarget.value || "/";
    window.location.href = `${target}${target.includes("?") ? "&" : "?"}lang=${lang}`;
  });

  // Reference-style tab navigation for desktop tabs and the mobile bottom bar.
  const tabNames = ["about", "wildlife", "rescue", "gallery", "location"];
  function switchTab(tabName, shouldScroll = false) {
    if (!tabNames.includes(tabName)) return;
    tabNames.forEach((name) => {
      const panel = $(`#panel-${name}`);
      const active = name === tabName;
      panel?.classList.toggle("hidden", !active);
      $$(`[data-tab="${name}"]`).forEach((button) => {
        button.classList.toggle("selected", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    });
    if (shouldScroll) {
      const main = $(".ref-panel:not(.hidden)");
      main?.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth", block: "start" });
    }
    window.lucide?.createIcons();
  }
  $$('[data-tab]').forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.tab, true)));
  const initialTab = location.hash.replace(/^#/, "");
  if (tabNames.includes(initialTab)) switchTab(initialTab, false);

  // Open the visitor's current-device route. GPS coordinates stay in the browser and are sent to Google Maps only after consent.
  $$('[data-current-directions]').forEach((button) => button.addEventListener("click", () => {
    const destination = button.dataset.destination || config.destination || "Surajpur District, Chhattisgarh, India";
    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    const routeTab = window.open("about:blank", "_blank");
    if (routeTab) routeTab.opener = null;
    const openRoute = (url) => {
      if (routeTab && !routeTab.closed) routeTab.location.href = url;
      else window.location.href = url;
    };
    if (!navigator.geolocation || !window.isSecureContext) {
      openRoute(fallbackUrl);
      toast(isHindi ? "वर्तमान लोकेशन उपलब्ध नहीं; गंतव्य का नक्शा खोला गया है।" : "Current location is unavailable; opening the destination in Google Maps.");
      return;
    }
    toast(isHindi ? "रास्ता दिखाने के लिए लोकेशन अनुमति दें…" : "Allow location access to calculate your route…");
    navigator.geolocation.getCurrentPosition((position) => {
      const origin = `${position.coords.latitude},${position.coords.longitude}`;
      openRoute(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`);
    }, () => {
      openRoute(fallbackUrl);
      toast(isHindi ? "लोकेशन अनुमति नहीं मिली; केवल गंतव्य खोला गया है।" : "Location permission was unavailable; opened the destination instead.");
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 });
  }));

  // Bilingual browser speech guide. Speech is queued sentence-by-sentence to avoid long-utterance truncation.
  const speechSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  let speechState = "idle";
  let speechChunks = [];
  let speechIndex = 0;
  let speechRun = 0;

  function splitNarration(text, maxLength = 210) {
    const sentences = String(text || "").replace(/\s+/g, " ").match(/[^.!?।]+[.!?।]?/g) || [];
    const result = [];
    let current = "";
    for (const raw of sentences) {
      const sentence = raw.trim();
      if (!sentence) continue;
      if (sentence.length > maxLength) {
        if (current) { result.push(current); current = ""; }
        let part = "";
        for (const word of sentence.split(/\s+/)) {
          if (part && `${part} ${word}`.length > maxLength) { result.push(part); part = word; }
          else part = part ? `${part} ${word}` : word;
        }
        if (part) result.push(part);
      } else if (current && `${current} ${sentence}`.length > maxLength) {
        result.push(current); current = sentence;
      } else current = current ? `${current} ${sentence}` : sentence;
    }
    if (current) result.push(current);
    return result;
  }

  function bestVoice() {
    const voices = speechSynthesis.getVoices();
    const expected = isHindi ? "hi-IN" : "en-IN";
    const prefix = isHindi ? "hi" : "en";
    const exact = voices.filter((voice) => voice.lang?.toLowerCase() === expected.toLowerCase());
    const regional = voices.filter((voice) => voice.lang?.toLowerCase().startsWith(prefix));
    const preferred = (items) => items.find((voice) => /natural|neural|google|microsoft/i.test(voice.name || ""));
    return preferred(exact) || exact[0] || preferred(regional) || regional[0] || null;
  }

  function setSpeechState(next) {
    speechState = next;
    const label = $("#audioLabel");
    const icon = $("#audioIcon");
    const banner = $("#speechBanner");
    const status = $("#speechStatus");
    if (label) label.textContent = next === "playing"
      ? (isHindi ? "ऑडियो रोकें" : "Pause Audio Tour")
      : next === "paused" ? (isHindi ? "जारी रखें" : "Resume Audio Tour")
      : (isHindi ? "ऑडियो गाइड सुनें" : "Listen Audio Tour");
    if (icon) icon.setAttribute("data-lucide", next === "playing" ? "pause" : next === "paused" ? "play" : "volume-2");
    banner?.classList.toggle("hidden", next === "idle");
    if (status) status.textContent = next === "paused"
      ? (isHindi ? "ऑडियो रुका हुआ है" : "Audio is paused")
      : (isHindi ? "ऑडियो गाइड चल रहा है…" : "Audio guide is playing…");
    window.lucide?.createIcons();
  }

  function speakNext(run) {
    if (run !== speechRun) return;
    if (speechIndex >= speechChunks.length) {
      setSpeechState("idle");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(speechChunks[speechIndex]);
    utterance.lang = isHindi ? "hi-IN" : "en-IN";
    utterance.rate = 0.92;
    utterance.pitch = 1;
    const voice = bestVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (run !== speechRun) return;
      speechIndex += 1;
      speakNext(run);
    };
    utterance.onerror = (event) => {
      if (run !== speechRun || event.error === "canceled" || event.error === "interrupted") return;
      speechRun += 1;
      speechSynthesis.cancel();
      setSpeechState("idle");
      toast(isHindi ? "ऑडियो चलाने में समस्या आई।" : "The audio guide could not be played.");
    };
    speechSynthesis.speak(utterance);
  }

  function startNarration() {
    if (!speechSupported) {
      toast(isHindi ? "इस ब्राउज़र में ऑडियो सुविधा उपलब्ध नहीं है।" : "Audio narration is not supported by this browser.");
      return;
    }
    speechChunks = splitNarration(config.speechText);
    if (!speechChunks.length) {
      toast(isHindi ? "इस पेज के लिए ऑडियो जानकारी उपलब्ध नहीं है।" : "No audio description is available for this page yet.");
      return;
    }
    speechRun += 1;
    speechIndex = 0;
    speechSynthesis.cancel();
    setSpeechState("playing");
    speakNext(speechRun);
  }

  $("#audioButton")?.addEventListener("click", () => {
    if (!speechSupported) return startNarration();
    if (speechState === "playing" && speechSynthesis.speaking) {
      speechSynthesis.pause();
      setSpeechState("paused");
    } else if (speechState === "paused" && speechSynthesis.paused) {
      speechSynthesis.resume();
      setSpeechState("playing");
    } else startNarration();
  });
  window.addEventListener("pagehide", () => { if (speechSupported) speechSynthesis.cancel(); });

  // Modals: keep background scrolling locked while a dialog is open (mobile Safari safe).
  function syncModalScrollLock() {
    const hasOpenModal = $$(".ref-modal").some((modal) => !modal.classList.contains("hidden"));
    document.body.classList.toggle("sv-modal-open", hasOpenModal);
  }
  function openModal(id) {
    const modal = $(`#${id}`);
    if (!modal) return;
    modal.classList.remove("hidden");
    syncModalScrollLock();
  }
  function closeModal(id) {
    $(`#${id}`)?.classList.add("hidden");
    syncModalScrollLock();
  }
  $("#pitchOpen")?.addEventListener("click", () => openModal("pitchModal"));
  $("#sosOpen")?.addEventListener("click", () => openModal("sosModal"));
  $$('[data-close]').forEach((button) => button.addEventListener("click", () => closeModal(button.dataset.close)));
  $$(".ref-modal").forEach((modal) => modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal(modal.id);
  }));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") $$(".ref-modal").forEach((modal) => closeModal(modal.id));
  });

  // QR modal: on-screen QR preview plus server-generated print-quality SVG / 1600-DPI PNG links.
  $("#qrOpen")?.addEventListener("click", () => {
    openModal("qrModal");
    const box = $("#qrPreview");
    if (!box) return;
    box.replaceChildren();
    const target = config.qrTargetUrl || location.href;
    if (window.QRCode) {
      new QRCode(box, {
        text: target,
        width: 220,
        height: 220,
        colorDark: "#052e16",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      box.textContent = isHindi ? "QR पूर्वावलोकन उपलब्ध नहीं" : "QR preview is unavailable";
    }
  });
  $("#copyQrLink")?.addEventListener("click", async () => {
    const target = config.qrTargetUrl || location.href;
    try {
      await navigator.clipboard.writeText(target);
      toast(isHindi ? "QR लिंक कॉपी हो गया।" : "QR link copied.");
    } catch (_) {
      const input = document.createElement("textarea");
      input.value = target;
      document.body.appendChild(input);
      input.select();
      const ok = document.execCommand("copy");
      input.remove();
      toast(ok ? (isHindi ? "लिंक कॉपी हो गया।" : "Link copied.") : (isHindi ? "कॉपी नहीं हो सका।" : "Could not copy the link."));
    }
  });

  // Gallery lightbox with photo credits and original source links.
  $$(".ref-gallery-tile").forEach((tile) => tile.addEventListener("click", () => {
    const image = $("#lightboxImage");
    const caption = $("#lightboxCaption");
    const credit = $("#lightboxCredit");
    if (image) image.src = tile.dataset.image || "";
    if (caption) caption.textContent = tile.dataset.caption || "";
    if (credit) {
      credit.replaceChildren();
      if (tile.dataset.credit) credit.append(document.createTextNode(tile.dataset.credit));
      if (tile.dataset.sourceUrl) {
        if (credit.textContent) credit.append(document.createTextNode(" · "));
        const link = document.createElement("a");
        link.href = tile.dataset.sourceUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = isHindi ? "स्रोत / लाइसेंस" : "Source / licence";
        credit.append(link);
      }
    }
    openModal("lightbox");
  }));

  // Native share when supported, otherwise copy the current URL.
  $("#shareButton")?.addEventListener("click", async () => {
    const shareData = {
      title: document.title,
      text: $("#heroTitle")?.textContent?.trim() || document.title,
      url: location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(location.href);
        toast(isHindi ? "लिंक कॉपी हो गया।" : "Page link copied.");
      } else {
        const input = document.createElement("textarea");
        input.value = location.href;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand("copy");
        input.remove();
        toast(copied ? (isHindi ? "लिंक कॉपी हो गया।" : "Page link copied.") : (isHindi ? "लिंक कॉपी नहीं हो सका।" : "Could not copy the page link."));
      }
    } catch (error) {
      if (error?.name !== "AbortError") toast(isHindi ? "शेयर नहीं हो पाया।" : "Could not share this page.");
    }
  });

  // Subtle reveal-on-scroll: progressive enhancement with a no-animation fallback.
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (!reduceMotion && "IntersectionObserver" in window) {
    const revealItems = $$(".ref-panel > article, .ref-panel > .grid > article, .ref-gallery-item, .ref-route-button");
    if (revealItems.length) {
      document.documentElement.classList.add("sv-motion-ready");
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      revealItems.forEach((item) => {
        item.classList.add("sv-reveal");
        revealObserver.observe(item);
      });
    }
  }

  window.lucide?.createIcons();
})();
