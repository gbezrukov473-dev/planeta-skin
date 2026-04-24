#!/usr/bin/env node
/**
 * scripts/inject-image-dimensions.mjs
 *
 * Читает реальные размеры картинок через sharp и проставляет width/height
 * ко всем <img> в HTML, у которых этих атрибутов нет. Это убирает Cumulative
 * Layout Shift (CLS) — браузер резервирует место под картинку до её загрузки.
 *
 * Идемпотентный: существующие width/height не трогает.
 *
 * Как определяет, какой файл считать источником:
 *   - сначала смотрит data-src (lazy-loaded картинки)
 *   - потом src
 *   - поддерживает srcset и <source srcset> (берёт первый путь)
 *
 * Не трогает:
 *   - SVG (векторные, размер в пикселях не нужен)
 *   - data: URL
 *   - внешние URL (https://...)
 *
 * Использование:
 *   node scripts/inject-image-dimensions.mjs
 *   node scripts/inject-image-dimensions.mjs --dry
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry') || args.includes('--dry-run');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

const IMG_TAG_RE = /<img\b([^>]*?)\/?>/gi;
const ATTR_RE = (name) => new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i');

const dimCache = new Map();

async function getDimensions(relPath) {
  if (!relPath) return null;
  if (dimCache.has(relPath)) return dimCache.get(relPath);

  // Игнорируем внешние / data / svg
  if (/^https?:\/\//i.test(relPath)) return null;
  if (relPath.startsWith('data:')) return null;
  if (/\.svg(\?|$)/i.test(relPath)) return null;

  const clean = relPath.split('?')[0].split('#')[0];
  const onDisk = clean.startsWith('/')
    ? path.join(PUBLIC_DIR, clean)
    : path.join(PROJECT_ROOT, clean);

  try {
    const meta = await sharp(onDisk).metadata();
    if (!meta.width || !meta.height) return null;
    const dims = { width: meta.width, height: meta.height };
    dimCache.set(relPath, dims);
    return dims;
  } catch {
    dimCache.set(relPath, null);
    return null;
  }
}

/**
 * Из img-тега достаём «полезный» путь к картинке.
 * Приоритет: data-src > src > srcset (первый URL).
 */
function extractImgSrc(attrsStr) {
  const dataSrc = attrsStr.match(ATTR_RE('data-src'));
  if (dataSrc && dataSrc[1] && !dataSrc[1].startsWith('data:')) return dataSrc[1];

  const src = attrsStr.match(ATTR_RE('src'));
  if (src && src[1] && !src[1].startsWith('data:')) return src[1];

  const srcset = attrsStr.match(ATTR_RE('srcset'));
  if (srcset && srcset[1]) {
    const first = srcset[1].split(',')[0].trim().split(/\s+/)[0];
    if (first && !first.startsWith('data:')) return first;
  }

  return null;
}

function hasAttr(attrsStr, name) {
  return new RegExp(`\\s${name}\\s*=`, 'i').test(attrsStr);
}

async function processHtml(filePath) {
  const html = await fs.readFile(filePath, 'utf8');
  let touched = 0;
  let skippedNoSrc = 0;
  let skippedHadDims = 0;
  let skippedUnresolvable = 0;

  // Собираем таски; async-замена проще через цикл.
  const matches = [];
  let m;
  IMG_TAG_RE.lastIndex = 0;
  while ((m = IMG_TAG_RE.exec(html)) !== null) {
    matches.push({ full: m[0], attrs: m[1], index: m.index });
  }

  // Обрабатываем с конца, чтобы не смещать индексы.
  let out = html;
  for (let i = matches.length - 1; i >= 0; i--) {
    const { full, attrs, index } = matches[i];

    if (hasAttr(attrs, 'width') && hasAttr(attrs, 'height')) {
      skippedHadDims++;
      continue;
    }

    const src = extractImgSrc(attrs);
    if (!src) {
      skippedNoSrc++;
      continue;
    }

    const dims = await getDimensions(src);
    if (!dims) {
      skippedUnresolvable++;
      continue;
    }

    // Вставляем перед закрывающим '>' или '/>'
    let newAttrs = attrs;
    if (!hasAttr(newAttrs, 'width')) newAttrs += ` width="${dims.width}"`;
    if (!hasAttr(newAttrs, 'height')) newAttrs += ` height="${dims.height}"`;

    const closing = full.endsWith('/>') ? '/>' : '>';
    const replaced = `<img${newAttrs}${closing}`;

    out = out.slice(0, index) + replaced + out.slice(index + full.length);
    touched++;
  }

  if (touched > 0 && !DRY_RUN) {
    await fs.writeFile(filePath, out, 'utf8');
  }

  return { touched, skippedHadDims, skippedNoSrc, skippedUnresolvable };
}

async function listHtmlFiles() {
  const entries = await fs.readdir(PROJECT_ROOT, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.html') && e.name !== 'icons-preview.html')
    .map((e) => path.join(PROJECT_ROOT, e.name));
}

async function main() {
  console.log('📐 Простановка width/height в <img>');
  if (DRY_RUN) console.log('   [DRY RUN] ничего не пишем\n');
  else console.log('');

  const files = await listHtmlFiles();

  let totalTouched = 0;
  let totalHadDims = 0;
  let totalNoSrc = 0;
  let totalUnresolvable = 0;

  for (const f of files) {
    const name = path.basename(f);
    const r = await processHtml(f);
    totalTouched += r.touched;
    totalHadDims += r.skippedHadDims;
    totalNoSrc += r.skippedNoSrc;
    totalUnresolvable += r.skippedUnresolvable;

    const changeStr = r.touched > 0 ? `+${r.touched}` : '  0';
    console.log(
      `  ${name.padEnd(25)} ${changeStr}  (уже с размерами: ${r.skippedHadDims}, без src: ${r.skippedNoSrc}, не найдено: ${r.skippedUnresolvable})`
    );
  }

  console.log('');
  console.log('─'.repeat(70));
  console.log(`Всего проставлено:         ${totalTouched}`);
  console.log(`Уже имели width/height:    ${totalHadDims}`);
  console.log(`Без валидного src:         ${totalNoSrc}`);
  console.log(`Файл не нашли на диске:    ${totalUnresolvable}`);
  if (DRY_RUN) console.log('\n(dry-run, файлы не менялись)');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
