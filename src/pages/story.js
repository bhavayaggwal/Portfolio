/* Story page: "The Adventures of Bunny", told as album tracks.
   Each track is a tall section whose copy stays pinned while the stage plays it: the set piece changes,
   the character performs the track's roles (src/choreo.js), and the player bar shows what's on.
   Press play and the album plays itself: it moves to the next track after a reading pause, the
   character nods along, and the track's music plays if one has been added in the admin. */
import C, { asset } from "../content.js";
import { initShell, $, $$, esc, pageUrl, scrollToEl, copyEmail, toast, reduceMotion } from "../shared.js";
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
$("#subtitle").textContent = S.subtitle;

// "58% → 78%" counts up from the first number to the second when its track plays
const statHtml = (s) => esc(s).replace(/(\d+)%\s*→\s*(\d+)%/, (_, a, b) => `${a}% → <span class="count" data-from="${a}" data-to="${b}">${a}</span>%`);
$("#tracks").innerHTML = T.map((t, i) => `
  <li class="track" id="${esc(t.id)}" data-i="${i}">
    <div class="track-copy">
      <h2>${esc(t.title)}</h2>
      <p class="track-lead">${esc(t.lead)}</p>
      <p>${esc(t.text)}</p>
      ${i === 0 ? `<button class="btn primary press-play" data-play><span aria-hidden="true">▶</span> Press play</button>` : ""}
      ${t.pins?.length ? `<ul class="pins">${t.pins.map((p, j) => `<li style="--tilt:${((j * 37) % 7) - 3}deg"><button data-pin="${j}"><b>${esc(p.title)}</b><span>${esc(p.text)}</span></button></li>`).join("")}</ul>` : ""}
      ${t.stat ? `<p class="sticker">${statHtml(t.stat)}</p>` : ""}
      ${t.notes ? `<details class="liner"><summary>Liner notes</summary>${t.notes.split(/\n\n+/).map((para) => `<p>${esc(para)}</p>`).join("")}</details>` : ""}
    </div>
  </li>`).join("");

$("#ending-title").textContent = S.ending.title;
$("#ending-text").textContent = S.ending.text;
$("#ending-links").innerHTML = ["work", "papers", "skills"].map((id) => `<a class="btn" href="${pageUrl(id)}">${id[0].toUpperCase() + id.slice(1)} →</a>`).join("")
  + `<button class="btn primary" id="say-hi">Say hi: ${esc(C.profile.email)}</button>`;
$("#say-hi").addEventListener("click", copyEmail);

/* ---------- Set pieces (decorative, behind the character) ---------- */
const SETS = {
  play: () => `<div class="big-disc"></div>`,
  corner: () => `<div class="lamp"></div><div class="notes"><i>♪</i><i>♫</i><i>♪</i><i>♬</i></div><p class="code-bubble"><code></code></p>`,
  board: (t) => `<div class="cork">${(t.pins || []).map((_, j) => `<i class="note" style="--tilt:${((j * 53) % 11) - 5}deg"></i>`).join("")}</div>`,
  detour: () => `<svg class="road" viewBox="0 0 400 300" preserveAspectRatio="none"><path d="M-20 310 C 140 250, 40 150, 210 120 S 360 40, 430 10"/><path class="dash" d="M-20 310 C 140 250, 40 150, 210 120 S 360 40, 430 10"/></svg><div class="scratch-disc"></div>`,
  portal: () => `<div class="streams">${Array.from({ length: 14 }, (_, j) => `<i style="--x:${j * 7.4 + 2}%;--d:${(j * 0.37) % 2.2}s;--s:${2.4 + (j % 4) * 0.6}s">${Array.from({ length: 12 }, (_, k) => (j * 7 + k * 3) % 2).join("")}</i>`).join("")}</div><div class="portal"></div>`,
  runway: () => `<div class="spot"></div><div class="runway">${Array.from({ length: 8 }, (_, j) => `<i style="--j:${j}"></i>`).join("")}</div>`,
  crossroads: () => `<svg class="paths" viewBox="0 0 400 300" preserveAspectRatio="none"><path d="M200 300 C 200 220, 120 190, 30 150"/><path d="M200 300 C 200 220, 280 190, 370 150"/></svg><div class="sign"><b class="flip"><span>The End</span><span>To be continued</span></b></div>`,
};
$("#set").innerHTML = T.map((t, i) => `<div class="scene scene-${esc(t.scene)}" data-i="${i}">${(SETS[t.scene] || (() => ""))(t)}</div>`).join("")
  + `<div class="scene scene-crossroads" data-i="${ENDING}">${SETS.crossroads()}</div>`;

/* ---------- Character ---------- */
let fig = null, director = null;
const wide = matchMedia("(min-width: 821px)");
const pokes = [];
function dance(msg) {
  if (!fig) return;
  fig.react("dance");
  toast(msg);
}
import("../figure.js").then(({ initFigure }) => {
  fig = initFigure(C.figure, {
    docked: true,
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
  director = createDirector(fig);
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
  trackEls.forEach((el, j) => el.classList.toggle("current", j === i));
  const t = T[i];
  $("#now-title").textContent = t ? t.title : S.ending.title;
  $("#now-mood").textContent = t ? t.mood || "" : "Thanks for listening";
  if (director) director.perform(rolesFor(i));
  if (t) sceneCue(t, i);
  music(i);
  schedule();
}

// One-off moments for a scene, timed to the choreography
function sceneCue(t, i) {
  const scene = $(`.scene[data-i="${i}"]`);
  if (t.scene === "corner") {
    const code = $(".code-bubble code", scene), text = 'print("Hello, World!")';
    code.textContent = "";
    scene.classList.remove("typed");
    later(() => {
      scene.classList.add("typed");
      if (reduceMotion) { code.textContent = text; return; }
      [...text].forEach((ch, k) => later(() => (code.textContent += ch), k * 75));
    }, reduceMotion ? 0 : 5200);
  }
  if (t.scene === "detour") { scene.classList.remove("scratch"); void scene.offsetWidth; scene.classList.add("scratch"); }
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
// The ending flips "The End" to "To be continued" every time it is reached
const flip = () => $$(".scene .flip").forEach((f) => { f.classList.remove("flipped"); later(() => f.classList.add("flipped"), 2200); });

function update() {
  const mid = innerHeight * 0.45;
  let i = 0;
  trackEls.forEach((el, j) => { if (el.getBoundingClientRect().top < mid) i = j; });
  if (debrief.getBoundingClientRect().top < innerHeight * 0.7) i = ENDING;
  if (i !== active) { enter(i); if (i === ENDING || T[i]?.scene === "crossroads") flip(); }

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
    $$(`.scene[data-i="${j}"] .note`).forEach((p, m) => p.classList.toggle("in", m < n));
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
  const ms = Math.min(18000, Math.max(9000, words * 280 + (t.actions?.length || 1) * 1500));
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

// Pins: the world title gets a victory dance, the rest get a point
$("#tracks").addEventListener("click", (e) => {
  const b = e.target.closest("[data-pin]");
  if (!b || !fig) return;
  b.parentElement.classList.remove("poked");
  void b.offsetWidth;
  b.parentElement.classList.add("poked");
  fig.react(/champion/i.test(b.textContent) ? "victory" : "point");
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
