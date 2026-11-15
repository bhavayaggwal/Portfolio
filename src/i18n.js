/* Page languages. The HTML is rendered in English with each string's source in data-t (see src/render.js);
   setLang() swaps in a dictionary from src/i18n/<code>.json, loaded only when chosen. A string without a
   translation stays in English. The CV, llms.txt and the structured data stay English on purpose. */
import { LANGS } from "./render.js";

const dicts = import.meta.glob("./i18n/*.json", { import: "default" });
// Scripts Geist doesn't cover get a matching Noto face, fetched only for that language.
const FONTS = { zh: "Noto+Sans+SC", hi: "Noto+Sans+Devanagari", bn: "Noto+Sans+Bengali", ar: "Noto+Sans+Arabic" };
const RTL = new Set(["ar"]);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const hl = (s) => esc(s).replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>");

let dict = {};
export let lang = "en";
export const codes = LANGS.map(([c]) => c);
// Translate a string; {name} placeholders take vars[name], itself translated when the dictionary has it.
export const t = (s, vars = {}) => (dict[s] ?? s).replace(/\{(\w+)\}/g, (_, k) => dict[vars[k]] ?? vars[k] ?? "");
const locale = () => `${lang}-u-nu-latn`; // keep Western digits, like the figures on the page

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
function month(s) {
  const m = /([a-z]{3})[a-z]*\.?\s+(\d{4})/i.exec(s);
  const i = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
  return i < 0 ? t(s) : new Intl.DateTimeFormat(locale(), { month: "short", year: "numeric" }).format(new Date(+m[2], i, 1));
}

export async function setLang(code) {
  if (!codes.includes(code)) code = "en";
  dict = code === "en" ? {} : await dicts[`./i18n/${code}.json`]();
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
    el.textContent = new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short", year: "numeric" }).format(new Date(el.dataset.day));
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
