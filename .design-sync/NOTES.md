# Заметки по design-sync

## Природа репозитория
`planeta-skin` — статический MPA-сайт (Vite + Tailwind v4), а **не** библиотека
компонентов. Страницы — рукописный HTML, собираемый из `templates/*.html`;
JS — ванильные модули. Экспортируемых React/Storybook-компонентов нет, поэтому
штатный конвертер design-sync (package/storybook shape) **неприменим**.

## Что синкается: brand-theme (shape = "brand-theme")
Ручной layout в `ds-bundle/` — только фирменная тема, без компонентов:
- `styles.css` — единая точка входа (@import всего ниже).
- `tokens/{colors,typography,layout}.css` — из `tailwind.config.js`.
- `fonts/` — Anticva + Open Sans (woff2) из `public/fonts/` + `fonts.css`.
- `base.css` — пер. в литеральный CSS пригодные куски `src/style.css`
  (.btn-primary/.btn-secondary/.icon, body, h1–h4).
- `guidelines/` — `logo.svg`, `max-logo.svg` (из `public/img/`) + `brand.md`.
- `README.md` — бренд-справочник для дизайн-агента.

## Источники правды (при пересборке обновлять из них)
- Палитра/шрифты: `tailwind.config.js` → `theme.extend.colors.brand` / `fontFamily`.
- Шрифты-файлы: `public/fonts/*.woff2`.
- Логотипы: `public/img/logo.svg`, `public/img/max-logo.svg`.
- Компонентные стили: `src/style.css`.

## Ограничение
Тема-без-компонентов даёт дизайн-агенту палитру/типографику/лого, но строит
он обобщёнными компонентами. Полноценная дизайн-система потребовала бы сначала
вынести UI в экспортируемую библиотеку.
