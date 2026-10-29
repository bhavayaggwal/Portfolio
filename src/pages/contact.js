/* Contact page (placeholder until it is defined): email, links, optional phone and résumé. */
import C from "../content.js";
import { initShell, $, esc, copyEmail, observeReveals } from "../shared.js";

initShell("contact");

const p = C.profile;
$("#email").textContent = p.email;
$("#copy-email").addEventListener("click", copyEmail);
$("#contact-links").innerHTML = [
  `<a class="btn" href="${esc(p.links.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a>`,
  `<a class="btn" href="${esc(p.links.github)}" target="_blank" rel="noopener">GitHub ↗</a>`,
  p.showPhone && p.phone ? `<a class="btn" href="tel:${esc(p.phone.replace(/\s/g, ""))}">${esc(p.phone)}</a>` : "",
  p.resumeFile ? `<a class="btn" href="${esc(p.resumeFile)}" target="_blank" rel="noopener">Résumé ↗</a>` : "",
].join("");

$(".contact h1").classList.add("reveal");
observeReveals();
