// npm test — the timeline's date parser, and that every page string is translated in every language.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { when, load, renderBody, LANGS, UI_KEYS } from "./render.js";

const now = new Date(2026, 10, 15);
assert.equal(when("Jan 2026", now), 2026);
assert.equal(when("Aug 2026", now), 2026 + 7 / 12);
assert.equal(when("Sept. 2024", now), 2024 + 8 / 12);
assert.equal(when("Present", now), 2026 + 10 / 12);
assert.equal(when("", now), 2026 + 10 / 12);

// Names that read the same in every language (products, tools, awards); everything else needs a translation.
const KEEP = new Set(["SceneForge", "Python", "SQL", "Power BI", "TensorFlow", "Jira", "Asana", "GitHub", "Claude", "CI/CD",
  "TensorFlow · OpenCV · CNN", "Python · PyQt6 · SQL Server · matplotlib", "Microsoft Imagine Cup Junior", "Intern Hub"]);
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const html = renderBody(load((n) => JSON.parse(readFileSync(`content/${n}.json`, "utf8"))));
const keys = new Set([...html.matchAll(/data-ta?="([^"]*)"/g)].map((m) => unesc(m[1])).concat(UI_KEYS));
const marks = (s) => [...s.matchAll(/\{\w+\}|\*/g)].map((m) => m[0]).sort().join();

const problems = [];
for (const [code] of LANGS.slice(1)) {
  const dict = JSON.parse(readFileSync(`src/i18n/${code}.json`, "utf8"));
  for (const k of keys) {
    if (!(k in dict)) { if (!KEEP.has(k)) problems.push(`${code}: missing "${k}"`); continue; }
    if (!dict[k].trim()) problems.push(`${code}: empty "${k}"`);
    if (marks(dict[k]) !== marks(k)) problems.push(`${code}: placeholders differ in "${k}"`);
  }
  // Leftovers are fine for old content, but flag them so dictionaries stay tidy.
  for (const k of Object.keys(dict)) if (!keys.has(k)) console.warn(`${code}: unused "${k}"`);
}
assert.deepEqual(problems, [], "\n" + problems.join("\n"));
console.log(`render: ok (${keys.size} strings × ${LANGS.length - 1} languages)`);
