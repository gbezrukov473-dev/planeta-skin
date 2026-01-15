import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import { htmlTemplatePlugin } from './vite-plugin-html-template.js';

// Функция для автоматического поиска всех HTML файлов в папке
function getHtmlEntries() {
  const pages = {};
  const files = fs.readdirSync(__dirname);
  
  files.forEach(file => {
    if (file.endsWith('.html')) {
      const name = file.replace('.html', '');
      pages[name] = resolve(__dirname, file);
    }
  });
  
  return pages;
}

export default defineConfig({
  plugins: [
    htmlTemplatePlugin(), // Плагин для вставки header/footer
  ],
  build: {
    rollupOptions: {
      input: getHtmlEntries(), // Автоматически подставляет все найденные HTML файлы
    },
    cssCodeSplit: true, // Разделение CSS для лучшего кеширования
    minify: 'esbuild', // Минификация JS (быстрее чем terser, встроен в Vite)
    // esbuild автоматически удаляет console.log в production
    // Оптимизация chunk размеров
    chunkSizeWarningLimit: 1000,
  },
  // Оптимизация зависимостей
  optimizeDeps: {
    include: [], // Зависимости для предварительной оптимизации
  },
});