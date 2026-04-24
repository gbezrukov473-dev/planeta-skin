/**
 * Деплой-плагин. У нас один prod-хостинг — reg.ru (Apache + PHP).
 * Cloudflare Pages (planeta-skin.pages.dev) — это превью-сборка, она льётся
 * в той же конфигурации и с тем же base='/', потому что там тоже clean URLs.
 *
 * Что делает:
 *  1. На билде подставляет дату-версию в Service Worker (dist/sw.js).
 *  2. Перекладывает dist/page.html → dist/page/index.html, чтобы
 *     «красивые» URL работали и без .htaccess (важно для Cloudflare Pages).
 */
import fs from 'fs';
import path from 'path';

// Страницы, которые остаются в корне и НЕ получают свою папку
const KEEP_AT_ROOT = new Set(['index.html', '404.html', 'offline.html']);

export function deployPlugin() {
  const buildVersion = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let outDir = 'dist';

  return {
    name: 'planeta-deploy',
    apply: 'build',

    configResolved(config) {
      outDir = config.build?.outDir || 'dist';
    },

    closeBundle() {
      const distDir = path.resolve(outDir);
      if (!fs.existsSync(distDir)) return;

      stampServiceWorker(distDir, buildVersion);
      restructurePages(distDir);
    },
  };
}

function stampServiceWorker(distDir, version) {
  const swPath = path.join(distDir, 'sw.js');
  if (!fs.existsSync(swPath)) return;

  let content = fs.readFileSync(swPath, 'utf-8');
  if (content.includes('__BUILD_VERSION__')) {
    content = content.replace(/__BUILD_VERSION__/g, version);
    fs.writeFileSync(swPath, content, 'utf-8');
    console.log(`[deploy] Service Worker version: pzk-sw-v${version}`);
  }
}

function restructurePages(distDir) {
  const files = fs.readdirSync(distDir);
  for (const file of files) {
    if (!file.endsWith('.html')) continue;
    if (KEEP_AT_ROOT.has(file)) continue;

    const slug = file.replace(/\.html$/, '');
    const targetDir = path.join(distDir, slug);
    const targetFile = path.join(targetDir, 'index.html');
    const sourceFile = path.join(distDir, file);

    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.renameSync(sourceFile, targetFile);
  }
  console.log('[deploy] Страницы разложены по папкам: /page/ → /page/index.html');
}
