# Redesign plan (2 Nov 2026)

Built from three reviews of the current site: the taste skill (`.taste-skill/before/critique.md`), Hallmark
(`.hallmark/audit.md`) and Ponytail's repo audit (summarised below). Direction dealt by the taste skill:
**The dark room**, seed 1790228177 (`.taste-skill/direction.json`, reprint with `draw.mjs --show`).

## Decisions (Bhavay, 2 Nov)
- Pages: **Home → Story → Work → Contact.** Papers and Skills stop being pages (files to `dump/`).
- Papers content (publications, education, recognition) becomes a section on **Work**.
- Contact form sends email through **Web3Forms** (free, 250/month). Bhavay gets the access key at web3forms.com.
- Look: **a new direction from the taste skill**, and Bhavay picked **The dark room**.
- Story flow: **side by side, trimmed** (text left, stage right), with less copy per screen.

## The direction, applied
- **Idea:** *Bunny's album becomes the dark room's lit exhibit.* A listening room in the dark: Bunny stands in the
  one light, and each track and project is an object under its own lamp. (Competitor test: no other portfolio has
  Bunny or the album.)
- **Live thing:** Bunny himself. Click him and he waves back (seated wave when sitting), five clicks and he dances.
  Second: the story player.
- **Colour:** warm black `#0c0a08` ground, brown-black `#181512` panels, white ink, `#8f8a84` soft ink, **gold
  `#c9a45a` on the one main action per screen only**. Replaces navy and light blue.
- **Type:** Clash Grotesk only (Fontshare), regular and medium, five sizes (small 13–14, body 17–19, lead 20–26,
  head 32–64, display). Replaces Instrument Serif, Inter Tight and JetBrains Mono.
- **Signature motion:** the giant name scales slightly with the scroll (under 8%). Plus an entrance for each
  section's parts, press/hover/focus on every control, and one moving picture (Bunny is that picture).
- **Pictures** (the floor is 4+ real pictures per page; SVG drawings don't count):
  1. stills of Bunny rendered from our own story scenes (ours, honest);
  2. project screenshots (from Bhavay, or captured from the repos and READMEs);
  3. open-collection pictures of the album world (records, headphones, a listening room), downloaded and credited;
  4. the dealt "fog and quiet" photographs only as atmosphere.

## Pages
### Home
| Section | Blueprint (from the sheet) | Content |
| --- | --- | --- |
| Welcome | Name under a photograph | The lit stage with Bunny waving fills the top ~58%; BHAVAY AGGARWAL runs full width below; one sentence plus "Play my story" (gold). |
| Story | Band of unequal panels | Four stills of Bunny from the story scenes, side by side; Bunny on the page turns and **points at the Play my story button**. |
| Skills | Sticky picture + active list (adjusted) | **The cluster as it is now**, as the lit exhibit on the left; the four groups as a list on the right; the active group lights its skills. Phone overflow fixed; animation runs only while visible. |
| Work | Full panels, one midline row (shortened) | Two or three project panels (screenshot, year, title, one fact), then "All work" to the Work page. |
| Contact | The email as display type | The email address set huge as a mailto link, one sentence, links; "Write to me" goes to the form. |
| Footer | Columns above, wordmark below | Links, socials; BUNNY / BHAVAY AGGARWAL as the full-width wordmark. |

### Story
Side by side, trimmed: copy left (title, opening line, at most two sentences on screen), stage right, pinned.
- Liner notes and the brag-board pins reveal in steps as you scroll, never more than ~80 words on one screen.
- Set pieces redrawn flat in the palette (no gradients, no emoji notes), lit like exhibits.
- The queued fixes: animation timing (faster Stand Up and scene changes), the stage never left empty mid-walk or
  cropped, "Hello, World!" only after the laptop appears (cued off the `type` role), the player bar shows the
  mood and progress instead of repeating the title, the ending sign uncovered.

### Work
1. Projects: full panels with real screenshots and the live repo line (language, stars, last push).
2. **Live GitHub stats:** public repos, total stars, top languages, last push, from GitHub's public API (no key).
3. **Work history** from `content/experience.json` (already written; **CavinKare stays out**, as decided earlier).
4. Publications, education, recognition (from `research.json`).

### Contact
Name, email, message, a hidden spam trap; posts to Web3Forms, which emails Bhavay with the visitor's address as
reply-to. Clear sending, sent and failed states; without JavaScript the form still posts. Email, LinkedIn, GitHub
beside it.

## Fixes carried from the audits (site-wide)
- Remove: monospace, thin rules and 1px outlined boxes, eyebrow tag lines, tracked caps, TX codes, glows and resting
  shadows, gradients, emoji glyphs, the accent-coloured word in headings.
- Every colour from a token; spacing on a 4px scale; buttons 44–52px with press, hover and focus states.
- Content visible without JavaScript (reveals start visible, hidden only once the script runs).
- `overflow-x: clip` on html and body; skip link that stays on screen; no width transitions.
- About 80 words per screen; one h1 per page that says what it is; equal margins; no empty screens.

## Ponytail audit (2 Nov, report only)
1. Must: Skills sphere overflows on phones (`skills.js:24-33`, `style.css:239`).
2. Must: the contact form needs a service to send (Web3Forms, above).
3. Should: ~90 lines of dead CSS (`.hero`, `.eyebrow`, `.metric*`, `.work-list`, `.tag*`, `.pager`, `.chapter*`, `.kicker`, `.scroll-hint`) → `dump/`.
4. Should: the sphere animates forever; run it only while on screen.
5. Should: `sharp` is used by the model tools but not listed in `package.json`.
6. Should: reveals, pins and the code bubble are invisible without JavaScript.
7. Nice: one small self-check for the story timing logic.

## Order of work
1. **Baseline:** commit the current phase-3 work as is, so the redesign is one readable diff (needs Bhavay's OK).
2. **Foundation:** tokens, Clash Grotesk, the five sizes, the shell (nav: Home, Story, Work, Contact; plain bar),
   the footer, dead CSS out, the Papers and Skills pages to `dump/`, vite inputs, admin collections.
3. **Home**, then **Story**, then **Work**, then **Contact**, each built still, then checked.
4. **Pictures and motion layer.**
5. **Gates:** taste `lint` + `inspect` (0 FAIL at 1440/768/390 on the production build), Hallmark `sloplint`
   (FAILs fixed, REFLEXes fixed or waived with a reason), three critique rounds at most, Chrome check of every
   link, the form, the player and Bunny's clicks.
6. Commit and push only when Bhavay says so.

## Needed from Bhavay
- The **Web3Forms access key** (web3forms.com, enter agg.bhavay@gmail.com; the key arrives by email).
- **Project screenshots** for ASL Translation, Fashion Recommendation, Business Simulator and SceneForge, or the OK to
  capture them from the repos and READMEs.
- OK to commit the current phase-3 work as the baseline.
