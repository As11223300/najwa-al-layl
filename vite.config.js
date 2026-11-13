import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { generate } from './src/site/generate.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(root, '.site');
const publicOut = path.join(root, '.site-public');

// GitHub Pages serves a project site under /<repo>/. The deploy workflow sets
// BASE_PATH; locally the site lives at /.
const base = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');

function htmlInputs(dir) {
  const inputs = {};
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) {
        inputs[path.relative(dir, full).replace(/\\/g, '/').replace(/\.html$/, '') || 'index'] = full;
      }
    }
  };
  walk(dir);
  return inputs;
}

// Regenerates the pages when content, settings or templates change.
function journal() {
  return {
    name: 'najwa-journal',
    configureServer(server) {
      const watched = [path.join(root, 'content'), path.join(root, 'src/site'), path.join(root, 'site.config.mjs')];
      server.watcher.add(watched);
      let timer;
      server.watcher.on('all', (_event, file) => {
        if (!watched.some((w) => file.startsWith(w))) return;
        clearTimeout(timer);
        // Node caches the generator's own modules, so a change to them (or to
        // the settings) needs a fresh server; content and theme files only
        // need the pages regenerated.
        if (file.endsWith('.mjs')) {
          timer = setTimeout(() => server.restart(), 80);
          return;
        }
        timer = setTimeout(async () => {
          try {
            await generate({ root, outDir, publicOut, base });
            server.ws.send({ type: 'full-reload' });
          } catch (err) {
            server.config.logger.error(`\n${err.message}\n`);
          }
        }, 80);
      });
    },
  };
}

export default defineConfig(async () => {
  await generate({ root, outDir, publicOut, base });
  return {
    root: outDir,
    base,
    publicDir: publicOut,
    appType: 'mpa',
    plugins: [journal()],
    server: { fs: { allow: [root] } },
    build: {
      outDir: path.join(root, 'dist'),
      emptyOutDir: true,
      rollupOptions: { input: htmlInputs(outDir) },
    },
  };
});
