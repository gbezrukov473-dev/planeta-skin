import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import { htmlTemplatePlugin } from './vite-plugin-html-template.js';
import { deployPlugin } from './vite-plugin-deploy.js';

// Авто-обнаружение всех HTML-страниц в корне
function getHtmlEntries() {
  const pages = {};
  for (const file of fs.readdirSync(__dirname)) {
    if (file.endsWith('.html')) {
      const name = file.replace('.html', '');
      pages[name] = resolve(__dirname, file);
    }
  }
  return pages;
}

// На GitHub Pages (project site) base = /<repo>/, на reg.ru — '/'
const isGhPages = Boolean(process.env.GITHUB_REPOSITORY);
const base = isGhPages
  ? '/' + process.env.GITHUB_REPOSITORY.split('/')[1] + '/'
  : '/';

// Origin production-домена (используется для абсолютных form action на GH Pages)
const PROD_ORIGIN = process.env.PROD_ORIGIN || 'https://hs-planet.ru';

/**
 * Dev-сервер: на reg.ru красивые URL /about/ отдает Apache. Чтобы это работало
 * и локально, подставляем .html для путей без расширения.
 */
function devCleanUrlPlugin() {
  return {
    name: 'dev-clean-url',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '/').split('?')[0];
        if (url === '/' || url.includes('.') || url.endsWith('.html')) return next();

        const clean = url.endsWith('/') ? url.slice(0, -1) : url;
        const htmlPath = resolve(__dirname, clean.slice(1) + '.html');
        if (fs.existsSync(htmlPath)) {
          req.url = clean + '.html';
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base,
  appType: 'mpa',
  plugins: [
    devCleanUrlPlugin(),
    htmlTemplatePlugin(),
    deployPlugin({ isGhPages, base, prodOrigin: PROD_ORIGIN }),
  ],
  build: {
    rollupOptions: {
      input: getHtmlEntries(),
    },
    cssCodeSplit: true,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
  },
  esbuild: {
    // Убираем console.log и debugger в production-бандле
    drop: ['console', 'debugger'],
  },
});
