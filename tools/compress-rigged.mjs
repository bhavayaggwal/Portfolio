// Compresses the merged, rigged character for the web.
//
//   node tools/compress-rigged.mjs
//
// Reads  models/build/bhavay-rigged-raw.glb  (made by tools/rig/index.html)
// Writes public/models/bhavay.glb            (the model the site loads)
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { resample, prune, dedup, textureCompress, draco } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import sharp from "sharp";
import { statSync } from "node:fs";

const SRC = "models/build/bhavay-rigged-raw.glb";
const OUT = "public/models/bhavay.glb";
const mb = (n) => (n / 1048576).toFixed(1) + " MB";

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  });

const doc = await io.read(SRC);
const keys = () => doc.getRoot().listAccessors().filter((a) => doc.getRoot().listAnimations().some((an) =>
  an.listSamplers().some((s) => s.getInput() === a))).reduce((n, a) => n + a.getCount(), 0);
const before = keys();

await doc.transform(
  resample({ tolerance: 1e-4 }), // drop keyframes that a straight interpolation reproduces
  dedup(),
  prune(),
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [2048, 2048], quality: 85 }),
  draco({ method: "edgebreaker" }),
);

for (const a of doc.getRoot().listAnimations()) console.log(`clip ${a.getName()}`);
console.log(`keyframes ${before.toLocaleString()} -> ${keys().toLocaleString()}`);
await io.write(OUT, doc);
console.log(`${SRC} ${mb(statSync(SRC).size)} -> ${OUT} ${mb(statSync(OUT).size)}`);
