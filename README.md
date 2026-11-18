# Portfolio

Bhavay Aggarwal's portfolio: a one-page, recruiter-first **status report** (outcomes, experience, projects, skills,
record, contact) with a small live 3D avatar (Bunny). Content is edited in an admin, rendered into plain HTML at
build time, and published to GitHub Pages.

Live: https://bhavayaggwal.github.io/Portfolio/ · Machine-readable: `/llms.txt`

## Run it

```
npm install
npm run dev        # http://localhost:8080   (admin: /admin/index.html)
npm test           # date-parser check for the timeline
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## How it works

| File | Does |
| --- | --- |
| `content/*.json` | All copy and data. The source of truth; edit through the admin. |
| `src/render.js` | Turns the content into the page HTML, the JSON-LD profile and `llms.txt` (pure, runs in Node). |
| `vite.config.js` | Runs the renderer for dev and build, emits `llms.txt`, reloads the page when content changes. |
| `index.html` | The shell: bar, fonts, placeholders for the rendered head and body. |
| `src/main.js` | Live extras only: local clock, each project's GitHub activity, in-page form sending, loading Bunny. |
| `src/figure.js` | Bunny (three.js): idles, follows the cursor, spins on drag, waves on click or Enter. |
| `src/snake.js` | The footer's "break from AI" Snake game, loaded on first play. |
| `src/i18n.js`, `src/i18n/*.json` | Page languages: the 10 most spoken (Ethnologue 2025). English is the page itself; each other language is a dictionary keyed by the English text, loaded when chosen. Arabic switches the page right-to-left. |

## Languages and themes

- The language picker and the light/dark switch sit at the top left; each visitor's choice is remembered in their
  browser. The CV, `llms.txt` and the structured data stay in English.
- **When you change copy in the admin**, the new English text has no translation yet, so it shows in English in the
  other languages until its dictionaries get an entry. `npm test` lists every missing or broken translation (it
  fails the check), so run it after content changes and before pushing.
- Product, tool and award names stay in English everywhere (the `KEEP` list in `src/render.test.js`).
| `src/style.css` | All styles. Tokens at the top. |
| `public/admin/` | Sveltia CMS and its field config (`config.yml`). |
| `public/models/bhavay.glb` | The avatar model (rigged, Draco-compressed; three bundles the decoder). |
| `public/stills/wave.webp` | Avatar still: shown before 3D loads, without WebGL, and as the social-preview image. |

Everything renders without JavaScript, so recruiters' tools, search engines and AI agents read the full profile.
For agents there is also a JSON-LD `Person` block in the head and `llms.txt` (the whole profile as Markdown).

## Edit content (admin)

- **Locally:** `npm run dev` → http://localhost:8080/admin/index.html in Chrome or Edge → *Work with Local
  Repository* → choose this folder. Edits land in `content/*.json`; uploads in `public/uploads/`. Commit when happy.
- **Live:** `/admin/` on the live site → *Sign in with token* (a fine-grained GitHub token for this repo with
  Contents: read and write). Each save is a commit to `main` and the site redeploys in about a minute.
- `*word*` in the headline makes a word bold. The status line shows with a green dot at the top.
- A **résumé** uploaded in Profile adds "Read CV" / "Download CV" buttons. A **project image** (a screenshot) sits
  on the card's coloured cover; without one the cover shows the project's first key fact.
- **Testimonials** (admin → Testimonials): the "What people say" section appears once there is one.
- Role **focus areas** show as chips on each role card; role **highlights** are not shown on the page but go into
  `llms.txt` for AI agents.
- Everything in `content/` is public (it ships in the HTML). Never put private data there.

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main` (admin saves included).
If the site moves, update `SITE_URL` in `vite.config.js` and `repo:` in `public/admin/config.yml`.

## Security

The site is static files on GitHub Pages: no server, database, visitor accounts or passwords. What protects it:
- **Admin:** anyone can open `/admin/`, but saving needs a GitHub sign-in with write access to this repo. Keep repo
  access to yourself, use 2-factor sign-in on GitHub, and give admin tokens only *Contents: read and write* on this
  one repo, with an expiry. The CMS script is pinned with an integrity hash (see `public/admin/index.html`).
- **Never commit secrets.** `token.txt`, `.env*` and key files are git-ignored and blocked by the dev server. Better:
  keep tokens in a password manager, not in this folder.
- **Content is public by design:** everything in `content/` and `public/uploads/` is published, including the
  Web3Forms key (it can only send mail to you; restrict it to this site's domain in the Web3Forms dashboard).
- **Page safety:** all content is HTML-escaped when rendered, links only allow `http(s)`, `mailto` and `tel`
  (`npm test` checks this), and the built page carries a Content-Security-Policy (`vite.config.js`).
- **Contact form:** input is trimmed and validated, a hidden spam trap catches bots, and each browser can send once a
  minute; Web3Forms applies its own limits.

## Decisions

- **Nov 2026 redesign:** the animated album story, the extra pages (Story, Work, Contact) and the black neumorphic
  look are gone (all in git history before this change). Reason: recruiter-first and professional, readable by AI
  agents. The concept is a programme status report; Bunny stays, small and live, as the "owner" on the cover.
- Numbers follow the site, not the résumé (58% → 78%). CavinKare stays out of the work history.
- Contact goes through Web3Forms (key in `content/profile.json → formKey`); without a key it falls back to mailto.
- Per-project GitHub activity uses the public API (no key, 60 requests an hour per visitor); cards still work if it fails.

## Working agreements

- Plan first and offer short choices on big decisions; test in the browser; keep reports short.
- Smallest change that works (Ponytail); no new libraries for a few lines.
- Bhavay edits copy in the admin; treat `content/` as the source of truth.
- Commit and push only when asked.
