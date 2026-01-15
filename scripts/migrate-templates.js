/**
 * Скрипт для автоматической миграции HTML файлов на использование шаблонов
 * Заменяет header и footer на плейсхолдеры
 * 
 * Использование: node scripts/migrate-templates.js
 */

const fs = require('fs');
const path = require('path');

const htmlFiles = [
  'index.html',
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

htmlFiles.forEach(filename => {
  const filePath = path.join(__dirname, '..', filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Файл ${filename} не найден, пропускаем`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Проверяем, не мигрирован ли уже файл
  if (content.includes('<!-- HEADER_PLACEHOLDER -->') && content.includes('<!-- FOOTER_PLACEHOLDER -->')) {
    console.log(`✓ ${filename} уже мигрирован`);
    return;
  }
  
  // Ищем начало header (прелоадер или header)
  const headerStartPatterns = [
    /<!-- === ПРЕЛОАДЕР === -->/,
    /<!-- === ШАПКА === -->/,
    /<!-- === ШАПКА САЙТА === -->/,
    /<div id="preloader"/,
    /<header class="bg-white shadow-md/,
  ];
  
  // Ищем конец header (перед main или перед первым section)
  const headerEndPatterns = [
    /<\/header>/,
    /<main>/,
    /<!-- === [0-9]\./,
  ];
  
  // Ищем footer
  const footerPatterns = [
    /<footer id="contacts"/,
    /<!-- === [0-9]+\. ПОДВАЛ === -->/,
    /<footer class="bg-gray-50/,
  ];
  
  // Простая замена: если есть HEADER_PLACEHOLDER, пропускаем
  if (!content.includes('<!-- HEADER_PLACEHOLDER -->')) {
    // Пытаемся найти и заменить header
    // Это сложно автоматизировать из-за разных структур, поэтому просто добавляем инструкцию
    console.log(`⚠️  ${filename} требует ручной миграции header`);
  }
  
  // Простая замена footer
  if (!content.includes('<!-- FOOTER_PLACEHOLDER -->')) {
    // Ищем footer и заменяем его
    const footerMatch = content.match(/(<footer[^>]*>[\s\S]*?<\/footer>[\s\S]*?<script[^>]*src="\/src\/main\.js"[^>]*><\/script>)/);
    if (footerMatch) {
      content = content.replace(footerMatch[0], '    <!-- FOOTER_PLACEHOLDER -->');
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ ${filename} обновлен`);
  } else {
    console.log(`⚠️  ${filename} требует ручной проверки`);
  }
});

console.log('\n✅ Миграция завершена!');
console.log('⚠️  Некоторые файлы могут требовать ручной доработки.');
