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

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PRODUCTS, CATEGORIES } from '../src/data/products.js';

const OUT = fileURLToPath(new URL('../send-form/catalog.php', import.meta.url));

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

writeFileSync(OUT, php, 'utf8');
console.log(`OK: send-form/catalog.php сгенерирован, позиций: ${count}`);
