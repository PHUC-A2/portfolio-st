/**
 * PHUC KA Portfolio
 * theme | loader | nav | reveal | skills | cursor
 */

const STORAGE_THEME = "phuc-ka-theme";
const LOADER_MS = 1500;
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

const initIcons = () => {
  if (typeof lucide !== "undefined") lucide.createIcons();
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
      initIcons();
    });
  });
};

/* ===== Loading intro ===== */
const initLoader = () => {
  document.body.classList.add("no-scroll");
  DOM.navLogo?.classList.add("is-reload");

  setTimeout(() => {
    DOM.navLogo?.classList.remove("is-reload");
    DOM.loader?.classList.add("is-hidden");
    document.body.classList.remove("no-scroll");
    document.body.classList.add("is-ready");
  }, LOADER_MS);
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
    initIcons();
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
    { threshold: 0.1, rootMargin: "0px 0px -36px 0px" }
  );

  DOM.reveals.forEach((el) => observer.observe(el));
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
  initScrollReveal();
  initSkillBars();
  initCursorGlow();
  initButtonRipple();
  initSmoothAnchor();
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
