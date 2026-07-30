/**
 * Vite плагин для вставки шаблонов header и footer в HTML файлы
 * Поддерживает подсветку активной страницы в меню
 */
import { readFileSync } from 'fs';
import { resolve, basename } from 'path';

// Маппинг файлов на ключи для подсветки + параметры лид-формы
//   menuMain     — какой пункт верхнего меню подсветить
//   menuService  — какой пункт меню услуг подсветить
//   formId       — значение data-form-id и hidden form_id (отличает заявки в логах)
//   formService  — текст услуги, который попадает в письмо/лог; пустая строка = не указано
//   formIdSuffix — суффикс для DOM id (lead-form-laser, lead-phone-laser …);
//                  выводится из имени файла, у index — пусто (исторически).
export const pageMap = {
  'index.html':        { menuMain: null,           menuService: null,        formId: 'lead_main',         formService: '',                            formIdSuffix: '' },
  'about.html':        { menuMain: 'about',        menuService: null,        formId: 'lead_about',        formService: '',                            formIdSuffix: '-about' },
  'specialists.html':  { menuMain: 'specialists',  menuService: null,        formId: 'lead_specialists',  formService: '',                            formIdSuffix: '-specialists' },
  'equipment.html':    { menuMain: 'equipment',    menuService: null,        formId: 'lead_equipment',    formService: '',                            formIdSuffix: '-equipment' },
  'promo.html':        { menuMain: 'promo',        menuService: null,        formId: 'lead_promo',        formService: '',                            formIdSuffix: '-promo' },
  'reviews.html':      { menuMain: 'reviews',      menuService: null,        formId: 'lead_reviews',      formService: '',                            formIdSuffix: '-reviews' },
  'certificates.html': { menuMain: 'certificates', menuService: null,        formId: 'lead_certificates', formService: 'Подарочный сертификат',       formIdSuffix: '-certificates' },
  'laser.html':        { menuMain: null,           menuService: 'laser',     formId: 'lead_laser',        formService: 'Лазерная эпиляция Moveo',     formIdSuffix: '-laser' },
  'removal.html':      { menuMain: null,           menuService: 'removal',   formId: 'lead_removal',      formService: 'Удаление новообразований',    formIdSuffix: '-removal' },
  'hardware.html':     { menuMain: null,           menuService: 'hardware',  formId: 'lead_hardware',     formService: 'Аппаратная косметология',     formIdSuffix: '-hardware' },
  'inject.html':       { menuMain: null,           menuService: 'inject',    formId: 'lead_inject',       formService: 'Инъекционная косметология',   formIdSuffix: '-inject' },
  'aesthetic.html':    { menuMain: null,           menuService: 'aesthetic', formId: 'lead_aesthetic',    formService: 'Эстетическая косметология',   formIdSuffix: '-aesthetic' },
  'body.html':         { menuMain: null,           menuService: 'body',      formId: 'lead_body',         formService: 'Коррекция фигуры',            formIdSuffix: '-body' },
  'contacts.html':     { menuMain: 'contacts',     menuService: null,        formId: 'lead_contacts',     formService: 'Запись с страницы контактов', formIdSuffix: '-contacts' },
  'cosmetics.html':    { menuMain: 'cosmetics',    menuService: null,        formId: 'lead_cosmetics',    formService: '',                            formIdSuffix: '-cosmetics' },
  'legal.html':        { menuMain: null,           menuService: null,        formId: 'lead_legal',        formService: '',                            formIdSuffix: '-legal' },
};

function renderHeader(currentPage) {
  const headerPath = resolve(__dirname, 'templates/header.html');
  let header = readFileSync(headerPath, 'utf-8');

  const pageInfo = pageMap[currentPage] || { menuMain: null, menuService: null };

  // Подсветка в верхнем меню (десктоп)
  const mainMenuItems = [
    { key: 'about', href: '/about/', text: 'О клинике' },
    { key: 'specialists', href: '/specialists/', text: 'Врачи' },
    { key: 'equipment', href: '/equipment/', text: 'Оборудование' },
    { key: 'promo', href: '/promo/', text: 'Акции' },
    { key: 'reviews', href: '/reviews/', text: 'Отзывы' },
    { key: 'certificates', href: '/certificates/', text: 'Сертификаты' },
    { key: 'cosmetics', href: '/cosmetics/', text: 'Косметика' },
    { key: 'contacts', href: '/contacts/', text: 'Контакты' },
  ];
  
  // Десктопное верхнее меню
  let mainMenuHtml = mainMenuItems.map(item => {
    const isActive = pageInfo.menuMain === item.key;
    const activeClass = isActive 
      ? 'text-brand-turquoise cursor-default' 
      : 'hover:text-brand-tiffany';
    const ariaCurrent = isActive ? ' aria-current="page"' : '';
    return `<a href="${item.href}" class="font-medium ${activeClass} transition whitespace-nowrap"${ariaCurrent}>${item.text}</a>`;
  }).join('\n                ');
  
  header = header.replace('<!-- MAIN_MENU_PLACEHOLDER -->', mainMenuHtml);
  
  // Подсветка в меню услуг (второй уровень)
  const serviceMenuItems = [
    { key: 'laser', href: '/laser/', text: 'Лазерная<br>эпиляция', width: 'xl:w-24' },
    { key: 'removal', href: '/removal/', text: 'Удаление<br>новообразований', width: 'xl:w-36' },
    { key: 'hardware', href: '/hardware/', text: 'Аппаратная<br>косметология', width: 'xl:w-28' },
    { key: 'inject', href: '/inject/', text: 'Инъекционная<br>косметология', width: 'xl:w-32' },
    { key: 'aesthetic', href: '/aesthetic/', text: 'Эстетическая<br>косметология', width: 'xl:w-32' },
    { key: 'body', href: '/body/', text: 'Коррекция<br>фигуры', width: 'xl:w-24' },
  ];
  
  let serviceMenuHtml = serviceMenuItems.map(item => {
    const isActive = pageInfo.menuService === item.key;
    const activeClass = isActive 
      ? 'text-brand-turquoise cursor-default' 
      : 'hover:text-brand-turquoise';
    return `<a href="${item.href}" class="nav-service-link lg:w-auto ${item.width} lg:px-1 xl:px-0 ${activeClass} transition duration-200">${item.text}</a>`;
  }).join('\n                ');
  
  header = header.replace('<!-- SERVICE_MENU_PLACEHOLDER -->', serviceMenuHtml);
  
  // Мобильное верхнее меню
  let mobileMainMenuHtml = mainMenuItems.map(item => {
    const isActive = pageInfo.menuMain === item.key;
    const activeClass = isActive ? 'text-brand-turquoise font-bold' : '';
    return `<a href="${item.href}" class="pl-2 ${activeClass} hover:text-brand-turquoise">${item.text}</a>`;
  }).join('\n                ');
  
  header = header.replace('<!-- MOBILE_MAIN_MENU_PLACEHOLDER -->', mobileMainMenuHtml);
  
  // Мобильное меню услуг
  const mobileServiceMenuItems = [
    { key: 'laser', href: '/laser/', text: 'Лазерная эпиляция' },
    { key: 'removal', href: '/removal/', text: 'Удаление новообразований' },
    { key: 'hardware', href: '/hardware/', text: 'Аппаратная косметология' },
    { key: 'inject', href: '/inject/', text: 'Инъекционная косметология' },
    { key: 'aesthetic', href: '/aesthetic/', text: 'Эстетическая косметология' },
    { key: 'body', href: '/body/', text: 'Коррекция фигуры' },
  ];
  
  let mobileServiceMenuHtml = mobileServiceMenuItems.map(item => {
    const isActive = pageInfo.menuService === item.key;
    const activeClass = isActive ? 'text-brand-turquoise font-bold' : '';
    return `<a href="${item.href}" class="pl-2 text-sm flex items-center ${activeClass}"><svg class="icon text-brand-turquoise text-xs mr-2" aria-hidden="true"><use href="/img/icons.svg#i-chevron-right"></use></svg>${item.text}</a>`;
  }).join('\n                ');
  
  header = header.replace('<!-- MOBILE_SERVICE_MENU_PLACEHOLDER -->', mobileServiceMenuHtml);
  
  return header;
}

/**
 * Рендерит общую лид-форму с per-page параметрами (form_id, услуга, суффикс DOM-id).
 * Подставляется в каждую страницу на месте `<!-- LEAD_FORM_PLACEHOLDER -->`.
 */
function renderLeadForm(currentPage) {
  const formPath = resolve(__dirname, 'templates/lead-form.html');
  const tpl = readFileSync(formPath, 'utf-8');

  const info = pageMap[currentPage] || {};
  const formId = info.formId || 'lead';
  const service = info.formService ?? '';
  const idSuffix = info.formIdSuffix ?? '';

  // Экранирование на случай, если в pageMap появятся кавычки (сейчас их нет, но не повредит).
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  return tpl
    .replace(/\{\{ID_SUFFIX\}\}/g, esc(idSuffix))
    .replace(/\{\{FORM_ID\}\}/g, esc(formId))
    .replace(/\{\{SERVICE\}\}/g, esc(service));
}

export function htmlTemplatePlugin() {
  return {
    name: 'html-template',
    transformIndexHtml: {
      order: 'pre', // Выполняется ДО обработки Vite, чтобы Vite мог обработать script/link теги из шаблонов
      handler(html, context) {
        const footerPath = resolve(__dirname, 'templates/footer.html');

        // Определяем текущую страницу
        const filename = context.filename ? basename(context.filename) : 'index.html';
        const currentPage = filename;

        try {
          const header = renderHeader(currentPage);
          const footer = readFileSync(footerPath, 'utf-8');

          // Общая часть <head> — только для страниц, которые её запросили.
          // 404.html / thanks.html / policy.html автономны и плейсхолдера не имеют.
          if (html.includes('<!-- HEAD_PLACEHOLDER -->')) {
            // Комментарии из шаблона — документация для разработчика, в прод их
            // тащить незачем: head.html состоит только из link/meta.
            const head = readFileSync(resolve(__dirname, 'templates/head.html'), 'utf-8')
              .replace(/<!--[\s\S]*?-->\s*/g, '')
              .trim();
            html = html.replace('<!-- HEAD_PLACEHOLDER -->', head);
          }

          // Заменяем плейсхолдеры
          html = html.replace('<!-- HEADER_PLACEHOLDER -->', header);
          html = html.replace('<!-- FOOTER_PLACEHOLDER -->', footer);

          // Лид-форма — подставляем только если страница её запросила
          if (html.includes('<!-- LEAD_FORM_PLACEHOLDER -->')) {
            const form = renderLeadForm(currentPage);
            html = html.replace('<!-- LEAD_FORM_PLACEHOLDER -->', form);
          }
        } catch (error) {
          console.warn('HTML Template Plugin: Could not read templates', error.message);
        }

        return html;
      }
    }
  };
}
