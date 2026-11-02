/* Work page: live GitHub numbers, featured projects (with live repo data), work history, and the
   publications, education and recognition record. */
import C from "../content.js";
import { initShell, $, $$, esc, observeReveals, projectCard, ago } from "../shared.js";

initShell("work");
const ghUser = C.profile.links.github.replace(/\/+$/, "").split("/").pop();
$("#gh-user").textContent = ghUser;
$("#gh-all").href = C.profile.links.github;

/* Projects: a raised card each; the repo's live line fills in once GitHub answers */
function renderProjects(byName = {}) {
  $("#cards").innerHTML = C.projects.map((p) => `<li class="reveal">${projectCard(p, byName[p.repo.toLowerCase()])}</li>`).join("");
  observeReveals(); // cards redrawn with live data need their entrance too
}
renderProjects();

/* Live numbers from GitHub's public API (no key; 60 requests an hour per visitor) */
fetch(`https://api.github.com/users/${ghUser}/repos?per_page=100&sort=pushed`)
  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  .then((repos) => {
    const own = repos.filter((r) => !r.fork);
    const langs = {};
    own.forEach((r) => r.language && (langs[r.language] = (langs[r.language] || 0) + 1));
    $("#s-repos").textContent = own.length;
    $("#s-stars").textContent = own.reduce((n, r) => n + r.stargazers_count, 0);
    $("#s-langs").textContent = Object.entries(langs).sort((a, b) => b[1] - a[1])[0]?.[0] || "None yet";
    $("#s-push").textContent = own.length ? ago(own[0].pushed_at) : "None yet";
    $("#gh-status").textContent = `Counted just now from github.com/${ghUser}, forks left out.`;

    const byName = Object.fromEntries(own.map((r) => [r.name.toLowerCase(), r]));
    renderProjects(byName);
    const featured = new Set(C.projects.map((p) => p.repo.toLowerCase()));
    const hidden = new Set(C.hiddenRepos.map((s) => s.toLowerCase()));
    const rest = own.filter((r) => !featured.has(r.name.toLowerCase()) && !hidden.has(r.name.toLowerCase()));
    $("#repo-more").hidden = !rest.length;
    $("#more-count").textContent = `(${rest.length})`;
    $("#more-repos").innerHTML = rest.map((r) => `<li><a href="${esc(r.html_url)}" target="_blank" rel="noopener">
      <b>${esc(r.name.replace(/[-_]/g, " "))}</b><span>${esc(r.description || r.language || "")}</span></a></li>`).join("");
  })
  .catch(() => {
    ["#s-repos", "#s-stars", "#s-langs", "#s-push"].forEach((s) => ($(s).textContent = "Offline"));
    $("#gh-status").innerHTML = `GitHub didn't answer just now. <a class="link" href="${esc(C.profile.links.github)}" target="_blank" rel="noopener">See the profile on GitHub</a>.`;
  });

/* Work history: role, company and dates; what each role did opens on request */
$("#roles").innerHTML = C.experience.map((r) => `
  <li class="role reveal">
    <p class="when">${esc(r.start)} to ${esc(r.end)}</p>
    <div><h3>${esc(r.role)}</h3><p class="at">${esc(r.company)}</p></div>
    <details><summary>What I did there</summary><ul>${r.points.map((pt) => `<li>${esc(pt)}</li>`).join("")}</ul></details>
  </li>`).join("");

/* The record */
$("#publications").innerHTML = C.publications.map((p) => `<li><b>${p.url ? `<a class="link" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a>` : esc(p.title)}</b><span>${esc(p.kind)}, ${esc(p.ref)}</span></li>`).join("");
$("#education").innerHTML = C.education.map((e) => `<li><b>${esc(e.degree)}</b><span>${esc(e.school)}, ${esc(e.period)}, ${esc(e.score)}</span></li>`).join("");
$("#achievements").innerHTML = C.achievements.map((a) => `<li><b>${esc(a.title)}</b><span>${esc(a.detail)}${a.year ? ", " + esc(a.year) : ""}</span></li>`).join("");

$$(".stats > div, .record > div").forEach((el) => el.classList.add("reveal"));
observeReveals();
