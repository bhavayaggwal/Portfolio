# Handoff: where the portfolio stands (30 Oct 2026)

Read this first when picking the work back up. Companion docs: `PLAN.md` (plan and decisions),
`STORY-MAP.md` (choreography and the Mixamo motion list), `story-vision.md` (the original "Adventures of Bunny" text).

## Resume in 30 seconds
```
npm install          # also copies the Draco decoder into public/draco
npm run dev          # http://localhost:8080   (admin: /admin/index.html, rig tool: /tools/rig/index.html)
```

## What exists and works
- **Vite multi-page site**, tested in Chrome with no console errors:
  - `/` landing ("album cover"): name, tagline, one line, **Play my story**, links; 3D figure waves on arrival.
  - `/story/` "The Adventures of Bunny": 7 tracks as plain sections with liner notes (copy-review layout).
  - `/work/` featured projects + live GitHub repos · `/papers/` · `/skills/` (drag sphere) · `/contact/` (placeholder).
- **Admin** (Sveltia CMS) at `/admin/index.html`: edits every `content/*.json` file, uploads to `public/uploads/`.
  Works locally via "Work with Local Repository" in Chrome. Field definitions: `public/admin/config.yml`.
- **3D character** `public/models/bhavay.glb` (2.3 MB): rigged on Mixamo, 21 clips (the original 9 plus sitClap, standUp,
  type, nod, smirkNod, surprised, think, talk, shrug, bow, catwalk, dance) and a built-in `waveSeated`. Loaded by `src/figure.js` (idle loop, wave on click,
  cursor look, drag to turn, glides to the background at 40% on scroll).
- **Model pipeline:** `npm run optimize-model` → Mixamo → `tools/rig/index.html` (merges FBX clips, saves to
  `models/build/`) → `npm run compress-rigged` (writes `public/models/bhavay.glb`).
- **Deploy workflow** `.github/workflows/deploy.yml` (GitHub Pages on push to `main`), not yet used.

## Git and hosting
- Remote `origin` = `bhavayaggwal/Portfolio` (public). History was reset to one clean commit (`7758eb1`) on
  29 Oct 2026 so the phone number is not in it; the old commits are on the local-only branch `backup/pre-public`.
- **Live at https://bhavayaggwal.github.io/Portfolio/** via GitHub Pages (Source: GitHub Actions,
  `.github/workflows/deploy.yml`). Every push to `main` redeploys.
- No custom domain for now (decided 30 Oct). Options discussed: a ~$10/yr domain with the name in it beats the free
  `bunny.work.gd`; Cloudflare Pages if the repo should go private again.
- Admin on the live site would need GitHub sign-in setup; edit via localhost "Work with Local Repository" and push.
- Everything `src/content.js` imports ships in the public JS, so it only imports files a page shows.
- Git-ignored on purpose: `dump/` (set-aside files, incl. the 174 MB OBJ, the avatar video and the old résumé),
  `models/source/` (original GLB + Mixamo FBX), `models/build/`, `public/draco/`, `.agents/`, `node_modules/`, `dist/`.

## Decisions made
- Concept: **the story is an album**; landing = album cover; Story = 7 tracks; music player bar + spinning vinyl
  progress ring (replaces the earlier "Mission: Delivery" game HUD, which is dropped).
- Separate pages: Story, Work, Papers, Skills, Contact (Contact to be defined later).
- Music: **royalty-free tracks** matched to each track's mood (moods are in `content/story.json`), credited in
  `docs/CREDITS.md`, opt-in via Press Play.
- Job titles follow Story.md: **AI Project Manager** (Flixstock), **Customer Service Associate** (Teleperformance),
  **Amazon Nova Act**.
- **Numbers: follow what Bhavay wrote on the site, not the résumé.** Data quality is **58% → 78%**.
- Brag Board pins approved; "Intern Hub" = the college placement cell he co-founded. **CavinKare stays out.**
- Hosting: GitHub Pages + Git-based admin. Tooling: Vite + npm. Props: free CC0 low-poly kits when needed.
- Design direction: "the dark room" is being explored, not committed. Review fixes to carry: name in the `h1`,
  nothing behind running text, no boxes/hairlines/mono labels/index numbers, real numbers at rest, nothing < 13px.
- The figure may be swapped later: story asks for **roles** mapped to clips, framing is data, props attach to
  bones (see `PLAN.md` → "Swapping the character later").

## Waiting on Bhavay
1. **Mixamo downloads** into `models/source/mixamo/` (list and settings in `STORY-MAP.md`):
   must-have: head nod, Stand Up, Typing, Looking Around, Victory/Cheering, Surprised;
   nice-to-have: catwalk walk, Talking, Thinking, Shrugging, Sitting Clap, Bow, a short dance.
   Settings: FBX Binary, Without Skin, 30 fps, In Place for walks, Character Arm-Space ~55–65 (same on every clip).
2. A new résumé without the phone number (PDF), uploaded via admin → Profile → Résumé file (button hidden until then).

## Redesign (2 Nov 2026): work from here next
The plan is `docs/REDESIGN.md`: pages Home → Story → Work → Contact, taste-skill direction "The dark room"
(warm black and gold, Clash Grotesk), Web3Forms contact form, audit fixes from the taste skill, Hallmark and
Ponytail. It folds in the phase 3 review below. Waiting on Bhavay: the Web3Forms key, project screenshots, and the
OK to commit phase 3 as the baseline.

## Review of phase 3 (Bhavay, 30 Oct 2026)
Phase 3 is built but **uncommitted**. Bhavay reviewed it at localhost.
- **Good:** the story flow; animations are "half decent" and need refinement.
- **Fix next:**
  1. **Animation timing is off** (beats vs. scroll and autoplay; Stand Up takes ~5 s, walk off/on ~3 s per scene change).
  2. **Player bar repeats the track titles** already on the page; it should show something else (e.g. the song or mood).
  3. **"Hello, World!" bubble appears before the desk and laptop** in Quiet Kid; cue it off the `type` role, not a timer.
  4. **Site structure:** a separate **Home** page; **Story becomes page 2**; Work, Papers, Skills, Contact follow in that order.
- Wait for Bhavay's go-ahead before starting these.

## Next steps (in order)
1. ~~Phase 3, story engine~~ **done 30 Oct** (uncommitted when written): pinned tracks beside a sticky stage, player bar
   with vinyl progress ring and autoplay, role-based choreography (`src/choreo.js`), chair/desk props, a set piece
   per track, click → wave (seated wave when sitting), 5 clicks or the vinyl → dance. Missing clips: Looking Around
   and Victory (mapped to think and dance in `profile.json → character.clips`).
3. **Phase 4:** richer set pieces, royalty-free music per mood, credits.
4. **Phase 5:** design-skill gate (`.claude/skills/design-taste-frontend`, `inspect.mjs` at 1440/768/390), reduced
   motion, performance, Skills sphere refinement, Contact page.

## Known issues
- Hoodie pulls at the armpit when an arm is raised (narrow A-pose at rigging). Arm-Space on new downloads helps.
- `highlights.json` (key numbers) and `experience.json` (job history) are not shown on any page now; decide
  whether they belong on Work or stay out.
- Vite warns that the figure chunk is > 500 kB (three.js); it is lazy-loaded, fine for now.

## How Bhavay likes to work
- Plan first, then build in phases; checks in on big decisions and often answers with choices.
- Wants to see things tested in the browser, and short, clear reports.
- Uses the admin himself to edit copy; treat his edits in `content/` as the source of truth.
- Commit only when asked; set-aside files go to `dump/`, not deleted.
