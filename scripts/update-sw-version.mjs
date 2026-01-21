/**
 * Скрипт для автоматического обновления версии Service Worker
 * Запускается перед билдом: npm run build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swPath = path.join(__dirname, '..', 'public', 'sw.js');

// Генерируем версию в формате ГГГГММДД
const now = new Date();
const version = now.toISOString().slice(0, 10).replace(/-/g, '');

// Читаем файл
let content = fs.readFileSync(swPath, 'utf-8');

// Заменяем BUILD_DATE
content = content.replace(
  /const BUILD_DATE = '\d+';/,
  `const BUILD_DATE = '${version}';`
);

// Записываем обратно
fs.writeFileSync(swPath, content, 'utf-8');

console.log(`[update-sw-version] Updated SW version to: pzk-sw-v${version}`);
