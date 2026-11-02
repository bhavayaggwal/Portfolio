// Renders stills of the character for the site (public/stills/*.webp, transparent background).
// Open http://localhost:8080/tools/stills/index.html while `npm run dev` runs; it saves every still on its own.
import { initFigure } from "../../src/figure.js";

// name → the clip to pose, the moment in it (seconds), and the props it needs
const STILLS = [
  { name: "wave", clip: "wave", t: 1.4 },
  { name: "type", clip: "type", t: 2.0, props: ["chair", "desk"], seated: true },
  { name: "point", clip: "point", t: 1.3 },
  { name: "kneel", clip: "kneelPoint", t: 2.6 },
  { name: "catwalk", clip: "catwalk", t: 0.3 },
  { name: "dance", clip: "dance", t: 1.2 },
  { name: "talk", clip: "sitTalk", t: 3.0, props: ["chair"], seated: true },
  { name: "bow", clip: "bow", t: 1.2 },
];

const log = (m) => { document.getElementById("log").textContent += m + "\n"; console.log("[stills]", m); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const slot = document.getElementById("figure-slot");
const fig = initFigure({ model: "/models/bhavay.glb", clips: {} }, { slot });
// keep the cursor-follow neutral: a pointer resting at the figure's eye line
const steady = () => dispatchEvent(new PointerEvent("pointermove", { clientX: 400, clientY: 150 }));
const keep = setInterval(steady, 100);

await fig.ready;
for (const s of STILLS) {
  fig.setProp("chair", !!s.props?.includes("chair"));
  fig.setProp("desk", !!s.props?.includes("desk"));
  fig.posture = s.seated ? "seated" : "standing";
  // set the pose directly (no crossfade), held at the chosen moment
  Object.values(fig.clips).forEach((c) => c.stop());
  const a = fig.clips[s.clip];
  a.reset().setEffectiveWeight(1).play();
  a.time = s.t;
  a.paused = true;
  await wait(200);
  const res = await fetch(`/__tools/save?path=public/stills/${s.name}.webp`, { method: "POST", body: await (await fetch(fig.snapshot())).blob() });
  log(`${s.name}: ${res.ok ? await res.text() : "failed " + res.status}`);
  a.paused = false;
}
clearInterval(keep);
window.__done = true;
