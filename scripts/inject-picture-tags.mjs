/**
 * Скрипт замены <img> на <picture> с AVIF/WebP источниками
 * 
 * Находит все <img> с src="/img/..." и оборачивает в <picture>
 * с fallback на AVIF и WebP форматы
 * 
 * Запуск: npm run images:picture
 */

import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';

// Директории для поиска HTML
const HTML_PATTERNS = [
  '*.html',
  'templates/*.html'
];

/**
 * Проверяет, находится ли img внутри picture
 */
function isInsidePicture(html, imgIndex) {
  const beforeImg = html.slice(0, imgIndex);
  const lastPictureOpen = beforeImg.lastIndexOf('<picture');
  const lastPictureClose = beforeImg.lastIndexOf('</picture>');
  return lastPictureOpen > lastPictureClose;
}

/**
 * Генерирует путь к AVIF/WebP версии
 */
function getAlternativePath(srcPath, newExt) {
  const parsed = path.parse(srcPath);
  return `${parsed.dir}/${parsed.name}.${newExt}`;
}

/**
 * Проверяет существование файла в public
 */
function fileExists(imgPath) {
  const normalizedPath = imgPath.startsWith('/') ? imgPath.slice(1) : imgPath;
  const fullPath = path.join('public', normalizedPath);
  return fs.existsSync(fullPath);
}

/**
 * Извлекает путь к изображению из img тега
 * Проверяет src и data-src
 */
function extractImagePath(imgTag) {
  // Сначала ищем data-src (для lazy loading)
  const dataSrcMatch = imgTag.match(/\sdata-src=["']([^"']+)["']/);
  if (dataSrcMatch && dataSrcMatch[1].match(/^\/?img\//)) {
    return dataSrcMatch[1];
  }
  
  // Затем ищем src
  const srcMatch = imgTag.match(/\ssrc=["']([^"']+)["']/);
  if (srcMatch) {
    return srcMatch[1];
  }
  
  return null;
}

/**
 * Проверяет, подходит ли img для обработки
 */
function shouldProcess(imgTag, imagePath) {
  // Пропускаем если нет пути
  if (!imagePath) return false;
  
  // Пропускаем SVG
  if (imagePath.endsWith('.svg')) return false;
  
  // Пропускаем data: URI (placeholder)
  if (imagePath.startsWith('data:')) return false;
  
  // Пропускаем если путь не начинается с /img/ или img/
  if (!imagePath.match(/^\/?img\//)) return false;
  
  // Пропускаем если расширение не подходит
  if (!imagePath.match(/\.(jpg|jpeg|png|webp)$/i)) return false;
  
  return true;
}

/**
 * Обрабатывает один HTML файл
 */
function processHtmlFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  let replacements = 0;
  const examples = [];

  // Находим все <img ...> теги с помощью более надёжной регулярки
  const imgRegex = /<img\s[^>]*>/gi;
  
  // Собираем все совпадения
  const matches = [];
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    matches.push({
      fullMatch: match[0],
      index: match.index
    });
  }

  // Обрабатываем в обратном порядке
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    
    // Пропускаем если уже внутри <picture>
    if (isInsidePicture(html, m.index)) {
      continue;
    }

    // Извлекаем путь к изображению
    const imagePath = extractImagePath(m.fullMatch);
    
    // Проверяем, нужно ли обрабатывать
    if (!shouldProcess(m.fullMatch, imagePath)) {
      continue;
    }

    // Нормализуем путь
    const normalizedPath = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
    
    // Генерируем путь к AVIF
    const avifPath = getAlternativePath(normalizedPath, 'avif');
    
    // Проверяем существование AVIF
    if (!fileExists(avifPath)) {
      continue;
    }

    // Формируем новый <picture>
    let pictureHtml = '<picture>';
    
    // AVIF source
    pictureHtml += `<source srcset="${avifPath}" type="image/avif">`;
    
    // Исходный img как fallback (оставляем как есть!)
    pictureHtml += m.fullMatch;
    pictureHtml += '</picture>';

    // Заменяем
    html = html.slice(0, m.index) + pictureHtml + html.slice(m.index + m.fullMatch.length);
    modified = true;
    replacements++;

    // Сохраняем примеры
    if (examples.length < 3) {
      examples.push({
        file: path.basename(filePath),
        src: normalizedPath
      });
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, html, 'utf-8');
  }

  return { replacements, examples };
}

async function main() {
  console.log('🖼️  Замена <img> на <picture> с AVIF...\n');

  // Находим все HTML файлы
  const htmlFiles = await fg(HTML_PATTERNS);
  
  if (htmlFiles.length === 0) {
    console.log('   HTML файлы не найдены.');
    return;
  }

  console.log(`   Найдено HTML файлов: ${htmlFiles.length}\n`);

  let totalReplacements = 0;
  const allExamples = [];

  for (const file of htmlFiles) {
    const result = processHtmlFile(file);
    
    if (result.replacements > 0) {
      console.log(`   ✅ ${file}: ${result.replacements} замен`);
      totalReplacements += result.replacements;
      allExamples.push(...result.examples);
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`\n📊 Итог:`);
  console.log(`   Всего замен <img> → <picture>: ${totalReplacements}`);
  
  if (allExamples.length > 0) {
    console.log(`\n📝 Примеры замен (первые ${Math.min(10, allExamples.length)}):`);
    allExamples.slice(0, 10).forEach((ex, i) => {
      console.log(`   ${i + 1}. ${ex.file}: ${ex.src}`);
    });
  }

  console.log('');
}

main().catch(console.error);
