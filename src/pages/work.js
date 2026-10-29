/* Work page: featured projects with live GitHub data, plus the rest of the public repos. */
import C from "../content.js";
import { initShell, $, $$, esc, observeReveals } from "../shared.js";

initShell("work");

const ghUser = C.profile.links.github.replace(/\/+$/, "").split("/").pop();
const ago = (iso) => {
  const d = (Date.now() - new Date(iso)) / 864e5;
  if (d < 1) return "today";
  if (d < 30) return Math.round(d) + "d ago";
  if (d < 365) return Math.round(d / 30) + "mo ago";
  return Math.round(d / 365) + "y ago";
};
let shown = false; // cards already revealed stay visible when live GitHub data re-renders them

function render(repos) {
  const byName = Object.fromEntries((repos || []).map((r) => [r.name.toLowerCase(), r]));
  $("#projects-grid").innerHTML = C.projects.map((p) => {
    const r = byName[p.repo.toLowerCase()];
    const href = r ? r.html_url : `${C.profile.links.github}/${p.repo}`;
    const live = r ? `<span><span class="lang-dot"></span>${esc(r.language || "Code")} · ★ ${r.stargazers_count} · ${ago(r.pushed_at)}</span>` : `<span>${esc((p.stack || [])[0] || "")}</span>`;
    return `<a class="project reveal${shown ? " in" : ""}" href="${esc(href)}" target="_blank" rel="noopener">
      ${p.image ? `<img class="project-img" src="${esc(p.image)}" alt="" loading="lazy" />` : ""}
      <div class="top mono"><span>${esc((p.stack || []).join(" · "))}</span><span class="arrow">↗</span></div>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.blurb)}</p>
      <div class="stats">${(p.stats || []).map((s) => `<span class="stat">${esc(s)}</span>`).join("")}</div>
      <div class="foot mono">${live}<span>View repo</span></div>
    </a>`;
  }).join("");
  $$(".project").forEach((card) => card.addEventListener("pointermove", (e) => {
    const b = card.getBoundingClientRect();
    card.style.setProperty("--mx", e.clientX - b.left + "px");
    card.style.setProperty("--my", e.clientY - b.top + "px");
  }));
  const featured = new Set(C.projects.map((p) => p.repo.toLowerCase()));
  const hidden = new Set(C.hiddenRepos.map((s) => s.toLowerCase()));
  const rest = (repos || []).filter((r) => !featured.has(r.name.toLowerCase()) && !hidden.has(r.name.toLowerCase()) && !r.fork);
  $("#more-count").textContent = rest.length ? `(${rest.length})` : "";
  $(".more-repos").hidden = !rest.length;
  $("#more-repos").innerHTML = rest.map((r) => `<li><a href="${esc(r.html_url)}" target="_blank" rel="noopener">
    <span class="rn">${esc(r.name.replace(/[-_]/g, " "))}</span><span class="rl mono">${esc(r.language || "")}</span>
    <span class="rd">${esc(r.description || "")}</span></a></li>`).join("");
  observeReveals();
  setTimeout(() => (shown = true), 1500);
}

$(".section-head").classList.add("reveal");
render(null);
fetch(`https://api.github.com/users/${ghUser}/repos?per_page=100&sort=pushed`)
  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  .then((repos) => { render(repos); $("#gh-status").textContent = `Live from GitHub · ${repos.length} public repos`; })
  .catch(() => { $("#gh-status").textContent = "GitHub offline · showing saved projects"; });
