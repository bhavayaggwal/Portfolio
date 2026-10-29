/* Shared shell for every page: header and navigation, footer, theme, clock, smooth scrolling,
   command menu, toasts and scroll reveals. Each page calls initShell() then renders its own content. */
import "./style.css";
import Lenis from "lenis";
import C, { root } from "./content.js";

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

export const PAGES = [
  { id: "home", label: "Home", href: "", nav: false }, // reached through the name in the header
  { id: "story", label: "Story", href: "story/" },
  { id: "work", label: "Work", href: "work/" },
  { id: "papers", label: "Papers", href: "papers/" },
  { id: "skills", label: "Skills", href: "skills/" },
  { id: "contact", label: "Contact", href: "contact/" },
];
export const pageUrl = (id) => root + PAGES.find((p) => p.id === id).href;

let lenis = null;

/* ---------- Toast + email ---------- */
let toastTimer;
export function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}
export async function copyEmail() {
  try {
    await navigator.clipboard.writeText(C.profile.email);
    toast("Email copied: " + C.profile.email);
  } catch {
    location.href = "mailto:" + C.profile.email;
  }
}

/* ---------- Scrolling ---------- */
const headerOffset = () => -(($(".topbar") || {}).offsetHeight || 0) - 12;
export function scrollToEl(el) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: headerOffset(), duration: 1.4 });
  else el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
}

/* ---------- Reveals ---------- */
// Elements with .reveal ease in as they enter. `onReveal(el)` lets a page react (count up, type out…).
let io;
const revealHooks = [];
export function onReveal(fn) { revealHooks.push(fn); }
export function observeReveals() {
  if (!("IntersectionObserver" in window) || reduceMotion) { $$(".reveal").forEach((el) => el.classList.add("in")); return; }
  io = io || new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target;
    el.classList.add("in");
    // drop the stagger once revealed so hover effects respond immediately
    setTimeout(() => el.style.setProperty("--i", 0), 1200 + (+el.style.getPropertyValue("--i") || 0) * 90);
    revealHooks.forEach((fn) => fn(el));
    io.unobserve(el);
  }), { threshold: 0.15 });
  $$(".reveal:not(.in)").forEach((el) => {
    // stagger siblings so they arrive one after another
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--i", Math.min(sibs.indexOf(el), 6));
    io.observe(el);
  });
}

/* ---------- Shell ---------- */
const ICON_SUN = `<svg class="sun" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="1.6"/></svg>`;
const ICON_MOON = `<svg class="moon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;

/**
 * Builds the header, footer, command menu and toast around the page, and wires the shared behaviour.
 * @param {string} pageId  one of PAGES[].id, marks the current link
 * @param {{actions?: Array<[string, string, Function]>}} opts  extra command-menu entries for this page
 */
export function initShell(pageId, { actions = [] } = {}) {
  const p = C.profile;
  document.body.insertAdjacentHTML("afterbegin", `
    <a class="skip" href="#main">Skip to content</a>
    <header class="topbar">
      <a class="brand" href="${pageUrl("home")}">
        ${p.avatar ? `<img src="${esc(p.avatar)}" alt="" width="32" height="32" />`
          : `<span class="monogram" aria-hidden="true">${esc(p.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2))}</span>`}
        <span><strong>${esc(p.name)}</strong><small>${esc(p.role)}</small></span>
      </a>
      <nav class="nav" aria-label="Pages">
        ${PAGES.filter((pg) => pg.nav !== false).map((pg) => `<a href="${pageUrl(pg.id)}"${pg.id === pageId ? ' aria-current="page" class="active"' : ""}>${pg.label}</a>`).join("")}
      </nav>
      <div class="tools">
        <span class="clock mono" id="clock" aria-live="off"></span>
        <button class="kbd-btn mono" id="open-palette" aria-label="Open command menu">⌕ <kbd>Ctrl K</kbd></button>
        <button class="icon-btn" id="theme-toggle" aria-label="Toggle dark mode">${ICON_SUN}${ICON_MOON}</button>
      </div>
    </header>`);
  document.body.insertAdjacentHTML("beforeend", `
    <footer class="footer mono">
      <span>© ${new Date().getFullYear()} ${esc(p.name)}</span>
      <nav aria-label="Footer">${PAGES.filter((pg) => pg.nav !== false).map((pg) => `<a href="${pageUrl(pg.id)}">${pg.label}</a>`).join(" · ")}</nav>
    </footer>
    <div class="palette" id="palette" hidden>
      <div class="palette-box" role="dialog" aria-modal="true" aria-label="Command menu">
        <input id="palette-input" type="text" placeholder="Go to a page or run an action…" autocomplete="off" aria-controls="palette-list" />
        <ul id="palette-list" role="listbox" data-lenis-prevent></ul>
        <p class="mono palette-foot">↑↓ to move · Enter to run · Esc to close</p>
      </div>
    </div>
    <div class="toast mono" id="toast" role="status" aria-live="polite"></div>`);

  /* smooth scrolling */
  lenis = !reduceMotion ? new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 }) : null;
  if (lenis) {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  // in-page links (#…) glide instead of jumping
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute("href").length < 2) return;
    const el = document.getElementById(a.getAttribute("href").slice(1));
    if (!el) return;
    e.preventDefault();
    scrollToEl(el);
  });
  const topbar = $(".topbar");
  addEventListener("scroll", () => topbar.classList.toggle("scrolled", scrollY > 8), { passive: true });

  /* clock */
  const clock = $("#clock");
  const tick = () => {
    const t = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: p.timezone }).format(new Date());
    clock.textContent = `${p.location} · ${t} ${p.timezoneLabel}`;
  };
  tick();
  setInterval(tick, 15000);

  /* theme */
  const html = document.documentElement;
  const isDark = () => html.dataset.theme ? html.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  function toggleTheme() {
    html.dataset.theme = isDark() ? "light" : "dark";
    try { localStorage.setItem("theme", html.dataset.theme); } catch {}
  }
  $("#theme-toggle").addEventListener("click", toggleTheme);

  /* command menu */
  const pal = $("#palette"), input = $("#palette-input"), plist = $("#palette-list");
  const all = [
    ...PAGES.filter((pg) => pg.id !== pageId).map((pg) => [pg.label, "Page", () => (location.href = pageUrl(pg.id))]),
    ...actions,
    ["Copy email address", "Action", copyEmail],
    ...(p.resumeFile ? [["Download résumé", "Action", () => window.open(p.resumeFile, "_blank", "noopener")]] : []),
    ["Open GitHub", "Link", () => window.open(p.links.github, "_blank", "noopener")],
    ["Open LinkedIn", "Link", () => window.open(p.links.linkedin, "_blank", "noopener")],
    ["Toggle dark mode", "Action", toggleTheme],
  ];
  let filtered = all, sel = 0, lastFocus;
  function renderPalette() {
    const q = input.value.trim().toLowerCase();
    filtered = all.filter((a) => a[0].toLowerCase().includes(q) || a[1].toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(0, filtered.length - 1));
    plist.innerHTML = filtered.length
      ? filtered.map((a, i) => `<li role="option" data-i="${i}" aria-selected="${i === sel}"><span>${esc(a[0])}</span><span class="mono">${esc(a[1])}</span></li>`).join("")
      : `<li><span>No matches</span></li>`;
    const s = $('[aria-selected="true"]', plist);
    if (s) s.scrollIntoView({ block: "nearest" });
  }
  function openPalette() { lastFocus = document.activeElement; pal.hidden = false; if (lenis) lenis.stop(); input.value = ""; sel = 0; renderPalette(); input.focus(); }
  function closePalette() { pal.hidden = true; if (lenis) lenis.start(); if (lastFocus) lastFocus.focus({ preventScroll: true }); }
  function run(i) { const a = filtered[i]; if (!a) return; closePalette(); a[2](); }
  $("#open-palette").addEventListener("click", openPalette);
  input.addEventListener("input", () => { sel = 0; renderPalette(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % (filtered.length || 1); renderPalette(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + filtered.length) % (filtered.length || 1); renderPalette(); }
    else if (e.key === "Enter") { e.preventDefault(); run(sel); }
    else if (e.key === "Tab") e.preventDefault();
  });
  plist.addEventListener("click", (e) => { const li = e.target.closest("[data-i]"); if (li) run(+li.dataset.i); });
  pal.addEventListener("click", (e) => { if (e.target === pal) closePalette(); });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal.hidden ? openPalette() : closePalette(); }
    else if (e.key === "Escape" && !pal.hidden) closePalette();
    else if (e.key === "/" && pal.hidden && !e.target.closest?.("input, textarea")) { e.preventDefault(); openPalette(); }
  });
  if (/Mac|iPhone|iPad/.test(navigator.platform)) $("#open-palette kbd").textContent = "⌘K";

  return { lenis };
}
