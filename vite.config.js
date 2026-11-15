import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
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

export default defineConfig({
  // Relative base so the built site works at any path (e.g. username.github.io/Portfolio/).
  base: "./",
  server: { port: 8080, open: false },
  plugins: [report()],
});
