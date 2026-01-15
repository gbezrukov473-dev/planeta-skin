/**
 * Скрипт для конвертации изображений в WebP формат
 * Требует: npm install sharp --save-dev
 * 
 * Использование: node scripts/convert-to-webp.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputDir = path.join(__dirname, '../public/img');
const outputDir = path.join(__dirname, '../public/img/webp');

// Создаем папку для WebP если её нет
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Получаем все изображения
const imageExtensions = ['.jpg', '.jpeg', '.png'];
const files = fs.readdirSync(inputDir);

files.forEach(file => {
  const ext = path.extname(file).toLowerCase();
  
  if (imageExtensions.includes(ext)) {
    const inputPath = path.join(inputDir, file);
    const outputName = path.basename(file, ext) + '.webp';
    const outputPath = path.join(outputDir, outputName);
    
    sharp(inputPath)
      .webp({ quality: 85 })
      .toFile(outputPath)
      .then(() => {
        console.log(`✓ Converted: ${file} → ${outputName}`);
      })
      .catch(err => {
        console.error(`✗ Error converting ${file}:`, err.message);
      });
  }
});

console.log('\nКонвертация завершена! WebP файлы находятся в public/img/webp/');
