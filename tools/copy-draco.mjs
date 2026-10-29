// Copies three.js's Draco decoder into public/draco so compressed models load without a CDN.
// Runs automatically after `npm install`.
import { cpSync, existsSync } from "node:fs";

const from = "node_modules/three/examples/jsm/libs/draco/gltf";
if (existsSync(from)) {
  cpSync(from, "public/draco", { recursive: true });
  console.log("draco decoder -> public/draco");
}
