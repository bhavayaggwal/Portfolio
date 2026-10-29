// Merges Mixamo FBX clips onto the skinned character and exports one GLB.
// Open http://localhost:8080/tools/rig/index.html while `npm run dev` runs.
// Output: models/build/bhavay-rigged-raw.glb, then `node tools/compress-rigged.mjs` makes the web copy.
import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DIR = "/models/source/mixamo/"; // Mixamo FBX downloads
const SKIN = "Idle.fbx"; // a "With Skin" download: provides the mesh and skeleton
const TEXTURE_FROM = "/models/build/bhavay-static.glb"; // the optimized model, for its original material
// Clip name used by the site → Mixamo file
const CLIPS = {
  idle: "Idle.fbx",
  walkStart: "Start Walking.fbx",
  walk: "Walking.fbx",
  wave: "Waving.fbx",
  point: "Pointing.fbx",
  kneelPoint: "Kneeling Pointing.fbx",
  sitDown: "Sitting.fbx",
  sitIdle: "Sitting Idle.fbx",
  sitTalk: "Sitting Talking.fbx",
};

const log = (msg) => { document.getElementById("log").textContent += msg + "\n"; console.log("[merge]", msg); };

/* ---------- Viewer ---------- */
const view = document.getElementById("view");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
view.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color("#22252c");
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 1.2, 4.2);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.95, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.position.set(2, 4, 3);
scene.add(sun, new THREE.GridHelper(4, 8, 0x444444, 0x333333));
function resize() {
  const w = view.clientWidth, h = view.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

/* ---------- Load ---------- */
const fbx = new FBXLoader();
const character = await fbx.loadAsync(DIR + encodeURIComponent(SKIN));
// Units depend on what was uploaded to Mixamo; measure and scale the character to 1.8 m tall
character.updateMatrixWorld(true);
const rawSize = new THREE.Box3().setFromObject(character, true).getSize(new THREE.Vector3());
character.scale.multiplyScalar(1.8 / rawSize.y);
log(`raw height ${rawSize.y.toFixed(3)} → scaled ×${(1.8 / rawSize.y).toFixed(4)}`);
scene.add(character);

const gltf = await new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath("/draco/")).loadAsync(TEXTURE_FROM);
let original;
gltf.scene.traverse((o) => { if (o.isMesh && !original) original = o.material; });
let meshes = 0, bones = 0;
character.traverse((o) => {
  if (o.isSkinnedMesh) {
    // FBX UVs have V pointing up; glTF textures expect it pointing down. Flip so the original
    // glTF texture lines up (and the exported GLB uses glTF's convention).
    const uv = o.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
    uv.needsUpdate = true;
    o.material = original;
    o.frustumCulled = false;
    meshes++;
  }
  if (o.isBone) bones++;
});
log(`character: ${meshes} skinned mesh(es), ${bones} bones`);

const clips = [];
for (const [name, file] of Object.entries(CLIPS)) {
  try {
    const src = await fbx.loadAsync(DIR + encodeURIComponent(file));
    const clip = src.animations[0];
    clip.name = name;
    // Keep motion in place: hold the hips' horizontal position at its first frame, so the site
    // decides where the character goes. Vertical motion (sitting, kneeling) is kept.
    const hips = clip.tracks.find((t) => /Hips\.position$/.test(t.name));
    if (hips) for (let i = 0; i < hips.values.length; i += 3) { hips.values[i] = hips.values[0]; hips.values[i + 2] = hips.values[2]; }
    clips.push(clip);
    log(`${name}: ${clip.duration.toFixed(2)}s, ${clip.tracks.length} tracks`);
  } catch (e) {
    log(`${name}: FAILED (${file}) ${e.message}`);
  }
}

/* ---------- Preview ---------- */
const mixer = new THREE.AnimationMixer(character);
let current;
const buttons = document.getElementById("clips");
function play(name) {
  const clip = clips.find((c) => c.name === name);
  const next = mixer.clipAction(clip);
  next.reset().fadeIn(0.3).play();
  if (current && current !== next) current.fadeOut(0.3);
  current = next;
  [...buttons.children].forEach((b) => b.setAttribute("aria-pressed", b.dataset.clip === name));
  window.__clip = name;
}
clips.forEach((c) => {
  const b = document.createElement("button");
  b.dataset.clip = c.name;
  b.textContent = `${c.name} (${c.duration.toFixed(1)}s)`;
  b.onclick = () => play(c.name);
  buttons.appendChild(b);
});
play("idle");
window.__play = play;

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => { mixer.update(clock.getDelta()); controls.update(); renderer.render(scene, camera); });

/* ---------- Export ---------- */
const save = document.getElementById("save");
save.disabled = false;
save.onclick = async () => {
  save.disabled = true;
  mixer.stopAllAction();
  character.updateMatrixWorld(true);
  const glb = await new GLTFExporter().parseAsync(character, { binary: true, animations: clips });
  const res = await fetch("/__tools/save?path=models/build/bhavay-rigged-raw.glb", { method: "POST", body: glb });
  log(res.ok ? "saved " + (await res.text()) : "save failed: " + res.status);
  window.__saved = res.ok;
  play("idle");
  save.disabled = false;
};
window.__ready = true;
