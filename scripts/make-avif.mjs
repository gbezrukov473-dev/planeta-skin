/**
 * Скрипт генерации AVIF изображений
 * 
 * Находит все JPG/PNG/WebP в public/img и создаёт рядом .avif версии
 * Запуск: npm run images:avif
 */

import sharp from 'sharp';
import fg from 'fast-glob';
import path from 'path';
import fs from 'fs';

// Настройки AVIF
const AVIF_OPTIONS = {
  quality: 45,
  effort: 4,
  chromaSubsampling: '4:2:0'
};

// Директория с изображениями
const IMG_DIR = 'public/img';

// Паттерн для поиска изображений
const GLOB_PATTERN = `${IMG_DIR}/**/*.{jpg,jpeg,png,webp}`;

async function makeAvif() {
  console.log('🖼️  Генерация AVIF изображений...\n');
  console.log(`   Настройки: quality=${AVIF_OPTIONS.quality}, effort=${AVIF_OPTIONS.effort}\n`);

  // Находим все подходящие изображения
  const files = await fg(GLOB_PATTERN, {
    ignore: ['**/*.avif'], // Игнорируем уже существующие AVIF
    caseSensitiveMatch: false
  });

  if (files.length === 0) {
    console.log('   Изображения не найдены.');
    return;
  }

  console.log(`   Найдено изображений: ${files.length}\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;
  const createdFiles = [];

  for (const file of files) {
    const parsed = path.parse(file);
    const avifPath = path.join(parsed.dir, `${parsed.name}.avif`);

    // Пропускаем, если AVIF уже существует
    if (fs.existsSync(avifPath)) {
      skipped++;
      continue;
    }

    try {
      await sharp(file)
        .avif(AVIF_OPTIONS)
        .toFile(avifPath);

      created++;
      createdFiles.push(avifPath);

      // Получаем размеры файлов для сравнения
      const originalSize = fs.statSync(file).size;
      const avifSize = fs.statSync(avifPath).size;
      const savings = ((1 - avifSize / originalSize) * 100).toFixed(1);

      console.log(`   ✅ ${path.relative(IMG_DIR, avifPath)} (${savings}% меньше)`);
    } catch (err) {
      errors++;
      console.error(`   ❌ Ошибка: ${file} - ${err.message}`);
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`\n📊 Итог:`);
  console.log(`   Создано: ${created}`);
  console.log(`   Пропущено (уже существуют): ${skipped}`);
  if (errors > 0) {
    console.log(`   Ошибок: ${errors}`);
  }
  console.log('');

  return { created, skipped, errors, createdFiles };
}

// Запуск
makeAvif().catch(console.error);
