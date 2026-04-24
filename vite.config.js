import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import { htmlTemplatePlugin } from './vite-plugin-html-template.js';
import { deployPlugin } from './vite-plugin-deploy.js';

// Авто-обнаружение всех HTML-страниц в корне
function getHtmlEntries() {
  const pages = {};
  for (const file of fs.readdirSync(__dirname)) {
    if (!file.endsWith('.html')) continue;
    // icons-preview — служебная страница, на проде не нужна
    if (file === 'icons-preview.html') continue;
    const name = file.replace('.html', '');
    pages[name] = resolve(__dirname, file);
  }
  return pages;
}

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
  base: '/',
  appType: 'mpa',
  plugins: [
    devCleanUrlPlugin(),
    htmlTemplatePlugin(),
    deployPlugin(),
  ],
  build: {
    rollupOptions: {
      input: getHtmlEntries(),
    },
    cssCodeSplit: true,
    // rolldown-vite использует Oxc (не esbuild), minify идёт по умолчанию
    chunkSizeWarningLimit: 1000,
  },
});
