/**
 * Скрипт для автоматической миграции всех HTML файлов на использование шаблонов
 * Заменяет header и footer на плейсхолдеры
 * 
 * Использование: node scripts/migrate-all-html.js
 */

const fs = require('fs');
const path = require('path');

const htmlFiles = [
  'about.html',
  'specialists.html',
  'equipment.html',
  'promo.html',
  'reviews.html',
  'certificates.html',
  'laser.html',
  'removal.html',
  'hardware.html',
  'inject.html',
  'aesthetic.html',
  'body.html',
  'thanks.html',
  'policy.html',
];

function migrateFile(filename) {
  const filePath = path.join(__dirname, '..', filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Файл ${filename} не найден, пропускаем`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Проверяем, не мигрирован ли уже файл
  if (content.includes('<!-- HEADER_PLACEHOLDER -->') && content.includes('<!-- FOOTER_PLACEHOLDER -->')) {
    console.log(`✓ ${filename} уже мигрирован`);
    return true;
  }
  
  // Ищем и заменяем header (от прелоадера до </header>)
  // Паттерн: начинается с комментария прелоадера или header, заканчивается </header>
  const headerPattern = /(<!--\s*===?\s*(ПРЕЛОАДЕР|ШАПКА|ШАПКА САЙТА)\s*===?\s*-->[\s\S]*?<\/header>)/i;
  const headerMatch = content.match(headerPattern);
  
  if (headerMatch && !content.includes('<!-- HEADER_PLACEHOLDER -->')) {
    // Заменяем header на плейсхолдер
    const indent = headerMatch[1].match(/^(\s*)/)?.[1] || '  ';
    content = content.replace(headerPattern, `${indent}<!-- HEADER_PLACEHOLDER -->`);
    modified = true;
    console.log(`✓ ${filename}: header заменен`);
  }
  
  // Ищем и заменяем footer (от <footer до </script>)
  const footerPattern = /(<footer[^>]*>[\s\S]*?<\/footer>[\s\S]*?<script[^>]*src=["']\/src\/main\.js["'][^>]*><\/script>)/i;
  const footerMatch = content.match(footerPattern);
  
  if (footerMatch && !content.includes('<!-- FOOTER_PLACEHOLDER -->')) {
    // Заменяем footer на плейсхолдер
    const indent = footerMatch[1].match(/^(\s*)/)?.[1] || '  ';
    content = content.replace(footerPattern, `${indent}<!-- FOOTER_PLACEHOLDER -->`);
    modified = true;
    console.log(`✓ ${filename}: footer заменен`);
  }
  
  // Также ищем лайтбокс отдельно, если он есть после footer
  if (content.includes('<!-- Лайтбокс -->') && !content.includes('<!-- FOOTER_PLACEHOLDER -->')) {
    const lightboxPattern = /(<!--\s*Лайтбокс\s*-->[\s\S]*?<\/div>\s*<script[^>]*src=["']\/src\/main\.js["'][^>]*><\/script>)/i;
    const lightboxMatch = content.match(lightboxPattern);
    if (lightboxMatch) {
      const indent = lightboxMatch[1].match(/^(\s*)/)?.[1] || '  ';
      content = content.replace(lightboxPattern, `${indent}<!-- FOOTER_PLACEHOLDER -->`);
      modified = true;
      console.log(`✓ ${filename}: footer с лайтбоксом заменен`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${filename} успешно мигрирован\n`);
    return true;
  } else {
    console.log(`⚠️  ${filename} требует ручной проверки\n`);
    return false;
  }
}

console.log('🚀 Начинаем миграцию HTML файлов...\n');

let successCount = 0;
let skipCount = 0;
let failCount = 0;

htmlFiles.forEach(filename => {
  const result = migrateFile(filename);
  if (result === true) successCount++;
  else if (result === false) failCount++;
  else skipCount++;
});

console.log('\n📊 Итоги миграции:');
console.log(`✅ Успешно: ${successCount}`);
console.log(`⏭️  Пропущено: ${skipCount}`);
console.log(`⚠️  Требуют внимания: ${failCount}`);
console.log('\n✨ Миграция завершена!');
