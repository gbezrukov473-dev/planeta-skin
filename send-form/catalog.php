<?php
declare(strict_types=1);

/**
 * Серверное зеркало каталога интернет-магазина.
 *
 * Используется в send-form/index.php при обработке заказа:
 *  - проверяем, что все id из корзины клиента существуют;
 *  - пересчитываем сумму по серверной цене (клиенту не доверяем);
 *  - собираем красивый список позиций в email администратору.
 *
 * ВАЖНО: при изменениях синхронизировать с src/data/products.js.
 */

/** @return array<string, array{name:string,size:string,price:int,line:string}> */
function shop_catalog(): array {
    return [
        // Очищение
        'mic-calendula' => [
            'name'  => 'Мицеллярная вода Pro You Calendula pH Balance',
            'size'  => '300 мл',
            'price' => 9600,
            'line'  => 'Basic',
        ],
        'enzyme-powder' => [
            'name'  => 'Энзимная пудра для умывания Pro You Enzyme Powder Cleanser',
            'size'  => '70 г',
            'price' => 9770,
            'line'  => 'Basic',
        ],
        'foam-lemon' => [
            'name'  => 'Очищающая крем-пенка Pro You Lemon Fresh Foam Cleanser',
            'size'  => '120 г',
            'price' => 8900,
            'line'  => 'Basic',
        ],

        // Тоники
        'toner-wrinkle' => [
            'name'  => 'Тонер Pro You Wrinkle Peptide',
            'size'  => '130 мл',
            'price' => 9700,
            'line'  => 'Wrinkle Peptide',
        ],
        'toner-aroma-ac' => [
            'name'  => 'Тонер Pro You Aroma AC',
            'size'  => '130 мл',
            'price' => 8400,
            'line'  => 'Aroma AC',
        ],

        // Сыворотки
        'serum-wrinkle' => [
            'name'  => 'Сыворотка Pro You Wrinkle Peptide Serum',
            'size'  => '50 мл',
            'price' => 13100,
            'line'  => 'Wrinkle Peptide',
        ],
        'serum-whitening' => [
            'name'  => 'Сыворотка Pro You Whitening Serum',
            'size'  => '50 мл',
            'price' => 13100,
            'line'  => 'Whitening',
        ],
        'fluid-vitc' => [
            'name'  => 'Флюид Pro You Vitamin C Fluid 15%',
            'size'  => '30 мл',
            'price' => 13100,
            'line'  => 'Vitamin C',
        ],

        // Кремы
        'cream-retinol' => [
            'name'  => 'Крем Pro You Retinol Cream',
            'size'  => '40 г',
            'price' => 9800,
            'line'  => 'Retinol',
        ],
        'cream-wrinkle' => [
            'name'  => 'Крем Pro You Wrinkle Peptide Cream',
            'size'  => '60 г',
            'price' => 13200,
            'line'  => 'Wrinkle Peptide',
        ],
        'cream-hydration' => [
            'name'  => 'Крем Pro You Hydration Cream',
            'size'  => '60 г',
            'price' => 11800,
            'line'  => 'Hydration',
        ],
        'cream-spf50' => [
            'name'  => 'Крем Pro You SPF 50 Vita White Sun Protection PA+++',
            'size'  => '50 г',
            'price' => 9100,
            'line'  => 'Vita White',
        ],

        // Для глаз
        'patch-black-pearl' => [
            'name'  => 'Гидрогелевые патчи Pro You Premium Black Pearl Eye Patch',
            'size'  => '60 шт',
            'price' => 5000,
            'line'  => 'Eye Care',
        ],
        'eye-cream-wrinkle' => [
            'name'  => 'Крем для кожи вокруг глаз Pro You Wrinkle Peptide Eye Cream',
            'size'  => '30 г',
            'price' => 13200,
            'line'  => 'Wrinkle Peptide',
        ],

        // Маски
        'mask-phyto-collagen' => [
            'name'  => 'Кремовая маска Pro You Phyto Collagen Mask',
            'size'  => '150 г',
            'price' => 9600,
            'line'  => 'Phyto Collagen',
        ],
        'mask-sheet-placenta' => [
            'name'  => 'Набор тканевых масок Pro You Bio Placenta Bright',
            'size'  => '25 мл × 10 шт',
            'price' => 9900,
            'line'  => 'Bio Placenta',
        ],

        // Наборы
        'set-mini-wrinkle' => [
            'name'  => 'Набор мини-версий Pro You Wrinkle Peptide',
            'size'  => '8 мл + 5 мл + 8 мл + 6 г',
            'price' => 2100,
            'line'  => 'Wrinkle Peptide',
        ],
        'set-metacos' => [
            'name'  => 'Подарочный набор Pro You Metacos Platinum Wrinkle Peptide',
            'size'  => '130 + 50 + 130 + 50 + 30 мл/г',
            'price' => 57800,
            'line'  => 'Metacos Platinum',
        ],
    ];
}
