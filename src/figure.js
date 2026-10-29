/*
 * The 3D character (Three.js).
 * - Loads the GLB set in content/profile.json → character.model.
 * - Sits in the hero slot (#figure-slot); on scroll it glides into the background and fades to
 *   character.backgroundOpacity.
 * - Follows the cursor, glances around when left alone, turns on drag, hops on click, and turns
 *   toward the content once it is in the background.
 * - If the model carries animation clips (a rigged export), they are available by name in `clips`;
 *   the first one plays by default.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { root as siteRoot } from "./content.js";

export function initFigure(cfg, { greet = false } = {}) {
  const slot = document.getElementById("figure-slot");
  if (!slot || !cfg.model) return;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Stage: a fixed layer behind the page ---------- */
  const stage = document.createElement("div");
  stage.className = "figure-stage";
  stage.setAttribute("aria-hidden", "true");
  document.body.prepend(stage);

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
  function syncTheme() {
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#8FCAFF";
    rim.color.set(accent);
  }
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", syncTheme);

  const root = new THREE.Group();
  scene.add(root);
  const actor = new THREE.Group(); // hop and look happen here, drag spin on root
  root.add(actor);

  // soft floor shadow
  const cv = document.createElement("canvas");
  cv.width = cv.height = 256;
  const g = cv.getContext("2d");
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(0,0,0,.55)");
  gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.0),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.005, 0.05);
  root.add(shadow);

  /* ---------- Model ---------- */
  let mixer = null, current = null, rest = "idle";
  const clips = {};
  // Crossfade to a clip. `once` plays it a single time, then returns to the resting loop.
  function play(name, { once = false, fade = 0.35 } = {}) {
    const next = clips[name];
    if (!next || next === current) return;
    next.reset().setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = once;
    if (current) { next.fadeIn(fade).play(); current.fadeOut(fade); }
    else next.setEffectiveWeight(1).play(); // first clip applies at full weight, so the pose can be measured
    current = next;
    if (!once) rest = name;
  }
  const draco = new DRACOLoader().setDecoderPath(siteRoot + "draco/");
  new GLTFLoader().setDRACOLoader(draco).load(cfg.model, (gltf) => {
    const m = gltf.scene;
    actor.add(m);
    if (gltf.animations.length) {
      mixer = new THREE.AnimationMixer(m);
      gltf.animations.forEach((c) => (clips[c.name] = mixer.clipAction(c)));
      mixer.addEventListener("finished", () => play(rest)); // one-shot clips return to the resting loop
      play(clips.idle ? "idle" : gltf.animations[0].name);
      mixer.update(0); // pose the skeleton before measuring
      if (greet && clips.wave && !reduceMotion) setTimeout(() => play("wave", { once: true }), 700);
    }
    // Stand the model on the floor at a consistent height. Measure the posed vertices (precise),
    // since a skinned or quantized mesh's stored bounds don't match what's drawn.
    m.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m, true), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    const s = 3.5 / size.y;
    m.scale.multiplyScalar(s);
    m.position.set(-center.x * s, -box.min.y * s, -center.z * s);
    slot.classList.add("ready");
  }, undefined, (err) => {
    console.warn("[figure] could not load", cfg.model, err);
    slot.classList.add("no-3d");
    stage.remove();
  });

  /* ---------- Layout: hero slot → background ---------- */
  let W = 0, H = 0;
  function targetRect() {
    const vw = innerWidth, vh = innerHeight;
    if (vw < 820) {
      const w = Math.min(vw * 0.92, vh * 0.62);
      return { x: (vw - w) / 2, y: vh - w * 1.25, w };
    }
    const h = vh * 0.94, w = h * 0.8;
    return { x: Math.min(vw - w - vw * 0.02, vw * 0.5 + (vw * 0.5 - w) / 2), y: vh - h, w };
  }
  function resize() {
    const t = targetRect();
    W = Math.round(Math.max(t.w, slot.clientWidth));
    H = Math.round(W * 1.25);
    stage.style.width = W + "px";
    stage.style.height = H + "px";
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    place();
  }
  const ease = (t) => t * t * (3 - 2 * t);
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  let progress = 0;
  const header = document.querySelector(".topbar");
  function place() {
    const s = slot.getBoundingClientRect(), t = targetRect();
    progress = ease(clamp01(scrollY / (innerHeight * 0.75)));
    const fade = ease(clamp01(scrollY / (innerHeight * 1.3))); // opacity eases more slowly than position
    const top = Math.max(s.top, header ? header.offsetHeight + 8 : 0); // never ride up under the header
    const x = s.left + (t.x - s.left) * progress;
    const y = top + (t.y - top) * progress;
    const w = s.width + (t.w - s.width) * progress;
    slot.style.setProperty("--detach", progress.toFixed(3));
    stage.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${w / W})`;
    stage.style.opacity = (1 - (1 - cfg.backgroundOpacity) * fade).toFixed(3);
  }
  addEventListener("resize", resize);
  addEventListener("scroll", place, { passive: true });

  /* ---------- Interaction ---------- */
  const pointer = { x: 0, y: 0 };
  let lastMove = performance.now();
  addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    pointer.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth * 0.5)));
    pointer.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.15)) / (innerHeight * 0.5)));
    lastMove = performance.now();
  }, { passive: true });

  let spin = 0, spinV = 0, dragging = false, dragX = 0, moved = 0;
  slot.addEventListener("pointerdown", (e) => { dragging = true; dragX = e.clientX; moved = 0; slot.setPointerCapture(e.pointerId); slot.classList.add("dragging"); });
  slot.addEventListener("pointermove", (e) => {
    if (!dragging) return;
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
    if (moved < 6) hop();
  };
  slot.addEventListener("pointerup", endDrag);
  slot.addEventListener("pointercancel", endDrag);
  slot.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hop(); }
    if (e.key === "ArrowLeft") spinV = -0.15;
    if (e.key === "ArrowRight") spinV = 0.15;
  });

  let hopStart = -1;
  // Click reaction: wave if the model has the clip, otherwise a little hop.
  function hop() {
    if (clips.wave) return play("wave", { once: true });
    if (!reduceMotion) hopStart = performance.now();
  }

  /* ---------- Animation loop ---------- */
  let glance = { x: 0, y: 0 }, nextGlance = performance.now() + 4000;
  const look = { x: 0, y: 0 };
  const clock = new THREE.Clock();
  renderer.setAnimationLoop((now) => {
    const dt = Math.min(clock.getDelta(), 0.05), t = now / 1000;
    if (mixer) mixer.update(dt);

    // drag spin with inertia; in the background, turn slightly toward the content on the left
    if (!dragging) { spin += spinV; spinV *= 0.92; spin += (progress * -0.35 - spin) * 0.035; }
    root.rotation.y = spin;

    // face the cursor; after a few idle seconds, glance around on its own
    const idle = now - lastMove > 3500 && !reduceMotion;
    if (idle && now > nextGlance) {
      glance = { x: (Math.random() - 0.5) * 1.2, y: (Math.random() - 0.6) * 0.5 };
      nextGlance = now + 1800 + Math.random() * 2500;
    }
    const k = progress > 0.5 ? 0.5 : 1;
    look.x += ((idle ? glance.x : pointer.x * k) - look.x) * 0.06;
    look.y += ((idle ? glance.y : pointer.y * k) - look.y) * 0.06;
    actor.rotation.y = look.x * 0.35; // no head bone yet, so the whole figure turns gently
    actor.rotation.x = look.y * 0.04;

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
    shadow.scale.setScalar(1 - y * 0.6);

    renderer.render(scene, camera);
  });

  resize();
  return { clips, play, hop };
}
