/* Landing page (the album cover): name, one line, the character, Play my story, and links. */
import C from "../content.js";
import { initShell, $, esc, pageUrl } from "../shared.js";

initShell("home");

const p = C.profile;
$("#name").textContent = p.name;
$("#tagline").textContent = (p.tagline || []).map((w) => w.replace(/[.\s]+$/, "")).join(" · ");
$("#landing-line").textContent = p.landingLine || "";
$("#landing-links").innerHTML = ["work", "papers", "skills", "contact"]
  .map((id) => `<a href="${pageUrl(id)}">${esc(id[0].toUpperCase() + id.slice(1))} <span aria-hidden="true">→</span></a>`).join("");

// The character waves hello once it has loaded
import("../figure.js").then(({ initFigure }) => initFigure(C.figure, { greet: true }));
