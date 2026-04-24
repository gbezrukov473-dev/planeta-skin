/**
 * Critical CSS Generator для главной страницы
 * Использует Critters (Google) для inline critical CSS
 * 
 * Этот скрипт:
 * 1. Анализирует dist/index.html и находит используемый CSS
 * 2. Вставляет critical CSS inline в <head>
 * 3. Делает основной CSS неблокирующим через preload
 * 
 * Запуск: npm run critical (после npm run build)
 */

import Critters from 'critters';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');

// У нас везде base='/', прямое соответствие dist/ и URL-префикса.
const BASE = '/';

async function main() {
  console.log('🚀 Critical CSS Generator (Critters)\n');
  
  // Проверяем, что dist существует
  if (!fs.existsSync(INDEX_HTML)) {
    console.error('❌ dist/index.html не найден. Сначала запустите: npm run build');
    process.exit(1);
  }
  
  console.log('1️⃣  Чтение dist/index.html...');
  let html = fs.readFileSync(INDEX_HTML, 'utf-8');
  console.log(`   ✅ Прочитано: ${(html.length / 1024).toFixed(2)} KB\n`);
  
  console.log('2️⃣  Генерация critical CSS с Critters...');
  
  try {
    // Инициализируем Critters с нужными опциями
    const critters = new Critters({
      // Путь к статическим файлам
      path: DIST_DIR,
      // Префикс ассетов в HTML ('/' для reg.ru, '/<repo>/' для GH Pages)
      publicPath: BASE,
      // Инлайнить critical CSS
      inlineThreshold: 0,
      // Минифицировать инлайнованный CSS
      minimumExternalSize: 0,
      // Стратегия: media="print" → onload → media="all"
      preload: 'media',
      // Не удалять оригинальный CSS (noscript fallback)
      noscriptFallback: true,
      // Включить все @font-face
      inlineFonts: true,
      // Не сжимать встроенный CSS (для читаемости при отладке)
      compress: true,
      // Дополнительные селекторы для включения
      additionalStylesheets: [],
      // Логирование
      logger: {
        info: (msg) => console.log(`   ℹ️  ${msg}`),
        warn: (msg) => console.log(`   ⚠️  ${msg}`),
        error: (msg) => console.log(`   ❌ ${msg}`)
      },
      // Ключевой параметр: pruneSource отключен чтобы сохранить весь CSS
      pruneSource: false,
      // Селекторы которые всегда включать (выше first fold)
      reduceInlineStyles: true,
      // Форсируем включение важных селекторов для first screen
      keyframes: 'critical',
      fonts: true
    });
    
    // Обрабатываем HTML
    const processedHtml = await critters.process(html);
    
    console.log('   ✅ Critical CSS сгенерирован\n');
    
    // Проверяем что critical CSS был добавлен
    if (!processedHtml.includes('<style>') && !processedHtml.includes('<style ')) {
      console.log('   ⚠️  Critters не добавил inline стили, возможно CSS уже оптимален\n');
    }
    
    // Добавляем id="critical-css" к первому инлайн стилю для идентификации
    let finalHtml = processedHtml;
    if (!finalHtml.includes('id="critical-css"')) {
      // Находим первый <style> без id и добавляем id
      finalHtml = finalHtml.replace(/<style>/, '<style id="critical-css">');
    }
    
    // Исправляем noscript fallback - убираем media="print" и onload из noscript
    finalHtml = finalHtml.replace(
      /<noscript><link\s+rel="stylesheet"\s+([^>]*)media="print"\s+onload="[^"]*"([^>]*)><\/noscript>/gi,
      (match, before, after) => {
        return `<noscript><link rel="stylesheet" ${before}${after}></noscript>`;
      }
    );
    
    console.log('3️⃣  Сохранение результата...');
    fs.writeFileSync(INDEX_HTML, finalHtml);
    
    const savedSize = (finalHtml.length / 1024).toFixed(2);
    console.log(`   ✅ Сохранен dist/index.html (${savedSize} KB)\n`);
    
    // Проверяем результат
    console.log('4️⃣  Проверка результата...');
    
    const hasCriticalCss = finalHtml.includes('<style');
    const hasPreload = finalHtml.includes('rel="preload"') || finalHtml.includes('media="print"');
    const hasNoscript = finalHtml.includes('<noscript>');
    
    console.log(`   ${hasCriticalCss ? '✅' : '❌'} Critical CSS inline`);
    console.log(`   ${hasPreload ? '✅' : '❌'} CSS preload/media trick`);
    console.log(`   ${hasNoscript ? '✅' : '❌'} Noscript fallback\n`);
    
    // Считаем размер inline CSS
    const styleMatches = finalHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleMatches) {
      let totalInlineSize = 0;
      styleMatches.forEach(style => {
        totalInlineSize += style.length;
      });
      console.log(`   📊 Inline CSS размер: ${(totalInlineSize / 1024).toFixed(2)} KB`);
      
      if (totalInlineSize > 14 * 1024) {
        console.log(`   ⚠️  Рекомендуется < 14KB для optimal FCP\n`);
      } else {
        console.log(`   ✅ Размер в пределах нормы\n`);
      }
    }
    
    console.log('═══════════════════════════════════════════');
    console.log('✅ Critical CSS успешно внедрен!');
    console.log('');
    console.log('Проверка:');
    console.log('  npm run preview');
    console.log('  Откройте http://localhost:4173');
    console.log('  DevTools → Lighthouse → Performance');
    console.log('═══════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
