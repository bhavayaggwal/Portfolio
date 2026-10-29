/* Story page: "The Adventures of Bunny", told as album tracks.
   Phase 2 lays the tracks out as plain sections for reviewing the copy; phase 3 replaces this with
   pinned scroll scenes, the player bar, the vinyl progress ring and the character's choreography. */
import C from "../content.js";
import { initShell, $, $$, esc, observeReveals, pageUrl, scrollToEl, copyEmail } from "../shared.js";

const S = C.story;
initShell("story", {
  actions: S.tracks.map((t, i) => [`Track ${i}: ${t.title}`, "Track", () => scrollToEl(document.getElementById(t.id))]),
});

$("#album").textContent = S.album;
$("#subtitle").textContent = S.subtitle;
$("#tracks").innerHTML = S.tracks.map((t) => `
  <li class="track reveal" id="${esc(t.id)}" data-scene="${esc(t.scene)}" data-actions="${esc(t.actions.join(","))}">
    <h2>${esc(t.title)}</h2>
    <p class="track-lead">${esc(t.lead)}</p>
    <p>${esc(t.text)}</p>
    ${t.pins?.length ? `<ul class="pins">${t.pins.map((p) => `<li><b>${esc(p.title)}</b><span>${esc(p.text)}</span></li>`).join("")}</ul>` : ""}
    ${t.stat ? `<p class="sticker">${esc(t.stat)}</p>` : ""}
    ${t.notes ? `<details class="liner"><summary>Liner notes</summary>${t.notes.split(/\n\n+/).map((para) => `<p>${esc(para)}</p>`).join("")}</details>` : ""}
  </li>`).join("");

$("#ending-title").textContent = S.ending.title;
$("#ending-text").textContent = S.ending.text;
$("#ending-links").innerHTML = ["work", "papers", "skills"].map((id) => `<a class="btn" href="${pageUrl(id)}">${id[0].toUpperCase() + id.slice(1)} →</a>`).join("")
  + `<button class="btn primary" id="say-hi">Say hi: ${esc(C.profile.email)}</button>`;
$("#say-hi").addEventListener("click", copyEmail);

$$(".section-head, .debrief").forEach((el) => el.classList.add("reveal"));
observeReveals();
