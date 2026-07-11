<?php
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
        // ===== Очищение: демакияж =====
        '1-6a-eye-make-up-remover-165-ml-1-6a' => [
            'name' => 'Ремувер для снятия макияжа глаз Pro You Eye Make Up Remover',
            'size' => '165 мл', 'price' => 7383, 'line' => 'Eye Make Up', 'code' => '1-6A',
        ],
        '1-1a-coenzyme-q10-cleansing-lotion-165-ml-1-1a' => [
            'name' => 'Очищающий лосьон Pro You Coenzyme Q10 Cleansing Lotion',
            'size' => '165 мл', 'price' => 7176, 'line' => 'Coenzyme Q10', 'code' => '1-1A',
        ],
        '1-2a-vita-balance-cleansing-emulsion-165-ml-1-2a' => [
            'name' => 'Очищающая эмульсия Pro You Vita Balance Cleansing Emulsion',
            'size' => '165 мл', 'price' => 7176, 'line' => 'Vita Balance', 'code' => '1-2A',
        ],
        '1-3a-aroma-ac-cleansing-emulsion-165-ml-1-3a' => [
            'name' => 'Очищающая эмульсия Pro You Aroma AC Cleansing Emulsion',
            'size' => '165 мл', 'price' => 7176, 'line' => 'Aroma AC', 'code' => '1-3A',
        ],
        '1-4a-hydration-cleansing-emulsion-165-ml-1-4a' => [
            'name' => 'Очищающая эмульсия Pro You Hydration Cleansing Emulsion',
            'size' => '165 мл', 'price' => 7176, 'line' => 'Hydration', 'code' => '1-4A',
        ],

        // ===== Очищение: умывание =====
        '1-10a-aged-foam-cleansing-165-ml-1-10a' => [
            'name' => 'Очищающая гель-пенка Pro You Aged Foam Cleansing',
            'size' => '165 мл', 'price' => 5900, 'line' => 'Aged', 'code' => '1-10A',
        ],
        '1-11a-ac-pure-foam-cleansing-165-ml-1-11a' => [
            'name' => 'Очищающая гель-пенка Pro You AC Pure Foam Cleansing',
            'size' => '165 мл', 'price' => 5900, 'line' => 'AC Pure', 'code' => '1-11A',
        ],
        '1-12a-sensitive-atp-foam-cleansing-165-ml-1-12a' => [
            'name' => 'Очищающая гель-пенка Pro You Sensitive ATP Foam Cleansing',
            'size' => '165 мл', 'price' => 5900, 'line' => 'Sensitive ATP', 'code' => '1-12A',
        ],
        '1-14a-lemon-fresh-foam-cleanser-120-g-1-14a' => [
            'name' => 'Очищающая крем-пенка Pro You Lemon Fresh Foam Cleanser',
            'size' => '120 г', 'price' => 7728, 'line' => 'Lemon Fresh', 'code' => '1-14A',
        ],
        '29-2a-pore-fill-up-charcoal-bubble-cleanser-100-ml-29-2a' => [
            'name' => 'Очищающая кислородная пенка Pro You Pore Fill Up Charcoal Bubble Cleanser',
            'size' => '100 мл', 'price' => 6770, 'line' => 'Pore Fill Up', 'code' => '29-2A',
        ],
        '30-9a-pore-control-foam-deep-cleanser-100-ml-30-9a' => [
            'name' => 'Очищающая кислородная пенка Pro You Pore Control Foam Deep Cleanser',
            'size' => '100 мл', 'price' => 6770, 'line' => 'Pore Control', 'code' => '30-9A',
        ],

        // ===== Тонеры =====
        '2-1a-wrinkle-peptide-skin-toner-130-ml-2-1a' => [
            'name' => 'Тонер Pro You Wrinkle Peptide Skin Toner',
            'size' => '130 мл', 'price' => 8410, 'line' => 'Wrinkle Peptide', 'code' => '2-1А',
        ],
        '2-2a-whitening-skin-toner-130-ml-2-2a' => [
            'name' => 'Тонер Pro You Whitening Skin Toner',
            'size' => '130 мл', 'price' => 8410, 'line' => 'Whitening', 'code' => '2-2А',
        ],
        '2-3a-coenzyme-q10-skin-toner-130-ml-2-3a' => [
            'name' => 'Тонер Pro You Coenzyme Q10 Skin Toner',
            'size' => '130 мл', 'price' => 7300, 'line' => 'Coenzyme Q10', 'code' => '2-3А',
        ],
        '2-4a-vita-balance-skin-toner-130-ml-2-4a' => [
            'name' => 'Тонер Pro You Vita Balance Skin Toner',
            'size' => '130 мл', 'price' => 7300, 'line' => 'Vita Balance', 'code' => '2-4А',
        ],
        '2-5a-aroma-ac-skin-toner-130-ml-2-5a' => [
            'name' => 'Тонер Pro You Aroma AC Skin Toner',
            'size' => '130 мл', 'price' => 7300, 'line' => 'Aroma AC', 'code' => '2-5А',
        ],
        '2-6a-hydration-skin-toner-130-ml-2-6a' => [
            'name' => 'Тонер Pro You Hydration Skin Toner',
            'size' => '130 мл', 'price' => 7300, 'line' => 'Hydration', 'code' => '2-6А',
        ],
        '2-9a-aloe-moisture-skin-toner-130-ml-2-9a' => [
            'name' => 'Тонер Pro You Aloe Moisture Skin Toner',
            'size' => '130 мл', 'price' => 7300, 'line' => 'Aloe Moisture', 'code' => '2-9А',
        ],

        // ===== Сыворотки, флюиды, эссенции =====
        '6-1a-wrinkle-peptide-serum-50-ml-6-1a' => [
            'name' => 'Сыворотка Pro You Wrinkle Peptide Serum',
            'size' => '50 мл', 'price' => 11431, 'line' => 'Wrinkle Peptide', 'code' => '6-1А',
        ],
        '6-2a-whitening-serum-50-ml-6-2a' => [
            'name' => 'Сыворотка Pro You Whitening Serum',
            'size' => '50 мл', 'price' => 11431, 'line' => 'Whitening', 'code' => '6-2А',
        ],
        '6-3a-coenzyme-q10-essence-50-ml-6-3a' => [
            'name' => 'Эссенция Pro You Coenzyme Q10 Essence',
            'size' => '50 мл', 'price' => 10380, 'line' => 'Coenzyme Q10', 'code' => '6-3А',
        ],
        '6-4a-vita-balance-fluid-50-ml-6-4a' => [
            'name' => 'Флюид Pro You Vita Balance Fluid',
            'size' => '50 мл', 'price' => 10380, 'line' => 'Vita Balance', 'code' => '6-4А',
        ],
        '6-5a-aroma-ac-fluid-50-ml-6-5a' => [
            'name' => 'Флюид Pro You Aroma AC Fluid',
            'size' => '50 мл', 'price' => 10380, 'line' => 'Aroma AC', 'code' => '6-5А',
        ],
        '6-6a-hydration-fluid-50-ml-6-6a' => [
            'name' => 'Флюид Pro You Hydration Fluid',
            'size' => '50 мл', 'price' => 10380, 'line' => 'Hydration', 'code' => '6-6А',
        ],
        '6-7a-vita-collagen-fluid-50-ml-6-7a' => [
            'name' => 'Флюид Pro You Vita Collagen Fluid',
            'size' => '50 мл', 'price' => 10380, 'line' => 'Vita Collagen', 'code' => '6-7А',
        ],
        '6-12a-aloe-moisture-essence-50-ml-6-12a' => [
            'name' => 'Эссенция Pro You Aloe Moisture Essence',
            'size' => '50 мл', 'price' => 10380, 'line' => 'Aloe Moisture', 'code' => '6-12А',
        ],
        '6-13a-ginseng-nutrition-serum-50-ml-6-13a' => [
            'name' => 'Сыворотка Pro You Ginseng Nutrition Serum',
            'size' => '50 мл', 'price' => 10380, 'line' => 'Ginseng Nutrition', 'code' => '6-13А',
        ],
        '3-7a-soothing-vital-serum-50-ml-3-7a' => [
            'name' => 'Сыворотка Pro You Soothing Vital Serum',
            'size' => '50 мл', 'price' => 10380, 'line' => 'Soothing Vital', 'code' => '3-7А',
        ],
        '5-12a-pore-control-minimizing-serum-30-ml-5-12a' => [
            'name' => 'Сыворотка Pro You Pore Control Minimizing Serum',
            'size' => '30 мл', 'price' => 6930, 'line' => 'Pore Control', 'code' => '5-12А',
        ],
        '5-7a-vitamin-c-fluid-15-30-ml-5-7a' => [
            'name' => 'Флюид Pro You Vitamin C Fluid 15%',
            'size' => '30 мл', 'price' => 11408, 'line' => 'Vitamin C', 'code' => '5-7А',
        ],
        '5-8a-white-gold-pearl-fluid-30-ml-5-8a' => [
            'name' => 'Флюид Pro You White Gold Pearl Fluid',
            'size' => '30 мл', 'price' => 11408, 'line' => 'White Gold Pearl', 'code' => '5-8А',
        ],
        '30-1a-wrinkle-sc-renewal-essence-120-ml-30-1a' => [
            'name' => 'Эссенция Pro You Wrinkle SC Renewal Essence',
            'size' => '120 мл', 'price' => 22517, 'line' => 'Wrinkle SC', 'code' => '30-1А',
        ],

        // ===== Лосьоны =====
        '9-1a-wrinkle-peptide-lotion-130-ml-9-1a' => [
            'name' => 'Лосьон Pro You Wrinkle Peptide Lotion',
            'size' => '130 мл', 'price' => 9729, 'line' => 'Wrinkle Peptide', 'code' => '9-1А',
        ],
        '9-2a-whitening-lotion-130-ml-9-2a' => [
            'name' => 'Лосьон Pro You Whitening Lotion',
            'size' => '130 мл', 'price' => 9729, 'line' => 'Whitening', 'code' => '9-2А',
        ],
        '9-3a-coenzyme-q10-moisture-lotion-130-ml-9-3a' => [
            'name' => 'Лосьон Pro You Coenzyme Q10 Moisture Lotion',
            'size' => '130 мл', 'price' => 7498, 'line' => 'Coenzyme Q10', 'code' => '9-3А',
        ],
        '9-4a-vita-balance-moisture-lotion-130-ml-9-4a' => [
            'name' => 'Лосьон Pro You Vita Balance Moisture Lotion',
            'size' => '130 мл', 'price' => 7498, 'line' => 'Vita Balance', 'code' => '9-4А',
        ],
        '9-5a-aroma-ac-lotion-130-ml-9-5a' => [
            'name' => 'Лосьон Pro You Aroma AC Lotion',
            'size' => '130 мл', 'price' => 7498, 'line' => 'Aroma AC', 'code' => '9-5А',
        ],
        '9-6a-hydration-lotion-130-ml-9-6a' => [
            'name' => 'Лосьон Pro You Hydration Lotion',
            'size' => '130 мл', 'price' => 7498, 'line' => 'Hydration', 'code' => '9-6А',
        ],
        '9-7a-aloe-moisture-lotion-130-ml-9-7a' => [
            'name' => 'Лосьон Pro You Aloe Moisture Lotion',
            'size' => '130 мл', 'price' => 7498, 'line' => 'Aloe Moisture', 'code' => '9-7А',
        ],
        '9-8a-ginseng-nutrition-lotion-130-ml-9-8a' => [
            'name' => 'Лосьон Pro You Ginseng Nutrition Lotion',
            'size' => '130 мл', 'price' => 7498, 'line' => 'Ginseng Nutrition', 'code' => '9-8А',
        ],

        // ===== Кремы =====
        '8-11a-retinol-cream-40-g-8-11a' => [
            'name' => 'Крем Pro You Retinol Cream',
            'size' => '40 г', 'price' => 8500, 'line' => 'Retinol', 'code' => '8-11А',
        ],
        '7-1a-wrinkle-peptide-cream-60-g-7-1a' => [
            'name' => 'Крем Pro You Wrinkle Peptide Cream',
            'size' => '60 г', 'price' => 11530, 'line' => 'Wrinkle Peptide', 'code' => '7-1А',
        ],
        '7-2a-whitening-moisture-cream-60-g-7-2a' => [
            'name' => 'Крем Pro You Whitening Moisture Cream',
            'size' => '60 г', 'price' => 11530, 'line' => 'Whitening', 'code' => '7-2А',
        ],
        '7-3a-coenzyme-q10-cream-60-g-7-3a' => [
            'name' => 'Крем Pro You Coenzyme Q10 Cream',
            'size' => '60 г', 'price' => 10304, 'line' => 'Coenzyme Q10', 'code' => '7-3А',
        ],
        '7-4a-vita-balance-cream-60-g-7-4a' => [
            'name' => 'Крем Pro You Vita Balance Cream',
            'size' => '60 г', 'price' => 10304, 'line' => 'Vita Balance', 'code' => '7-4А',
        ],
        '7-5a-aroma-ac-cream-60-g-7-5a' => [
            'name' => 'Крем Pro You Aroma AC Cream',
            'size' => '60 г', 'price' => 10304, 'line' => 'Aroma AC', 'code' => '7-5А',
        ],
        '7-6a-hydration-cream-60-g-7-6a' => [
            'name' => 'Крем Pro You Hydration Cream',
            'size' => '60 г', 'price' => 10304, 'line' => 'Hydration', 'code' => '7-6А',
        ],
        '7-11a-aloe-moisture-cream-60-g-7-11a' => [
            'name' => 'Крем Pro You Aloe Moisture Cream',
            'size' => '60 г', 'price' => 10304, 'line' => 'Aloe Moisture', 'code' => '7-11А',
        ],
        '8-4a-vitamin-c-cream-60-g-8-4a' => [
            'name' => 'Крем Pro You Vitamin C Cream',
            'size' => '60 г', 'price' => 10304, 'line' => 'Vitamin C', 'code' => '8-4А',
        ],
        '7-14b-aroma-renewal-cream-250-g-7-14b' => [
            'name' => 'Крем Pro You Aroma Renewal Cream',
            'size' => '250 г', 'price' => 16813, 'line' => 'Aroma Renewal', 'code' => '7-14В',
        ],
        '30-3a-wrinkle-sc-renewal-cream-100-g-30-3a' => [
            'name' => 'Крем Pro You Wrinkle SC Renewal Cream',
            'size' => '100 г', 'price' => 18170, 'line' => 'Wrinkle SC', 'code' => '30-3А',
        ],
        '8-6a-spf-50-vita-white-sun-protection-cream-pa-50-g-8-6a' => [
            'name' => 'Крем Pro You SPF 50 Vita White Sun Protection Cream PA+++',
            'size' => '50 г', 'price' => 7920, 'line' => 'Vita White', 'code' => '8-6А',
        ],

        // ===== Для кожи вокруг глаз =====
        'ppp-premium-hydrogel-eye-patch-black-pearl-1-5-g-60-sht-ppp' => [
            'name' => 'Гидрогелевые патчи Pro You Premium Hydrogel Eye Patch Black Pearl',
            'size' => '1,5 г × 60 шт', 'price' => 4400, 'line' => 'Black Pearl', 'code' => 'PPP',
        ],
        '5-9a-coenzyme-q10-eye-serum-30-ml-5-9a' => [
            'name' => 'Сыворотка для кожи вокруг глаз Pro You Coenzyme Q10 Eye Serum',
            'size' => '30 мл', 'price' => 9085, 'line' => 'Coenzyme Q10', 'code' => '5-9А',
        ],
        '8-1a-wrinkle-peptide-eye-cream-30-g-8-1a' => [
            'name' => 'Крем для кожи вокруг глаз Pro You Wrinkle Peptide Eye Cream',
            'size' => '30 г', 'price' => 11530, 'line' => 'Wrinkle Peptide', 'code' => '8-1А',
        ],
        '8-2a-whitening-eye-cream-30-g-8-2a' => [
            'name' => 'Крем для кожи вокруг глаз Pro You Whitening Eye Cream',
            'size' => '30 г', 'price' => 11530, 'line' => 'Whitening', 'code' => '8-2А',
        ],
        '8-3a-lifting-eye-cream-30-g-8-3a' => [
            'name' => 'Крем для кожи вокруг глаз Pro You Lifting Eye Cream',
            'size' => '30 г', 'price' => 10304, 'line' => 'Lifting', 'code' => '8-3А',
        ],
        '31-3a-lip-eye-wrinkle-spot-cream-15-g-31-3a' => [
            'name' => 'Крем для кожи вокруг глаз и губ Pro You Lip & Eye Wrinkle Spot Cream',
            'size' => '15 г', 'price' => 5650, 'line' => 'Lip & Eye', 'code' => '31-3А',
        ],

        // ===== Маски =====
        '11-1a-whitening-soft-mask-150-g-11-1a' => [
            'name' => 'Кремовая маска Pro You Whitening Soft Mask',
            'size' => '150 г', 'price' => 10212, 'line' => 'Whitening', 'code' => '11-1А',
        ],
        '11-2a-coenzyme-q10-mask-150-g-11-2a' => [
            'name' => 'Кремовая маска Pro You Coenzyme Q10 Mask',
            'size' => '150 г', 'price' => 8360, 'line' => 'Coenzyme Q10', 'code' => '11-2А',
        ],
        '11-3a-vita-balance-mask-150-g-11-3a' => [
            'name' => 'Кремовая маска Pro You Vita Balance Mask',
            'size' => '150 г', 'price' => 8360, 'line' => 'Vita Balance', 'code' => '11-3А',
        ],
        '11-4a-aroma-ac-mask-150-g-11-4a' => [
            'name' => 'Кремовая маска Pro You Аroma AC Mask',
            'size' => '150 г', 'price' => 8360, 'line' => 'Aroma AC', 'code' => '11-4А',
        ],
        '11-5a-hydration-mask-150-g-11-5a' => [
            'name' => 'Кремовая маска Pro You Hydration Mask',
            'size' => '150 г', 'price' => 8360, 'line' => 'Hydration', 'code' => '11-5А',
        ],
        '11-6a-phyto-collagen-mask-150-g-11-6a' => [
            'name' => 'Кремовая маска Pro You Phyto Collagen Mask',
            'size' => '150 г', 'price' => 8360, 'line' => 'Phyto Collagen', 'code' => '11-6А',
        ],
        '13-3a-soothing-night-gel-mask-165-ml-13-3a' => [
            'name' => 'Гелевая маска Pro You Soothing Night Gel Mask',
            'size' => '165 мл', 'price' => 7530, 'line' => 'Soothing Night', 'code' => '13-3А',
        ],
        '15-6a-pore-control-facial-mask-100-g-15-6a' => [
            'name' => 'Кремовая маска Pro You Pore Control Facial Mask',
            'size' => '100 г', 'price' => 5920, 'line' => 'Pore Control', 'code' => '15-6А',
        ],
        '15-7a-pore-tightening-charcoal-mask-50-g-15-7a' => [
            'name' => 'Кремовая маска Pro You Pore Tightening Charcoal Mask',
            'size' => '50 г', 'price' => 5520, 'line' => 'Pore Tightening', 'code' => '15-7А',
        ],
        '16-7a-bio-placenta-bright-sheet-mask-25-ml-10-sht-16-7a' => [
            'name' => 'Набор тканевых масок Pro You Bio Placenta Bright Sheet Mask',
            'size' => '25 мл × 10 шт', 'price' => 8602, 'line' => 'Bio Placenta', 'code' => '16-7А',
        ],
        '16-5a-one-week-nature-program-for-well-being-treatment-25-ml-6-sht-16-5a' => [
            'name' => 'Набор тканевых масок Pro You One Week Nature Program For Well-being Treatment',
            'size' => '25 мл × 6 шт', 'price' => 4945, 'line' => 'One Week Nature', 'code' => '16-5А',
        ],
        '16-6a-prori-soothing-hydration-sheet-mask-160-ml-16-6a' => [
            'name' => 'Набор тканевых масок Pro You Prori Soothing Hydration Sheet Mask',
            'size' => '160 мл', 'price' => 4945, 'line' => 'Prori Soothing', 'code' => '16-6А',
        ],

        // ===== Для тела =====
        '14-11a-rose-body-moisture-lotion-300-ml-14-11a' => [
            'name' => 'Лосьон для тела Pro You Rose Body Moisture Lotion',
            'size' => '300 мл', 'price' => 6601, 'line' => 'Rose Body', 'code' => '14-11А',
        ],

        // ===== Metacos Platinum =====
        '25-2a-metacos-platinum-wrinkle-peptide-skin-toner-130-ml-25-2a' => [
            'name' => 'Тонер Pro You Metacos Platinum Wrinkle Peptide Skin Toner',
            'size' => '130 мл', 'price' => 9630, 'line' => 'Metacos Platinum', 'code' => '25-2А',
        ],
        '25-6a-metacos-platinum-wrinkle-peptide-serum-50-ml-25-6a' => [
            'name' => 'Сыворотка Pro You Metacos Platinum Wrinkle Peptide Serum',
            'size' => '50 мл', 'price' => 12680, 'line' => 'Metacos Platinum', 'code' => '25-6А',
        ],
        '25-3a-metacos-platinum-wrinkle-peptide-lotion-130-ml-25-3a' => [
            'name' => 'Лосьон Pro You Metacos Platinum Wrinkle Peptide Lotion',
            'size' => '130 мл', 'price' => 10902, 'line' => 'Metacos Platinum', 'code' => '25-3А',
        ],
        '25-4a-metacos-platinum-wrinkle-peptide-cream-50-g-25-4a' => [
            'name' => 'Крем Pro You Metacos Platinum Wrinkle Peptide Cream',
            'size' => '50 г', 'price' => 12903, 'line' => 'Metacos Platinum', 'code' => '25-4А',
        ],
        '25-5a-metacos-platinum-wrinkle-peptide-eye-decollete-cream-30-g-25-5a' => [
            'name' => 'Крем для кожи вокруг глаз и зоны декольте Pro You Metacos Platinum Wrinkle Peptide Eye & Decollete Cream',
            'size' => '30 г', 'price' => 12903, 'line' => 'Metacos Platinum', 'code' => '25-5А',
        ],
        '25-1s-metacos-platinum-wrinkle-peptide-set-tohep-cybopotka-locoh-k-130-ml-50-ml-130-ml-50-g-30-g-25-1s' => [
            'name' => 'Подарочный набор Pro You Metacos Platinum Wrinkle Peptide Set: тонер, сыворотка, лосьон, крем, крем для кожи вокруг глаз',
            'size' => '130 мл, 50 мл, 130 мл, 50 г, 30 г', 'price' => 50380, 'line' => 'Metacos Platinum', 'code' => '25-1S',
        ],

        // ===== Mayflo =====
        '26-1a-mayflo-wrinkle-and-white-vital-active-skin-toner-120-ml-26-1a' => [
            'name' => 'Тонер Pro You Mayflo Wrinkle And White Vital Active Skin Toner',
            'size' => '120 мл', 'price' => 10150, 'line' => 'Mayflo', 'code' => '26-1А',
        ],
        '26-4a-mayflo-wrinkle-and-white-vital-active-serum-35-ml-26-4a' => [
            'name' => 'Сыворотка Pro You Mayflo Wrinkle And White Vital Active Serum',
            'size' => '35 мл', 'price' => 12620, 'line' => 'Mayflo', 'code' => '26-4А',
        ],
        '26-5a-mayflo-wrinkle-and-white-vital-active-lotion-100-ml-26-5a' => [
            'name' => 'Лосьон Pro You Mayflo Wrinkle And White Vital Active Lotion',
            'size' => '100 мл', 'price' => 10856, 'line' => 'Mayflo', 'code' => '26-5А',
        ],
        '26-2a-mayflo-wrinkle-and-white-vital-moisture-cream-100-g-26-2a' => [
            'name' => 'Крем Pro You Mayflo Wrinkle And White Vital Moisture Cream',
            'size' => '100 г', 'price' => 12910, 'line' => 'Mayflo', 'code' => '26-2А',
        ],
        '26-3a-mayflo-wrinkle-and-white-vital-nutrition-cream-50-g-26-3a' => [
            'name' => 'Крем Pro You Mayflo Wrinkle And White Vital Nutrition Cream',
            'size' => '50 г', 'price' => 13240, 'line' => 'Mayflo', 'code' => '26-3А',
        ],

        // ===== Hermann Homme =====
        '24-2a-hermann-white-wrinkle-control-lotion-130-ml-24-2a' => [
            'name' => 'Лосьон Pro You Hermann White & Wrinkle Control Lotion',
            'size' => '130 мл', 'price' => 10060, 'line' => 'Hermann Homme', 'code' => '24-2А',
        ],
        '24-3s-hermann-white-wrinkle-control-set-tohep-locoh-polhopazmephye-130-ml-30-ml-130-ml-30-ml-24-3s' => [
            'name' => 'Подарочный набор Pro You Hermann White & Wrinkle Control Set: тонер + лосьон (полноразмерные и дорожные версии)',
            'size' => '130 мл, 30 мл + 130 мл, 30 мл', 'price' => 17871, 'line' => 'Hermann Homme', 'code' => '24-3S',
        ],
    ];
}
