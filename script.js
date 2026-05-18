/**
 * PHUC KA Portfolio
 * theme | loader | nav | reveal | skills | cursor
 */

const STORAGE_THEME = "phuc-ka-theme";
const LOADER_MIN_MS = 2500;
const LOADER_MAX_MS = 3200;
const LOADER_FADE_MS = 850;
const NAV_BREAKPOINT = 992;

/* ===== Theme (class .dark trên documentElement) ===== */
const getPreferredTheme = () => {
  const saved = localStorage.getItem(STORAGE_THEME);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = (theme) => {
  const isDark = theme === "dark";
  const root = document.documentElement;

  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
  root.style.backgroundColor = isDark ? "#0a0a0f" : "#f8f8fc";

  const meta = document.getElementById("metaTheme");
  if (meta) meta.content = isDark ? "#0a0a0f" : "#f8f8fc";
};

const syncThemeFromDOM = () => {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

/* Bật lại transition sau khi render (bỏ .preload) */
const enableThemeTransitions = () => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove("preload");
    });
  });
};

/* ===== DOM refs ===== */
const DOM = {};

const cacheDOM = () => {
  DOM.loader = document.getElementById("loader");
  DOM.loaderLogo = document.getElementById("loaderLogoImg");
  DOM.header = document.getElementById("header");
  DOM.navToggle = document.getElementById("navToggle");
  DOM.navMenu = document.getElementById("navMenu");
  DOM.navLinks = document.querySelectorAll(".nav__link");
  DOM.navLogo = document.querySelector(".nav__logo");
  DOM.themeToggle = document.getElementById("themeToggle");
  DOM.cursorGlow = document.getElementById("cursorGlow");
  DOM.reveals = document.querySelectorAll(".reveal");
  DOM.buttons = document.querySelectorAll(".btn");
};

/* Khởi tạo Lucide — root tùy chọn để tránh quét lại toàn trang */
const initIcons = (root) => {
  if (typeof lucide === "undefined") return;
  const scope = root && root.querySelectorAll ? root : document;
  lucide.createIcons({ nameAttr: "data-lucide", root: scope });
};

/* ===== Dark / Light toggle ===== */
const initThemeToggle = () => {
  if (!DOM.themeToggle) return;

  DOM.themeToggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const next = syncThemeFromDOM() === "dark" ? "light" : "dark";

    requestAnimationFrame(() => {
      applyTheme(next);
      localStorage.setItem(STORAGE_THEME, next);
      initIcons(DOM.themeToggle);
    });
  });
};

/* ===== Loading intro — glow ngay lập tức, tối thiểu 2.5s sau khi page + logo loaded ===== */
const initLoader = () => {
  const loader = DOM.loader;
  if (!loader) {
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-ready");
    return;
  }

  document.body.classList.add("no-scroll", "is-loading");
  DOM.navLogo?.classList.add("is-reload");

  let finished = false;
  let finishScheduled = false;
  const startedAt = Date.now();
  const gates = { page: false, logo: false };

  const finishLoader = () => {
    if (finished) return;
    finished = true;

    DOM.navLogo?.classList.remove("is-reload");
    loader.classList.add("is-exiting");
    loader.setAttribute("aria-busy", "false");

    loader.addEventListener(
      "animationend",
      (e) => {
        if (e.target !== loader || e.animationName !== "fadeOutLoader") return;
        loader.classList.add("is-hidden");
        document.body.classList.remove("no-scroll", "is-loading");
        document.body.classList.add("is-ready");
        loader.remove();
      },
      { once: true }
    );

    setTimeout(() => {
      if (!document.body.classList.contains("is-ready")) {
        loader.classList.add("is-hidden");
        document.body.classList.remove("no-scroll", "is-loading");
        document.body.classList.add("is-ready");
        loader.remove();
      }
    }, LOADER_FADE_MS + 200);
  };

  const scheduleFinish = () => {
    if (finishScheduled || finished) return;
    if (!gates.page || !gates.logo) return;
    finishScheduled = true;

    const elapsed = Date.now() - startedAt;
    const delay = Math.max(0, LOADER_MIN_MS - elapsed);
    setTimeout(finishLoader, delay);
  };

  const markLogoReady = () => {
    gates.logo = true;
    scheduleFinish();
  };

  const markPageReady = () => {
    gates.page = true;
    scheduleFinish();
  };

  const logoImg = DOM.loaderLogo;
  if (logoImg) {
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      markLogoReady();
    } else {
      logoImg.addEventListener("load", markLogoReady, { once: true });
      logoImg.addEventListener("error", markLogoReady, { once: true });
    }
  } else {
    gates.logo = true;
  }

  if (document.readyState === "complete") {
    markPageReady();
  } else {
    window.addEventListener("load", markPageReady, { once: true });
  }

  /* Hết thời gian tối đa — vẫn tôn trọng LOADER_MIN_MS */
  setTimeout(() => {
    if (finished) return;
    gates.page = true;
    gates.logo = true;
    if (!finishScheduled) {
      finishScheduled = true;
      const elapsed = Date.now() - startedAt;
      const delay = Math.max(0, LOADER_MIN_MS - elapsed);
      setTimeout(finishLoader, delay);
    }
  }, LOADER_MAX_MS);
};

/* ===== Navbar scroll blur ===== */
const initHeaderScroll = () => {
  const onScroll = () => DOM.header?.classList.toggle("is-scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
};

/* ===== Mobile menu ===== */
const setNavOpen = (isOpen) => {
  if (!DOM.navMenu || !DOM.navToggle) return;

  DOM.navMenu.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("nav-open", isOpen);
  DOM.navToggle.setAttribute("aria-expanded", String(isOpen));
  DOM.navToggle.setAttribute("aria-label", isOpen ? "Đóng menu" : "Mở menu");

  const icon = DOM.navToggle.querySelector("[data-lucide]");
  if (icon) {
    icon.setAttribute("data-lucide", isOpen ? "x" : "menu");
    initIcons(DOM.navToggle);
  }
};

const initMobileNav = () => {
  if (!DOM.navToggle || !DOM.navMenu) return;

  DOM.navToggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = !DOM.navMenu.classList.contains("is-open");
    setNavOpen(isOpen);
  });

  DOM.navLinks.forEach((link) => {
    link.addEventListener("click", () => setNavOpen(false));
  });

  /* Đóng menu khi bấm overlay (không đóng khi bấm nút menu) */
  document.addEventListener("click", (e) => {
    if (!document.body.classList.contains("nav-open")) return;
    if (e.target.closest("#navMenu") || e.target.closest("#navToggle")) return;
    setNavOpen(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > NAV_BREAKPOINT) setNavOpen(false);
  });
};

/* ===== Active nav theo section ===== */
const initActiveNav = () => {
  const sections = document.querySelectorAll("section[id]");
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        DOM.navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
        });
      });
    },
    { rootMargin: "-42% 0px -48% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
};

/* ===== Stagger delay cho nhóm reveal ===== */
const initStaggerReveal = () => {
  document.querySelectorAll("[data-stagger]").forEach((container) => {
    const step = parseInt(container.dataset.stagger, 10) || 80;
    container.querySelectorAll(".reveal").forEach((el, index) => {
      el.style.setProperty("--reveal-delay", `${index * step}ms`);
    });
  });
};

/* ===== Scroll reveal ===== */
const initScrollReveal = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
};

/* ===== Skill progress bars ===== */
const initSkillBars = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll(".skill-bar").forEach((bar) => {
          bar.style.setProperty("--level", bar.dataset.level || "0");
          bar.classList.add("is-animated");
        });
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.25 }
  );

  document.querySelectorAll("[data-skill]").forEach((card) => observer.observe(card));
};

/* ===== Cursor glow ===== */
const initCursorGlow = () => {
  if (!DOM.cursorGlow || window.matchMedia("(hover: none)").matches) return;

  let x = 0;
  let y = 0;
  let cx = 0;
  let cy = 0;

  document.addEventListener("mousemove", (e) => {
    x = e.clientX;
    y = e.clientY;
  });

  const tick = () => {
    cx += (x - cx) * 0.12;
    cy += (y - cy) * 0.12;
    DOM.cursorGlow.style.left = `${cx}px`;
    DOM.cursorGlow.style.top = `${cy}px`;
    requestAnimationFrame(tick);
  };

  tick();
};

/* ===== Button ripple ===== */
const initButtonRipple = () => {
  DOM.buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.remove("is-ripple");
      void btn.offsetWidth;
      btn.classList.add("is-ripple");
      setTimeout(() => btn.classList.remove("is-ripple"), 500);
    });
  });
};

/* ==========================================================================
   Auto-translate DOM (Google unofficial API)
   ========================================================================== */

const STORAGE_LANG = "phuc-ka-lang";
const STORAGE_I18N_CACHE = "phuc-ka-i18n-cache";
const SOURCE_LANG = "vi";
const I18N_DEBOUNCE_MS = 80;

/* Mã ngôn ngữ Google Translate — render dropdown bằng JS */
const TRANSLATE_LANGUAGES_RAW = [
  { lang: "vi", code: "VI", label: "Vietnamese" },
  { lang: "en", code: "EN", label: "English" },
  { lang: "lo", code: "LO", label: "Lao" },
  { lang: "fr", code: "FR", label: "Français" },
  { lang: "de", code: "DE", label: "Deutsch" },
  { lang: "es", code: "ES", label: "Español" },
  { lang: "it", code: "IT", label: "Italiano" },
  { lang: "pt", code: "PT", label: "Português" },
  { lang: "ru", code: "RU", label: "Русский" },
  { lang: "ja", code: "JA", label: "日本語" },
  { lang: "ko", code: "KO", label: "한국어" },
  { lang: "zh-CN", code: "ZH", label: "中文 (Giản thể)" },
  { lang: "zh-TW", code: "TW", label: "中文 (Phồn thể)" },
  { lang: "ar", code: "AR", label: "العربية" },
  { lang: "hi", code: "HI", label: "हिन्दी" },
  { lang: "th", code: "TH", label: "ไทย" },
  { lang: "id", code: "ID", label: "Bahasa Indonesia" },
  { lang: "ms", code: "MS", label: "Bahasa Melayu" },
  { lang: "tr", code: "TR", label: "Türkçe" },
  { lang: "pl", code: "PL", label: "Polski" },
  { lang: "nl", code: "NL", label: "Nederlands" },
  { lang: "sv", code: "SV", label: "Svenska" },
  { lang: "no", code: "NO", label: "Norsk" },
  { lang: "da", code: "DA", label: "Dansk" },
  { lang: "fi", code: "FI", label: "Suomi" },
  { lang: "cs", code: "CS", label: "Čeština" },
  { lang: "ro", code: "RO", label: "Română" },
  { lang: "hu", code: "HU", label: "Magyar" },
  { lang: "uk", code: "UK", label: "Українська" },
  { lang: "el", code: "EL", label: "Ελληνικά" },
  { lang: "he", code: "HE", label: "עברית" },
  { lang: "bn", code: "BN", label: "বাংলা" },
  { lang: "ur", code: "UR", label: "اردو" },
  { lang: "ta", code: "TA", label: "தமிழ்" },
  { lang: "te", code: "TE", label: "తెలుగు" },
  { lang: "ml", code: "ML", label: "മലയാളം" },
  { lang: "mr", code: "MR", label: "मराठी" },
  { lang: "ne", code: "NE", label: "नेपाली" },
  { lang: "si", code: "SI", label: "සිංහල" },
  { lang: "km", code: "KM", label: "ខ្មែរ" },
  { lang: "my", code: "MY", label: "မြန်မာ" },
  { lang: "ka", code: "KA", label: "ქართული" },
  { lang: "bg", code: "BG", label: "Български" },
  { lang: "hr", code: "HR", label: "Hrvatski" },
  { lang: "sr", code: "SR", label: "Српски" },
  { lang: "sk", code: "SK", label: "Slovenčina" },
  { lang: "sl", code: "SL", label: "Slovenščina" },
  { lang: "lt", code: "LT", label: "Lietuvių" },
  { lang: "lv", code: "LV", label: "Latviešu" },
  { lang: "et", code: "ET", label: "Eesti" },
  { lang: "is", code: "IS", label: "Íslenska" },
  { lang: "ga", code: "GA", label: "Gaeilge" },
  { lang: "cy", code: "CY", label: "Cymraeg" },
  { lang: "mk", code: "MK", label: "Македонски" },
  { lang: "fa", code: "FA", label: "فارسی" },
  { lang: "ps", code: "PS", label: "پښتو" },
  { lang: "ku", code: "KU", label: "Kurdî" },
  { lang: "af", code: "AF", label: "Afrikaans" },
  { lang: "sw", code: "SW", label: "Kiswahili" },
  { lang: "zu", code: "ZU", label: "isiZulu" },
  { lang: "xh", code: "XH", label: "isiXhosa" },
  { lang: "yo", code: "YO", label: "Yorùbá" },
  { lang: "ig", code: "IG", label: "Igbo" },
  { lang: "am", code: "AM", label: "አማርኛ" },
  { lang: "sn", code: "SN", label: "chiShona" },
  { lang: "so", code: "SO", label: "Soomaali" },
  { lang: "haw", code: "HAW", label: "ʻŌlelo Hawaiʻi" },
  { lang: "sm", code: "SM", label: "Gagana Samoa" },
  { lang: "to", code: "TO", label: "lea fakatonga" },
  { lang: "mi", code: "MI", label: "te reo Māori" },
];

/* Loại trùng lang (giữ bản đầu tiên) */
const TRANSLATE_LANGUAGES = TRANSLATE_LANGUAGES_RAW.filter((item, index, arr) => {
  return arr.findIndex((x) => x.lang === item.lang) === index;
});
const I18N_QUEUE_CONCURRENCY = 10;
const I18N_PERSIST_FLUSH_MS = 500;

/* Thẻ bỏ qua khi duyệt text node */
const I18N_SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "IFRAME",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "OPTION",
  "CODE",
  "PRE",
  "KBD",
  "SAMP",
  "SVG",
]);

const I18N = {
  currentLang: SOURCE_LANG,
  originalMap: new WeakMap(),
  memoryCache: new Map(),
  persistedCache: null,
  persistTimer: null,
  persistDirty: false,
  pageNodes: null,
  runId: 0,
  debounceTimer: null,
  isTranslating: false,
  observer: null,
  observerPaused: false,
  triggerEl: null,
  menuEl: null,
  langCodeEl: null,
  optionEls: null,
  langMap: null,
  searchEl: null,
  switcherEl: null,
  menuOpen: false,
};

/* Kiểm tra phần tử có bị loại khỏi dịch không */
const isNoTranslateElement = (el) => {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
  if (I18N_SKIP_TAGS.has(el.tagName)) return true;
  if (el.getAttribute("data-no-translate") === "true") return true;
  return false;
};

/* Kiểm tra text node có nằm trong vùng cấm dịch không */
const isTranslatableTextNode = (node) => {
  const parent = node.parentElement;
  if (!parent) return false;

  let el = parent;
  while (el) {
    if (isNoTranslateElement(el)) return false;
    el = el.parentElement;
  }

  const value = node.nodeValue;
  return Boolean(value && value.trim());
};

/* Duyệt toàn bộ text node trong root */
const collectTextNodes = (root = document.body) => {
  const list = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return isTranslatableTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  while (walker.nextNode()) {
    list.push(walker.currentNode);
  }

  return list;
};

/* Lưu bản gốc tiếng Việt (chỉ lần đầu) */
const rememberOriginal = (node) => {
  if (!I18N.originalMap.has(node)) {
    I18N.originalMap.set(node, node.nodeValue);
  }
};

/* Giữ khoảng trắng / xuống dòng đầu-cuối khi gán bản dịch */
const applyTextWithWhitespace = (node, translatedCore) => {
  const original = I18N.originalMap.get(node) ?? node.nodeValue ?? "";
  const lead = original.match(/^\s*/)?.[0] ?? "";
  const trail = original.match(/\s*$/)?.[0] ?? "";
  const core = String(translatedCore ?? "").trim();
  node.textContent = `${lead}${core}${trail}`;
};

/* Đọc cache localStorage — chỉ gọi lúc khởi tạo */
const readPersistedCache = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_I18N_CACHE) || "{}");
  } catch {
    return {};
  }
};

/* Nạp cache vào RAM — tránh parse JSON lặp lại mỗi lần tra */
const hydrateI18nCache = () => {
  if (I18N.persistedCache) return;
  I18N.persistedCache = readPersistedCache();
  Object.entries(I18N.persistedCache).forEach(([key, value]) => {
    I18N.memoryCache.set(key, value);
  });
};

/* Ghi cache ra localStorage theo lô — tránh block main thread */
const flushPersistedCache = () => {
  if (!I18N.persistDirty || !I18N.persistedCache) return;
  try {
    const keys = Object.keys(I18N.persistedCache);
    if (keys.length > 800) {
      keys.slice(0, keys.length - 800).forEach((k) => delete I18N.persistedCache[k]);
    }
    localStorage.setItem(STORAGE_I18N_CACHE, JSON.stringify(I18N.persistedCache));
    I18N.persistDirty = false;
  } catch {
    /* Bỏ qua nếu localStorage đầy */
  }
};

const schedulePersistedCacheFlush = () => {
  I18N.persistDirty = true;
  clearTimeout(I18N.persistTimer);
  I18N.persistTimer = setTimeout(flushPersistedCache, I18N_PERSIST_FLUSH_MS);
};

const buildCacheKey = (fromLang, toLang, text) => `${fromLang}|${toLang}|${text}`;

/* Lấy bản dịch từ cache RAM (đã hydrate) */
const getCachedTranslation = (fromLang, toLang, text) => {
  hydrateI18nCache();
  const key = buildCacheKey(fromLang, toLang, text);
  return I18N.memoryCache.get(key) ?? null;
};

const setCachedTranslation = (fromLang, toLang, text, translated) => {
  hydrateI18nCache();
  const key = buildCacheKey(fromLang, toLang, text);
  I18N.memoryCache.set(key, translated);
  I18N.persistedCache[key] = translated;
  schedulePersistedCacheFlush();
};

/* Hàng đợi request — tránh spam API */
class TranslateQueue {
  constructor(concurrency = I18N_QUEUE_CONCURRENCY) {
    this.concurrency = concurrency;
    this.running = 0;
    this.pending = [];
  }

  enqueue(task) {
    return new Promise((resolve, reject) => {
      this.pending.push({ task, resolve, reject });
      this.pump();
    });
  }

  pump() {
    while (this.running < this.concurrency && this.pending.length) {
      const job = this.pending.shift();
      this.running += 1;

      Promise.resolve()
        .then(() => job.task())
        .then(job.resolve, job.reject)
        .finally(() => {
          this.running -= 1;
          this.pump();
        });
    }
  }
}

const translateQueue = new TranslateQueue();

/* Gọi Google Translate unofficial API */
const fetchTranslation = async (text, targetLang) => {
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t` +
    `&q=${encodeURIComponent(text)}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Translate HTTP ${response.status}`);

  const payload = await response.json();
  const segments = Array.isArray(payload?.[0]) ? payload[0] : [];
  const merged = segments.map((part) => part?.[0] ?? "").join("");
  return merged || text;
};

/* Dịch một chuỗi (có cache), đưa vào queue */
const translateString = async (text, targetLang, runId) => {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const cached = getCachedTranslation(SOURCE_LANG, targetLang, trimmed);
  if (cached) return cached;

  if (runId !== I18N.runId) return text;

  const translated = await translateQueue.enqueue(() => fetchTranslation(trimmed, targetLang));

  if (runId !== I18N.runId) return text;

  setCachedTranslation(SOURCE_LANG, targetLang, trimmed, translated);
  return translated;
};

/* Nhóm text node theo nội dung trim — giảm request trùng */
const groupNodesByText = (nodes) => {
  const groups = new Map();

  nodes.forEach((node) => {
    rememberOriginal(node);
    const original = I18N.originalMap.get(node) ?? node.nodeValue ?? "";
    const trimmed = original.trim();
    if (!trimmed) return;

    if (!groups.has(trimmed)) groups.set(trimmed, []);
    groups.get(trimmed).push(node);
  });

  return groups;
};

/* Cache danh sách text node — tránh traverse DOM mỗi lần đổi ngôn ngữ */
const getPageTextNodes = () => {
  if (!I18N.pageNodes) I18N.pageNodes = collectTextNodes();
  return I18N.pageNodes;
};

const invalidatePageTextNodes = () => {
  I18N.pageNodes = null;
};

/* Tạm dừng observer khi đang dịch — tránh trigger dịch lặp */
const pauseI18nObserver = () => {
  if (!I18N.observer || I18N.observerPaused) return;
  I18N.observer.disconnect();
  I18N.observerPaused = true;
};

const resumeI18nObserver = () => {
  if (!I18N.observer || !I18N.observerPaused) return;
  I18N.observer.observe(document.body, { childList: true, subtree: true });
  I18N.observerPaused = false;
};

/* Cập nhật DOM một lần trong 1 frame — tránh nhảy chữ rời rạc */
const flushDomTranslations = (groups, translationMap, runId) =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      if (runId !== I18N.runId) {
        resolve();
        return;
      }

      groups.forEach((nodeList, trimmed) => {
        const translated = translationMap.get(trimmed);
        if (translated === undefined) return;
        nodeList.forEach((node) => applyTextWithWhitespace(node, translated));
      });

      resolve();
    });
  });

/* Khôi phục tiếng Việt gốc — không gọi API, flush 1 frame */
const restoreVietnamese = (nodes) =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        if (I18N.originalMap.has(node)) {
          node.textContent = I18N.originalMap.get(node);
        }
      }
      resolve();
    });
  });

const setTranslatingUI = (isLoading) => {
  I18N.isTranslating = isLoading;
  I18N.switcherEl?.classList.toggle("is-loading", isLoading);
  document.body.classList.toggle("is-translating", isLoading);
};

/* Dịch toàn trang: resolve API trước, cập nhật DOM một lần */
const translateNodes = async (targetLang, nodes, runId) => {
  if (!nodes.length || runId !== I18N.runId) return;

  if (targetLang === SOURCE_LANG) {
    await restoreVietnamese(nodes);
    return;
  }

  const groups = groupNodesByText(nodes);
  const translationMap = new Map();
  const needApi = [];

  groups.forEach((_nodeList, trimmed) => {
    const cached = getCachedTranslation(SOURCE_LANG, targetLang, trimmed);
    if (cached) translationMap.set(trimmed, cached);
    else needApi.push(trimmed);
  });

  if (needApi.length && runId === I18N.runId) {
    await Promise.all(
      needApi.map(async (trimmed) => {
        try {
          const translated = await translateString(trimmed, targetLang, runId);
          if (runId === I18N.runId) translationMap.set(trimmed, translated);
        } catch {
          /* Giữ nguyên text gốc nếu API lỗi */
        }
      })
    );
  }

  if (runId !== I18N.runId || !translationMap.size) return;

  await flushDomTranslations(groups, translationMap, runId);
};

/* Đổi ngôn ngữ — entry chính */
const applyLanguage = async (targetLang) => {
  const runId = ++I18N.runId;
  const lang = targetLang || SOURCE_LANG;

  I18N.currentLang = lang;
  document.documentElement.lang = lang === SOURCE_LANG ? "vi" : lang;
  syncLangSwitcherUI(lang);
  setLangMenuOpen(false);

  pauseI18nObserver();

  if (lang === SOURCE_LANG) {
    setTranslatingUI(true);
    document.body.classList.add("is-i18n-switching");
    document.body.classList.remove("is-i18n-ready");

    try {
      const nodes = getPageTextNodes();
      await restoreVietnamese(nodes);
      if (runId === I18N.runId) {
        localStorage.setItem(STORAGE_LANG, SOURCE_LANG);
      }
    } finally {
      if (runId === I18N.runId) {
        setTranslatingUI(false);
        document.body.classList.remove("is-i18n-switching");
        document.body.classList.add("is-i18n-ready");
      }
      if (I18N.observerPaused) resumeI18nObserver();
    }
    return;
  }

  setTranslatingUI(true);
  document.body.classList.add("is-i18n-switching");
  document.body.classList.remove("is-i18n-ready");

  try {
    const nodes = getPageTextNodes();
    await translateNodes(lang, nodes, runId);

    if (runId === I18N.runId) {
      localStorage.setItem(STORAGE_LANG, lang);
      flushPersistedCache();
    }
  } finally {
    if (runId === I18N.runId) {
      setTranslatingUI(false);
      document.body.classList.remove("is-i18n-switching");
      document.body.classList.add("is-i18n-ready");
    }
    if (I18N.observerPaused) resumeI18nObserver();
  }
};

/* Debounce khi user đổi ngôn ngữ liên tục */
const scheduleLanguageChange = (lang) => {
  clearTimeout(I18N.debounceTimer);
  I18N.debounceTimer = setTimeout(() => {
    applyLanguage(lang);
  }, I18N_DEBOUNCE_MS);
};

/* Dịch node mới khi DOM thay đổi (MutationObserver) */
const translateNewNodes = async (addedNodes) => {
  if (I18N.currentLang === SOURCE_LANG || I18N.isTranslating) return;

  const fresh = [];
  addedNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && isTranslatableTextNode(node)) {
      fresh.push(node);
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      fresh.push(...collectTextNodes(node));
    }
  });

  if (!fresh.length) return;

  invalidatePageTextNodes();
  const runId = I18N.runId;
  pauseI18nObserver();
  try {
    await translateNodes(I18N.currentLang, fresh, runId);
  } finally {
    if (I18N.observerPaused) resumeI18nObserver();
  }
};

const initDomTranslateObserver = () => {
  if (I18N.observer) return;

  I18N.observer = new MutationObserver((mutations) => {
    const added = [];
    mutations.forEach((m) => {
      m.addedNodes.forEach((n) => added.push(n));
    });
    if (added.length) translateNewNodes(added);
  });

  I18N.observer.observe(document.body, { childList: true, subtree: true });
};

/* Đồng bộ UI dropdown với ngôn ngữ hiện tại */
const syncLangSwitcherUI = (lang) => {
  const activeLang = lang || SOURCE_LANG;

  I18N.optionEls?.forEach((btn) => {
    const isActive = btn.dataset.lang === activeLang;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  const meta = I18N.langMap?.get(activeLang);
  const activeBtn = I18N.optionEls?.find((btn) => btn.dataset.lang === activeLang);
  if (I18N.langCodeEl) {
    I18N.langCodeEl.textContent = meta?.code || activeBtn?.dataset.code || "VI";
  }
};

/* Lọc danh sách ngôn ngữ trong menu */
const filterLangMenu = (query) => {
  const q = query.trim().toLowerCase();
  I18N.optionEls?.forEach((btn) => {
    const li = btn.closest("li");
    if (!li) return;
    const haystack = btn.dataset.search || "";
    li.hidden = Boolean(q && !haystack.includes(q));
  });
};

/* Render toàn bộ option ngôn ngữ vào #langMenu */
const renderLangMenu = () => {
  const menu = document.getElementById("langMenu");
  if (!menu) return;

  I18N.langMap = new Map(TRANSLATE_LANGUAGES.map((item) => [item.lang, item]));

  const fragment = document.createDocumentFragment();

  const searchLi = document.createElement("li");
  searchLi.className = "lang-switcher__search-wrap";
  searchLi.setAttribute("role", "presentation");
  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.className = "lang-switcher__search";
  searchInput.id = "langSearch";
  searchInput.placeholder = "Tìm ngôn ngữ...";
  searchInput.setAttribute("autocomplete", "off");
  searchInput.setAttribute("aria-label", "Tìm ngôn ngữ");
  searchLi.appendChild(searchInput);
  fragment.appendChild(searchLi);

  TRANSLATE_LANGUAGES.forEach((item) => {
    const li = document.createElement("li");
    li.setAttribute("role", "presentation");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lang-switcher__option";
    btn.setAttribute("role", "option");
    btn.dataset.lang = item.lang;
    btn.dataset.code = item.code;
    btn.dataset.search = `${item.label} ${item.lang} ${item.code}`.toLowerCase();
    btn.setAttribute("aria-selected", item.lang === SOURCE_LANG ? "true" : "false");
    if (item.lang === SOURCE_LANG) btn.classList.add("is-active");
    btn.textContent = item.label;

    li.appendChild(btn);
    fragment.appendChild(li);
  });

  menu.replaceChildren(fragment);
  I18N.searchEl = searchInput;
  I18N.optionEls = Array.from(menu.querySelectorAll(".lang-switcher__option"));
};

const setLangMenuOpen = (isOpen) => {
  I18N.menuOpen = isOpen;
  I18N.switcherEl?.classList.toggle("is-open", isOpen);
  I18N.triggerEl?.setAttribute("aria-expanded", String(isOpen));
  I18N.menuEl?.setAttribute("aria-hidden", String(!isOpen));

  if (isOpen) {
    initIcons(I18N.switcherEl);
    filterLangMenu("");
    if (I18N.searchEl) {
      I18N.searchEl.value = "";
      requestAnimationFrame(() => I18N.searchEl?.focus());
    }
  }
};

const initLangSwitcherUI = () => {
  I18N.triggerEl = document.getElementById("langTrigger");
  I18N.menuEl = document.getElementById("langMenu");
  I18N.langCodeEl = document.getElementById("langCode");
  I18N.switcherEl = document.getElementById("langSwitcher");

  if (!I18N.triggerEl || !I18N.menuEl) return;

  renderLangMenu();

  I18N.triggerEl.addEventListener("click", (e) => {
    e.stopPropagation();
    if (I18N.isTranslating) return;
    setLangMenuOpen(!I18N.menuOpen);
  });

  I18N.searchEl?.addEventListener("input", (e) => {
    e.stopPropagation();
    filterLangMenu(e.target.value);
  });

  I18N.searchEl?.addEventListener("click", (e) => e.stopPropagation());

  I18N.menuEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".lang-switcher__option");
    if (!btn) return;

    e.stopPropagation();
    const lang = btn.dataset.lang;
    if (!lang || lang === I18N.currentLang) {
      setLangMenuOpen(false);
      return;
    }

    I18N.currentLang = lang;
    syncLangSwitcherUI(lang);
    setLangMenuOpen(false);
    scheduleLanguageChange(lang);
  });

  document.addEventListener("click", (e) => {
    if (!I18N.menuOpen) return;
    if (e.target.closest("#langSwitcher")) return;
    setLangMenuOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && I18N.menuOpen) setLangMenuOpen(false);
  });
};

/* Khởi tạo dropdown + khôi phục ngôn ngữ đã lưu */
const initAutoTranslate = () => {
  I18N.switcherEl = document.getElementById("langSwitcher");
  if (!I18N.switcherEl) return;

  initLangSwitcherUI();
  if (!I18N.triggerEl) return;

  hydrateI18nCache();
  window.addEventListener("beforeunload", flushPersistedCache);

  const saved = localStorage.getItem(STORAGE_LANG);
  if (saved && I18N.langMap?.has(saved)) {
    I18N.currentLang = saved;
  }

  syncLangSwitcherUI(I18N.currentLang);

  initDomTranslateObserver();

  const runSavedLang = () => {
    const lang = I18N.currentLang || SOURCE_LANG;
    if (lang !== SOURCE_LANG) {
      applyLanguage(lang);
    }
  };

  /* Chờ loader xong rồi mới dịch — tránh lag lúc intro */
  if (document.body.classList.contains("is-ready")) {
    runSavedLang();
  } else {
    const waitReady = new MutationObserver(() => {
      if (!document.body.classList.contains("is-ready")) return;
      waitReady.disconnect();
      runSavedLang();
    });
    waitReady.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("load", runSavedLang, { once: true });
  }
};

/* ===== Smooth scroll ===== */
const initSmoothAnchor = () => {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      setNavOpen(false);

      const offset =
        parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h"), 10) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });
};

/* ===== Khởi chạy ===== */
const boot = () => {
  cacheDOM();
  initThemeToggle();
  initLoader();
  initHeaderScroll();
  initMobileNav();
  initActiveNav();
  initStaggerReveal();
  initScrollReveal();
  initSkillBars();
  initCursorGlow();
  initButtonRipple();
  initSmoothAnchor();
  initAutoTranslate();
  initIcons();

  /* Đồng bộ meta theme sau khi DOM sẵn sàng */
  applyTheme(syncThemeFromDOM());
  enableThemeTransitions();
};

/* Luôn gọi boot dù DOM đã load hay chưa */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

window.addEventListener("load", () => {
  initIcons();
  enableThemeTransitions();
});

/* ===== Khởi tạo năm hiện tại ===== */
const initYear = () => {
  const year = new Date().getFullYear();
  document.getElementById("year").textContent = year;
};

initYear();