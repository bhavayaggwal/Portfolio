// Optimize the source character model for the web and for Mixamo rigging.
//
//   node tools/optimize-model.mjs [source.glb] [--tris 60000] [--tex 2048]
//
// Outputs:
//   models/build/bhavay-static.glb   light static copy (simplified, Draco, WebP); tools/rig takes its texture
//   models/build/mixamo/bhavay.obj|.mtl|albedo.png   upload set for Mixamo's auto-rigger (zip it, then upload)
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { weld, simplify, textureCompress, draco, prune, dedup } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import draco3d from "draco3dgltf";
import sharp from "sharp";
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? Number(args[i + 1]) : def; };
const SRC = args.find((a) => a.endsWith(".glb")) || "models/source/man_hoodie_headphones.glb";
const TARGET_TRIS = opt("--tris", 60000);
const TEX = opt("--tex", 2048);
const OUT = "models/build";
mkdirSync(join(OUT, "mixamo"), { recursive: true });

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  });

const mb = (n) => (n / 1048576).toFixed(1) + " MB";
const triCount = (doc) => doc.getRoot().listMeshes().reduce((n, m) =>
  n + m.listPrimitives().reduce((k, p) => k + (p.getIndices() ? p.getIndices().getCount() : p.getAttribute("POSITION").getCount()) / 3, 0), 0);

console.log("reading", SRC, mb(statSync(SRC).size));
const doc = await io.read(SRC);
const before = triCount(doc);

// The source stores separate normals per triangle, so no vertex is shared and the simplifier can't
// collapse anything. Drop normals, weld (UVs are mostly shared, so the texture survives), simplify,
// then rebuild smooth normals.
await MeshoptSimplifier.ready;
for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) p.setAttribute("NORMAL", null);
await doc.transform(
  weld({ tolerance: 0.0001 }),
  simplify({ simplifier: MeshoptSimplifier, ratio: Math.min(1, TARGET_TRIS / before), error: 0.01 }),
  dedup(),
  prune(),
);
// Smooth normals that keep the mesh indexed (gltf-transform's normals() un-welds and goes faceted).
// Vertices split at UV seams share a position, so normals are summed by position to hide the seams.
for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) {
  const pos = p.getAttribute("POSITION"), ind = p.getIndices(), n = pos.getCount();
  const key = (i) => { const a = pos.getElement(i, []); return a.map((x) => x.toFixed(5)).join(","); };
  const sums = new Map(), a = [], b = [], c = [];
  for (let i = 0; i < ind.getCount(); i += 3) {
    const i0 = ind.getScalar(i), i1 = ind.getScalar(i + 1), i2 = ind.getScalar(i + 2);
    pos.getElement(i0, a); pos.getElement(i1, b); pos.getElement(i2, c);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const f = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]; // area-weighted face normal
    for (const k of [i0, i1, i2].map(key)) { const s = sums.get(k) || [0, 0, 0]; s[0] += f[0]; s[1] += f[1]; s[2] += f[2]; sums.set(k, s); }
  }
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const s = sums.get(key(i)) || [0, 1, 0], l = Math.hypot(...s) || 1;
    out[i * 3] = s[0] / l; out[i * 3 + 1] = s[1] / l; out[i * 3 + 2] = s[2] / l;
  }
  p.setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(out).setBuffer(pos.getBuffer()));
}
const after = triCount(doc);
console.log(`triangles ${before.toLocaleString()} -> ${after.toLocaleString()}`);
{
  const p = doc.getRoot().listMeshes()[0].listPrimitives()[0];
  console.log(`vertices ${p.getAttribute("POSITION").getCount().toLocaleString()}, indexed: ${!!p.getIndices()}`);
}

/* ---------- Mixamo upload set: OBJ + MTL + albedo PNG ---------- */
const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const P = prim.getAttribute("POSITION"), N = prim.getAttribute("NORMAL"), UV = prim.getAttribute("TEXCOORD_0");
const idx = prim.getIndices();
const lines = ["# Bhavay avatar, simplified for Mixamo", "mtllib bhavay.mtl", "o bhavay", "usemtl avatar"];
const v = [0, 0, 0], t = [0, 0];
for (let i = 0; i < P.getCount(); i++) { P.getElement(i, v); lines.push(`v ${v[0].toFixed(5)} ${v[1].toFixed(5)} ${v[2].toFixed(5)}`); }
for (let i = 0; i < UV.getCount(); i++) { UV.getElement(i, t); lines.push(`vt ${t[0].toFixed(5)} ${(1 - t[1]).toFixed(5)}`); } // glTF V is flipped vs OBJ
for (let i = 0; i < N.getCount(); i++) { N.getElement(i, v); lines.push(`vn ${v[0].toFixed(4)} ${v[1].toFixed(4)} ${v[2].toFixed(4)}`); }
const at = (i) => (idx ? idx.getScalar(i) : i) + 1; // indexed or plain triangle list
for (let i = 0; i < (idx ? idx.getCount() : P.getCount()); i += 3) {
  const a = at(i), b = at(i + 1), c = at(i + 2);
  lines.push(`f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}`);
}
writeFileSync(join(OUT, "mixamo", "bhavay.obj"), lines.join("\n"));
writeFileSync(join(OUT, "mixamo", "bhavay.mtl"), "newmtl avatar\nKd 1 1 1\nmap_Kd albedo.png\n");
const albedo = doc.getRoot().listMaterials()[0].getBaseColorTexture();
await sharp(Buffer.from(albedo.getImage())).resize(TEX, TEX).png().toFile(join(OUT, "mixamo", "albedo.png"));
console.log("mixamo set ->", join(OUT, "mixamo"));

/* ---------- Light web copy ---------- */
await doc.transform(
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [TEX, TEX], quality: 85 }),
  draco({ method: "edgebreaker" }),
);
const webPath = join(OUT, "bhavay-static.glb"); // input for tools/rig (texture source); the site uses the rigged model
await io.write(webPath, doc);
console.log("web glb ->", webPath, mb(statSync(webPath).size));
