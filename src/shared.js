/* Shared shell for every page: header and navigation, footer, theme, clock, smooth scrolling,
   command menu, toasts and scroll reveals. Each page calls initShell() then renders its own content. */
import "./style.css";
import Lenis from "lenis";
import C, { root } from "./content.js";

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Copy from the admin can mark key words as *like this*; they show with a red highlight.
export const hl = (s) => esc(s).replace(/\*([^*\n]+)\*/g, "<mark>$1</mark>");
export const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

export const PAGES = [
  { id: "home", label: "Home", href: "", nav: false }, // reached through the name in the bar
  { id: "story", label: "Story", href: "story/" },
  { id: "work", label: "Work", href: "work/" },
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

/* ---------- Project cards (Home carousel, Work page) ---------- */
export const ago = (iso) => {
  const d = (Date.now() - new Date(iso)) / 864e5;
  if (d < 1) return "today";
  if (d < 2) return "yesterday";
  if (d < 30) return Math.round(d) + " days ago";
  if (d < 365) return Math.round(d / 30) + " months ago";
  return Math.round(d / 365) + " years ago";
};
// One project as a raised card; `r` is its live GitHub repo when we have it. Opens in a new tab.
export function projectCard(p, r) {
  const href = r ? r.html_url : `${C.profile.links.github}/${p.repo}`;
  const fact = r ? `${r.language || "Code"}, updated ${ago(r.pushed_at)}` : (p.stats || [])[0] || "";
  return `<a class="card" href="${esc(href)}" target="_blank" rel="noopener" draggable="false">
    ${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" draggable="false" />` : ""}
    <h3>${esc(p.title)}</h3><p>${esc(p.blurb)}</p><span class="stack">${esc((p.stack || []).join(", "))}</span><span class="fact">${esc(fact)}</span></a>`;
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
/**
 * Builds the bar, footer, command menu and toast around the page, and wires the shared behaviour.
 * @param {string} pageId  one of PAGES[].id, marks the current link
 * @param {{actions?: Array<[string, string, Function]>}} opts  extra command-menu entries for this page
 */
export function initShell(pageId, { actions = [] } = {}) {
  const p = C.profile;
  document.documentElement.classList.add("js"); // reveals may hide content only once the script runs
  const nav = PAGES.filter((pg) => pg.nav !== false);
  document.body.insertAdjacentHTML("afterbegin", `
    <a class="skip" href="#main">Skip to content</a>
    <header class="bar"><div class="wrap">
      <a class="wordmark" href="${pageUrl("home")}"${pageId === "home" ? ' aria-current="page"' : ""}>${esc(p.name)}</a>
      <nav class="nav" aria-label="Pages">
        ${nav.map((pg) => `<a href="${pageUrl(pg.id)}"${pg.id === pageId ? ' aria-current="page"' : ""}>${pg.label}</a>`).join("")}
      </nav>
    </div></header>`);
  document.body.insertAdjacentHTML("beforeend", `
    <footer class="foot"><div class="wrap">
      <div class="foot-cols">
        <div><p>Pages</p>${PAGES.map((pg) => `<a href="${pageUrl(pg.id)}">${pg.label}</a>`).join("")}</div>
        <div><p>Elsewhere</p><a href="${esc(p.links.github)}" target="_blank" rel="noopener">GitHub</a><a href="${esc(p.links.linkedin)}" target="_blank" rel="noopener">LinkedIn</a></div>
        <div><p>Write</p><a href="mailto:${esc(p.email)}">${esc(p.email)}</a><a href="${pageUrl("contact")}">Contact form</a></div>
        <div><p>Based in</p><span>${esc(p.location)}, <span id="clock"></span></span></div>
      </div>
      <span></span>
      <p class="foot-mark" aria-hidden="true">${esc(p.name)}</p>
      <p class="foot-legal">© ${new Date().getFullYear()} ${esc(p.name)}. Press Ctrl K for the menu.</p>
    </div></footer>
    <div class="palette" id="palette" hidden>
      <div class="palette-box" role="dialog" aria-modal="true" aria-label="Command menu">
        <input id="palette-input" type="text" placeholder="Go to a page or run an action" autocomplete="off" aria-label="Search pages and actions" aria-controls="palette-list" />
        <ul id="palette-list" role="listbox" data-lenis-prevent></ul>
      </div>
    </div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`);

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

  /* clock in the footer */
  const clock = $("#clock");
  const tick = () => (clock.textContent = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: p.timezone }).format(new Date()) + " " + p.timezoneLabel);
  tick();
  setInterval(tick, 15000);

  /* command menu (Ctrl K or /) */
  const pal = $("#palette"), input = $("#palette-input"), plist = $("#palette-list");
  const all = [
    ...PAGES.filter((pg) => pg.id !== pageId).map((pg) => [pg.label, "Page", () => (location.href = pageUrl(pg.id))]),
    ...actions,
    ["Copy email address", "Action", copyEmail],
    ...(p.resumeFile ? [["Download résumé", "Action", () => window.open(p.resumeFile, "_blank", "noopener")]] : []),
    ["Open GitHub", "Link", () => window.open(p.links.github, "_blank", "noopener")],
    ["Open LinkedIn", "Link", () => window.open(p.links.linkedin, "_blank", "noopener")],
  ];
  let filtered = all, sel = 0, lastFocus;
  function renderPalette() {
    const q = input.value.trim().toLowerCase();
    filtered = all.filter((a) => a[0].toLowerCase().includes(q) || a[1].toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(0, filtered.length - 1));
    plist.innerHTML = filtered.length
      ? filtered.map((a, i) => `<li role="option" data-i="${i}" aria-selected="${i === sel}"><span>${esc(a[0])}</span><span>${esc(a[1])}</span></li>`).join("")
      : `<li><span>No matches</span></li>`;
    const s = $('[aria-selected="true"]', plist);
    if (s) s.scrollIntoView({ block: "nearest" });
  }
  function openPalette() { lastFocus = document.activeElement; pal.hidden = false; if (lenis) lenis.stop(); input.value = ""; sel = 0; renderPalette(); input.focus(); }
  function closePalette() { pal.hidden = true; if (lenis) lenis.start(); if (lastFocus) lastFocus.focus({ preventScroll: true }); }
  function run(i) { const a = filtered[i]; if (!a) return; closePalette(); a[2](); }
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

  return { lenis };
}
