/* Story page: "The Adventures of Bunny", told as album tracks.
   Each track is a tall section whose copy stays pinned while the stage plays it: the set piece changes,
   the character performs the track's roles (src/choreo.js), and the player bar shows the track's mood.
   Press play and the album plays itself: it moves to the next track after a reading pause, the
   character nods along, and the track's music plays if one has been added in the admin. */
import C, { asset } from "../content.js";
import { initShell, $, $$, esc, hl, pageUrl, scrollToEl, copyEmail, toast, reduceMotion } from "../shared.js";
import { createDirector } from "../choreo.js";

const S = C.story, T = S.tracks;
const ENDING = T.length; // the debrief counts as one more "track" for the stage
initShell("story", {
  actions: [
    ["Play the story", "Player", () => setPlaying(true)],
    ...T.map((t, i) => [t.title, "Track", () => go(i)]),
  ],
});

/* ---------- Copy ---------- */
$("#album").textContent = S.album;
$("#subtitle").innerHTML = hl(S.subtitle);

// "58% → 78%" counts up from the first number to the second when its track plays
const statHtml = (s) => esc(s).replace(/(\d+)%\s*→\s*(\d+)%/, (_, a, b) => `${a}% → <span class="count" data-from="${a}" data-to="${b}">${b}</span>%`);
$("#tracks").innerHTML = T.map((t, i) => `
  <li class="track" id="${esc(t.id)}" data-i="${i}">
    <div class="track-copy">
      <h2>${esc(t.title)}</h2>
      <p class="track-lead">${hl(t.lead)}</p>
      <p>${hl(t.text)}</p>
      ${i === 0 ? `<button class="btn primary" data-play>Press play</button>` : ""}
      ${t.pins?.length ? `<ul class="pins">${t.pins.map((p, j) => `<li><button aria-expanded="false" data-pin="${j}"><b>${esc(p.title)}</b><span>${esc(p.text)}</span></button></li>`).join("")}</ul>` : ""}
      ${t.stat ? `<p class="sticker">${statHtml(t.stat)}</p>` : ""}
      ${t.notes ? `<details class="liner"><summary>Liner notes</summary>${t.notes.split(/\n\n+/).map((para) => `<p>${hl(para)}</p>`).join("")}</details>` : ""}
    </div>
  </li>`).join("");

$("#ending-title").textContent = S.ending.title;
$("#ending-text").innerHTML = hl(S.ending.text);
$("#ending-links").innerHTML = `<a class="btn primary" href="${pageUrl("contact")}">Write to me</a>`
  + `<a class="btn" href="${pageUrl("work")}">See the work</a><button class="btn" id="say-hi">Copy my email</button>`;
$("#say-hi").addEventListener("click", copyEmail);

/* ---------- Set pieces: flat drawings in the palette, behind (back) or in front of (front) the character ---------- */
const fill = (v) => `style="fill:var(${v})"`;
const record = (size, extra = "") => `<svg viewBox="0 0 100 100" ${extra}><g class="spins">
  <circle cx="50" cy="50" r="50" ${fill("--black")}/>${[44, 38, 32, 26].map((r) => `<circle cx="50" cy="50" r="${r}" style="fill:none;stroke:var(--grey);stroke-width:.6"/>`).join("")}
  <circle cx="50" cy="50" r="15" ${fill("--red")}/><circle cx="50" cy="50" r="2" ${fill("--black")}/><rect x="56" y="44" width="10" height="3" ${fill("--white")}/></g></svg>`;
const BACK = {
  play: () => record(0, `style="left:50%;top:6%;width:min(84%,56svh);translate:-50% 0"`),
  corner: () => `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="inset:0;width:100%;height:100%"><rect x="21.6" y="0" width=".4" height="10" ${fill("--grey")}/><polygon points="18,10 26,10 29,15 15,15" ${fill("--white")}/></svg>`,
  board: (t) => `<div class="cork">${(t.pins || []).map((_, j) => `<i class="note" style="--tilt:${((j * 53) % 11) - 5}deg"></i>`).join("")}</div>`,
  detour: () => `<svg viewBox="0 0 400 300" preserveAspectRatio="none" style="left:0;bottom:0;width:100%;height:60%"><path d="M-20 310 C 140 250, 40 150, 210 120 S 360 40, 430 10" style="fill:none;stroke:var(--grey);stroke-width:46"/><path class="road-dash" d="M-20 310 C 140 250, 40 150, 210 120 S 360 40, 430 10" style="fill:none;stroke:var(--white);stroke-width:3"/></svg>`,
  portal: () => `<svg viewBox="0 0 100 100" style="left:50%;top:4%;width:min(86%,58svh);translate:-50% 0"><g class="spins" style="animation-play-state:running;animation-duration:12s"><circle cx="50" cy="50" r="44" style="fill:none;stroke:var(--blue);stroke-width:4;stroke-dasharray:40 12"/><circle cx="50" cy="50" r="38" style="fill:none;stroke:var(--grey);stroke-width:1.5"/></g></svg>`,
  runway: () => `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="inset:0;width:100%;height:100%"><polygon points="38,62 62,62 80,100 20,100" ${fill("--grey")}/>${Array.from({ length: 6 }, (_, j) => { const y = 64 + j * 6.5, w = 12 + j * 3.2; return `<circle class="runway-light" style="--j:${j};fill:var(--white)" cx="${50 - w}" cy="${y}" r=".9"/><circle class="runway-light" style="--j:${j};fill:var(--white)" cx="${50 + w}" cy="${y}" r=".9"/>`; }).join("")}</svg>`,
  crossroads: () => `<svg viewBox="0 0 400 300" preserveAspectRatio="none" style="left:0;bottom:0;width:100%;height:56%"><path d="M200 300 C 200 220, 120 190, 30 150" style="fill:none;stroke:var(--blue);stroke-width:4"/><path d="M200 300 C 200 220, 280 190, 370 150" style="fill:none;stroke:var(--grey);stroke-width:4"/></svg>`,
};
const FRONT = {
  corner: () => `<p class="code-bubble"><code></code></p>`,
  detour: () => record(0, `class="scratch-disc" style="right:6%;top:6%;width:22%"`),
  crossroads: () => `<div class="sign"><b class="flip">The End</b></div>`,
};
const layer = (sets, scene, t, i) => `<div class="scene scene-${esc(scene)}" data-i="${i}">${(sets[scene] || (() => ""))(t)}</div>`;
$("#set-back").innerHTML = T.map((t, i) => layer(BACK, t.scene, t, i)).join("") + layer(BACK, "crossroads", {}, ENDING);
$("#set-front").innerHTML = T.map((t, i) => layer(FRONT, t.scene, t, i)).join("") + layer(FRONT, "crossroads", {}, ENDING);
const scenes = (i) => $$(`.scene[data-i="${i}"]`);

/* ---------- Character ---------- */
let fig = null, director = null;
const wide = matchMedia("(min-width: 901px)");
const pokes = [];
function dance(msg) {
  if (!fig) return;
  fig.react("dance");
  toast(msg);
}
// The first line of code appears once the laptop is on the desk
function onRole(role) {
  if (role !== "type") return;
  const s = scenes(active).find((el) => $(".code-bubble", el));
  if (!s) return;
  const code = $(".code-bubble code", s), text = 'print("Hello, World!")';
  code.textContent = "";
  later(() => {
    s.classList.add("typed");
    if (reduceMotion) { code.textContent = text; return; }
    [...text].forEach((ch, k) => later(() => (code.textContent += ch), k * 75));
  }, reduceMotion ? 0 : 700);
}
import("../figure.js").then(({ initFigure }) => {
  fig = initFigure(C.figure, {
    turn: wide.matches ? -0.22 : 0, // turned a little toward the copy
    onPoke() {
      $("#stage-hint").classList.add("gone");
      const now = performance.now();
      pokes.push(now);
      while (pokes.length && now - pokes[0] > 3000) pokes.shift();
      if (pokes.length >= 5) { pokes.length = 0; setTimeout(() => dance("Five clicks: Bunny's got moves"), 50); }
    },
  });
  if (!fig) return;
  director = createDirector(fig, { onRole });
  director.setGroove(playing);
  if (active >= 0) director.perform(rolesFor(active));
});
const rolesFor = (i) => (i === ENDING ? ["bow", "idle"] : T[i].actions?.length ? T[i].actions : ["idle"]);

/* ---------- Which track is on ---------- */
const trackEls = $$(".track");
const debrief = $("#debrief");
let active = -1;
const timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));

function enter(i) {
  active = i;
  timers.splice(0).forEach(clearTimeout);
  $$(".scene").forEach((s) => s.classList.toggle("on", +s.dataset.i === i));
  $$(".scene.typed").forEach((s) => s.classList.remove("typed"));
  trackEls.forEach((el, j) => el.classList.toggle("current", j === i));
  const t = T[i];
  $("#now").textContent = t ? t.mood || t.title : "Thanks for listening";
  if (director) director.perform(rolesFor(i));
  if (t) sceneCue(t, i);
  if (i === ENDING || t?.scene === "crossroads") flip();
  music(i);
  schedule();
}

// One-off moments for a scene
function sceneCue(t, i) {
  if (t.scene === "detour") scenes(i).forEach((s) => { s.classList.remove("scratch"); void s.offsetWidth; s.classList.add("scratch"); });
  const count = $(`.track[data-i="${i}"] .count`);
  if (count && !count.dataset.done) {
    count.dataset.done = 1;
    const a = +count.dataset.from, b = +count.dataset.to, t0 = performance.now(), dur = reduceMotion ? 1 : 1600;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      count.textContent = Math.round(a + (b - a) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
// "The End" flips to "To be continued" each time the crossroads comes on
const flip = () => $$(".scene .flip").forEach((f) => {
  f.classList.remove("flipped");
  f.textContent = "The End";
  later(() => f.classList.add("swap"), 2200);
  later(() => { f.textContent = "To be continued"; f.classList.replace("swap", "flipped"); }, 2650);
});

function update() {
  const mid = innerHeight * (wide.matches ? 0.45 : 0.7); // on a phone the pinned stage covers the top of the screen
  let i = 0;
  trackEls.forEach((el, j) => { if (el.getBoundingClientRect().top < mid) i = j; });
  if (debrief.getBoundingClientRect().top < innerHeight * 0.7) i = ENDING;
  if (i !== active) enter(i);

  // album progress on the vinyl ring
  const max = document.documentElement.scrollHeight - innerHeight;
  $("#ring").style.strokeDashoffset = (100 - (max > 0 ? (scrollY / max) * 100 : 0)).toFixed(2);

  // brag-board pins land one by one as the track scrolls past
  trackEls.forEach((el, j) => {
    const pins = $$(".pins li", el);
    if (!pins.length) return;
    const r = el.getBoundingClientRect();
    const k = Math.max(0, Math.min(1, (mid - r.top) / (r.height * 0.55)));
    const n = j < active ? pins.length : j > active ? 0 : Math.ceil(k * pins.length);
    pins.forEach((p, m) => p.classList.toggle("in", m < n));
    scenes(j).forEach((s) => $$(".note", s).forEach((p, m) => p.classList.toggle("in", m < n)));
  });
}
addEventListener("scroll", update, { passive: true });
addEventListener("resize", update);

/* ---------- Player ---------- */
let playing = false, dwell;
function setPlaying(on) {
  playing = on;
  document.body.classList.toggle("playing", on); // spins the records
  $("#play").setAttribute("aria-label", on ? "Pause the story" : "Play the story");
  if (director) director.setGroove(on);
  if (on && active <= 0 && scrollY < trackEls[0].offsetTop - innerHeight * 0.3) go(0);
  music(active);
  schedule();
}
// While playing, move on after a reading pause sized to the track's copy
function schedule() {
  clearTimeout(dwell);
  if (!playing) return;
  if (active >= ENDING) { setPlaying(false); return; }
  const t = T[active] || T[0];
  const words = `${t.lead} ${t.text}`.split(/\s+/).length;
  const ms = Math.min(16000, Math.max(8000, words * 250 + (t.actions?.length || 1) * 1200));
  dwell = setTimeout(() => go(active + 1), ms);
}
function go(i) {
  i = Math.max(0, Math.min(ENDING, i));
  scrollToEl(i === ENDING ? debrief : trackEls[i]);
}
$("#play").addEventListener("click", () => setPlaying(!playing));
$("#prev").addEventListener("click", () => go(active - 1));
$("#next").addEventListener("click", () => go(active + 1));
$$("[data-play]").forEach((b) => b.addEventListener("click", () => setPlaying(true)));
$("#vinyl").addEventListener("click", () => dance("You found the dance"));

// Pins open to show their detail; the world title gets a victory dance, the rest get a point
$("#tracks").addEventListener("click", (e) => {
  const b = e.target.closest("[data-pin]");
  if (!b) return;
  b.setAttribute("aria-expanded", b.getAttribute("aria-expanded") !== "true");
  b.parentElement.classList.remove("poked");
  void b.offsetWidth;
  b.parentElement.classList.add("poked");
  if (fig) fig.react(/champion/i.test(b.textContent) ? "victory" : "point");
});

/* ---------- Music (optional, per track, added through the admin) ---------- */
const audio = {};
let nowPlaying = null;
function fade(a, to, then) {
  const step = () => {
    a.volume = Math.max(0, Math.min(1, a.volume + Math.sign(to - a.volume) * 0.05));
    if (Math.abs(a.volume - to) > 0.05) setTimeout(step, 50);
    else { a.volume = to; then?.(); }
  };
  step();
}
function music(i) {
  const src = playing && T[i]?.music ? asset(T[i].music) : "";
  const next = src ? (audio[i] ||= Object.assign(new Audio(src), { loop: true, volume: 0 })) : null;
  if (next === nowPlaying) return;
  const prev = nowPlaying;
  if (prev) fade(prev, 0, () => prev.pause());
  if (next) { next.play().catch(() => {}); fade(next, 0.8); }
  nowPlaying = next;
}

update();
