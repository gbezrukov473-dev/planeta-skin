/**
 * Конфигурация сайта
 * 
 * ВАЖНО: При смене домена измените SITE_URL здесь.
 * Этот URL используется для canonical, og:url, og:image, twitter:image
 */

export const SITE_URL = 'https://hs-planet.ru';

export const SITE_NAME = 'Планета здоровой кожи';

export const DEFAULT_OG_IMAGE = '/img/og/og-default.jpg';

/**
 * Идентификаторы счётчиков аналитики. Раньше были захардкожены инлайном
 * в <head> каждой из 18 страниц — смена номера означала 18 правок.
 *
 * Счётчики подключаются только после согласия на cookies, см.
 * src/js/modules/analytics.js. Пустое значение выключает счётчик.
 */
export const METRIKA_ID = 99676053;
export const TOP_MAIL_RU_ID = '3748697';

/**
 * Yandex SmartCaptcha — клиентский (публичный) ключ. Безопасно держать в коде:
 * он всё равно уходит в HTML и виден в DevTools. Защита держится на серверном
 * ключе, который лежит только в send-form/config.local.php (gitignore).
 *
 * Если ключ нужно сменить, обновите его И здесь, И в config.local.php на сервере.
 */
export const SMARTCAPTCHA_SITEKEY = 'ysc1_kkLKjwNMrPom5MFgRWDscotG40AXPK0NWfZnuflV3f82aedf';
