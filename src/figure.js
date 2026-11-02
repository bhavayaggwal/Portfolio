/*
 * The 3D character (Three.js).
 * - Loads the GLB set in content/profile.json → character.model.
 * - Fills its slot (#figure-slot) and stays put; the page directs it through the returned API
 *   (play clips, walk, sit at a chair and desk).
 * - Follows the cursor, glances around when left alone, turns on drag, and waves back when clicked
 *   (a seated wave when sitting).
 * - The story asks for roles, not clips: character.clips maps a role to a clip in the current model,
 *   and a missing clip falls back to idle.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { root as siteRoot } from "./content.js";

// Bones below the waist, used to splice an upper-body motion (the wave) onto a seated pose.
const LOWER_BODY = /(Hips|UpLeg|Leg|Foot|Toe)/;

export function initFigure(cfg, { turn = 0, onPoke, slot = document.getElementById("figure-slot") } = {}) {
  if (!slot || !cfg.model) return;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Stage: the canvas layer inside the slot ---------- */
  const stage = document.createElement("div");
  stage.className = "figure-stage";
  stage.setAttribute("aria-hidden", "true");
  slot.prepend(stage);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    slot.classList.add("no-3d"); // no WebGL: the slot shows the monogram instead
    stage.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 0.8, 0.1, 60);
  camera.position.set(0, 1.95, 7.0);
  camera.lookAt(0, 1.84, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x2c2a28, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(2.5, 4, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.7);
  fill.position.set(-3, 2, 3);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 2.0);
  rim.position.set(-2.5, 3.5, -3.5);
  scene.add(rim);

  const mover = new THREE.Group(); // walking position and heading; drag spin adds to the heading
  scene.add(mover);
  const actor = new THREE.Group(); // hop and look happen here
  mover.add(actor);

  // soft dark pool on the floor under the figure
  const cv = document.createElement("canvas");
  cv.width = cv.height = 256;
  const g = cv.getContext("2d");
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(0,0,0,.55)");
  gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.0),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.set(0, 0.005, 0.05);
  mover.add(floorGlow);

  // Invisible body-sized target, so a click on the figure (not the space around it) gets a wave
  const hitBox = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 3.5, 12), new THREE.MeshBasicMaterial({ visible: false }));
  hitBox.position.y = 1.75;
  actor.add(hitBox);

  /* ---------- Props: a simple chair and desk, placed from the measured seated pose ---------- */
  const propMat = new THREE.MeshStandardMaterial({ color: 0x454545, roughness: 0.8 }); // the palette's grey
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x8fcaff, emissiveIntensity: 0.9 });
  const box = (w, h, d, x, y, z, mat = propMat) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    b.position.set(x, y, z);
    return b;
  };
  const props = { chair: new THREE.Group(), desk: new THREE.Group() };
  const propShow = { chair: 0, desk: 0 }, propWant = { chair: 0, desk: 0 };
  Object.values(props).forEach((p) => { p.visible = false; mover.add(p); });
  function buildProps(seatY, seatZ, deskY, deskZ) {
    const c = props.chair, legH = seatY - 0.06;
    c.add(box(0.95, 0.1, 0.85, 0, seatY - 0.05, seatZ));
    c.add(box(0.95, 1.05, 0.1, 0, seatY + 0.5, seatZ - 0.45));
    for (const [x, z] of [[-0.4, -0.35], [0.4, -0.35], [-0.4, 0.35], [0.4, 0.35]]) c.add(box(0.08, legH, 0.08, x, legH / 2, seatZ + z));
    const d = props.desk, topY = deskY;
    d.add(box(1.9, 0.08, 0.7, 0, topY, deskZ));
    for (const x of [-0.88, 0.88]) d.add(box(0.08, topY, 0.6, x, topY / 2, deskZ));
    const lid = box(0.62, 0.42, 0.03, 0, topY + 0.25, deskZ - 0.02, screenMat); // laptop, screen facing him
    lid.rotation.x = -0.25;
    d.add(lid, box(0.62, 0.03, 0.42, 0, topY + 0.055, deskZ - 0.2));
  }
  function setProp(name, on) { if (props[name]) propWant[name] = on ? 1 : 0; }

  function syncTheme() {
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#8FCAFF";
    rim.color.set(accent);
    screenMat.emissive.set(accent);
  }
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", syncTheme);

  /* ---------- Model and clips ---------- */
  let mixer = null, current = null, currentOnce = false, rest = "idle", posture = "standing";
  const clips = {};
  const waiters = new Map(); // one-shot action → resolve(), called when it finishes or is cut off
  const settle = (action) => { const r = waiters.get(action); if (r) { waiters.delete(action); r(); } };
  const clipFor = (role) => { const n = (cfg.clips || {})[role] || role; return clips[n] ? n : clips[role] ? role : "idle"; };

  // Crossfade to a clip. `once` plays it a single time, then returns to the resting loop; the promise
  // resolves when it ends or another clip takes over.
  function play(name, { once = false, fade = 0.35, speed = 1 } = {}) {
    const next = clips[name];
    if (!next) return Promise.resolve();
    if (!once) rest = name;
    if (next === current && !once && !currentOnce) return Promise.resolve();
    if (current && current !== next) settle(current);
    if (next === current) settle(next);
    next.reset().setEffectiveTimeScale(speed).setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = once;
    if (current && current !== next) { next.fadeIn(fade).play(); current.fadeOut(fade); }
    else next.setEffectiveWeight(1).play(); // first clip applies at full weight, so the pose can be measured
    current = next;
    currentOnce = once;
    return once ? new Promise((r) => waiters.set(next, r)) : Promise.resolve();
  }
  // Change the resting loop without interrupting a one-shot that is playing.
  function setRest(name) {
    if (!clips[name]) name = "idle";
    rest = name;
    if (!currentOnce) play(name);
  }

  const draco = new DRACOLoader().setDecoderPath(siteRoot + "draco/");
  new GLTFLoader().setDRACOLoader(draco).load(cfg.model, (gltf) => {
    const m = gltf.scene;
    actor.add(m);
    if (gltf.animations.length) {
      mixer = new THREE.AnimationMixer(m);
      const byName = Object.fromEntries(gltf.animations.map((c) => [c.name, c]));
      // Seated wave: the wave's upper body over the seated legs and hips
      if (byName.wave && byName.sitIdle) {
        const split = (c, lower) => c.tracks.filter((t) => LOWER_BODY.test(t.name.split(".")[0]) === lower).map((t) => t.clone());
        gltf.animations.push(new THREE.AnimationClip("waveSeated", byName.wave.duration, [...split(byName.wave, false), ...split(byName.sitIdle, true)]));
      }
      gltf.animations.forEach((c) => (clips[c.name] = mixer.clipAction(c)));
      mixer.addEventListener("finished", (e) => {
        if (e.action === current) play(rest); // one-shot clips return to the resting loop
        settle(e.action);
      });
      play(clips.idle ? "idle" : gltf.animations[0].name);
      mixer.update(0); // pose the skeleton before measuring
    }
    // Stand the model on the floor at a consistent height. Measure the posed vertices (precise),
    // since a skinned or quantized mesh's stored bounds don't match what's drawn.
    m.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(m, true), size = bb.getSize(new THREE.Vector3()), center = bb.getCenter(new THREE.Vector3());
    const s = 3.5 / size.y;
    m.scale.multiplyScalar(s);
    m.position.set(-center.x * s, -bb.min.y * s, -center.z * s);
    if (mixer) measureProps(m);
    slot.classList.add("ready");
    readyResolve();
  }, undefined, (err) => {
    console.warn("[figure] could not load", cfg.model, err);
    slot.classList.add("no-3d");
    stage.remove();
  });
  let readyResolve;
  const ready = new Promise((r) => (readyResolve = r));

  // Pose the seated and typing clips once to find where the seat and desk belong for this model.
  function measureProps(m) {
    const find = (re) => { let b; m.traverse((o) => { if (!b && o.isBone && re.test(o.name)) b = o; }); return b; };
    const hips = find(/hips$/i), hand = find(/righthand$/i), p = new THREE.Vector3();
    const poseAt = (name, t) => {
      mixer.stopAllAction();
      const a = clips[name];
      a.reset().setEffectiveWeight(1).play();
      a.time = t;
      mixer.update(0);
      m.updateMatrixWorld(true);
    };
    let seatY = 1.0, seatZ = -0.1, deskY = 1.5, deskZ = 0.6;
    if (hips && clips.sitIdle) { poseAt("sitIdle", 0); hips.getWorldPosition(p); seatY = p.y - 0.2; seatZ = p.z - 0.05; }
    if (hand && clips.type) { poseAt("type", 1); hand.getWorldPosition(p); deskY = p.y - 0.1; deskZ = p.z + 0.12; }
    buildProps(seatY, seatZ, deskY, deskZ);
    mixer.stopAllAction();
    current = null;
    currentOnce = false;
    play("idle");
  }

  /* ---------- Walking: the site moves the figure; clips stay in place ---------- */
  let move = null, heading = 0, headingGoal = 0;
  function walk(to, { seconds = 2, clip = "walk", face = 0 } = {}) {
    const from = { x: mover.position.x, z: mover.position.z };
    if (reduceMotion) { mover.position.set(to.x, 0, to.z); return Promise.resolve(); }
    if (clips[clip]) play(clip);
    return new Promise((resolve) => (move = { from, to, start: performance.now(), dur: seconds * 1000, face, resolve }));
  }
  const place = (x, z = 0) => { move = null; mover.position.set(x, 0, z); };

  /* ---------- Layout ---------- */
  function resize() {
    const W = Math.max(1, Math.round(slot.clientWidth)), H = Math.max(1, Math.round(slot.clientHeight));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // keep the whole figure in frame on a wide, short stage
    camera.fov = camera.aspect > 1 ? 30 * Math.min(1.25, 0.85 + camera.aspect * 0.15) : 30;
    camera.updateProjectionMatrix();
  }
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  addEventListener("resize", resize);
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(slot);

  /* ---------- Interaction ---------- */
  const pointer = { x: 0, y: 0 };
  let lastMove = performance.now();
  addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    pointer.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth * 0.5)));
    pointer.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.15)) / (innerHeight * 0.5)));
    lastMove = performance.now();
  }, { passive: true });

  // Only a click on the figure itself counts, not the empty stage around it.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function onFigure(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(hitBox).length > 0;
  }

  let spin = 0, spinV = 0, dragging = false, dragX = 0, moved = 0, downOnFigure = false;
  slot.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, a, input")) return; // set-piece controls handle their own clicks
    dragging = true; dragX = e.clientX; moved = 0; downOnFigure = onFigure(e);
    slot.setPointerCapture(e.pointerId);
    slot.classList.add("dragging");
  });
  slot.addEventListener("pointermove", (e) => {
    if (!dragging) { slot.classList.toggle("over-figure", onFigure(e)); return; }
    const dx = e.clientX - dragX;
    dragX = e.clientX;
    moved += Math.abs(dx);
    spinV = dx * 0.012;
    spin += spinV;
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    slot.classList.remove("dragging");
    if (moved < 6 && downOnFigure) poke();
  };
  slot.addEventListener("pointerup", endDrag);
  slot.addEventListener("pointercancel", endDrag);
  slot.addEventListener("keydown", (e) => {
    if (e.target !== slot) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); poke(); }
    if (e.key === "ArrowLeft") spinV = -0.15;
    if (e.key === "ArrowRight") spinV = 0.15;
  });

  let hopStart = -1, reacting = null, pokeLater = false;
  // Click reaction: wave back (seated wave when sitting), or a little hop if the model has no wave.
  function poke() {
    onPoke?.();
    if (move) { pokeLater = true; return; } // finish the walk first, then wave
    const name = posture === "seated" && clips.waveSeated ? "waveSeated" : "wave";
    if (!clips[name]) { if (!reduceMotion) hopStart = performance.now(); return; }
    react(name);
  }
  // A one-shot reaction to the visitor; the story waits for it before its next move.
  // Standing reactions are skipped while seated or walking (they would pop the figure up).
  function react(role) {
    const name = clips[role] ? role : clipFor(role);
    if (move || (posture === "seated" && !/seated|sit/i.test(name))) return poke();
    const r = (reacting = play(name, { once: true }).then(() => { if (reacting === r) reacting = null; }));
  }
  const whenFree = () => reacting || Promise.resolve();

  /* ---------- Animation loop ---------- */
  let glance = { x: 0, y: 0 }, nextGlance = performance.now() + 4000;
  const look = { x: 0, y: 0 };
  let lookWeight = 1;
  const clock = new THREE.Clock();
  function frame(now) {
    const dt = Math.min(clock.getDelta(), 0.05), t = now / 1000;
    if (mixer) mixer.update(dt);

    // walking: glide along the path facing the way it goes, then turn to face the front
    if (move) {
      const k = clamp01((now - move.start) / move.dur);
      const dx = move.to.x - move.from.x, dz = move.to.z - move.from.z;
      mover.position.set(move.from.x + dx * k, 0, move.from.z + dz * k);
      if (dx || dz) headingGoal = Math.atan2(dx, dz);
      if (k >= 1) {
        const done = move.resolve;
        headingGoal = move.face;
        move = null;
        if (current && clips.walk && (current === clips.walk || current === clips.catwalk)) setRest("idle");
        done();
        if (pokeLater) { pokeLater = false; poke(); }
      }
    }
    heading += (headingGoal - heading) * (reduceMotion ? 1 : 0.12);

    // drag spin with inertia, easing back to the resting turn (toward the content)
    if (!dragging) { spin += spinV; spinV *= 0.92; spin += (turn - spin) * 0.035; }
    mover.rotation.y = heading + spin;

    // face the cursor; after a few idle seconds, glance around on its own (not while walking)
    lookWeight += ((move ? 0 : 1) - lookWeight) * 0.1;
    const idle = now - lastMove > 3500 && !reduceMotion;
    if (idle && now > nextGlance) {
      glance = { x: (Math.random() - 0.5) * 1.2, y: (Math.random() - 0.6) * 0.5 };
      nextGlance = now + 1800 + Math.random() * 2500;
    }
    look.x += ((idle ? glance.x : pointer.x) - look.x) * 0.06;
    look.y += ((idle ? glance.y : pointer.y) - look.y) * 0.06;
    actor.rotation.y = look.x * 0.35 * lookWeight; // no head bone yet, so the whole figure turns gently
    actor.rotation.x = look.y * 0.04 * lookWeight;

    // props grow in and out
    for (const n in props) {
      propShow[n] += (propWant[n] - propShow[n]) * (reduceMotion ? 1 : 0.14);
      props[n].visible = propShow[n] > 0.01;
      props[n].scale.set(1, Math.max(0.001, propShow[n]), 1);
    }

    // breathing sway and the click hop (squash, rise, land)
    let y = 0, sy = 1;
    if (!reduceMotion && !mixer) { actor.rotation.z = Math.sin(t * 0.45) * 0.01; sy = 1 + Math.sin(t * 1.6) * 0.004; }
    if (hopStart > 0) {
      const h = (now - hopStart) / 650;
      if (h >= 1) hopStart = -1;
      else if (h < 0.15) sy = 1 - 0.06 * Math.sin((h / 0.15) * Math.PI); // crouch
      else y = Math.sin(((h - 0.15) / 0.85) * Math.PI) * 0.35;            // jump
    }
    actor.position.y = y;
    actor.scale.set(1, sy, 1);
    floorGlow.scale.setScalar(1 - y * 0.6);

    renderer.render(scene, camera);
  }
  // Draw only while the figure is on screen and the tab is visible; the clock skips the paused time.
  let onScreen = true;
  const run = () => {
    const live = onScreen && !document.hidden;
    if (live) clock.getDelta();
    renderer.setAnimationLoop(live ? frame : null);
  };
  new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; run(); }).observe(slot);
  document.addEventListener("visibilitychange", run);
  run();

  resize();
  return {
    ready, clips, clipFor, play, setRest, walk, place, setProp, poke, react, whenFree,
    get posture() { return posture; },
    set posture(p) { posture = p; hitBox.scale.y = p === "seated" ? 0.75 : 1; hitBox.position.y = p === "seated" ? 1.35 : 1.75; },
    get moving() { return !!move; },
    get position() { return mover.position; },
    set turn(t) { turn = t; },
    // Render one frame and return it as an image (used by tools/stills to make the site's stills)
    snapshot(type = "image/webp") {
      mixer?.update(0); // apply the current pose even if the animation loop is throttled
      for (const n in props) { props[n].visible = propWant[n] > 0; props[n].scale.set(1, propWant[n] || 0.001, 1); }
      renderer.render(scene, camera); return renderer.domElement.toDataURL(type, 0.9);
    },
  };
}
