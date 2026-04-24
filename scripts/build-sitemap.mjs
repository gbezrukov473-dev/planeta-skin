#!/usr/bin/env node
/**
 * scripts/build-sitemap.mjs
 *
 * Генерирует public/sitemap.xml на основе реальных HTML-страниц.
 *
 * - Обходит корень проекта и берёт все .html (кроме служебных)
 * - <loc> формирует с правильным clean-URL (/about/ вместо /about.html)
 * - <lastmod> — дата последнего коммита, затронувшего файл (git log),
 *   либо mtime файла, если git недоступен.
 * - Дополнительно собирает image:image из <img src="/img/..."> на странице,
 *   что даёт Google бонус к индексации картинок.
 *
 * Запуск:
 *   node scripts/build-sitemap.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

const BASE_URL = 'https://hs-planet.ru';

// Страницы, которые НЕ должны попадать в sitemap
const EXCLUDE = new Set(['404.html', 'thanks.html', 'offline.html', 'icons-preview.html']);

// Частота обновления и приоритет — настраиваем вручную по важности
const PAGE_META = {
  'index.html':        { changefreq: 'weekly',  priority: '1.0' },
  'laser.html':        { changefreq: 'monthly', priority: '0.9' },
  'removal.html':      { changefreq: 'monthly', priority: '0.9' },
  'hardware.html':     { changefreq: 'monthly', priority: '0.9' },
  'inject.html':       { changefreq: 'monthly', priority: '0.9' },
  'aesthetic.html':    { changefreq: 'monthly', priority: '0.9' },
  'body.html':         { changefreq: 'monthly', priority: '0.9' },
  'cosmetics.html':    { changefreq: 'weekly',  priority: '0.8' },
  'promo.html':        { changefreq: 'weekly',  priority: '0.9' },
  'reviews.html':      { changefreq: 'weekly',  priority: '0.7' },
  'about.html':        { changefreq: 'monthly', priority: '0.8' },
  'specialists.html':  { changefreq: 'monthly', priority: '0.8' },
  'equipment.html':    { changefreq: 'monthly', priority: '0.8' },
  'contacts.html':     { changefreq: 'monthly', priority: '0.8' },
  'certificates.html': { changefreq: 'monthly', priority: '0.6' },
  'legal.html':        { changefreq: 'monthly', priority: '0.5' },
  'policy.html':       { changefreq: 'yearly',  priority: '0.3' },
};

function pathToUrl(filename) {
  if (filename === 'index.html') return `${BASE_URL}/`;
  const slug = filename.replace(/\.html$/, '');
  return `${BASE_URL}/${slug}/`;
}

function gitLastModified(filePath) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (out) return out.slice(0, 10);
  } catch {
    /* git может быть недоступен — падаем на mtime */
  }
  return null;
}

async function fileLastModified(filePath) {
  const fromGit = gitLastModified(filePath);
  if (fromGit) return fromGit;
  const st = await fs.stat(filePath);
  return st.mtime.toISOString().slice(0, 10);
}

function xmlEscape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function extractImages(html) {
  const found = new Set();
  // Забираем /img/... из src, data-src, srcset, <source srcset>
  const re = /(?:src|data-src|srcset)\s*=\s*"([^"]*\/img\/[^"]+)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    // Из srcset может быть "path 1x, path2 2x" — берём все пути
    const candidates = m[1].split(',').map((s) => s.trim().split(/\s+/)[0]);
    for (const c of candidates) {
      if (!c) continue;
      const clean = c.split('?')[0].split('#')[0];
      if (!clean.startsWith('/img/')) continue;
      // Для картинок в sitemap достаточно одной версии на ресурс
      // (Google сам понимает формат по URL). Избегаем дубликатов avif+webp.
      const withoutExt = clean.replace(/\.(avif|webp|jpg|jpeg|png|gif|svg)$/i, '');
      found.add(withoutExt + path.extname(clean));
    }
  }
  // Сводим к одной версии (webp в приоритете — она есть у всех картинок)
  const byBase = new Map();
  for (const url of found) {
    const ext = path.extname(url).toLowerCase();
    const base = url.slice(0, -ext.length);
    const prev = byBase.get(base);
    const priority = { '.webp': 3, '.jpg': 2, '.jpeg': 2, '.png': 2, '.avif': 1, '.svg': 0, '.gif': 0 };
    if (!prev || priority[ext] > priority[path.extname(prev).toLowerCase()]) {
      byBase.set(base, url);
    }
  }
  return Array.from(byBase.values()).sort();
}

async function buildUrlEntry(filename) {
  const filePath = path.join(PROJECT_ROOT, filename);
  const meta = PAGE_META[filename] || { changefreq: 'monthly', priority: '0.5' };
  const lastmod = await fileLastModified(filePath);
  const html = await fs.readFile(filePath, 'utf8');
  const images = await extractImages(html);

  const lines = [
    '  <url>',
    `    <loc>${xmlEscape(pathToUrl(filename))}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${meta.changefreq}</changefreq>`,
    `    <priority>${meta.priority}</priority>`,
  ];

  for (const img of images) {
    lines.push('    <image:image>');
    lines.push(`      <image:loc>${xmlEscape(BASE_URL + img)}</image:loc>`);
    lines.push('    </image:image>');
  }

  lines.push('  </url>');
  return lines.join('\n');
}

async function main() {
  console.log('🗺  Генерация public/sitemap.xml');

  const entries = await fs.readdir(PROJECT_ROOT, { withFileTypes: true });
  const htmlFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith('.html') && !EXCLUDE.has(e.name))
    .map((e) => e.name)
    .sort((a, b) => {
      // index первый, остальные по приоритету
      if (a === 'index.html') return -1;
      if (b === 'index.html') return 1;
      const pa = parseFloat(PAGE_META[a]?.priority || '0.5');
      const pb = parseFloat(PAGE_META[b]?.priority || '0.5');
      return pb - pa;
    });

  const urls = [];
  let imgCount = 0;
  for (const f of htmlFiles) {
    const entry = await buildUrlEntry(f);
    imgCount += (entry.match(/<image:image>/g) || []).length;
    urls.push(entry);
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');

  await fs.writeFile(SITEMAP_PATH, xml, 'utf8');

  console.log(`   Страниц:  ${htmlFiles.length}`);
  console.log(`   Картинок: ${imgCount}`);
  console.log(`   Записано: ${path.relative(PROJECT_ROOT, SITEMAP_PATH)}`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
