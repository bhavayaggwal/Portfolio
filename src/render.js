/* Turns content/*.json into the page's HTML at build time (vite.config.js), so recruiters, search engines and
   AI agents get the full report without running JavaScript. Also writes llms.txt and the JSON-LD profile.
   Pure functions: no DOM, runs in Node. */

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Copy from the admin can mark key words as *like this*.
export const hl = (s) => esc(s).replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>");
const plain = (s) => String(s ?? "").replace(/\*([^*\n]+)\*/g, "$1");
// Links and files come from admin-edited content: allow web, mail and phone links and relative paths only, so a
// "javascript:" (or "java\tscript:", since browsers drop tabs and newlines in URLs) link can never reach the page.
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
export const safeUrl = (u) => {
  const s = String(u ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return !SCHEME.test(s) || /^(https?|mailto|tel):/i.test(s) ? s : "#";
};
// Uploaded files are stored as "/uploads/…"; the site is served from a sub-path, so make them relative.
const asset = (p) => { const s = safeUrl(p); return SCHEME.test(s) ? s : s.replace(/^\.?\//, ""); };
const TONES = ["blue", "ink", "grey", "red"]; // project cover colours, in turn
const ext = (href, label, cls = "") => `<a${cls ? ` class="${cls}"` : ""} href="${esc(safeUrl(href))}" target="_blank" rel="noopener">${label}</a>`;

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
// "Aug 2026" → { year: 2026, month: 7 }; "Present" (or anything without a date) → null.
export function monthYear(s) {
  const m = /([a-z]{3})[a-z]*\.?\s+(\d{4})/i.exec(s || "");
  const i = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
  return i < 0 ? null : { year: +m[2], month: i };
}
// "Aug 2026" → 2026.58 on the timeline; "Present" → now.
export function when(s, now = new Date()) {
  const d = monthYear(s);
  return d ? d.year + d.month / 12 : now.getFullYear() + now.getMonth() / 12;
}
// The employer to name beside the role: only while the latest role is still current.
const employer = (d) => (/present/i.test(d.roles[0]?.end || "") ? d.roles[0].company : "");
const fig = (m) => `${m.prefix || ""}${Number(m.value).toFixed(m.decimals || 0)}${m.suffix || ""}`;

export function load(read) {
  const profile = read("profile"), skills = read("skills").groups, research = read("research");
  return {
    profile,
    metrics: read("highlights").metrics,
    roles: read("experience").roles,
    projects: read("projects").featured,
    skills,
    ...research,
    testimonials: read("testimonials").items || [],
  };
}

/* ---------- Translation markers ----------
   The page is rendered in English. Each translatable string carries its English source in data-t; src/i18n.js swaps
   in the chosen language. {name} placeholders take their value from data-name (translated too when a match exists).
   data-ta marks an aria-label to translate; data-range holds "Start|End" dates that are formatted per language. */
const tx = (s, vars = {}) => ` data-t="${esc(s)}"${Object.entries(vars).map(([k, v]) => ` data-${k}="${esc(v)}"`).join("")}`;
const fill = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
const T = (tag, s, attrs = "", vars) => `<${tag}${attrs}${tx(s, vars)}>${hl(fill(s, vars))}</${tag}>`;
const range = (a, b) => `<span data-range="${esc(a)}|${esc(b)}">${esc(a)} – ${esc(b)}</span>`;

export const LANGS = [ // the ten most spoken languages (Ethnologue 2025, total speakers), by their own names
  ["en", "English"], ["zh", "中文"], ["hi", "हिन्दी"], ["es", "Español"], ["ar", "العربية"],
  ["fr", "Français"], ["bn", "বাংলা"], ["pt", "Português"], ["ru", "Русский"], ["id", "Bahasa Indonesia"],
];

// Strings the browser script shows (form, GitHub activity, Snake…); dictionaries cover these too.
export const UI_KEYS = [
  "Present", "{role} at {company}", "Read CV", "Reviews", "Phone", "What people say", "{n} recommendations",
  "{language}, updated {when}", "updated {when}", "Sending…", "Sent. Thank you, I'll reply by email.",
  "That didn't go through. Try again, or write to {email} directly.", "Copied",
  "Please wait a minute before sending another message.",
  "Press an arrow key or swipe to start", "Score {n}", "Game over. Score {n}",
];

/* ---------- Page sections ---------- */
function timeline(d, now) {
  // Work and study as bars on one time axis (a programme plan, read left to right)
  const rows = [
    ...d.roles.map((r) => ({ lane: "work", label: r.role, sub: r.company, a: when(r.start, now), b: when(r.end, now) })),
    ...d.education.map((e) => { const [s, f] = e.period.split(/\s+[–-]\s+/); return { lane: "study", label: e.degree.replace(/\s*\(.*\)/, ""), sub: e.school, a: when(s, now), b: when(f, now) }; }),
  ];
  const lo = Math.floor(Math.min(...rows.map((r) => r.a))), hi = Math.ceil(Math.max(...rows.map((r) => r.b)) + 0.01);
  const pct = (v) => (((v - lo) / (hi - lo)) * 100).toFixed(2);
  const years = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  return `<div class="gantt" dir="ltr" role="img" aria-label="Timeline of roles and degrees" data-ta="Timeline of roles and degrees">
    <ol class="g-rows" aria-hidden="true">${rows.map((r) => `
      <li class="g-row ${r.lane}"><span class="g-label">${T("span", r.label)}<small>${esc(r.sub)}</small></span>
        <span class="g-track"><span class="g-bar" style="--a:${pct(r.a)}%;--b:${pct(r.b)}%"></span></span></li>`).join("")}
    </ol>
    <div class="g-axis" aria-hidden="true">${years.map((y) => `<span style="--x:${pct(y)}%">${y}</span>`).join("")}</div>
  </div>`;
}

export function renderBody(d, { now = new Date() } = {}) {
  const p = d.profile, current = employer(d);
  const companies = [...new Set(d.roles.map((r) => r.company.replace(/\s*\(.*\)/, "")))];
  const updated = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }); // same day as data-day
  const cv = asset(p.resumeFile), gh = safeUrl(p.links.github).replace(/\/+$/, "");
  let n = 0; // sections number themselves, so a hidden one (no testimonials yet) leaves no gap
  const sec = (id, title, meta, body) => `<section class="sheet wrap" id="${id}" aria-labelledby="${id}-h">
    <header class="sh"><span class="num">${String(++n).padStart(2, "0")}</span>${T("h2", title, ` id="${id}-h"`)}${meta ? T("span", meta[0], ` class="meta"`, { n: meta[1] }) : ""}</header>${body}
  </section>`;
  // A PDF opens in a new tab ("Read CV"); any other file (e.g. .docx) can only be downloaded.
  const pdf = /\.pdf$/i.test(cv);
  const cvBtn = (cls, label = "Download CV") => (cv ? T("a", pdf || label !== "Read CV" ? label : "Download CV", `${cls ? ` class="${cls}"` : ""} href="${esc(cv)}" ${pdf ? `target="_blank" rel="noopener"` : "download"}`) : "");
  const sun = `<svg class="i-sun" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const moon = `<svg class="i-moon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="currentColor"/></svg>`;

  return `
${T("a", "Skip to content", ` class="skip" href="#main"`)}
<header class="bar"><div class="wrap">
  <div class="bar-tools">
    <button class="theme" id="theme" type="button" role="switch" aria-checked="false" aria-label="Dark mode" data-ta="Dark mode"><span class="knob">${sun}${moon}</span></button>
    <label class="lang"><span class="sr-only" data-t="Language">Language</span>
      <select id="lang">${LANGS.map(([code, name]) => `<option value="${code}" lang="${code}">${name}</option>`).join("")}</select>
    </label>
    <span class="clock" id="clock" data-tz="${esc(p.timezone)}" title="${esc(p.name)}, ${esc(p.location)}"><b>--:--:--</b> <span>${esc(p.timezoneLabel)}</span></span>
  </div>
  <div class="bar-right">
    <nav aria-label="Sections" data-ta="Sections">
      ${T("a", "Outcomes", ` href="#outcomes"`)}${T("a", "Experience", ` href="#experience"`)}${T("a", "Projects", ` href="#projects"`)}${T("a", "Skills", ` href="#skills"`)}${d.testimonials.length ? T("a", "Reviews", ` href="#reviews"`) : ""}${T("a", "For agents", ` href="llms.txt"`)}
    </nav>
    ${cvBtn("btn small", "Read CV")}${T("a", "Contact", ` class="btn primary small" href="#contact"`)}
  </div>
</div></header>
<main id="main">
  <section class="cover wrap" aria-labelledby="name">
    <div class="cover-copy">
      <p class="meta">${T("span", "Status report · Updated")} <time data-day="${now.toISOString().slice(0, 10)}">${esc(updated)}</time></p>
      <h1 id="name">${esc(p.name)}</h1>
      ${current ? T("p", "{role} at {company}", ` class="title"`, { role: p.role, company: current }) : T("p", p.role, ` class="title"`)}
      ${T("p", p.landingLine, ` class="lead"`)}
      ${T("p", p.intro, ` class="intro"`)}
      <dl class="facts">
        ${p.status ? `<div>${T("dt", "Status")}<dd><span class="dot" aria-hidden="true"></span>${T("span", p.status)}</dd></div>` : ""}
        <div>${T("dt", "Based in")}<dd>${T("span", p.location)} · ${esc(p.timezoneLabel)}</dd></div>
        <div>${T("dt", "Email")}<dd><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></dd></div>
        ${p.showPhone && p.phone ? `<div>${T("dt", "Phone")}<dd><a href="tel:${esc(p.phone.replace(/[^\d+]/g, ""))}">${esc(p.phone)}</a></dd></div>` : ""}
      </dl>
      <div class="actions">
        ${T("a", "Get in touch", ` class="btn primary" href="#contact"`)}
        ${cvBtn("btn")}
        ${ext(p.links.linkedin, "LinkedIn", "btn")}
        ${ext(p.links.github, "GitHub", "btn")}
      </div>
    </div>
    <figure class="owner" id="figure-slot" data-model="${esc(asset(p.character?.model))}" tabindex="0" role="img"
      aria-label="Bunny, Bhavay's 3D avatar. Press Enter or click and he waves." data-ta="Bunny, Bhavay's 3D avatar. Press Enter or click and he waves.">
      <img class="owner-fallback" src="stills/wave.webp" width="1200" height="1500" alt="" />
      <figcaption>${T("span", "Owner")} ${T("span", "Bunny, as my friends call me. Click to say hi.")}</figcaption>
    </figure>
  </section>

  <section class="wrap strip" aria-label="Organisations" data-ta="Organisations">
    ${T("p", "Worked with", ` class="meta"`)}
    <ul>${companies.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
  </section>

  ${sec("outcomes", "Key outcomes", ["{n} results", d.metrics.length], `
    <ul class="metrics">${d.metrics.map((m) => `
      <li><b><bdi dir="ltr">${esc(fig(m))}</bdi></b>${T("span", m.label, ` class="m-label"`)}${T("span", m.detail, ` class="m-detail"`)}</li>`).join("")}
    </ul>`)}

  ${sec("experience", "Experience", ["{n} roles", d.roles.length], `
    ${timeline(d, now)}
    <ol class="journey">${d.roles.map((r) => `
      <li>
        <h3>${esc(r.company)}</h3>
        ${T("p", r.role, ` class="post"`)}
        <p class="meta">${range(r.start, r.end)}</p>
        ${(r.tags || []).length ? `<ul class="chips">${r.tags.map((t) => T("li", t)).join("")}</ul>` : ""}
      </li>`).join("")}
    </ol>`)}

  ${sec("projects", "Projects", ["{n} workstreams", d.projects.length], `
    <ul class="cards">${d.projects.map((pr, i) => {
      const stack = (pr.stack || []).join(" · ");
      return `
      <li><a class="card" href="${esc(`${gh}/${pr.repo}`)}" target="_blank" rel="noopener">
        <span class="art tone-${TONES[i % TONES.length]}" dir="ltr">${pr.image
          ? `<img src="${esc(asset(pr.image))}" alt="" loading="lazy" />`
          : `${T("span", (pr.stats || [])[0] || pr.title, ` class="art-stat"`)}${T("span", stack, ` class="art-stack"`)}`}</span>
        <span class="card-body">
          ${T("h3", pr.title)}
          ${T("span", pr.blurb, ` class="blurb"`)}
          ${(pr.stats || []).length > (pr.image ? 0 : 1) ? `<ul class="chips">${pr.stats.slice(pr.image ? 0 : 1).map((s) => T("li", s)).join("")}</ul>` : ""}
          <span class="card-foot">${T("span", stack, ` class="meta"`)}<span class="live meta" data-repo="${esc(pr.repo.toLowerCase())}">GitHub</span></span>
        </span>
      </a></li>`;
    }).join("")}
    </ul>`)}

  ${sec("skills", "I’ve got your back with…", ["{n} skills", d.skills.reduce((k, g) => k + g.items.length, 0)], `
    ${T("p", "Turning messy problems into intentional, scalable products, and keeping the teams that build them on schedule.", ` class="lead skills-lead"`)}
    <div class="skill-groups">${d.skills.map((g) => `
      <div>${T("h3", g.name, ` class="meta"`)}<ul class="chips">${g.items.map((s) => T("li", s)).join("")}</ul></div>`).join("")}
    </div>
    <div class="actions">${T("a", "Discuss a role", ` class="btn primary" href="#contact"`)}</div>`)}

  ${d.testimonials.length ? sec("reviews", "What people say", ["{n} recommendations", d.testimonials.length], `
    <ul class="quotes">${d.testimonials.map((t) => `
      <li><blockquote lang="en"><p>${esc(t.quote)}</p></blockquote>
        <p class="who"><b>${t.link ? ext(t.link, esc(t.name)) : esc(t.name)}</b><span>${esc(t.title)}</span></p></li>`).join("")}
    </ul>`) : ""}

  ${sec("record", "Education, publications and recognition", "", `
    <div class="record">
      <div>${T("h3", "Education", ` class="meta"`)}<ul>${d.education.map((e) => { const [s, f] = e.period.split(/\s+[–-]\s+/); return `<li>${T("b", e.degree)}<span>${esc(e.school)} · ${range(s, f)}${e.score ? ` · ${esc(e.score)}` : ""}</span></li>`; }).join("")}</ul></div>
      <div>${T("h3", "Publications", ` class="meta"`)}<ul>${d.publications.map((x) => `<li><b lang="en">${x.url ? ext(asset(x.url), esc(x.title)) : esc(x.title)}</b><span>${T("span", x.kind)} · ${esc(x.ref)}</span></li>`).join("")}</ul></div>
      <div>${T("h3", "Recognition", ` class="meta"`)}<ul>${d.achievements.map((a) => `<li>${T("b", a.title)}<span>${T("span", a.detail)}${a.year ? ` · ${esc(a.year)}` : ""}</span></li>`).join("")}</ul></div>
    </div>`)}

  ${sec("contact", "Next steps", "", `
    <div class="contact">
      <div>
        ${T("p", "Hiring for a delivery or AI programme role, or building something? Write to me and I'll reply by email.", ` class="lead"`)}
        <p><a class="email" href="mailto:${esc(p.email)}">${esc(p.email)}</a></p>
        <p class="links">${ext(p.links.linkedin, "LinkedIn", "link")} ${ext(p.links.github, "GitHub", "link")}</p>
      </div>
      <!-- Posts to Web3Forms when profile.json has a formKey; otherwise to the visitor's mail app (works without JS) -->
      <form class="form" id="contact-form" method="POST" ${p.formKey ? `action="https://api.web3forms.com/submit"` : `action="mailto:${esc(p.email)}" enctype="text/plain"`}>
        ${p.formKey ? `<input type="hidden" name="access_key" value="${esc(p.formKey)}" />` : ""}
        <input type="hidden" name="subject" value="New message from your portfolio" />
        <input type="hidden" name="from_name" value="Portfolio contact form" />
        <input type="checkbox" name="botcheck" class="trap" tabindex="-1" autocomplete="off" aria-hidden="true" />
        <label>${T("span", "Your name")}<input name="name" autocomplete="name" required maxlength="120" /></label>
        <label>${T("span", "Your email")}<input name="email" type="email" autocomplete="email" required maxlength="200" /></label>
        <label>${T("span", "Message")}<textarea name="message" required maxlength="5000" rows="5"></textarea></label>
        ${T("button", "Send message", ` class="btn primary" type="submit"`)}
        <p class="form-status" role="status" aria-live="polite"></p>
      </form>
    </div>`)}
</main>

<footer class="foot">
  <div class="wrap">
    <div class="foot-panel">
      <div class="foot-card">
        ${T("h2", "Have a role in mind?")}
        <div class="foot-actions">${T("a", "Message me", ` class="btn primary" href="#contact"`)}${cv ? cvBtn("btn dark") : ext(p.links.linkedin, "LinkedIn", "btn dark")}</div>
      </div>
      <div class="foot-card">
        ${T("h2", "Sending an AI agent?")}
        ${T("p", "Point it at my llms.txt: the whole profile in plain Markdown.")}
        <div class="foot-actions">${T("a", "Open llms.txt", ` class="btn dark" href="llms.txt"`)}${T("button", "Copy link", ` class="btn dark" type="button" id="copy-llms"`)}</div>
      </div>
    </div>
    <p class="break">${T("span", "How about a break from AI?")} ${T("button", "Play Snake", ` class="text-btn" type="button" id="play"`)}</p>
    <p class="legal">© ${now.getFullYear()} ${esc(p.name)}. ${T("span", "Designed and delivered on schedule.")}</p>
  </div>
  <nav class="foot-links" aria-label="Elsewhere" data-ta="Elsewhere">
    ${cvBtn("", "CV")}${T("a", "Email", ` href="mailto:${esc(p.email)}"`)}${ext(p.links.linkedin, "LinkedIn")}${ext(p.links.github, "GitHub")}<a href="llms.txt">llms.txt</a>
  </nav>
</footer>
<a class="to-top" href="#main" aria-label="Back to top" data-ta="Back to top"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2"/></svg></a>

<dialog class="game" id="game" aria-labelledby="game-h">
  ${T("h2", "How about a break from AI?", ` id="game-h"`)}
  ${T("p", "Snake, the old-fashioned way. Arrow keys, WASD or swipe.", ` class="game-sub"`)}
  <div class="board" id="board" dir="ltr" aria-hidden="true"></div>
  <p class="score" id="score" role="status" aria-live="polite"></p>
  <div class="foot-actions">${T("button", "Back to work", ` class="btn primary" type="button" id="game-close"`)}${T("button", "Play again", ` class="btn dark" type="button" id="game-again"`)}</div>
</dialog>`;
}

/* ---------- For search engines and AI agents ---------- */
export function renderHead(d, siteUrl) {
  const p = d.profile, title = `${p.name} · ${p.role}`, desc = `${plain(p.landingLine)} ${p.intro}`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    alternateName: "Bunny",
    jobTitle: p.role,
    worksFor: employer(d) ? { "@type": "Organization", name: employer(d) } : undefined,
    email: `mailto:${p.email}`,
    address: { "@type": "PostalAddress", addressCountry: p.location },
    url: siteUrl,
    image: siteUrl + "stills/wave.webp",
    sameAs: [p.links.github, p.links.linkedin],
    description: p.summary,
    knowsAbout: d.skills.flatMap((g) => g.items),
    alumniOf: d.education.map((e) => ({ "@type": "CollegeOrUniversity", name: e.school })),
  };
  return `<title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${esc(siteUrl)}" />
  <link rel="alternate" type="text/markdown" href="llms.txt" title="Profile for AI agents" />
  <meta property="og:type" content="profile" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${esc(siteUrl)}" />
  <meta property="og:image" content="${esc(siteUrl)}stills/wave.webp" />
  <meta name="twitter:card" content="summary" />
  <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;
}

// llms.txt: the whole profile as plain Markdown (https://llmstxt.org)
export function renderLlms(d, siteUrl) {
  const p = d.profile, li = (s) => `- ${plain(s)}`;
  return [
    `# ${p.name}`,
    `> ${p.role}${employer(d) ? ` at ${employer(d)}` : ""}. ${plain(p.landingLine)}`,
    p.summary,
    `## Contact`,
    li(`Email: ${p.email}`), li(`LinkedIn: ${p.links.linkedin}`), li(`GitHub: ${p.links.github}`), li(`Location: ${p.location} (${p.timezoneLabel})`),
    ...(p.status ? [li(`Status: ${p.status}`)] : []),
    ...(p.resumeFile ? [li(`CV: ${siteUrl}${asset(p.resumeFile)}`)] : []),
    li(`Website: ${siteUrl}`),
    `## Key outcomes`,
    ...d.metrics.map((m) => li(`${fig(m)} ${m.label}: ${m.detail}`)),
    `## Experience`,
    ...d.roles.flatMap((r) => [`### ${r.role}, ${r.company} (${r.start} – ${r.end})`, ...r.points.map(li)]),
    `## Projects`,
    ...d.projects.map((pr) => li(`[${pr.title}](${p.links.github.replace(/\/+$/, "")}/${pr.repo}): ${pr.blurb} ${[...(pr.stats || []), ...(pr.stack || [])].join(", ")}`)),
    `## Skills`,
    ...d.skills.map((g) => li(`${g.name}: ${g.items.join(", ")}`)),
    `## Education`,
    ...d.education.map((e) => li(`${e.degree}, ${e.school}, ${e.period}${e.score ? `, ${e.score}` : ""}`)),
    `## Publications`,
    ...d.publications.map((x) => li(`${x.title} (${x.kind}, ${x.ref})`)),
    `## Recognition`,
    ...d.achievements.map((a) => li(`${a.title}: ${a.detail}${a.year ? ` (${a.year})` : ""}`)),
    ...(d.testimonials.length ? [`## Recommendations`, ...d.testimonials.map((t) => `> ${t.quote}\n> — ${t.name}, ${t.title}`)] : []),
  ].join("\n\n").replace(/\n\n(?=- )/g, "\n") + "\n";
}
