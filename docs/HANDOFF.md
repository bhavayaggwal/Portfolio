# Handoff: where the portfolio stands (3 Nov 2026)

Read this first when picking the work back up. Companion docs: `REDESIGN.md` (the redesign: plan, decisions, rounds
1–3), `PLAN.md` (original plan), `STORY-MAP.md` (choreography and the Mixamo motion list), `story-vision.md`.

## Resume in 30 seconds
```
npm install          # also copies the Draco decoder into public/draco
npm run dev          # http://localhost:8080   admin: /admin/index.html
                     # tools: /tools/rig/index.html (merge clips), /tools/stills/index.html (render stills)
```

## Where we stopped
- **Latest commit `ca75990`** "Redesign: Home, Story, Work, Contact in black neumorphism", on `main`, **local only**.
  `5575a2c` (story engine) is also unpushed. One `git push` publishes both and redeploys the live site.
- Bhavay asked to commit before moving forward; nothing is pending in the working tree.

## What the site is now
- **Pages:** Home → Story → Work → Contact (bar: name at left, Story · Work · Contact). Old Papers/Skills pages and
  the previous CSS are in `dump/redesign-2026-11/`.
- **Look:** black neumorphism on Bhavay's palette (#000, #454545, #005cff, #bd0000, #fff). Ground pure black; raised
  things `--surface` (#080808, lit top-left in grey); pressed wells `--well` (#0f0f0f). Blue fills the main action;
  **red marks key words** (`*word*` in content, `<mark>` in page HTML: red band, white text) and signals (Live chip,
  record label, errors, toasts). One face, Clash Grotesk; five sizes. All in `src/style.css` tokens.
- **Home** (`index.html`, `src/pages/home.js`): Bunny dances live behind the hero (70% opacity); scrolling flies him
  to an empty spot beside "The Adventures of Bunny" (idle in flight, a wave on landing); the big name flies into the
  bar's name; skill cluster with groups (`src/sphere.js`, no box); project carousel (scroll-snap, buttons, mouse drag,
  cards open in a new tab); email as display type; wordmark footer on every page.
- **Story:** copy left, sunk stage right; flat set pieces in the palette; Bunny walks between two marks, sits/stands
  faster, "Hello, World!" after the laptop, player shows the mood, pins open on click; click Bunny → wave (seated wave
  when sitting), 5 clicks or the vinyl → dance.
- **Work:** live GitHub numbers (Live chip), project cards (shared `projectCard` in `src/shared.js`), work history
  (CavinKare removed), publications/education/recognition.
- **Contact:** Web3Forms form, key in `content/profile.json → formKey` (sends real email; not test-sent yet).
- **Figure** (`src/figure.js`): pauses drawing when off screen or the tab is hidden; `snapshot()` for stills.

## Admin (Sveltia CMS)
- Local: `npm run dev` → `/admin/index.html` → "Work with Local Repository" → pick the Portfolio folder → commit/push.
- Live (after the push): `https://bhavayaggwal.github.io/Portfolio/admin/` → "Sign in with token" with a fine-grained
  GitHub token limited to the Portfolio repo, Contents: read and write. Each save commits to `main` and redeploys.
  Confirm token sign-in works once pushed. Only people with write access to the repo can save.
- Skills live in the admin's Skills collection (`content/skills.json`).

## Git and hosting
- Remote `origin` = `bhavayaggwal/Portfolio` (public). Live at https://bhavayaggwal.github.io/Portfolio/ via GitHub
  Pages (Actions). No custom domain (deferred). Local-only branch `backup/pre-public` holds pre-reset history.
- Git-ignored on purpose: `dump/`, `models/source/`, `models/build/`, `public/draco/`, `.agents/`, `.taste-skill/`,
  `.hallmark/`, `node_modules/`, `dist/`.
- Everything `src/content.js` imports ships in the public JS: never put private data in `content/*.json`.

## Checks used
- **Ponytail** (plugin) reviews changes before code: smallest change, reuse, no new libraries.
- **Hallmark** (`~/.agents/skills/hallmark`, `sloplint.mjs --render --url`; render needs `HALLMARK_PUPPETEER` pointing at
  a folder with puppeteer-core): last run showed no contrast, focus or glow failures. Its stamp rule is waived.
- **Taste skill** (`.claude/skills/design-taste-frontend`): run `inspect.mjs ... --allow shadow,button-fx` (shadows
  waived for neumorphism). Remaining notes: canvas and same-colour surfaces read as "empty"; no project pictures yet.

## Open items (next session)
1. **Push** (with Bhavay's OK), then check the live site and the live admin's token sign-in.
2. **Test-send the contact form** once (Bhavay's inbox).
3. **Project screenshots** later (admin: Projects → Image); cards show them automatically.
4. **New model with idle and waving clips** from Bhavay: merge (`tools/rig`), `npm run compress-rigged`, re-render stills.
5. Old `/papers/` and `/skills/` links will 404 after the push; add redirect pages only if they were shared.
6. A live click-through of the choreography timing in a visible Chrome window (Chrome was throttled while building).
7. Later phases: royalty-free music per track mood with credits; richer set pieces.

## Decisions to keep
- The story is an album (7 tracks, player bar, vinyl ring). Job titles per Story.md. **Numbers follow the site, not
  the résumé (58% → 78%).** CavinKare stays out. Music: royalty-free, opt-in.
- The figure is role-driven (`content/profile.json → character.clips`; missing clips fall back to idle);
  lookAround → think and victory → dance until real clips exist.

## Known issues
- Hoodie tears under a raised arm (narrow A-pose at rigging); the new model should fix it.
- Vite warns the figure chunk is > 500 kB (three.js); it is lazy-loaded.

## How Bhavay likes to work
- Plan first, checks with Ponytail and Hallmark before building; answers big decisions with short choices.
- Wants changes tested in the browser and short, clear reports.
- Edits copy himself in the admin; treat `content/` as the source of truth.
- Commit only when asked; set-aside files go to `dump/`, not deleted.
