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

// Для GitHub Pages (project site): base = /repo-name/
const base = process.env.GITHUB_REPOSITORY
  ? '/' + process.env.GITHUB_REPOSITORY.split('/')[1] + '/'
  : '/';

function cleanUrlPlugin() {
  return {
    name: 'clean-url-rewrite',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0];
        if (url !== '/' && !url.includes('.') && !url.endsWith('.html')) {
          const clean = url.endsWith('/') ? url.slice(0, -1) : url;
          const htmlPath = resolve(__dirname, clean.slice(1) + '.html');
          if (fs.existsSync(htmlPath)) {
            req.url = clean + '.html';
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    cleanUrlPlugin(),
    htmlTemplatePlugin(),
  ],
  build: {
    rollupOptions: {
      input: getHtmlEntries(), // Автоматически подставляет все найденные HTML файлы
    },
    cssCodeSplit: true, // Разделение CSS для лучшего кеширования
    minify: 'esbuild', // Минификация JS (быстрее чем terser, встроен в Vite)
    // Оптимизация chunk размеров
    chunkSizeWarningLimit: 1000,
  },
  // Убираем console.log и debugger в production
  esbuild: {
    drop: ['console', 'debugger'],
  },
  // Оптимизация зависимостей
  optimizeDeps: {
    include: [], // Зависимости для предварительной оптимизации
  },
});