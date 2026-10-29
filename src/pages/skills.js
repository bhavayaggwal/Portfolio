/* Skills page: drag-to-spin skill sphere with group filters. (Refined in phase 4.) */
import C from "../content.js";
import { initShell, $, $$, esc, observeReveals, reduceMotion } from "../shared.js";

initShell("skills");

const groups = Object.keys(C.skills);
const skills = [];
groups.forEach((g) => C.skills[g].forEach((s) => {
  const hit = skills.find((x) => x.name === s);
  hit ? hit.groups.push(g) : skills.push({ name: s, groups: [g] });
}));
$("#skill-list").innerHTML = skills.map((s) => `<li>${esc(s.name)}</li>`).join("");
$("#skill-chips").innerHTML = ["All", ...groups].map((g, i) => `<button class="chip" aria-pressed="${i === 0}" data-g="${esc(g)}">${esc(g)}</button>`).join("");
const sphere = $("#sphere");
sphere.innerHTML = skills.map((s) => `<span>${esc(s.name)}</span>`).join("");
const nodes = $$("span", sphere);

// Fibonacci sphere: evenly spread points
const pts = skills.map((_, i) => {
  const y = 1 - (i / Math.max(1, skills.length - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * Math.PI * (3 - Math.sqrt(5));
  return [Math.cos(th) * r, y, Math.sin(th) * r];
});
let ax = 0.3, ay = 0, vx = 0.0016, vy = 0.004, dragging = false, lx = 0, ly = 0;
function draw() {
  const R = sphere.clientWidth * 0.4;
  const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
  pts.forEach(([x, y, z], i) => {
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
    const y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
    const s = 0.72 + 0.38 * (z2 + 1) / 2; // far side stays legible
    const n = nodes[i];
    n.style.transform = `translate(-50%,-50%) translate3d(${x1 * R}px,${y2 * R}px,0) scale(${s})`;
    n.style.opacity = n.classList.contains("dim") ? "" : (0.25 + 0.75 * (z2 + 1) / 2).toFixed(2);
    n.style.zIndex = Math.round(z2 * 100) + 100;
  });
}
function loop() {
  if (!dragging) { ay += vy; ax += vx; vy += (0.004 - vy) * 0.02; vx += (0.0016 - vx) * 0.02; }
  draw();
  requestAnimationFrame(loop);
}
sphere.addEventListener("pointerdown", (e) => { dragging = true; lx = e.clientX; ly = e.clientY; sphere.setPointerCapture(e.pointerId); sphere.classList.add("dragging"); });
sphere.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  vy = (e.clientX - lx) * 0.006; vx = -(e.clientY - ly) * 0.006;
  ay += vy; ax += vx; lx = e.clientX; ly = e.clientY;
});
const stopDrag = () => { dragging = false; sphere.classList.remove("dragging"); };
sphere.addEventListener("pointerup", stopDrag);
sphere.addEventListener("pointercancel", stopDrag);
$("#skill-chips").addEventListener("click", (e) => {
  const b = e.target.closest(".chip");
  if (!b) return;
  $$(".chip").forEach((c) => c.setAttribute("aria-pressed", c === b));
  const g = b.dataset.g;
  nodes.forEach((n, i) => {
    const on = g === "All" || skills[i].groups.includes(g);
    n.classList.toggle("dim", !on);
    n.classList.toggle("hot", on && g !== "All");
  });
  draw();
});
draw();
if (!reduceMotion) requestAnimationFrame(loop);

$(".section-head").classList.add("reveal");
observeReveals();
