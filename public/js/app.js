(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const config = window.TP_CONFIG || { lang: "en", speechText: "" };

  // Theme preference
  const savedTheme = localStorage.getItem("tp-theme");
  if (savedTheme === "dark") document.documentElement.classList.add("dark");
  const themeButton = $("#themeToggle");
  const updateThemeIcon = () => {
    if (!themeButton) return;
    themeButton.innerHTML = `<i data-lucide="${document.documentElement.classList.contains("dark") ? "sun" : "moon"}"></i>`;
    window.lucide?.createIcons();
  };
  updateThemeIcon();
  themeButton?.addEventListener("click", () => {
    const dark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("tp-theme", dark ? "dark" : "light");
    updateThemeIcon();
  });

  // Switch to another location without scanning another QR code.
  $("#locationExplorer")?.addEventListener("change", (event) => {
    const target = event.target.value || "/";
    const lang = event.target.dataset.lang || config.lang || "en";
    window.location.href = `${target}${target.includes("?") ? "&" : "?"}lang=${lang}`;
  });

  // Open a route from the visitor's current device location. Coordinates stay in the browser and are sent only to Google Maps after the visitor taps Directions.
  $$ ("[data-current-directions]").forEach(button => button.addEventListener("click", () => {
    const destination = button.dataset.destination || config.destination || "Tamor Pingla Wildlife Sanctuary, Surajpur, Chhattisgarh, India";
    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    const routeTab = window.open("about:blank", "_blank");
    if (routeTab) routeTab.opener = null;
    const openRoute = url => {
      if (routeTab && !routeTab.closed) routeTab.location.href = url;
      else window.location.href = url;
    };
    if (!navigator.geolocation || !window.isSecureContext) {
      openRoute(fallbackUrl);
      toast(config.lang === "hi" ? "वर्तमान लोकेशन उपलब्ध नहीं; गूगल मैप्स में गंतव्य खोला गया है।" : "Current location is unavailable; the destination has been opened in Google Maps.");
      return;
    }
    toast(config.lang === "hi" ? "रास्ता दिखाने के लिए लोकेशन अनुमति दें…" : "Allow location access to calculate your route…");
    navigator.geolocation.getCurrentPosition(position => {
      const origin = `${position.coords.latitude},${position.coords.longitude}`;
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
      openRoute(url);
    }, () => {
      openRoute(fallbackUrl);
      toast(config.lang === "hi" ? "लोकेशन अनुमति नहीं मिली; गंतव्य का नक्शा खोला गया है।" : "Location permission was unavailable; opening the destination map instead.");
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 });
  }));

  // Browser speech guide. It automatically chooses a voice for the page language.
  const speechSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  let speechState = "idle";
  let activeUtterance = null;
  let speechRunId = 0;

  function chooseVoice() {
    if (!speechSupported) return null;
    const voices = speechSynthesis.getVoices();
    const wanted = config.lang === "hi" ? "hi-IN" : "en-IN";
    const prefix = config.lang === "hi" ? "hi" : "en";
    const exact = voices.filter(voice => voice.lang?.toLowerCase() === wanted.toLowerCase());
    const regional = voices.filter(voice => voice.lang?.toLowerCase().startsWith(prefix));
    const preferred = list => list.find(voice => /natural|neural|google|microsoft/i.test(voice.name || ""));
    return preferred(exact) || exact[0] || preferred(regional) || regional[0] || null;
  }

  function splitNarration(text, maxLength = 220) {
    const sentences = text.match(/[^.!?।]+[.!?।]?/g) || [text];
    const chunks = [];
    let current = "";
    for (const sentence of sentences) {
      const clean = sentence.trim();
      if (!clean) continue;
      if (clean.length > maxLength) {
        if (current) { chunks.push(current); current = ""; }
        let part = "";
        for (const word of clean.split(/\s+/)) {
          if (part && (part + " " + word).length > maxLength) {
            chunks.push(part);
            part = word;
          } else {
            part = part ? `${part} ${word}` : word;
          }
        }
        if (part) chunks.push(part);
        continue;
      }
      if (current && (current + " " + clean).length > maxLength) {
        chunks.push(current);
        current = clean;
      } else {
        current = current ? `${current} ${clean}` : clean;
      }
    }
    if (current) chunks.push(current);
    return chunks.length ? chunks : [text];
  }

  function setSpeechState(state) {
    speechState = state;
    const label = $("#audioLabel");
    const icon = $("#audioIcon");
    const button = $("#audioButton");
    const banner = $("#speechBanner");
    const status = $("#speechStatus");
    const isHindi = config.lang === "hi";
    if (label) {
      label.textContent = state === "playing"
        ? (isHindi ? "ऑडियो रोकें" : "Pause audio")
        : state === "paused" ? (isHindi ? "जारी रखें" : "Resume audio")
        : (isHindi ? "ऑडियो गाइड सुनें" : "Listen Audio Tour");
    }
    if (icon) icon.setAttribute("data-lucide", state === "playing" ? "pause" : state === "paused" ? "play" : "volume-2");
    if (button) button.setAttribute("aria-pressed", state === "playing" ? "true" : "false");
    banner?.classList.toggle("hidden", state === "idle");
    if (status) status.textContent = state === "paused"
      ? (isHindi ? "ऑडियो रुका हुआ है" : "Audio paused")
      : (isHindi ? "ऑडियो गाइड चल रहा है" : "Audio guide is playing");
    window.lucide?.createIcons();
  }

  function startNarration() {
    if (!speechSupported) return toast(config.lang === "hi" ? "इस ब्राउज़र में ऑडियो सुविधा उपलब्ध नहीं है।" : "Audio narration is not supported by this browser.");
    const text = String(config.speechText || "").replace(/\s+/g, " ").trim();
    if (!text) return toast(config.lang === "hi" ? "इस पेज के लिए ऑडियो जानकारी उपलब्ध नहीं है।" : "No narration has been added for this page yet.");

    speechRunId += 1;
    const runId = speechRunId;
    speechSynthesis.cancel();
    const voice = chooseVoice();
    const chunks = splitNarration(text);
    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = config.lang === "hi" ? "hi-IN" : "en-IN";
      utterance.rate = 0.91;
      utterance.pitch = 1;
      if (voice) utterance.voice = voice;
      utterance.onend = () => {
        if (runId !== speechRunId) return;
        if (index === chunks.length - 1) {
          activeUtterance = null;
          setSpeechState("idle");
        }
      };
      utterance.onerror = () => {
        if (runId !== speechRunId) return;
        speechRunId += 1;
        speechSynthesis.cancel();
        activeUtterance = null;
        setSpeechState("idle");
        toast(config.lang === "hi" ? "ऑडियो चलाने में समस्या आई।" : "The audio guide could not be played.");
      };
      if (index === 0) activeUtterance = utterance;
      speechSynthesis.speak(utterance);
    });
    setSpeechState("playing");
  }

  $("#audioButton")?.addEventListener("click", () => {
    if (!speechSupported) return startNarration();
    if (speechState === "playing" && speechSynthesis.speaking) {
      speechSynthesis.pause();
      setSpeechState("paused");
    } else if (speechState === "paused" && speechSynthesis.paused) {
      speechSynthesis.resume();
      setSpeechState("playing");
    } else {
      startNarration();
    }
  });

  // Modals
  function openModal(id) { $("#" + id)?.classList.remove("hidden"); }
  function closeModal(id) { $("#" + id)?.classList.add("hidden"); }
  $("#sosOpen")?.addEventListener("click", () => openModal("sosModal"));
  $$ ("[data-close]").forEach(button => button.addEventListener("click", () => closeModal(button.dataset.close)));
  $$(".modal-backdrop").forEach(backdrop => backdrop.addEventListener("click", event => {
    if (event.target === backdrop) backdrop.classList.add("hidden");
  }));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") $$(".modal-backdrop").forEach(modal => modal.classList.add("hidden"));
  });

  // Gallery lightbox
  $$(".gallery-tile").forEach(tile => tile.addEventListener("click", () => {
    const image = $("#lightboxImage");
    const caption = $("#lightboxCaption");
    const credit = $("#lightboxCredit");
    if (image) image.src = tile.dataset.image || "";
    if (caption) caption.textContent = tile.dataset.caption || "";
    if (credit) {
      credit.replaceChildren();
      credit.append(document.createTextNode(tile.dataset.credit ? `Photo credit: ${tile.dataset.credit}` : ""));
      const sourceUrl = tile.dataset.sourceUrl || "";
      if (sourceUrl) {
        credit.append(document.createTextNode(" · "));
        const link = document.createElement("a");
        link.href = sourceUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Source / licence";
        credit.append(link);
      }
    }
    openModal("lightbox");
  }));

  // Share the current page. Fall back to copying the link when native sharing is unavailable.
  $("#shareButton")?.addEventListener("click", async () => {
    const data = { title: document.title, text: $("h1")?.textContent?.trim() || document.title, url: location.href };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(location.href);
        toast(config.lang === "hi" ? "लिंक कॉपी हो गया।" : "Link copied.");
      } else {
        const temporary = document.createElement("textarea");
        temporary.value = location.href;
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";
        document.body.appendChild(temporary);
        temporary.select();
        const copied = document.execCommand("copy");
        temporary.remove();
        toast(copied ? (config.lang === "hi" ? "लिंक कॉपी हो गया।" : "Link copied.") : "Could not copy the link.");
      }
    } catch (error) {
      if (error.name !== "AbortError") toast(config.lang === "hi" ? "शेयर नहीं हो पाया।" : "Could not share this link.");
    }
  });

  function toast(message) {
    const element = $("#toast");
    if (!element) return;
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(window.__tpToastTimer);
    window.__tpToastTimer = setTimeout(() => element.classList.remove("show"), 2600);
  }

  window.lucide?.createIcons();
})();
