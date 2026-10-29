/* Papers page: publications, education and recognition. */
import C from "../content.js";
import { initShell, $, $$, esc, observeReveals, onReveal, reduceMotion } from "../shared.js";

initShell("papers");

$("#tx-count").textContent = C.publications.length;
$("#publications").innerHTML = C.publications.map((p) => `
  <div class="tx reveal"><span class="code mono">${esc(p.code)}</span>
    <h3 data-full="${esc(p.title)}">${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a>` : esc(p.title)}</h3>
    <span class="ref mono">${esc(p.kind)} · ${esc(p.ref)}</span></div>`).join("");
$("#education").innerHTML = C.education.map((e) => `
  <div class="edu-item reveal"><strong>${esc(e.degree)}</strong><span>${esc(e.school)}</span>
    <div class="mono"><span>${esc(e.period)}</span><span>${esc(e.score)}</span></div></div>`).join("");
$("#achievements").innerHTML = C.achievements.map((a) => `<li class="reveal"><b>${esc(a.title)}</b><span>${esc(a.detail)}${a.year ? " · " + esc(a.year) : ""}</span></li>`).join("");

// Titles type themselves out as they arrive (plain titles only; linked ones keep their link)
onReveal((el) => {
  const h = el.classList.contains("tx") && $("h3", el);
  if (!h || reduceMotion || h.querySelector("a")) return;
  const full = h.dataset.full;
  let i = 0;
  h.textContent = "";
  h.classList.add("typed");
  const t = setInterval(() => {
    h.textContent = full.slice(0, ++i);
    if (i >= full.length) { clearInterval(t); h.classList.add("done"); }
  }, 22);
});

$$(".section-head").forEach((el) => el.classList.add("reveal"));
observeReveals();
