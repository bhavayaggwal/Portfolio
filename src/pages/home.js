/* Home: Bunny dancing behind the welcome, the big name that flies into the bar, Bunny landing in the story box
   with a wave, the skill cluster, a project carousel, and the email. */
import C from "../content.js";
import { initShell, $, esc, hl, observeReveals, projectCard, reduceMotion } from "../shared.js";
import { initSphere } from "../sphere.js";

initShell("home");
const p = C.profile, S = C.story;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease = (t) => t * t * (3 - 2 * t);

/* ---------- Copy ---------- */
$("#name").textContent = p.name;
$("#landing-line").innerHTML = hl(p.landingLine || "");
$("#story-h").textContent = S.album;
$("#story-sub").innerHTML = hl(S.subtitle);
$("#email-big").innerHTML = esc(p.email).replace("@", "@<wbr>"); // on a phone it breaks after the @
$("#email-big").href = "mailto:" + p.email;
$("#where").textContent = `Based in ${p.location}`;
$("#gh").href = p.links.github;
$("#li").href = p.links.linkedin;

/* ---------- The big name flies into the bar's name as the hero scrolls away ---------- */
const nameEl = $("#name"), mark = $(".wordmark");
let n0 = null;
function measureName() {
  nameEl.style.transform = "";
  const r = nameEl.getBoundingClientRect();
  n0 = { left: r.left, top: r.top + scrollY, size: parseFloat(getComputedStyle(nameEl).fontSize) };
}
function nameStep() {
  if (reduceMotion) { document.body.style.setProperty("--mark", 1); return; }
  const q = ease(clamp01(scrollY / (innerHeight * 0.5)));
  const m = mark.getBoundingClientRect();
  const s = 1 + (parseFloat(getComputedStyle(mark).fontSize) / n0.size - 1) * q;
  nameEl.style.transform = `translate(${(m.left - n0.left) * q}px, ${(m.top - (n0.top - scrollY)) * q}px) scale(${s})`;
  nameEl.style.opacity = (1 - clamp01((q - 0.7) / 0.3)).toFixed(3);
  nameEl.style.visibility = q >= 1 ? "hidden" : ""; // gone once it has become the bar's name
  document.body.style.setProperty("--mark", clamp01((q - 0.85) / 0.15).toFixed(3));
}

/* ---------- Bunny: dances behind the hero, idles while he travels, waves when he lands in his box ---------- */
const slot = $("#figure-slot"), heroArea = $("#fig-hero"), box = $("#fig-box");
let fig = null, W = 1, H = 1, mode = "";
function sizeSlot() {
  W = box.clientWidth; H = box.clientHeight;
  slot.style.width = W + "px";
  slot.style.height = H + "px";
}
// The largest copy of the slot that fits a box, standing on its bottom edge
const fit = (r) => { const s = Math.min(r.width / W, r.height / H); return { x: r.left + (r.width - W * s) / 2, y: r.top + r.height - H * s, s }; };
function setMode(m) {
  if (m === mode || !fig) return;
  mode = m;
  if (m === "dance") fig.play(fig.clipFor("dance"));
  else fig.play(fig.clipFor("idle"));
  if (m === "landed") fig.react("wave");
}
function figStep() {
  const b = box.getBoundingClientRect();
  const land = b.top + scrollY + b.height / 2 - innerHeight / 2; // the box centred on screen
  const t = reduceMotion ? 1 : clamp01(scrollY / Math.max(1, land));
  const k = ease(t), a = fit(heroArea.getBoundingClientRect()), z = fit(b);
  const x = a.x + (z.x - a.x) * k, y = a.y + (z.y - a.y) * k, s = a.s + (z.s - a.s) * k;
  slot.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
  slot.style.opacity = (0.7 + 0.3 * k).toFixed(3); // a little dimmer while he is the background
  if (fig) fig.turn = -0.35 * k; // in his box he turns toward the copy
  setMode(t < 0.03 ? "dance" : t < 0.97 ? "fly" : "landed");
}

function step() { nameStep(); figStep(); }
function layout() { measureName(); sizeSlot(); step(); }
addEventListener("scroll", step, { passive: true });
addEventListener("resize", layout);
document.fonts?.ready.then(layout);
layout();

import("../figure.js").then(({ initFigure }) => {
  fig = initFigure(C.figure, { slot, onPoke: () => $("#stage-hint").classList.add("gone") });
  if (!fig) return;
  fig.ready.then(() => { mode = ""; figStep(); }); // start the right motion for where the page already is
});

/* ---------- Skills ---------- */
initSphere($("#sphere"), $("#groups"), C.skills);
$("#skill-list").innerHTML = Object.values(C.skills).flat().map((s) => `<li>${esc(s)}</li>`).join("");

/* ---------- Work: a carousel of project cards (scroll-snap, buttons, drag with a mouse) ---------- */
const slides = $("#slides");
slides.innerHTML = C.projects.map((pr) => `<li>${projectCard(pr)}</li>`).join("");
const stepBy = (dir) => {
  const li = slides.querySelector("li");
  slides.scrollBy({ left: dir * (li ? li.getBoundingClientRect().width + 32 : 400), behavior: reduceMotion ? "auto" : "smooth" });
};
$("#slide-prev").addEventListener("click", () => stepBy(-1));
$("#slide-next").addEventListener("click", () => stepBy(1));
let drag = null, dragged = false;
slides.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse") return; // touch scrolls natively
  drag = { x: e.clientX, left: slides.scrollLeft };
  dragged = false;
});
addEventListener("pointermove", (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  if (Math.abs(dx) > 4) { dragged = true; slides.classList.add("dragging"); }
  slides.scrollLeft = drag.left - dx;
});
addEventListener("pointerup", () => { drag = null; slides.classList.remove("dragging"); });
slides.addEventListener("click", (e) => { if (dragged) { e.preventDefault(); dragged = false; } }, true); // a drag is not a click

observeReveals();
