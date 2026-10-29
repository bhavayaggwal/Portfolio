import { defineConfig } from "vite";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";

// Dev-only endpoint used by the tool pages in /tools (e.g. the animation merger) to save
// generated files. Writes are limited to models/build/ so a tool can't touch anything else.
function toolSave() {
  const allowed = resolve("models/build");
  return {
    name: "tool-save",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__tools/save", (req, res) => {
        const target = resolve(new URL(req.url, "http://x").searchParams.get("path") || "");
        if (req.method !== "POST" || relative(allowed, target).startsWith("..")) {
          res.statusCode = 403;
          return res.end("Only POSTs into models/build/ are allowed.");
        }
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => {
          mkdirSync(dirname(target), { recursive: true });
          writeFileSync(target, Buffer.concat(chunks));
          res.end(JSON.stringify({ saved: relative(process.cwd(), target), bytes: Buffer.concat(chunks).length }));
        });
      });
    },
  };
}

export default defineConfig({
  // Relative base so the built site works at any path (e.g. username.github.io/Portfolio/).
  base: "./",
  server: { port: 8080, open: false },
  plugins: [toolSave()],
  build: {
    rollupOptions: {
      // One HTML entry per page
      input: {
        home: resolve("index.html"),
        story: resolve("story/index.html"),
        work: resolve("work/index.html"),
        papers: resolve("papers/index.html"),
        skills: resolve("skills/index.html"),
        contact: resolve("contact/index.html"),
      },
    },
  },
});
