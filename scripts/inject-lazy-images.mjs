/**
 * Скрипт для добавления lazy loading к изображениям
 * 
 * Запуск: node scripts/inject-lazy-images.mjs
 * 
 * Правила:
 * - НЕ трогаем изображения в header (логотипы)
 * - НЕ трогаем hero-изображения первого экрана
 * - НЕ трогаем SVG иконки
 * - НЕ трогаем изображения с aria-hidden="true" (декоративные в первом экране)
 * - Переводим остальные контентные изображения на lazy load
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// Прозрачный 1x1 пиксель GIF
const PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

// HTML файлы для обработки
const HTML_FILES = [
  'index.html',
  'laser.html',
  'hardware.html',
  'removal.html',
  'inject.html',
  'aesthetic.html',
  'body.html',
  'specialists.html',
  'equipment.html',
  'about.html',
  'reviews.html',
  'promo.html',
  'certificates.html',
  'legal.html',
  'policy.html'
];

// Паттерны для НЕ-lazy изображений (hero/first screen)
const SKIP_PATTERNS = [
  // SVG иконки и спрайты
  /icons\.svg/i,
  /\.svg$/i,
  // Логотипы
  /logo\.svg/i,
  /logo\.png/i,
  /max-logo\.svg/i,
  // Favicon
  /favicon/i
];

// Секции, где НЕ применяем lazy (первый экран)
const SKIP_SECTIONS = [
  'header',
  'preloader',
  '#preloader'
];

/**
 * Проверяет, нужно ли пропустить изображение
 */
function shouldSkipImage(imgTag, context) {
  // Пропускаем SVG и иконки
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(imgTag)) {
      return true;
    }
  }
  
  // Пропускаем если уже есть data-src (уже обработано)
  if (imgTag.includes('data-src=')) {
    return true;
  }
  
  // Пропускаем изображения с aria-hidden (декоративные в hero)
  if (imgTag.includes('aria-hidden="true"')) {
    return true;
  }
  
  return false;
}

/**
 * Определяет, находится ли изображение в hero-секции
 */
function isInHeroSection(html, imgPosition) {
  // Ищем первую секцию после header
  const headerEnd = html.indexOf('</header>');
  if (headerEnd === -1) return false;
  
  // Ищем конец hero-секции (обычно первая </section> после header)
  const afterHeader = html.substring(headerEnd);
  const firstSectionEnd = afterHeader.indexOf('</section>');
  
  if (firstSectionEnd === -1) return false;
  
  const heroEnd = headerEnd + firstSectionEnd + '</section>'.length;
  
  // Если изображение до конца hero — пропускаем
  return imgPosition < heroEnd;
}

/**
 * Преобразует img тег в lazy-версию
 */
function convertToLazy(imgTag) {
  let newTag = imgTag;
  
  // Извлекаем src
  const srcMatch = imgTag.match(/src="([^"]+)"/);
  if (!srcMatch) return imgTag;
  
  const originalSrc = srcMatch[1];
  
  // Пропускаем data: URLs
  if (originalSrc.startsWith('data:')) return imgTag;
  
  // Заменяем src на placeholder и добавляем data-src
  newTag = newTag.replace(/src="([^"]+)"/, `src="${PLACEHOLDER}" data-src="${originalSrc}"`);
  
  // Обрабатываем srcset если есть
  const srcsetMatch = imgTag.match(/srcset="([^"]+)"/);
  if (srcsetMatch) {
    newTag = newTag.replace(/srcset="([^"]+)"/, `data-srcset="${srcsetMatch[1]}"`);
  }
  
  // Обрабатываем sizes если есть
  const sizesMatch = imgTag.match(/sizes="([^"]+)"/);
  if (sizesMatch && srcsetMatch) {
    newTag = newTag.replace(/sizes="([^"]+)"/, `data-sizes="${sizesMatch[1]}"`);
  }
  
  // Добавляем класс lazy-img (сохраняя существующие классы)
  if (newTag.includes('class="')) {
    newTag = newTag.replace(/class="([^"]*)"/, 'class="$1 lazy-img"');
  } else {
    newTag = newTag.replace('<img ', '<img class="lazy-img" ');
  }
  
  // Добавляем loading="lazy" если нет
  if (!newTag.includes('loading=')) {
    newTag = newTag.replace('<img ', '<img loading="lazy" ');
  }
  
  // Добавляем decoding="async" если нет
  if (!newTag.includes('decoding=')) {
    newTag = newTag.replace('<img ', '<img decoding="async" ');
  }
  
  return newTag;
}

/**
 * Обрабатывает один HTML файл
 */
function processHtmlFile(filename) {
  const filepath = path.join(ROOT_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`  ⚠️  Файл не найден: ${filename}`);
    return { processed: 0, skipped: 0 };
  }
  
  let html = fs.readFileSync(filepath, 'utf-8');
  let processed = 0;
  let skipped = 0;
  
  // Находим все img теги
  const imgRegex = /<img[^>]+>/gi;
  let match;
  const replacements = [];
  
  while ((match = imgRegex.exec(html)) !== null) {
    const imgTag = match[0];
    const imgPosition = match.index;
    
    // Проверяем, нужно ли пропустить
    if (shouldSkipImage(imgTag, html)) {
      skipped++;
      continue;
    }
    
    // Проверяем, в hero ли изображение
    if (isInHeroSection(html, imgPosition)) {
      skipped++;
      continue;
    }
    
    // Преобразуем в lazy
    const newTag = convertToLazy(imgTag);
    
    if (newTag !== imgTag) {
      replacements.push({ original: imgTag, replacement: newTag });
      processed++;
    }
  }
  
  // Применяем замены
  for (const { original, replacement } of replacements) {
    html = html.replace(original, replacement);
  }
  
  // Сохраняем файл
  fs.writeFileSync(filepath, html);
  
  return { processed, skipped };
}

/**
 * Главная функция
 */
function main() {
  console.log('🚀 Inject Lazy Images\n');
  
  let totalProcessed = 0;
  let totalSkipped = 0;
  
  for (const filename of HTML_FILES) {
    const { processed, skipped } = processHtmlFile(filename);
    console.log(`  ${filename}: ${processed} lazy, ${skipped} skipped`);
    totalProcessed += processed;
    totalSkipped += skipped;
  }
  
  console.log('\n════════════════════════════════════════');
  console.log(`✅ Обработано: ${totalProcessed} изображений`);
  console.log(`⏭️  Пропущено: ${totalSkipped} изображений`);
  console.log('════════════════════════════════════════\n');
}

main();
