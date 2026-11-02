/* The skill cluster: a drag-to-spin sphere of skill names, with a list of groups beside it that lights
   one group at a time. Spins only while it is on screen; sized to its (clipped) box so it never overflows. */
import { $$, esc, reduceMotion } from "./shared.js";

export function initSphere(sphere, groupList, groupsBySkills) {
  const groups = Object.keys(groupsBySkills);
  const skills = [];
  groups.forEach((g) => groupsBySkills[g].forEach((s) => {
    const hit = skills.find((x) => x.name === s);
    hit ? hit.groups.push(g) : skills.push({ name: s, groups: [g] });
  }));
  sphere.innerHTML = skills.map((s) => `<span>${esc(s.name)}</span>`).join("");
  const nodes = $$("span", sphere);
  groupList.innerHTML = ["All", ...groups].map((g, i) => `<li><button aria-pressed="${i === 0}" data-g="${esc(g)}">
    <span>${g === "All" ? "Everything" : esc(g)}</span><small>${g === "All" ? skills.length : groupsBySkills[g].length}</small></button></li>`).join("");

  // Fibonacci sphere: evenly spread points
  const pts = skills.map((_, i) => {
    const y = 1 - (i / Math.max(1, skills.length - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * Math.PI * (3 - Math.sqrt(5));
    return [Math.cos(th) * r, y, Math.sin(th) * r];
  });
  let ax = 0.3, ay = 0, vx = 0.0016, vy = 0.004, dragging = false, lx = 0, ly = 0, visible = false, raf = 0;
  function draw() {
    const R = sphere.clientWidth * (sphere.clientWidth < 500 ? 0.26 : 0.32); // leaves room for the longest names inside the box
    const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
    pts.forEach(([x, y, z], i) => {
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      const y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
      const s = 0.8 + 0.4 * (z2 + 1) / 2; // far side stays legible
      const n = nodes[i];
      n.style.transform = `translate(-50%,-50%) translate3d(${x1 * R}px,${y2 * R}px,0) scale(${s})`;
      n.style.opacity = n.classList.contains("dim") ? "" : (0.35 + 0.65 * (z2 + 1) / 2).toFixed(2);
      n.style.zIndex = Math.round(z2 * 100) + 100;
    });
  }
  function loop() {
    if (!dragging) { ay += vy; ax += vx; vy += (0.004 - vy) * 0.02; vx += (0.0016 - vx) * 0.02; }
    draw();
    raf = visible ? requestAnimationFrame(loop) : 0;
  }
  const start = () => { if (!raf && !reduceMotion) raf = requestAnimationFrame(loop); };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }).observe(sphere);

  sphere.addEventListener("pointerdown", (e) => { dragging = true; lx = e.clientX; ly = e.clientY; sphere.setPointerCapture(e.pointerId); sphere.classList.add("dragging"); });
  sphere.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    vy = (e.clientX - lx) * 0.006; vx = -(e.clientY - ly) * 0.006;
    ay += vy; ax += vx; lx = e.clientX; ly = e.clientY;
    if (reduceMotion) draw();
  });
  const stopDrag = () => { dragging = false; sphere.classList.remove("dragging"); };
  sphere.addEventListener("pointerup", stopDrag);
  sphere.addEventListener("pointercancel", stopDrag);
  groupList.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-g]");
    if (!b) return;
    $$("button[data-g]", groupList).forEach((c) => c.setAttribute("aria-pressed", c === b));
    const g = b.dataset.g;
    nodes.forEach((n, i) => {
      const on = g === "All" || skills[i].groups.includes(g);
      n.classList.toggle("dim", !on);
      n.classList.toggle("hot", on && g !== "All");
    });
    draw();
  });
  draw();
}
