// Site content lives in /content/*.json, edited through the admin (/admin/) or by hand.
// This module gathers those files into one object for the page. Everything imported here ships
// in the public JS, so only import files a page actually shows (highlights.json and
// experience.json are left out until they get a page).
import profile from "../content/profile.json";
import projects from "../content/projects.json";
import skills from "../content/skills.json";
import research from "../content/research.json";
import story from "../content/story.json";

// Path from the current page to the site root ("./" on the home page, "../" one level down).
// Each page sets it on <body data-root>, so links and uploads work at any hosting path.
export const root = document.body.dataset.root || "./";

// Uploaded files are stored as "/uploads/…" (or another site path). Resolve them against the root.
export const asset = (path) => {
  if (!path || /^(https?:|data:|blob:)/.test(path)) return path || "";
  return root + path.replace(/^\.?\//, "");
};

const C = {
  profile: {
    ...profile,
    avatar: asset(profile.photo),
    resumeFile: asset(profile.resumeFile),
  },
  summary: profile.summary,
  figure: { ...profile.character, model: asset(profile.character.model) },
  projects: projects.featured.map((p) => ({ ...p, image: asset(p.image) })),
  hiddenRepos: projects.hiddenRepos || [],
  skills: Object.fromEntries(skills.groups.map((g) => [g.name, g.items])),
  publications: research.publications.map((p) => ({ ...p, url: asset(p.url) })),
  education: research.education,
  achievements: research.achievements,
  story,
};

export default C;
