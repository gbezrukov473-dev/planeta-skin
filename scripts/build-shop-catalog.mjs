/**
 * Генерирует send-form/catalog.php из src/data/products.js.
 *
 * Раньше серверный каталог поддерживался руками и расходился с фронтовым
 * (позиции, которых нет в catalog.php, молча выкидываются из заказа).
 * Теперь источник правды один — products.js. После любого изменения цен
 * или состава каталога запускать:
 *
 *   npm run shop:catalog
 *
 * и заливать обновлённый send-form/catalog.php на прод вместе с остальным.
 *
 * Варианты с hidden: true в PHP-каталог не попадают — их нельзя заказать.
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PRODUCTS, CATEGORIES } from '../src/data/products.js';

const OUT = fileURLToPath(new URL('../send-form/catalog.php', import.meta.url));

// --check: ничего не пишем, только сверяем существующий catalog.php с тем,
// что получилось бы из products.js. Используется в prebuild — сборка падает,
// если каталог забыли перегенерировать, вместо того чтобы молча уехать в прод
// с ценами, расходящимися с витриной.
const CHECK_ONLY = process.argv.includes('--check');

const categoryTitles = new Map(CATEGORIES.map((c) => [c.id, c.title]));

/** Экранирование для одинарных кавычек PHP: \ -> \\, ' -> \' */
function phpStr(value) {
  return "'" + String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

const seen = new Set();
const lines = [];
let currentCategory = null;
let count = 0;

for (const product of PRODUCTS) {
  for (const variant of product.variants) {
    if (variant.hidden) continue;

    if (!variant.id || seen.has(variant.id)) {
      console.error(`ОШИБКА: пустой или неуникальный variant.id: ${variant.id} (${product.name})`);
      process.exit(1);
    }
    seen.add(variant.id);

    if (!Number.isInteger(variant.price) || variant.price <= 0) {
      console.error(`ОШИБКА: некорректная цена у ${variant.id}: ${variant.price}`);
      process.exit(1);
    }

    if (product.category !== currentCategory) {
      currentCategory = product.category;
      const title = categoryTitles.get(currentCategory) || currentCategory;
      if (lines.length) lines.push('');
      lines.push(`        // ===== ${title} =====`);
    }

    lines.push(`        ${phpStr(variant.id)} => [`);
    lines.push(`            'name' => ${phpStr(product.name)},`);
    lines.push(
      `            'size' => ${phpStr(variant.size)}, 'price' => ${variant.price}, ` +
      `'line' => ${phpStr(product.line || '')}, 'code' => ${phpStr(variant.code || '')},`
    );
    lines.push('        ],');
    count++;
  }
}

const php = `<?php
declare(strict_types=1);

/**
 * АВТОГЕНЕРИРОВАННЫЙ ФАЙЛ — НЕ РЕДАКТИРОВАТЬ РУКАМИ.
 *
 * Источник правды: src/data/products.js.
 * Регенерация: npm run shop:catalog (scripts/build-shop-catalog.mjs).
 *
 * Серверное зеркало каталога интернет-магазина. Используется в
 * send-form/index.php при обработке заказа:
 *  - проверяем, что все variantId из корзины клиента существуют;
 *  - пересчитываем сумму по серверной цене (клиенту не доверяем);
 *  - собираем список позиций в email администратору.
 *
 * Ключ — variant.id (PRODUCTS[].variants[].id). Варианты с hidden: true
 * сюда не попадают и заказать их нельзя.
 */

/** @return array<string, array{name:string,size:string,price:int,line:string,code:string}> */
function shop_catalog(): array {
    return [
${lines.join('\n')}
    ];
}
`;

// Переводы строк нормализуем: после клонирования с core.autocrlf=true файл
// в рабочей копии может лежать с CRLF, а генератор всегда пишет LF.
const normalize = (s) => s.replace(/\r\n/g, '\n');

if (CHECK_ONLY) {
  if (!existsSync(OUT)) {
    console.error('ОШИБКА: send-form/catalog.php отсутствует. Выполните: npm run shop:catalog');
    process.exit(1);
  }

  if (normalize(readFileSync(OUT, 'utf8')) !== normalize(php)) {
    console.error(
      'ОШИБКА: send-form/catalog.php разошёлся с src/data/products.js.\n' +
      '        Серверные цены не совпадут с витриной — заказы уйдут с неверной суммой.\n' +
      '        Выполните: npm run shop:catalog — и залейте catalog.php на прод.'
    );
    process.exit(1);
  }

  console.log(`OK: send-form/catalog.php соответствует products.js, позиций: ${count}`);
} else {
  writeFileSync(OUT, php, 'utf8');
  console.log(`OK: send-form/catalog.php сгенерирован, позиций: ${count}`);
}
