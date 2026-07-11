# Планета здоровой кожи

Сайт клиники косметологии: лазерная эпиляция, аппаратная косметология, инъекции,
магазин Pro You. Статический сайт (MPA), собирается Vite + Tailwind CSS v4,
формы и корзина магазина обрабатываются PHP-бэкендом.

- Prod: [hs-planet.ru](https://hs-planet.ru) — reg.ru (Apache + PHP)
- Preview: [planeta-skin.pages.dev](https://planeta-skin.pages.dev) — Cloudflare Pages

## Требования

- Node.js 20+ (проверяется локально)
- PHP 8+ на проде (reg.ru)

## Установка и запуск

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # продакшен-сборка в dist/ (включает sitemap + critical CSS)
npm run build:fast   # то же, но без critical CSS (для быстрой локальной проверки)
npm run preview      # http://localhost:4173 — превью собранного dist/
```

## Деплой

### Cloudflare Pages (превью)
Любой `git push` в ветку на GitHub автоматически собирается и публикуется на
`https://planeta-skin.pages.dev/`. Команда билда в настройках Cloudflare Pages:
`npm run build`, output directory: `dist`.

### reg.ru (прод)
Содержимое папки `dist/` после `npm run build` заливается в корень домена
`hs-planet.ru` (FTP / панель хостинга). Из исходного репо дополнительно должны
быть залиты:

- `send-form/` — PHP-скрипт обработки форм и заказов магазина
- `public/.htaccess` (он копируется в dist автоматически, но нужно убедиться, что
  сервер читает именно актуальный)
- `data/.htaccess` — **обязательно**: закрывает `data/leads.jsonl` (телефоны и
  имена клиентов) от публичного скачивания. `send-form/index.php` подстрахует и
  создаст его сам при первой заявке, но проверить руками после деплоя нужно:
  `https://hs-planet.ru/data/leads.jsonl` должен отдавать 403.

После деплоя также проверить, что на сервере лежит `send-form/config.local.php`
с `captcha.enabled => true` — без него проверка SmartCaptcha молча выключена
(в этом случае в каждое письмо о заявке добавляется предупреждение).

## Формы и заказы (PHP)

`send-form/index.php` принимает:
- обычные заявки на процедуры (имя, телефон, способ связи, комментарий)
- заказы из магазина косметики (`cart_json` + данные покупателя)

Способы связи: **звонок** и **MAX** (мессенджер). WhatsApp/Telegram/Instagram
больше не используются — они вырезаны из фронта, бэкенд принимает только
значения `call` и `max`.

Серверный каталог цен `send-form/catalog.php` — автогенерируемый файл
(руками не редактировать). После изменения `src/data/products.js` выполнить
`npm run shop:catalog` и залить обновлённый `catalog.php` на прод.

Логи:
- `data/leads.jsonl` — JSON Lines, одна заявка на строку.
- Автоматически ротируется: при первом запросе в новом месяце предыдущий
  `leads.jsonl` переименовывается в `leads-YYYY-MM.jsonl`.
- `data/ratelimit/` — счётчики антиспама, старые файлы (>1 ч) чистятся сами.

### Почта

`send-form/index.php` пробует два пути: **SMTP** (если настроен) → откат на
**`mail()`**. Заявка в любом случае уже записана в `data/leads.jsonl`, так
что письмо — бонус, а не единственный канал.

**Включить SMTP (рекомендуется — лучшая доставляемость):**

1. Поставить PHPMailer одним из двух способов:
   ```bash
   # вариант А: composer (если на хостинге доступен)
   cd send-form && composer require phpmailer/phpmailer
   # вариант Б: вручную — скачать релиз с github.com/PHPMailer/PHPMailer/releases,
   # распаковать так, чтобы получилось send-form/lib/PHPMailer/src/PHPMailer.php
   ```
2. Скопировать шаблон конфига и заполнить креды:
   ```bash
   cp send-form/config.local.php.example send-form/config.local.php
   # заполнить host / username / password ящика mc@hs-planet.ru,
   # выставить 'enabled' => true
   ```
3. Файлы `send-form/config.local.php` и `send-form/vendor/`, `send-form/lib/`
   уже в `.gitignore` — пароль в репозиторий не попадёт.

**Если SMTP не настроен**, работает откат на `mail()` с корректными заголовками
(`Message-ID`, `Date`, `Return-Path`, 8-бит, envelope `-f`). Чтобы такие письма
не уходили в спам:

1. В панели reg.ru → Почта убедитесь, что для `hs-planet.ru` включён **SPF**:
   `TXT v=spf1 include:_spf.reg.ru ~all`.
2. Там же включите **DKIM** — reg.ru добавит запись в DNS автоматически.
3. Проверьте через [mail-tester.com](https://www.mail-tester.com/) — оценка
   должна быть ≥ 8/10.

## Картинки

### Сжатие

```bash
# пережимает всё новое/изменившееся в public/img (WebP q=85 + AVIF q=65)
npm run images:compress

# dry-run — покажет план, ничего не пишет
npm run images:compress -- --dry

# пережать всё принудительно (игнорируя manifest)
npm run images:compress -- --force
```

Скрипт идемпотентный — повторный запуск без новых файлов ничего не делает.
Состояние хранится в `scripts/.image-manifest.json` (SHA1-хеши исходников
+ параметры сжатия), этот файл коммитится.

### Размеры в HTML (CLS)

```bash
npm run images:dimensions
```

Проставляет `width` и `height` ко всем `<img>` в корневых HTML-файлах на
основании реальных размеров файлов (читает через `sharp`). Нужно
запускать после добавления новых картинок.

## Sitemap и SEO

`public/sitemap.xml` генерируется автоматически на каждом билде (`prebuild`
в package.json). Данные берутся из реально существующих HTML-страниц, `lastmod`
— дата последнего git-коммита, затронувшего файл. Картинки со страниц попадают
в `image:image` (даёт бонус к индексации в Google Images).

## Service Worker / PWA

`public/sw.js` — Service Worker. При каждом билде в него подставляется
версия вида `pzk-sw-v20260423` (плагин `vite-plugin-deploy.js`). При
обновлении на бою пользователи увидят баннер «Доступна новая версия сайта»
(стили в `src/style.css`, `#sw-update-banner`).

Чистка кеша пользователя вручную: открыть консоль, выполнить
`await window.__pzkClearCaches()`, перезагрузить страницу.

## Иконки

Спрайт `public/img/icons.svg` собран один раз из Font Awesome 6.4 и
закоммичен. Пакет `@fortawesome/fontawesome-free` НЕ держим в зависимостях
(весит 30 МБ). Если нужно добавить новые иконки:

```bash
npm install @fortawesome/fontawesome-free --no-save
# добавить icon-id в ICONS в scripts/build-icons-sprite.mjs
npm run icons
# после этого node_modules/@fortawesome можно удалить
```

## Безопасность

- HTTPS принудительно (`.htaccess` редиректит HTTP).
- HSTS на год включён (**внимание**: после включения откатить можно только
  отключением и ожиданием 12 месяцев истечения TTL в браузерах).
- CSP блокирует всё, кроме self + Яндекс.Метрики и Top.Mail.Ru.
- `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `X-Content-Type-Options`.
- На форме магазина — honeypot + rate-limit (см. `send-form/index.php`).

## Структура

```
.
├── index.html, laser.html, ...         Страницы-точки входа
├── templates/                           Общие куски HTML
│   ├── header.html, footer.html        Шапка и подвал
│   └── lead-form.html                   Лид-форма (подставляется через
│                                        <!-- LEAD_FORM_PLACEHOLDER --> + pageMap)
├── src/
│   ├── main.js                          Точка входа JS, регистрация SW
│   ├── style.css                        Tailwind + кастомные стили
│   ├── js/modules/                      Модули: forms, shop, phoneMask, ...
│   └── data/products.js                 Каталог товаров магазина (фронт)
├── public/
│   ├── img/                             Картинки (WebP + AVIF), sw.js, icons.svg
│   ├── .htaccess, robots.txt, sitemap.xml
│   └── site.webmanifest
├── send-form/
│   ├── index.php                        Бэкенд для форм и заказов
│   └── catalog.php                      Серверный каталог (валидация цен)
├── scripts/                             Node-утилиты билда
├── vite.config.js
├── vite-plugin-deploy.js                Плагин деплоя (SW-версия, clean URLs)
└── vite-plugin-html-template.js         Инклюд общих HTML-шаблонов
```
