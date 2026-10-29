# Portfolio

Bhavay Aggarwal's portfolio: a story-driven site with a 3D character, plus an admin for editing content without touching code. Built with Vite and three.js, hosted on GitHub Pages, edited with [Sveltia CMS](https://github.com/sveltia/sveltia-cms).

## Run it

```
npm install
npm run dev        # http://localhost:8080
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## Edit content (admin)

Open **http://localhost:8080/admin/index.html** in Chrome or Edge while `npm run dev` is running.

- **Locally:** click *Work with Local Repository* and choose this project folder. Edits are written straight to `content/*.json`, and uploads go to `public/uploads/`. The site reloads as you save. Commit the changes when you're happy.
- **Online (after deploying):** open `/admin/` on the live site and sign in with GitHub. Each save becomes a commit, and the site redeploys in about a minute.

What you can edit: profile and contact details, headline, résumé file, profile photo, key numbers, work experience, projects (with images), skills, publications, education, awards, and the 3D character's model and background visibility.

The fields are defined in `public/admin/config.yml`.

## Content files

| File | Holds |
| --- | --- |
| `content/profile.json` | Name, role, headline, intro, summary, contact, links, résumé, 3D character |
| `content/highlights.json` | Key numbers |
| `content/experience.json` | Roles |
| `content/projects.json` | Featured projects, hidden repos |
| `content/skills.json` | Skill groups |
| `content/research.json` | Publications, education, awards |

## 3D character

- `public/models/bhavay.glb` is the optimized model the site loads (0.7 MB).
- `npm run optimize-model` rebuilds it from `models/source/` (git-ignored) and also writes a Mixamo upload set to `models/build/mixamo/`.
- Once the model is rigged, a GLB with animation clips can replace it. `src/figure.js` exposes the clips by name.

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`. Before the first deploy:
1. Create the GitHub repository and push this project.
2. In the repository settings, set Pages → Source to "GitHub Actions".
3. If the repository isn't `bhavayaggwal/Portfolio`, update `repo:` in `public/admin/config.yml`.

## Layout

```
index.html              page structure
src/main.js             rendering, interactions, smooth scrolling
src/figure.js           3D character
src/content.js          loads content/*.json
src/style.css           styles
content/                editable content (JSON)
public/admin/           admin page + field config
public/models/          web-ready 3D model
public/uploads/         files uploaded through the admin
tools/                  model optimizer, Draco copy step
```
