# Handoff: where the portfolio stands (28 Oct 2026)

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
- **3D character** `public/models/bhavay.glb` (1.5 MB): rigged on Mixamo, 9 clips: idle, wave, walk (in place),
  walkStart, point, kneelPoint, sitDown, sitIdle, sitTalk. Loaded by `src/figure.js` (idle loop, wave on click,
  cursor look, drag to turn, glides to the background at 40% on scroll).
- **Model pipeline:** `npm run optimize-model` → Mixamo → `tools/rig/index.html` (merges FBX clips, saves to
  `models/build/`) → `npm run compress-rigged` (writes `public/models/bhavay.glb`).
- **Deploy workflow** `.github/workflows/deploy.yml` (GitHub Pages on push to `main`), not yet used.

## Git
- Local commits: `ee11550` baseline, `a5f254d` character-adaptability plan. **No remote yet.**
- To publish: create an empty public repo `bhavayaggwal/Portfolio` (GitHub Desktop "Publish repository", or
  github.com/new without a README), then `git push -u origin main`. If the repo name differs, update `repo:` in
  `public/admin/config.yml`. Set Pages → Source to "GitHub Actions".
- Git-ignored on purpose: `dump/` (set-aside files, incl. the 174 MB OBJ and the avatar video), `models/source/`
  (original GLB + Mixamo FBX), `models/build/`, `public/draco/`, `.agents/` (the design skill), `node_modules/`, `dist/`.

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
2. **GitHub repo** creation (see Git above).
3. Optional: remove the phone number from `content/profile.json` before the repo goes public (it is hidden on the
   site but would be visible in the repo; it is also inside the uploaded résumé).

## Next steps (in order)
1. Merge the new Mixamo clips: add them to `CLIPS` in `tools/rig/merge.js`, run the rig tool, `npm run compress-rigged`.
2. **Phase 3, story engine:** pinned scroll tracks, player bar, vinyl progress ring, role-based choreography per
   `STORY-MAP.md` (Enter → Beat → Rest → Click), role→clip map in `content/profile.json → character.clips`
   with idle fallback, framing as data.
3. **Phase 4:** one set piece per track (mostly 2D), royalty-free music per mood, credits.
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
