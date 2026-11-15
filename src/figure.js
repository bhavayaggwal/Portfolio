/*
 * Bunny, the 3D avatar (three.js), framed head and shoulders in the cover panel.
 * Idles, turns toward the cursor, glances around when left alone, spins on drag, and waves when clicked
 * (or with Enter). Draws only while on screen and the tab is visible.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

export function initFigure(slot, model) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return; // no WebGL: the still picture stays
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.domElement.setAttribute("aria-hidden", "true");
  slot.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 0.8, 0.1, 60);
  camera.position.set(0, 2.55, 5.4);
  camera.lookAt(0, 2.45, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 2.0));
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(2.5, 4, 4);
  const rim = new THREE.DirectionalLight(0xffffff, 1.4);
  rim.position.set(-2.5, 3.5, -3.5);
  scene.add(key, rim);

  const actor = new THREE.Group();
  scene.add(actor);
  // Invisible body-sized target, so a click on Bunny (not the space around him) gets a wave
  const hitBox = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 3.5, 12), new THREE.MeshBasicMaterial({ visible: false }));
  hitBox.position.y = 1.75;
  actor.add(hitBox);

  let mixer = null, idle = null, wave = null;
  const draco = new DRACOLoader(); // three bundles the decoder next to this chunk
  new GLTFLoader().setDRACOLoader(draco).load(model, (gltf) => {
    const m = gltf.scene;
    actor.add(m);
    if (gltf.animations.length) {
      mixer = new THREE.AnimationMixer(m);
      const clip = (n) => gltf.animations.find((c) => c.name === n);
      idle = mixer.clipAction(clip("idle") || gltf.animations[0]).play();
      if (clip("wave")) {
        wave = mixer.clipAction(clip("wave")).setLoop(THREE.LoopOnce, 1);
        wave.clampWhenFinished = true;
        mixer.addEventListener("finished", (e) => { if (e.action === wave) { idle.reset().fadeIn(0.35).play(); wave.fadeOut(0.35); } });
      }
      mixer.update(0); // pose the skeleton before measuring
    }
    // Stand the model on the floor at a set height, measured from the posed vertices
    m.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(m, true), size = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
    const s = 3.5 / size.y;
    m.scale.multiplyScalar(s);
    m.position.set(-c.x * s, -bb.min.y * s, -c.z * s);
    slot.classList.add("ready");
  }, undefined, (err) => console.warn("[figure] could not load", model, err));

  function poke() {
    if (!wave || wave.isRunning()) return;
    wave.reset().fadeIn(0.25).play();
    idle.fadeOut(0.25);
  }

  /* Layout */
  function resize() {
    const W = Math.max(1, slot.clientWidth), H = Math.max(1, slot.clientHeight);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(slot);

  /* Interaction */
  const pointer = { x: 0, y: 0 };
  let lastMove = performance.now();
  addEventListener("pointermove", (e) => {
    const r = slot.getBoundingClientRect();
    pointer.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth * 0.5)));
    pointer.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.3)) / (innerHeight * 0.5)));
    lastMove = performance.now();
  }, { passive: true });

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const onFigure = (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(hitBox).length > 0;
  };
  let spin = 0, spinV = 0, drag = null;
  slot.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, moved: 0, hit: onFigure(e) }; slot.setPointerCapture(e.pointerId); });
  slot.addEventListener("pointermove", (e) => {
    if (!drag) return slot.classList.toggle("over", onFigure(e));
    const dx = e.clientX - drag.x;
    drag.x = e.clientX;
    drag.moved += Math.abs(dx);
    spinV = dx * 0.012;
    spin += spinV;
  });
  const end = () => { if (drag && drag.moved < 6 && drag.hit) poke(); drag = null; };
  slot.addEventListener("pointerup", end);
  slot.addEventListener("pointercancel", end);
  slot.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); poke(); } });

  /* Animation loop */
  let glance = { x: 0, y: 0 }, nextGlance = 0;
  const look = { x: 0, y: 0 }, clock = new THREE.Clock();
  function frame(now) {
    if (mixer) mixer.update(Math.min(clock.getDelta(), 0.05));
    if (!drag) { spin += spinV; spinV *= 0.92; spin *= 0.965; } // inertia, then ease back to facing front
    const idleNow = now - lastMove > 3500;
    if (idleNow && now > nextGlance) {
      glance = { x: (Math.random() - 0.5) * 1.2, y: (Math.random() - 0.6) * 0.5 };
      nextGlance = now + 1800 + Math.random() * 2500;
    }
    look.x += ((idleNow ? glance.x : pointer.x) - look.x) * 0.06;
    look.y += ((idleNow ? glance.y : pointer.y) - look.y) * 0.06;
    actor.rotation.y = spin + look.x * 0.35; // no head bone, so the whole figure turns gently
    actor.rotation.x = look.y * 0.04;
    renderer.render(scene, camera);
  }
  let onScreen = true;
  const run = () => {
    const live = onScreen && !document.hidden;
    if (live) clock.getDelta(); // skip the paused time
    renderer.setAnimationLoop(live ? frame : null);
  };
  new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; run(); }).observe(slot);
  document.addEventListener("visibilitychange", run);
  resize();
  run();
}
