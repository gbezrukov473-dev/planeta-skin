/**
 * Скрипт для генерации SVG-спрайта из официальных иконок Font Awesome 6.4.0.
 *
 * Запускается РЕДКО — только когда нужно добавить новые иконки в спрайт.
 * Сам спрайт (public/img/icons.svg) закоммичен в репозиторий.
 *
 * Запуск:
 *   npm install @fortawesome/fontawesome-free --no-save
 *   npm run icons
 *   (после этого node_modules/@fortawesome можно удалить)
 *
 * Пакет не держим в devDependencies, потому что он весит ~30 МБ, а нужен
 * 2–3 раза в год. Кастомные иконки (i-subway, i-car) дописаны руками в
 * public/img/icons.svg и скриптом не управляются.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Пути к SVG Font Awesome
const FA_BASE = path.join(rootDir, 'node_modules/@fortawesome/fontawesome-free/svgs');
const OUTPUT_FILE = path.join(rootDir, 'public/img/icons.svg');

// Полный список иконок для включения в спрайт
// FA 6 использует новые названия файлов (алиасы к старым именам)
const ICONS = {
  // === SOLID ===
  'i-arrow-left':       { folder: 'solid', file: 'arrow-left.svg' },
  'i-arrow-right':      { folder: 'solid', file: 'arrow-right.svg' },
  'i-arrow-up':         { folder: 'solid', file: 'arrow-up.svg' },
  'i-bars':             { folder: 'solid', file: 'bars.svg' },
  'i-bolt':             { folder: 'solid', file: 'bolt.svg' },
  'i-calendar-alt':     { folder: 'solid', file: 'calendar-days.svg' },     // fa-calendar-alt -> calendar-days
  'i-calendar-check':   { folder: 'solid', file: 'calendar-check.svg' },
  'i-check':            { folder: 'solid', file: 'check.svg' },
  'i-check-circle':     { folder: 'solid', file: 'circle-check.svg' },      // fa-check-circle -> circle-check
  'i-check-double':     { folder: 'solid', file: 'check-double.svg' },
  'i-chevron-down':     { folder: 'solid', file: 'chevron-down.svg' },
  'i-chevron-left':     { folder: 'solid', file: 'chevron-left.svg' },
  'i-chevron-right':    { folder: 'solid', file: 'chevron-right.svg' },
  'i-clock':            { folder: 'solid', file: 'clock.svg' },
  'i-credit-card':      { folder: 'solid', file: 'credit-card.svg' },
  'i-crosshairs':       { folder: 'solid', file: 'crosshairs.svg' },
  'i-exchange-alt':     { folder: 'solid', file: 'right-left.svg' },        // fa-exchange-alt -> right-left
  'i-feather-alt':      { folder: 'solid', file: 'feather-pointed.svg' },   // fa-feather-alt -> feather-pointed
  'i-file-medical':     { folder: 'solid', file: 'file-medical.svg' },
  'i-fire':             { folder: 'solid', file: 'fire.svg' },
  'i-gift':             { folder: 'solid', file: 'gift.svg' },
  'i-hand-sparkles':    { folder: 'solid', file: 'hand-sparkles.svg' },
  'i-heart':            { folder: 'solid', file: 'heart.svg' },
  'i-image':            { folder: 'solid', file: 'image.svg' },
  'i-infinity':         { folder: 'solid', file: 'infinity.svg' },
  'i-key':              { folder: 'solid', file: 'key.svg' },
  'i-layer-group':      { folder: 'solid', file: 'layer-group.svg' },
  'i-leaf':             { folder: 'solid', file: 'leaf.svg' },
  'i-magic':            { folder: 'solid', file: 'wand-magic-sparkles.svg' }, // fa-magic -> wand-magic-sparkles
  'i-male':             { folder: 'solid', file: 'person.svg' },            // fa-male -> person
  'i-map-marked-alt':   { folder: 'solid', file: 'map-location-dot.svg' },  // fa-map-marked-alt -> map-location-dot
  'i-map-marker-alt':   { folder: 'solid', file: 'location-dot.svg' },      // fa-map-marker-alt -> location-dot
  'i-medal':            { folder: 'solid', file: 'medal.svg' },
  'i-microchip':        { folder: 'solid', file: 'microchip.svg' },
  'i-microscope':       { folder: 'solid', file: 'microscope.svg' },
  'i-parking':          { folder: 'solid', file: 'square-parking.svg' },    // fa-parking -> square-parking
  'i-phone-alt':        { folder: 'solid', file: 'phone.svg' },             // fa-phone-alt -> phone
  'i-plus':             { folder: 'solid', file: 'plus.svg' },
  'i-quote-right':      { folder: 'solid', file: 'quote-right.svg' },
  'i-running':          { folder: 'solid', file: 'person-running.svg' },    // fa-running -> person-running
  'i-search-plus':      { folder: 'solid', file: 'magnifying-glass-plus.svg' }, // fa-search-plus -> magnifying-glass-plus
  'i-shield-alt':       { folder: 'solid', file: 'shield-halved.svg' },     // fa-shield-alt -> shield-halved
  'i-shopping-bag':     { folder: 'solid', file: 'bag-shopping.svg' },      // fa-shopping-bag -> bag-shopping
  'i-shopping-cart':    { folder: 'solid', file: 'cart-shopping.svg' },     // fa-shopping-cart -> cart-shopping
  'i-smile':            { folder: 'solid', file: 'face-smile.svg' },        // fa-smile -> face-smile
  'i-snowflake':        { folder: 'solid', file: 'snowflake.svg' },
  'i-star':             { folder: 'solid', file: 'star.svg' },
  'i-sun':              { folder: 'solid', file: 'sun.svg' },
  'i-times':            { folder: 'solid', file: 'xmark.svg' },             // fa-times -> xmark
  'i-tshirt':           { folder: 'solid', file: 'shirt.svg' },             // fa-tshirt -> shirt
  'i-user-md':          { folder: 'solid', file: 'user-doctor.svg' },       // fa-user-md -> user-doctor
  'i-walking':          { folder: 'solid', file: 'person-walking.svg' },    // fa-walking -> person-walking
  'i-wave-square':      { folder: 'solid', file: 'wave-square.svg' },

  // === REGULAR (outline) ===
  'i-clock-outline':    { folder: 'regular', file: 'clock.svg' },

  // === BRANDS ===
  'i-instagram':        { folder: 'brands', file: 'instagram.svg' },
  'i-vk':               { folder: 'brands', file: 'vk.svg' },
  'i-yandex':           { folder: 'brands', file: 'yandex.svg' },
};

/**
 * Читает SVG файл и извлекает viewBox и содержимое
 */
function parseSvgFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Извлекаем viewBox
  const viewBoxMatch = content.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 512 512';
  
  // Извлекаем содержимое внутри <svg>...</svg>
  const innerMatch = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  let inner = innerMatch ? innerMatch[1].trim() : '';
  
  // Удаляем комментарии
  inner = inner.replace(/<!--[\s\S]*?-->/g, '');
  
  // Удаляем xmlns из вложенных элементов
  inner = inner.replace(/\s*xmlns="[^"]*"/g, '');
  
  // Заменяем fill="..." на fill="currentColor" (кроме fill="none")
  // Сначала удаляем все fill атрибуты (кроме none)
  inner = inner.replace(/\s+fill="(?!none)[^"]*"/gi, '');
  
  // Добавляем fill="currentColor" ко всем path элементам
  inner = inner.replace(/<path(?!\s+fill)/g, '<path fill="currentColor"');
  
  return { viewBox, inner };
}

/**
 * Генерирует SVG-спрайт
 */
function buildSprite() {
  console.log('🔧 Генерация SVG-спрайта из @fortawesome/fontawesome-free@6.4.0...\n');
  
  // Проверяем наличие пакета
  if (!fs.existsSync(FA_BASE)) {
    console.error('❌ Пакет @fortawesome/fontawesome-free не найден!');
    console.error('   Выполните: npm install');
    process.exit(1);
  }
  
  const symbols = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (const [id, config] of Object.entries(ICONS)) {
    const filePath = path.join(FA_BASE, config.folder, config.file);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Не найден: ${config.folder}/${config.file} (для ${id})`);
      errorCount++;
      continue;
    }
    
    try {
      const { viewBox, inner } = parseSvgFile(filePath);
      symbols.push(`  <symbol id="${id}" viewBox="${viewBox}">\n    ${inner}\n  </symbol>`);
      console.log(`✅ ${id} <- ${config.folder}/${config.file}`);
      successCount++;
    } catch (err) {
      console.error(`❌ Ошибка: ${config.folder}/${config.file}: ${err.message}`);
      errorCount++;
    }
  }
  
  // Собираем итоговый SVG
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join('\n\n')}\n</svg>\n`;
  
  // Записываем в файл
  fs.writeFileSync(OUTPUT_FILE, sprite, 'utf-8');
  
  console.log(`\n✨ Готово!`);
  console.log(`   Успешно: ${successCount} иконок`);
  if (errorCount > 0) {
    console.log(`   Ошибки: ${errorCount}`);
  }
  console.log(`   Файл: ${OUTPUT_FILE}`);
  console.log(`   Размер: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB`);
}

// Запуск
buildSprite();
