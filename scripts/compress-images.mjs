#!/usr/bin/env node
/**
 * scripts/compress-images.mjs
 *
 * Идемпотентное сжатие картинок в public/img/.
 *
 * Что делает за один запуск:
 *  - Для каждой картинки (.webp/.jpg/.jpeg/.png) в public/img/:
 *      * пережимает WebP с q=QUALITY_WEBP (по умолчанию 85 — визуально без потерь);
 *      * генерирует/обновляет рядом AVIF с q=QUALITY_AVIF (по умолчанию 65);
 *      * при необходимости уменьшает до MAX_WIDTH по длинной стороне.
 *  - Уже обработанные файлы пропускает по SHA1-хешу из scripts/.image-manifest.json.
 *  - Если новый файл получился НЕ меньше старого хотя бы на SAVINGS_THRESHOLD,
 *    оставляет старый (не ухудшаем уже оптимизированное).
 *
 * Использование:
 *   npm run images:compress                 — сжать всё новое/изменившееся
 *   npm run images:compress -- --dry        — ничего не писать, просто показать план
 *   npm run images:compress -- --force      — пережать всё, игнорируя манифест
 *   npm run images:compress -- --quality-webp=90 --quality-avif=70
 *
 * Параметры качества подобраны так, чтобы цветность и тон кожи (важно для
 * клинических фото «до/после») оставались близки к оригиналу. Если нужно
 * ещё бережнее — увеличьте QUALITY_WEBP до 90 и QUALITY_AVIF до 72.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/* ------------------------------- config ------------------------------- */

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry') || args.includes('--dry-run');
const FORCE = args.includes('--force');
const BOOTSTRAP = args.includes('--bootstrap');

function argNum(flag, def) {
  const hit = args.find((a) => a.startsWith(`${flag}=`));
  if (!hit) return def;
  const n = Number(hit.split('=')[1]);
  return Number.isFinite(n) ? n : def;
}

const QUALITY_WEBP = argNum('--quality-webp', 85);
const QUALITY_AVIF = argNum('--quality-avif', 65);
const MAX_WIDTH = argNum('--max-width', 1920);
const EFFORT = 6;
const CONCURRENCY = 4;
const SAVINGS_THRESHOLD = 0.02;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const IMG_DIR = path.join(PROJECT_ROOT, 'public', 'img');
const MANIFEST_PATH = path.join(__dirname, '.image-manifest.json');

const SOURCE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/* ------------------------------- utils -------------------------------- */

function sha1File(buf) {
  return createHash('sha1').update(buf).digest('hex').slice(0, 16);
}

function fmtBytes(n) {
  if (!Number.isFinite(n)) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

async function loadManifest() {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf8');
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

async function saveManifest(m) {
  if (DRY_RUN) return;
  const sorted = Object.fromEntries(
    Object.entries(m).sort(([a], [b]) => a.localeCompare(b))
  );
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
}

async function readDirSafe(dir) {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

/**
 * Пишем во временный файл, затем атомарно переименовываем. Если новый
 * файл не выиграл у старого по размеру — откатываем. На Windows rename
 * может иногда падать с EPERM (антивирус, Explorer держит превью) —
 * делаем несколько повторов с backoff.
 */
async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function renameWithRetry(from, to, attempts = 5) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      await fs.rename(from, to);
      return;
    } catch (err) {
      lastErr = err;
      if (err.code !== 'EPERM' && err.code !== 'EBUSY' && err.code !== 'EACCES') throw err;
      await sleep(100 * (i + 1));
    }
  }
  throw lastErr;
}

async function writeIfSmaller(destPath, newBuf) {
  let origSize = 0;
  try {
    const st = await fs.stat(destPath);
    origSize = st.size;
  } catch {
    /* файла не было — это ок */
  }

  if (origSize > 0 && newBuf.length >= origSize * (1 - SAVINGS_THRESHOLD)) {
    return { action: 'kept-original', size: origSize, wrote: false };
  }

  if (DRY_RUN) {
    return {
      action: origSize > 0 ? 'would-replace' : 'would-create',
      size: newBuf.length,
      wrote: false,
    };
  }

  const tmp = destPath + '.tmp';
  await fs.writeFile(tmp, newBuf);
  await renameWithRetry(tmp, destPath);
  return { action: origSize > 0 ? 'replaced' : 'created', size: newBuf.length, wrote: true };
}

/* --------------------------- image pipeline --------------------------- */

async function encodeBoth(srcBuf) {
  const base = sharp(srcBuf, { failOn: 'none' }).rotate();
  const meta = await base.metadata();

  const needResize = meta.width && meta.width > MAX_WIDTH;
  const pipeline = needResize
    ? base.clone().resize({ width: MAX_WIDTH, withoutEnlargement: true })
    : base.clone();

  const [webpBuf, avifBuf] = await Promise.all([
    pipeline
      .clone()
      .webp({
        quality: QUALITY_WEBP,
        effort: EFFORT,
        smartSubsample: true,
      })
      .toBuffer(),
    pipeline
      .clone()
      .avif({
        quality: QUALITY_AVIF,
        effort: EFFORT,
      })
      .toBuffer(),
  ]);

  return { webpBuf, avifBuf, width: meta.width, height: meta.height, resized: needResize };
}

/* ---------------------------- main loop ------------------------------- */

/**
 * Группирует файлы в public/img/ по basename.
 * Для каждого basename выбираем «источник» — jpg/png в приоритете
 * (лучшее качество), иначе webp.
 */
async function collectGroups() {
  const entries = await readDirSafe(IMG_DIR);
  const groups = new Map();

  for (const ent of entries) {
    if (!ent.isFile()) continue;
    const ext = path.extname(ent.name).toLowerCase();
    if (!SOURCE_EXTS.has(ext)) continue;

    const base = path.basename(ent.name, ext);
    if (!groups.has(base)) groups.set(base, {});
    const g = groups.get(base);

    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
      g.raw = ent.name;
      g.rawExt = ext;
    } else if (ext === '.webp') {
      g.webp = ent.name;
    }
  }

  return groups;
}

async function processOne(base, group, manifest, stats) {
  const sourceFile = group.raw || group.webp;
  if (!sourceFile) return;

  const srcPath = path.join(IMG_DIR, sourceFile);
  const webpPath = path.join(IMG_DIR, `${base}.webp`);
  const avifPath = path.join(IMG_DIR, `${base}.avif`);

  const webpExistsBefore = !!group.webp;
  const avifExistsBefore = await fs
    .access(avifPath)
    .then(() => true)
    .catch(() => false);

  // Идемпотентность: сверяем хеши уже существующих webp/avif на диске
  // с манифестом. Если оба совпали и настройки те же — пропускаем.
  let currentWebpHash = null;
  let currentAvifHash = null;
  let currentWebpSize = 0;
  let currentAvifSize = 0;
  if (webpExistsBefore) {
    const buf = await fs.readFile(webpPath);
    currentWebpHash = sha1File(buf);
    currentWebpSize = buf.length;
  }
  if (avifExistsBefore) {
    const buf = await fs.readFile(avifPath);
    currentAvifHash = sha1File(buf);
    currentAvifSize = buf.length;
  }

  const mEntry = manifest[base] || {};

  if (
    !FORCE &&
    webpExistsBefore &&
    avifExistsBefore &&
    currentWebpHash === mEntry.webpHash &&
    currentAvifHash === mEntry.avifHash &&
    mEntry.qualityWebp === QUALITY_WEBP &&
    mEntry.qualityAvif === QUALITY_AVIF &&
    mEntry.maxWidth === MAX_WIDTH
  ) {
    manifest[base] = mEntry;
    stats.skipped++;
    return;
  }

  // Bootstrap: не перекодируем, просто фиксируем текущие файлы в манифесте.
  // Полезно после первого массового прогона или если манифест потерялся.
  if (BOOTSTRAP && webpExistsBefore && avifExistsBefore) {
    manifest[base] = {
      webpHash: currentWebpHash,
      avifHash: currentAvifHash,
      qualityWebp: QUALITY_WEBP,
      qualityAvif: QUALITY_AVIF,
      maxWidth: MAX_WIDTH,
      webpSize: currentWebpSize,
      avifSize: currentAvifSize,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    stats.bootstrapped = (stats.bootstrapped || 0) + 1;
    return;
  }

  let srcBuf;
  try {
    srcBuf = await fs.readFile(srcPath);
  } catch (err) {
    console.error(`  ✗ ${base}: не удалось прочитать источник — ${err.message}`);
    stats.errors++;
    return;
  }

  // Для учёта "было/стало" берём текущие размеры webp/avif на диске
  // (а не размер источника — если источник и есть webp, он уже учтён).
  stats.bytesBefore += currentWebpSize + currentAvifSize;
  if (!webpExistsBefore && group.raw) stats.bytesBefore += srcBuf.length;

  let out;
  try {
    out = await encodeBoth(srcBuf);
  } catch (err) {
    console.error(`  ✗ ${base}: кодирование не удалось — ${err.message}`);
    stats.errors++;
    return;
  }

  const webpResult = await writeIfSmaller(webpPath, out.webpBuf);
  const avifResult = await writeIfSmaller(avifPath, out.avifBuf);

  stats.bytesAfter += webpResult.size + avifResult.size;
  if (webpResult.wrote) stats.webpWritten++;
  if (avifResult.wrote) stats.avifWritten++;
  if (DRY_RUN) {
    if (webpResult.action.startsWith('would-')) stats.webpWritten++;
    if (avifResult.action.startsWith('would-')) stats.avifWritten++;
  }

  const tag = DRY_RUN ? '»' : '✓';
  const note = out.resized ? ` (resized → ${MAX_WIDTH}px)` : '';
  console.log(
    `  ${tag} ${base.padEnd(34)} webp ${fmtBytes(webpResult.size).padStart(8)}  avif ${fmtBytes(avifResult.size).padStart(8)}${note}`
  );

  // Хеши сохраняем от того, что реально лежит на диске после операции.
  // Если writeIfSmaller оставил старый файл, сохраняем хеш старого.
  const finalWebpHash = webpResult.wrote ? sha1File(out.webpBuf) : currentWebpHash;
  const finalAvifHash = avifResult.wrote ? sha1File(out.avifBuf) : currentAvifHash;

  manifest[base] = {
    webpHash: finalWebpHash,
    avifHash: finalAvifHash,
    qualityWebp: QUALITY_WEBP,
    qualityAvif: QUALITY_AVIF,
    maxWidth: MAX_WIDTH,
    webpSize: webpResult.size,
    avifSize: avifResult.size,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

async function runPool(items, worker, concurrency) {
  const queue = items.slice();
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const it = queue.shift();
      await worker(it);
    }
  });
  await Promise.all(workers);
}

async function main() {
  console.log('🖼  Сжатие картинок в public/img/');
  console.log(
    `   WebP q=${QUALITY_WEBP}, AVIF q=${QUALITY_AVIF}, max width=${MAX_WIDTH}px, effort=${EFFORT}`
  );
  if (DRY_RUN) console.log('   [DRY RUN]   ничего не пишем, только показываем.');
  if (FORCE) console.log('   [FORCE]     игнорируем manifest, пережимаем всё.');
  if (BOOTSTRAP) console.log('   [BOOTSTRAP] не перекодируем, только фиксируем текущие файлы в manifest.');
  console.log('');

  const manifest = FORCE ? {} : await loadManifest();
  const groups = await collectGroups();

  if (groups.size === 0) {
    console.log('В public/img/ нет подходящих картинок.');
    return;
  }

  const stats = {
    total: groups.size,
    skipped: 0,
    webpWritten: 0,
    avifWritten: 0,
    errors: 0,
    bytesBefore: 0,
    bytesAfter: 0,
  };

  const items = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  await runPool(items, ([base, group]) => processOne(base, group, manifest, stats), CONCURRENCY);

  await saveManifest(manifest);

  const saved = stats.bytesBefore - stats.bytesAfter;
  const pct = stats.bytesBefore > 0 ? ((saved / stats.bytesBefore) * 100).toFixed(1) : '0.0';

  console.log('');
  console.log('─'.repeat(70));
  console.log(`Всего файлов:                   ${stats.total}`);
  console.log(`Пропущено (уже обработано):     ${stats.skipped}`);
  if (stats.bootstrapped) console.log(`Занесено в manifest (bootstrap): ${stats.bootstrapped}`);
  console.log(`WebP записано/обновлено:        ${stats.webpWritten}`);
  console.log(`AVIF записано/обновлено:        ${stats.avifWritten}`);
  if (stats.errors) console.log(`Ошибок:                         ${stats.errors}`);
  if (stats.webpWritten + stats.avifWritten > 0) {
    console.log(`Было (исходники обработанных):  ${fmtBytes(stats.bytesBefore)}`);
    console.log(`Стало (webp + avif):            ${fmtBytes(stats.bytesAfter)}`);
    console.log(`Экономия:                       ${fmtBytes(saved)} (${pct}%)`);
  }
  if (DRY_RUN) console.log('\n(это был dry-run, на диск ничего не писали)');
}

main().catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
