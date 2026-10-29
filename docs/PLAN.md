# Portfolio plan

Source of the story: `Story.md` ("The Adventures of Bunny"). This plan turns it into a site that is clean,
eye-catching and short enough to finish.

## Decisions (28 Oct 2026)
- Album concept and the seven-track structure: approved.
- Music: royalty-free tracks, credited in `docs/CREDITS.md`.
- Titles follow `Story.md`: AI Project Manager (Flixstock), Customer Service Associate (Teleperformance), Amazon Nova Act.
- Assumed until confirmed: the Brag Board includes Story.md's extra items (debate, literature-society tech lead,
  research summit, placement cell); CavinKare and Intern Hub stay out of the story, as in Story.md.

## The idea
**The story is an album.** Bhavay ("Bunny") tells his journey as tracks on an album, and music runs through every
chapter. The landing page is the album cover; the story page plays the tracks as you scroll; a spinning vinyl is the
progress bar (each groove lights up as its chapter plays), which is how the "Bonus Track: Why Music?" is told without
being an extra section to read.

Tone: playful, with a hint of cinematic. On screen, emoji become small drawn stickers in one consistent style.

## Site map
| Page | Path | Holds |
| --- | --- | --- |
| Landing (album cover) | `/` | Name, one line, the character, **Play my story** button, links to the other pages. Nothing else. |
| Story | `/story/` | The album: seven short tracks, the character acting each one |
| Work | `/work/` | GitHub repos and projects (live data) |
| Papers | `/papers/` | Published and presented research |
| Skills | `/skills/` | Refined drag-to-spin skill sphere |
| Contact | `/contact/` | To be defined |

## Landing page (clean)
- `h1`: Bhavay Aggarwal. One line under it (editable), e.g. "Developer turned AI project lead. My friends call me Bunny."
- The 3D character, headphones on, waves once on arrival; click to wave again.
- One primary button: **▶ Play my story** → `/story/`.
- Four plain links: Work, Papers, Skills, Contact.
- No metrics, no sections, no scrolling needed on desktop.

## Story page: seven tracks
Each track is one screen (pinned while it plays): a title, two or three sentences (about 40–55 words), one
signature visual beat, and one character action. The full text from `Story.md` sits behind **Liner notes** on each
track for anyone who wants more. Total reading time about two minutes.

| # | Track | On screen (short) | Signature beat | Character |
| --- | --- | --- | --- | --- |
| 0 | Press Play | "Hey, I'm Bhavay. My friends call me Bunny. This story has a soundtrack." | Dark screen, a glowing play button; the cursor types the greeting | idle → wave |
| 1 | The Quiet Kid | Quiet kid in the corner, building, painting, daydreaming, music always on. Then Python: love at first `print("Hello, World!")`. | Blocks and paint strokes turn into lines of code | sitDown → sitIdle (headphones, cosy corner) |
| 2 | The Brag Board | World Champion, Imagine Cup Junior 2021 (counterfeit-medicine app); Research Club president; published author; side quests (ASL translator, recommender). | Pins pop onto a corkboard on the beat | point |
| 3 | The Plot Twist | 2024: the developer took a detour to the support desk for Adobe customers, and learned that great technology starts with understanding people. | Record scratch; the road curves; headphones swap for a headset | walk → sitTalk |
| 4 | Back to the Future of AI | 2025, Keywords Studios: AI researcher on Amazon Nova Act and Mecka AI, promoted to senior, a Python + Claude QA workflow: 58% → 87% data quality. | A portal opens into a lab; data streams pulse | walkStart → kneelPoint |
| 5 | Leading the Runway | Flixstock: leading AI operations for fashion, a 95+ person team, a global client. Leading a team is like conducting a band. | Runway lights up; outfits strut past in rhythm | walk (runway) → point |
| 6 | To Be Continued | Exploring the next chapter. "THE END" shuffles into "TO BE CONTINUED". Buttons: Work, Papers, Skills, Say hi. | Crossroads with glowing paths | wave |

All nine clips are used: idle, wave, walk, walkStart, point, kneelPoint, sitDown, sitIdle, sitTalk.

Interface: a slim **player bar** (track number and title, play/mute, progress) and the **vinyl** progress
indicator. Replaces the earlier game HUD.

## Sound (opt-in)
The Press Play click is the moment audio can start (browsers block sound before a click). Each track has its own
short loop that crossfades as you scroll; mute is always visible; off by default on phones and for reduced motion.
Music must be licensed for use: royalty-free tracks with their licence and credit recorded in `docs/CREDITS.md`,
or tracks you provide.

## Visuals
- The 3D character is the one constant on screen.
- Each track gets one set piece, mostly 2D (drawn SVG/CSS layers in one style), plus a few free CC0 3D props where
  depth helps (the cosy corner, the desk). Sources and licences go in `docs/CREDITS.md`.
- Review fixes carried over: name in the `h1`; nothing behind running text; no boxes, hairlines or index numbers;
  real numbers at rest; nothing under 13px.

## Admin
`content/story.json` becomes a list of tracks: title, short text, liner notes (full text), character action,
set piece, music file, and pins (for the Brag Board). Landing page text is editable too.

## Character
`public/models/bhavay.glb`: rigged, 9 clips, 1.5 MB. Known artefact: hoodie pulls at the armpit when the arm is raised.

### Swapping the character later (built in from phase 3)
The figure may change, so nothing on the site depends on this particular model.
1. **One pipeline for any model.** New model (GLB/OBJ/FBX) → `npm run optimize-model` (slims it and makes a Mixamo
   upload set) → Mixamo auto-rig, download Idle *With Skin* → put it in `models/source/mixamo/` → `tools/rig/` merges →
   `npm run compress-rigged`. The other eight clips are *Without Skin* Mixamo files: they work on any Mixamo skeleton,
   so they are reused, not re-downloaded. A model that arrives already rigged on a Mixamo-style skeleton skips the
   Mixamo step.
2. **The story asks for roles, not clips.** Tracks request roles (`greet`, `sit`, `talk`, `walk`, `point`,
   `kneel`…), and `content/profile.json → character.clips` maps each role to a clip name in the current model.
   A missing clip falls back to idle, so the story still plays with a partial set.
3. **Framing is data.** Height, ground offset and camera framing live in `character`, editable in the admin,
   instead of being tuned in code for one model. The figure is measured in its idle pose when it loads.
4. **Props attach to bones, not the mesh.** Story props (the Plot Twist headset, the clipboard) attach to the
   skeleton's head or hand bone, so they follow any rig and don't assume the hoodie or headphones.
5. **Checks before switching.** `tools/rig/` reports the bone names, clip list and measured height of a new model,
   so problems show up before it reaches the site.

## Phases
1. **Landing + routing:** album-cover landing at `/`, story moves to `/story/`, navigation updated. *(done)*
2. **Story content + admin:** tracks model in `story.json`, admin fields, copy finalised. *(done, copy awaiting review)*
3. **Story engine:** pinned scroll tracks, player bar, vinyl progress, character choreography (all 9 clips).
4. **Set pieces + sound:** one signature beat per track; licensed music if approved.
5. **Polish:** design-skill gate at 1440/768/390, reduced motion, performance; Skills sphere refinement; Contact.

## Superseded
"Mission: Delivery" (game HUD, chaos meter, studio level) is replaced by this plan. Its chapter content is folded
into tracks 3–5.
