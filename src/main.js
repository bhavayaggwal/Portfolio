/* The page arrives fully rendered (src/render.js). This adds the live parts: theme and language, the clock,
   each project's latest GitHub activity, in-page form sending, the footer extras, and Bunny in 3D. */
import "./style.css";
import { setLang, t, ago, lang } from "./i18n.js";

const $ = (s, el = document) => el.querySelector(s);
// Remembered per visitor; private windows can refuse storage, so every access is guarded.
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

/* Theme: the visitor's choice, else the system's (set before paint by the script in index.html) */
const themeBtn = $("#theme");
const isDark = () => document.documentElement.dataset.theme === "dark";
const showTheme = () => themeBtn.setAttribute("aria-checked", String(isDark()));
themeBtn.addEventListener("click", () => {
  document.documentElement.dataset.theme = isDark() ? "light" : "dark";
  store.set("theme", document.documentElement.dataset.theme);
  showTheme();
});
showTheme();

/* Language: the visitor's choice, remembered; English by default */
const picker = $("#lang");
picker.value = store.get("lang") || "en";
picker.addEventListener("change", () => { store.set("lang", picker.value); setLang(picker.value); });
if (picker.value !== "en") setLang(picker.value);

/* Live clock in the bar: Bhavay's local time and its offset from GMT */
const clock = $("#clock");
function tick() {
  const parts = new Intl.DateTimeFormat(`${lang}-u-nu-latn`, { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: clock.dataset.tz, timeZoneName: "shortOffset" }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value;
  clock.firstElementChild.textContent = `${get("hour")}:${get("minute")}:${get("second")}`;
  clock.lastElementChild.textContent = get("timeZoneName");
}
tick();
setInterval(tick, 1000);

/* Project cards: language and last push from GitHub's public API (no key; 60 requests an hour per visitor) */
let repos = null;
function showRepos() {
  if (!repos) return;
  document.querySelectorAll(".live[data-repo]").forEach((el) => {
    const r = repos[el.dataset.repo];
    if (r) el.textContent = r.language ? t("{language}, updated {when}", { language: r.language, when: ago(r.pushed_at) }) : t("updated {when}", { when: ago(r.pushed_at) });
  });
}
const gh = $(".actions a[href*='github.com']")?.href.replace(/\/+$/, "").split("/").pop();
if (gh) {
  fetch(`https://api.github.com/users/${gh}/repos?per_page=100&sort=pushed`)
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((list) => { repos = Object.fromEntries(list.map((r) => [r.name.toLowerCase(), r])); showRepos(); })
    .catch(() => {}); // the cards already say "GitHub" and link there
}
document.addEventListener("langchange", () => { showRepos(); tick(); });

/* Contact form: send in the page through Web3Forms (the form still posts without JavaScript) */
const form = $("#contact-form");
if (form && form.action.includes("web3forms")) {
  const status = $(".form-status", form), send = $("button", form);
  const say = (msg, kind = "") => { status.textContent = msg; status.className = `form-status ${kind}`; };
  const email = $("a.email")?.textContent;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    if (data.botcheck) return; // a bot ticked the hidden box
    send.disabled = true;
    say(t("Sending…"));
    try {
      const res = await fetch(form.action, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.success) throw new Error(out.message || res.status);
      form.reset();
      say(t("Sent. Thank you, I'll reply by email."), "ok");
    } catch {
      say(t("That didn't go through. Try again, or write to {email} directly.", { email }), "err");
    } finally {
      send.disabled = false;
    }
  });
}

/* Footer: copy the llms.txt link, the back-to-top button, and Snake (loaded on first play) */
$("#copy-llms")?.addEventListener("click", async (e) => {
  const url = new URL("llms.txt", location.href).href;
  try { await navigator.clipboard.writeText(url); e.currentTarget.textContent = t("Copied"); }
  catch { location.href = url; }
});
const top = $(".to-top");
addEventListener("scroll", () => top.classList.toggle("show", scrollY > innerHeight), { passive: true });
const game = $("#game");
let startSnake;
$("#play")?.addEventListener("click", async () => {
  startSnake ||= (await import("./snake.js")).initSnake(game, t);
  game.showModal();
  startSnake();
});

/* Bunny: loaded only when his panel is near the screen, and only with WebGL and motion allowed */
const slot = $("#figure-slot");
if (slot?.dataset.model && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  new IntersectionObserver(([en], io) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    import("./figure.js").then(({ initFigure }) => initFigure(slot, slot.dataset.model));
  }, { rootMargin: "200px" }).observe(slot);
}
