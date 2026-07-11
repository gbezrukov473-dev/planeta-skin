/**
 * Скрипт для добавления/обновления Open Graph и Twitter Card мета-тегов
 * 
 * Запуск: node scripts/inject-social-meta.mjs
 * 
 * Функции:
 * - Добавляет og:* и twitter:* теги в <head>
 * - Идемпотентный: повторный запуск не дублирует теги
 * - Использует существующие title и description
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// Конфигурация
const SITE_URL = 'https://hs-planet.ru';
const SITE_NAME = 'Планета здоровой кожи';
// JPEG, а не WebP: часть мессенджеров (WhatsApp, iMessage) не показывает
// WebP в превью ссылок. 1200×630, ~60 КБ — укладывается в лимиты краулеров.
const DEFAULT_OG_IMAGE = '/img/og/og-default.jpg';
const OG_IMAGE_WIDTH = '1200';
const OG_IMAGE_HEIGHT = '630';

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
  'policy.html',
  'thanks.html'
];

/**
 * Извлекает содержимое тега из HTML
 */
function extractTagContent(html, tagRegex) {
  const match = html.match(tagRegex);
  return match ? match[1] : null;
}

/**
 * Извлекает title страницы
 */
function extractTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].trim() : SITE_NAME;
}

/**
 * Извлекает description страницы
 */
function extractDescription(html) {
  const match = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  if (match) return match[1];
  
  // Попробуем другой порядок атрибутов
  const match2 = html.match(/<meta\s+content="([^"]+)"\s+name="description"/i);
  return match2 ? match2[1] : `${SITE_NAME} — клиника косметологии в Кудрово`;
}

/**
 * Извлекает canonical URL
 */
function extractCanonical(html) {
  const match = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return match ? match[1] : null;
}

/**
 * Извлекает существующий og:image
 */
function extractOgImage(html) {
  const match = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  return match ? match[1] : null;
}

/**
 * Генерирует URL страницы
 */
function getPageUrl(filename) {
  if (filename === 'index.html') {
    return SITE_URL + '/';
  }
  return `${SITE_URL}/${filename}`;
}

/**
 * Удаляет существующие OG/Twitter теги
 */
function removeExistingTags(html) {
  // Удаляем существующие og: теги
  html = html.replace(/<meta\s+property="og:[^"]+"\s+content="[^"]*"\s*\/?>\s*\n?/gi, '');
  // Удаляем существующие twitter: теги  
  html = html.replace(/<meta\s+name="twitter:[^"]+"\s+content="[^"]*"\s*\/?>\s*\n?/gi, '');
  // Удаляем существующие og:image:width и og:image:height
  html = html.replace(/<meta\s+property="og:image:(width|height)"\s+content="[^"]*"\s*\/?>\s*\n?/gi, '');
  
  return html;
}

/**
 * Генерирует мета-теги для страницы
 */
function generateMetaTags(title, description, pageUrl, ogImage) {
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`;
  
  return `
    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta property="og:locale" content="ru_RU">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:image" content="${fullOgImage}">
    <meta property="og:image:width" content="${OG_IMAGE_WIDTH}">
    <meta property="og:image:height" content="${OG_IMAGE_HEIGHT}">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${fullOgImage}">
`;
}

/**
 * Обрабатывает один HTML файл
 */
function processHtmlFile(filename) {
  const filepath = path.join(ROOT_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`  ⚠️  Файл не найден: ${filename}`);
    return false;
  }
  
  let html = fs.readFileSync(filepath, 'utf-8');
  
  // Извлекаем данные
  const title = extractTitle(html);
  const description = extractDescription(html);
  const pageUrl = getPageUrl(filename);
  
  // Проверяем, есть ли уже og:image и используем его, иначе дефолт
  let ogImage = extractOgImage(html);
  if (!ogImage || ogImage.includes('example.com')) {
    ogImage = DEFAULT_OG_IMAGE;
  } else if (!ogImage.startsWith('http')) {
    // Если относительный путь, оставляем его
    ogImage = ogImage.replace(SITE_URL, '');
  }
  
  // Проверяем/добавляем canonical
  const existingCanonical = extractCanonical(html);
  if (!existingCanonical) {
    // Добавляем canonical перед </head>
    html = html.replace('</head>', `    <link rel="canonical" href="${pageUrl}">\n</head>`);
  }
  
  // Удаляем существующие OG/Twitter теги
  html = removeExistingTags(html);
  
  // Генерируем новые мета-теги
  const metaTags = generateMetaTags(title, description, pageUrl, ogImage);
  
  // Вставляем перед </head>
  html = html.replace('</head>', `${metaTags}</head>`);
  
  // Сохраняем файл
  fs.writeFileSync(filepath, html);
  
  console.log(`  ✅ ${filename}`);
  console.log(`      Title: ${title.substring(0, 50)}...`);
  console.log(`      Image: ${ogImage}`);
  
  return true;
}

/**
 * Главная функция
 */
function main() {
  console.log('🚀 Inject Social Meta Tags\n');
  console.log(`Site URL: ${SITE_URL}`);
  console.log(`Default OG Image: ${DEFAULT_OG_IMAGE}\n`);
  
  let processed = 0;
  let failed = 0;
  
  for (const filename of HTML_FILES) {
    if (processHtmlFile(filename)) {
      processed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n════════════════════════════════════════');
  console.log(`✅ Обработано: ${processed} файлов`);
  if (failed > 0) {
    console.log(`⚠️  Пропущено: ${failed} файлов`);
  }
  console.log('════════════════════════════════════════\n');
}

main();
