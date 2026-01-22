/**
 * Vite плагин для вставки шаблонов header и footer в HTML файлы
 * Поддерживает подсветку активной страницы в меню
 */
import { readFileSync } from 'fs';
import { resolve, basename } from 'path';

// Маппинг файлов на ключи для подсветки
const pageMap = {
  'index.html': { main: null, service: null },
  'about.html': { main: 'about', service: null },
  'specialists.html': { main: 'specialists', service: null },
  'equipment.html': { main: 'equipment', service: null },
  'promo.html': { main: 'promo', service: null },
  'reviews.html': { main: 'reviews', service: null },
  'certificates.html': { main: 'certificates', service: null },
  'laser.html': { main: null, service: 'laser' },
  'removal.html': { main: null, service: 'removal' },
  'hardware.html': { main: null, service: 'hardware' },
  'inject.html': { main: null, service: 'inject' },
  'aesthetic.html': { main: null, service: 'aesthetic' },
  'body.html': { main: null, service: 'body' },
};

function renderHeader(currentPage) {
  const headerPath = resolve(__dirname, 'templates/header.html');
  let header = readFileSync(headerPath, 'utf-8');
  
  const pageInfo = pageMap[currentPage] || { main: null, service: null };
  
  // Подсветка в верхнем меню (десктоп)
  const mainMenuItems = [
    { key: 'about', href: 'about.html', text: 'О клинике' },
    { key: 'specialists', href: 'specialists.html', text: 'Врачи' },
    { key: 'equipment', href: 'equipment.html', text: 'Оборудование' },
    { key: 'promo', href: 'promo.html', text: 'Акции' },
    { key: 'reviews', href: 'reviews.html', text: 'Отзывы' },
    { key: 'certificates', href: 'certificates.html', text: 'Сертификаты' },
  ];
  
  // Десктопное верхнее меню
  let mainMenuHtml = mainMenuItems.map(item => {
    const isActive = pageInfo.main === item.key;
    const activeClass = isActive 
      ? 'text-brand-turquoise cursor-default' 
      : 'hover:text-brand-tiffany';
    const ariaCurrent = isActive ? ' aria-current="page"' : '';
    return `<a href="${item.href}" class="font-medium ${activeClass} transition whitespace-nowrap"${ariaCurrent}>${item.text}</a>`;
  }).join('\n                ');
  
  header = header.replace('<!-- MAIN_MENU_PLACEHOLDER -->', mainMenuHtml);
  
  // Подсветка в меню услуг (второй уровень)
  const serviceMenuItems = [
    { key: 'laser', href: 'laser.html', text: 'Лазерная<br>эпиляция', width: 'xl:w-24' },
    { key: 'removal', href: 'removal.html', text: 'Удаление<br>новообразований', width: 'xl:w-36' },
    { key: 'hardware', href: 'hardware.html', text: 'Аппаратная<br>косметология', width: 'xl:w-28' },
    { key: 'inject', href: 'inject.html', text: 'Инъекционная<br>косметология', width: 'xl:w-32' },
    { key: 'aesthetic', href: 'aesthetic.html', text: 'Эстетическая<br>косметология', width: 'xl:w-32' },
    { key: 'body', href: 'body.html', text: 'Коррекция<br>фигуры', width: 'xl:w-24' },
  ];
  
  let serviceMenuHtml = serviceMenuItems.map(item => {
    const isActive = pageInfo.service === item.key;
    const activeClass = isActive 
      ? 'text-brand-turquoise cursor-default' 
      : 'hover:text-brand-turquoise';
    return `<a href="${item.href}" class="nav-service-link lg:w-auto ${item.width} lg:px-1 xl:px-0 ${activeClass} transition duration-200">${item.text}</a>`;
  }).join('\n                ');
  
  header = header.replace('<!-- SERVICE_MENU_PLACEHOLDER -->', serviceMenuHtml);
  
  // Мобильное верхнее меню
  let mobileMainMenuHtml = mainMenuItems.map(item => {
    const isActive = pageInfo.main === item.key;
    const activeClass = isActive ? 'text-brand-turquoise font-bold' : '';
    return `<a href="${item.href}" class="pl-2 ${activeClass} hover:text-brand-turquoise">${item.text}</a>`;
  }).join('\n                ');
  
  header = header.replace('<!-- MOBILE_MAIN_MENU_PLACEHOLDER -->', mobileMainMenuHtml);
  
  // Мобильное меню услуг
  const mobileServiceMenuItems = [
    { key: 'laser', href: 'laser.html', text: 'Лазерная эпиляция' },
    { key: 'removal', href: 'removal.html', text: 'Удаление новообразований' },
    { key: 'hardware', href: 'hardware.html', text: 'Аппаратная косметология' },
    { key: 'inject', href: 'inject.html', text: 'Инъекционная косметология' },
    { key: 'aesthetic', href: 'aesthetic.html', text: 'Эстетическая косметология' },
    { key: 'body', href: 'body.html', text: 'Коррекция фигуры' },
  ];
  
  let mobileServiceMenuHtml = mobileServiceMenuItems.map(item => {
    const isActive = pageInfo.service === item.key;
    const activeClass = isActive ? 'text-brand-turquoise font-bold' : '';
    return `<a href="${item.href}" class="pl-2 text-sm flex items-center ${activeClass}"><i class="fas fa-chevron-right text-brand-turquoise text-xs mr-2" aria-hidden="true"></i>${item.text}</a>`;
  }).join('\n                ');
  
  header = header.replace('<!-- MOBILE_SERVICE_MENU_PLACEHOLDER -->', mobileServiceMenuHtml);
  
  return header;
}

export function htmlTemplatePlugin() {
  return {
    name: 'html-template',
    enforce: 'post', // Выполняется после стандартной обработки Vite, чтобы не мешать обработке путей
    transformIndexHtml(html, context) {
      const footerPath = resolve(__dirname, 'templates/footer.html');
      
      // Определяем текущую страницу
      const filename = context.filename ? basename(context.filename) : 'index.html';
      const currentPage = filename;
      
      try {
        const header = renderHeader(currentPage);
        const footer = readFileSync(footerPath, 'utf-8');
        
        // Заменяем плейсхолдеры
        html = html.replace('<!-- HEADER_PLACEHOLDER -->', header);
        html = html.replace('<!-- FOOTER_PLACEHOLDER -->', footer);
      } catch (error) {
        console.warn('HTML Template Plugin: Could not read templates', error.message);
      }
      
      return html;
    }
  };
}
