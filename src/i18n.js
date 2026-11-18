/* Page languages. The HTML is rendered in English with each string's source in data-t (see src/render.js);
   setLang() swaps in a dictionary from src/i18n/<code>.json, loaded only when chosen. A string without a
   translation stays in English. The CV, llms.txt and the structured data stay English on purpose. */
import { LANGS, hl, monthYear } from "./render.js";

const dicts = import.meta.glob("./i18n/*.json", { import: "default" });
// Scripts Geist doesn't cover get a matching Noto face, fetched only for that language.
const FONTS = { zh: "Noto+Sans+SC", hi: "Noto+Sans+Devanagari", bn: "Noto+Sans+Bengali", ar: "Noto+Sans+Arabic" };
const RTL = new Set(["ar"]);

let dict = {};
export let lang = "en";
const codes = LANGS.map(([c]) => c);
let wanted = "en"; // the latest choice: a slower, earlier dictionary must not overwrite it
// Translate a string; {name} placeholders take vars[name], itself translated when the dictionary has it.
export const t = (s, vars = {}) => (dict[s] ?? s).replace(/\{(\w+)\}/g, (_, k) => dict[vars[k]] ?? vars[k] ?? "");
const locale = () => `${lang}-u-nu-latn`; // keep Western digits, like the figures on the page

function month(s) {
  const d = monthYear(s);
  return d ? new Intl.DateTimeFormat(locale(), { month: "short", year: "numeric" }).format(new Date(d.year, d.month, 1)) : t(s);
}

export async function setLang(code) {
  if (!codes.includes(code)) code = "en";
  wanted = code;
  const next = code === "en" ? {} : await dicts[`./i18n/${code}.json`]();
  if (code !== wanted) return; // the visitor picked another language while this one loaded
  dict = next;
  lang = code;
  const root = document.documentElement;
  root.lang = code;
  root.dir = RTL.has(code) ? "rtl" : "ltr";
  if (FONTS[code] && !document.getElementById(`font-${code}`)) {
    document.head.insertAdjacentHTML("beforeend", `<link id="font-${code}" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${FONTS[code]}:wght@400;500;600&display=swap" />`);
  }
  root.style.setProperty("--script", FONTS[code] ? `"${FONTS[code].replace(/\+/g, " ")}"` : "system-ui");

  document.querySelectorAll("[data-t]").forEach((el) => { const { t: key, ...vars } = el.dataset; el.innerHTML = hl(t(key, vars)); });
  document.querySelectorAll("[data-ta]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.ta)));
  document.querySelectorAll("[data-range]").forEach((el) => { el.textContent = el.dataset.range.split("|").map(month).join(" – "); });
  document.querySelectorAll("time[data-day]").forEach((el) => {
    // The stored day ("2026-11-15") means midnight UTC; format it in UTC so visitors west of London don't see the day before
    el.textContent = new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(el.dataset.day));
  });
  const role = document.querySelector(".title");
  if (role) document.title = `${document.getElementById("name").textContent} · ${role.dataset.role ? t(role.dataset.role) : role.textContent}`;
  document.dispatchEvent(new CustomEvent("langchange"));
}

// Relative time ("3 days ago") in the page language
export function ago(iso) {
  const days = (Date.now() - new Date(iso)) / 864e5;
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: "auto" });
  if (days < 30) return rtf.format(-Math.round(days), "day");
  if (days < 365) return rtf.format(-Math.round(days / 30), "month");
  return rtf.format(-Math.round(days / 365), "year");
}
