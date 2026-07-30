/**
 * Проверка согласованности HTML-страниц и pageMap (vite-plugin-html-template.js).
 *
 * Зачем: плагин подставляет лид-форму даже для страницы, которой нет в pageMap, —
 * молча, с fallback-значениями (form_id: 'lead', пустой суффикс DOM-id, пустая
 * услуга). Внешне всё работает, но заявка приходит без привязки к странице,
 * а при нескольких формах на сайте совпадают id элементов. Раньше это ловилось
 * только глазами; теперь сборка падает.
 *
 * Запускается в prebuild. Отдельно: npm run check:pages
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { pageMap } from '../vite-plugin-html-template.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Служебная страница, в прод-сборку не попадает (см. getHtmlEntries в vite.config.js)
const IGNORED = new Set(['icons-preview.html']);

const errors = [];
const warnings = [];

const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html') && !IGNORED.has(f));

for (const page of pages) {
  const html = readFileSync(resolve(ROOT, page), 'utf8');
  const registered = Object.prototype.hasOwnProperty.call(pageMap, page);

  if (html.includes('<!-- LEAD_FORM_PLACEHOLDER -->') && !registered) {
    errors.push(
      `${page}: есть LEAD_FORM_PLACEHOLDER, но страницы нет в pageMap — ` +
      `форма получит form_id 'lead' и пустой суффикс DOM-id`
    );
  }

  if (html.includes('<!-- HEADER_PLACEHOLDER -->') && !registered) {
    errors.push(`${page}: есть HEADER_PLACEHOLDER, но страницы нет в pageMap — пункт меню не подсветится`);
  }

  // Общий <head> (фавиконки, манифест, preload шрифтов) — templates/head.html.
  // Не ошибка: страница может быть автономной, как 404/thanks/policy.
  if (registered && !html.includes('<!-- HEAD_PLACEHOLDER -->')) {
    warnings.push(`${page}: нет HEAD_PLACEHOLDER — фавиконки и preload шрифтов на странице не появятся`);
  }
}

// Записи pageMap, для которых больше нет файла
for (const page of Object.keys(pageMap)) {
  if (!pages.includes(page)) {
    warnings.push(`pageMap содержит ${page}, но такого файла в корне нет`);
  }
}

// Коллизии, из-за которых заявки склеятся в аналитике или поедут DOM-id
const seenFormId = new Map();
const seenSuffix = new Map();

for (const [page, info] of Object.entries(pageMap)) {
  if (info.formId) {
    if (seenFormId.has(info.formId)) {
      errors.push(`form_id '${info.formId}' задан дважды: ${seenFormId.get(info.formId)} и ${page}`);
    }
    seenFormId.set(info.formId, page);
  }

  const suffix = info.formIdSuffix ?? '';
  if (seenSuffix.has(suffix)) {
    errors.push(`formIdSuffix '${suffix}' задан дважды: ${seenSuffix.get(suffix)} и ${page} — совпадут id элементов формы`);
  }
  seenSuffix.set(suffix, page);
}

for (const w of warnings) console.warn(`ПРЕДУПРЕЖДЕНИЕ: ${w}`);

if (errors.length) {
  console.error('ОШИБКА: страницы и pageMap рассогласованы.');
  for (const e of errors) console.error(`        ${e}`);
  console.error('        Поправьте pageMap в vite-plugin-html-template.js.');
  process.exit(1);
}

console.log(`OK: ${pages.length} страниц согласованы с pageMap (записей в pageMap: ${Object.keys(pageMap).length})`);
