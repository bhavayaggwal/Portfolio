import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { load, renderBody, renderHead, renderLlms } from "./src/render.js";

// The live address; used for canonical, social-preview and llms.txt links.
const SITE_URL = "https://bhavayaggwal.github.io/Portfolio/";
const content = () => load((name) => JSON.parse(readFileSync(`content/${name}.json`, "utf8")));

// Renders content/*.json into index.html (dev and build), and writes llms.txt next to it.
function report() {
  return {
    name: "report",
    transformIndexHtml(html) {
      const d = content();
      return html.replace("<!--head-->", renderHead(d, SITE_URL)).replace("<!--body-->", renderBody(d));
    },
    configureServer(server) {
      server.watcher.add("content");
      server.watcher.on("change", (f) => /content[\\/].+\.json$/.test(f) && server.ws.send({ type: "full-reload" }));
      server.middlewares.use("/llms.txt", (_req, res) => { res.setHeader("Content-Type", "text/markdown; charset=utf-8"); res.end(renderLlms(content(), SITE_URL)); });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "llms.txt", source: renderLlms(content(), SITE_URL) });
    },
  };
}

// Content-Security-Policy for the built page. GitHub Pages can't send custom headers, so it goes in a <meta> tag
// (which can't set frame-ancestors; HSTS and nosniff already come from GitHub). Build only: the dev server injects
// inline scripts for hot reload. Inline scripts are allowed by hash, never wholesale.
function csp() {
  return {
    name: "csp",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => `'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`);
        const policy = [
          "default-src 'self'",
          `script-src 'self' ${hashes.join(" ")} 'wasm-unsafe-eval'`, // wasm: three's Draco decoder
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // inline style="" sets the timeline bars
          "font-src https://fonts.gstatic.com",
          "img-src 'self' data: blob:", // blob: textures inside the 3D model
          "connect-src 'self' https://api.github.com https://api.web3forms.com data: blob:",
          "worker-src 'self' blob:", // Draco decodes in a blob worker
          "form-action https://api.web3forms.com mailto:",
          "base-uri 'self'",
          "object-src 'none'",
          "frame-src 'none'",
          "upgrade-insecure-requests",
        ].join("; ");
        return html.replace('<meta charset="utf-8" />', `<meta charset="utf-8" />\n  <meta http-equiv="Content-Security-Policy" content="${policy}" />\n  <meta name="referrer" content="strict-origin-when-cross-origin" />`);
      },
    },
  };
}

export default defineConfig({
  // Relative base so the built site works at any path (e.g. username.github.io/Portfolio/).
  base: "./",
  // Vite's defaults (.env, keys, .git) plus the local admin token file: never served by the dev server
  server: { port: 8080, open: false, fs: { deny: [".env", ".env.*", "*.{crt,pem,key}", "**/.git/**", "token.txt", "*.token"] } },
  plugins: [report(), csp()],
});
