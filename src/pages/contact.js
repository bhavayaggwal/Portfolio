/* Contact page: a form that emails Bhavay through Web3Forms (content/profile.json → formKey, set in the admin).
   Without a key it opens the visitor's mail app with the message filled in instead. */
import C from "../content.js";
import { initShell, $, $$, observeReveals } from "../shared.js";

initShell("contact");
const p = C.profile;
$("#email-inline").textContent = p.email;
$("#c-email").href = "mailto:" + p.email;
$("#c-li").href = p.links.linkedin;
$("#c-gh").href = p.links.github;

$$(".contact-side > *, .form > .field, .form > button").forEach((el) => el.classList.add("reveal"));
observeReveals();

const form = $("#contact-form"), status = $("#f-status"), send = $("#f-send");
const say = (msg, kind = "") => { status.textContent = msg; status.className = "form-status " + kind; };
if (p.formKey) $("#access-key").value = p.formKey;
else { form.action = `mailto:${p.email}`; form.enctype = "text/plain"; } // works without JavaScript too

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form));
  if (data.botcheck) return; // a bot ticked the hidden box

  if (!p.formKey) {
    const body = `${data.message}\n\n${data.name}\n${data.email}`;
    location.href = `mailto:${p.email}?subject=${encodeURIComponent("Hello from " + data.name)}&body=${encodeURIComponent(body)}`;
    say("Your mail app should open with the message ready to send.", "ok");
    return;
  }
  send.disabled = true;
  say("Sending…");
  try {
    const res = await fetch(form.action, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || !out.success) throw new Error(out.message || res.status);
    form.reset();
    say("Sent. Thank you, I'll reply by email.", "ok");
  } catch {
    say(`That didn't go through. Try again, or write to ${p.email} directly.`, "err");
  } finally {
    send.disabled = false;
  }
});
