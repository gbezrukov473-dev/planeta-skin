# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev          # vite dev server at http://localhost:5173
npm run build        # full prod build → dist/ (prebuild: sitemap; postbuild: critical CSS via Critters)
npm run build:fast   # same, but skips critical CSS — use for quick local checks
npm run preview      # serve built dist/ at http://localhost:4173

# One-off content/asset utilities (run on demand, not part of build):
npm run icons               # rebuild public/img/icons.svg sprite from Font Awesome
npm run sitemap             # regenerate public/sitemap.xml manually (also runs as prebuild)
npm run critical            # regenerate inline critical CSS for dist/index.html
npm run social-meta         # inject og:/twitter: tags into HTML pages
npm run lazy-images         # add loading=lazy / decoding=async to <img>
npm run images:compress     # WebP q=85 + AVIF q=65 for public/img (idempotent via scripts/.image-manifest.json)
npm run images:compress -- --dry      # plan only, no writes
npm run images:compress -- --force    # re-encode everything
npm run images:dimensions   # set width/height on <img> based on real file sizes (run after adding images)
npm run images:picture      # convert <img> → <picture> with AVIF/WebP sources
npm run shop:catalog        # regenerate send-form/catalog.php from src/data/products.js (run after any catalog/price change)
```

There is no test suite, linter, or formatter configured. Do not invent npm scripts that don't exist in `package.json`.

## Architecture

**Static MPA** — one HTML file per route at the repo root (`index.html`, `laser.html`, `inject.html`, …). Vite is configured with `appType: 'mpa'` and auto-discovers every `*.html` in the root as a rollup entry (`vite.config.js` → `getHtmlEntries()`, with `icons-preview.html` excluded). There is no router or framework — page-specific behavior is driven by DOM markers and per-page metadata.

**Build toolchain pin:** `vite` is overridden to `rolldown-vite` in `package.json` (`overrides`). Minification uses Oxc, not esbuild — keep this in mind if a config change references esbuild options.

### HTML composition pipeline

Pages are not standalone — they're assembled at build time by `vite-plugin-html-template.js` (runs `order: 'pre'` so Vite still post-processes script/link tags):

- Each page contains placeholder comments: `<!-- HEADER_PLACEHOLDER -->`, `<!-- FOOTER_PLACEHOLDER -->`, and (where present) `<!-- LEAD_FORM_PLACEHOLDER -->`.
- The plugin substitutes them with `templates/header.html`, `templates/footer.html`, and a rendered `templates/lead-form.html`.
- `pageMap` in `vite-plugin-html-template.js` is the **single source of truth** for: which top-nav / service-menu item is active, the `form_id` written into the lead, the `service` label sent to backend/email, and the DOM-id suffix used for the form (`lead-form-laser`, `lead-phone-laser`, …). Adding a new HTML page requires adding an entry here — otherwise the form will fall back to generic ids and the menu won't highlight.
- `templates/lead-form.html` uses `{{ID_SUFFIX}}`, `{{FORM_ID}}`, `{{SERVICE}}` tokens that the plugin replaces per page.

### Deploy plugin (`vite-plugin-deploy.js`)

Runs in `closeBundle` and does two things prod relies on:
1. **Service worker stamping** — replaces `__BUILD_VERSION__` in `dist/sw.js` with `YYYYMMDD` (so the SW cache name becomes `pzk-sw-v<date>`). When this changes, returning users see the "Доступна новая версия сайта" banner injected from `src/main.js`.
2. **Clean URL restructuring** — moves `dist/page.html` → `dist/page/index.html` for every page except `index.html`, `404.html`, `offline.html`. This is what makes `/about/` style URLs work on Cloudflare Pages without an `.htaccess`. On reg.ru, Apache + `public/.htaccess` does the same thing.

Local `vite dev` doesn't restructure dist, so a separate `devCleanUrlPlugin` in `vite.config.js` rewrites `/about` → `/about.html` in the dev middleware to match prod URL shape.

### JavaScript loading strategy (`src/main.js`)

- **Core modules** are statically imported and initialized on `DOMContentLoaded` on every page: `preloader`, `mobileMenu`, `scrollToForm`, `forms` (lead form submit + masking + tracking), `scrollToTop`, `cookieBanner`, `lazyImages`, `phoneMask`.
- **Heavy / page-specific modules** are dynamically `import()`ed only when a DOM marker is present:
  - `#shop-root` → `shop.js` (cosmetics catalog + cart)
  - `#lightbox` → `lightbox.js`
  - `#stats-section` → `counters.js`
  - `.scroller` → `scroller.js`
  - `.slide`, `.equip-slide`, `.results-slider`, `.slider-container` → `sliders.js` (hero/equipment/removal — three init fns in one chunk)

When adding a page-specific feature, follow this pattern — gate the dynamic import on a DOM marker so pages that don't need it skip the chunk entirely (~25 KB saving per non-shop page).

### Service worker

`public/sw.js` is shipped as-is and stamped with a build-date version by the deploy plugin. Update banner UI lives in `src/main.js` (`showUpdateBanner`) and styles in `src/style.css` (`#sw-update-banner`). For manual cache nuking from the browser console: `await window.__pzkClearCaches()` then reload.

### PHP backend (`send-form/`)

This is NOT shipped via `dist/` — it lives on reg.ru alongside the static site and must be uploaded separately from the repo.

- `send-form/index.php` handles two payload shapes through the same endpoint: ordinary lead forms (`name`, `phone`, `contact_method`, `comment`) and shop orders (lead fields + `cart_json` + customer data). It supports both `fetch` (returns JSON) and classic form post (303 redirect to `/thanks/`).
- `send-form/catalog.php` is server-side product validation — prices/inventory are re-checked here so the client cart can't lie about totals. It is AUTOGENERATED from `src/data/products.js` by `npm run shop:catalog` — never edit it by hand; regenerate and re-upload after any catalog change.
- **Contact method allowlist:** backend accepts only `call` and `max`. WhatsApp/Telegram/Instagram have been removed from frontend AND backend — don't reintroduce them.
- Anti-spam: honeypot field `website`, `fill_time` heuristic, IP rate limiter writing to `data/ratelimit/` (auto-cleaned after 1h).
- Leads append to `data/leads.jsonl`. On the first request of a new month the file is rotated to `leads-YYYY-MM.jsonl` automatically.
- Email delivery is best-effort: tries SMTP via PHPMailer (if `send-form/config.local.php` + `send-form/lib/PHPMailer/` exist), falls back to PHP `mail()`. Even if mail fails, the lead is already in `leads.jsonl` — the JSONL is the source of truth.
- `send-form/config.local.php`, `send-form/vendor/`, `send-form/lib/` are gitignored — credentials never enter the repo.

### Styling

Tailwind CSS v4 (`@tailwindcss/postcss`). Custom design tokens are in `tailwind.config.js`:
- Brand palette: `brand-peach #E5C1AC`, `brand-light #FDF6F3`, `brand-turquoise #44C8D2`, `brand-tiffany #017B8C`, `brand-dark #333333`.
- Fonts: `font-sans` = Open Sans, `font-serif` = Anticva.
- Container is centered with responsive padding (24px → 80px) and capped at 1400px on `2xl`.

`src/style.css` holds Tailwind directives plus hand-written component CSS (e.g., the SW update banner, sliders).

### SEO / sitemap

`public/sitemap.xml` is regenerated by `scripts/build-sitemap.mjs` (runs as `prebuild`). Source of truth: HTML files in the root + `git log` for `<lastmod>` (falls back to mtime). It also embeds `image:image` entries for `/img/...` references inside each page. Base URL is hardcoded to `https://hs-planet.ru` in the script and in `src/js/config.js` (`SITE_URL`) — both must change together if the domain moves.

### Icons

`public/img/icons.svg` is a hand-curated SVG sprite committed to the repo. Font Awesome is NOT a dependency (30 MB). To add an icon:
```bash
npm install @fortawesome/fontawesome-free --no-save
# add the icon id to ICONS in scripts/build-icons-sprite.mjs
npm run icons
# then delete node_modules/@fortawesome (no-save keeps it out of package.json)
```
Use icons in HTML via `<svg class="icon"><use href="/img/icons.svg#i-<name>"></use></svg>`.

### Images

`scripts/compress-images.mjs` is idempotent — state lives in `scripts/.image-manifest.json` (SHA1 of source + encode params), which **is** committed. Re-running without new files is a no-op. After adding new `<img>` tags, run `npm run images:dimensions` to set width/height (prevents CLS).

## Hosting & deployment

- **Production:** reg.ru (Apache + PHP 8+) serving `hs-planet.ru`. Upload `dist/` contents to the domain root via FTP, and upload `send-form/` and `public/.htaccess` from the repo separately. `.htaccess` enforces HTTPS, HSTS (1 year — irreversible without long TTL wait), CSP allowing self + Yandex.Metrika + Top.Mail.Ru only, and `X-Frame-Options: SAMEORIGIN`.
- **Preview:** Cloudflare Pages at `planeta-skin.pages.dev` — auto-builds every push (build command `npm run build`, output `dist`). PHP backend does not run here, so form submissions need to point to the prod backend (or be tested against prod's `send-form/`).

## Conventions to keep in mind

- Comments and user-facing strings throughout the codebase are in **Russian**. Match that when editing files; don't translate existing text without being asked.
- Don't add HTML pages without also registering them in `pageMap` (`vite-plugin-html-template.js`) — otherwise menu highlighting, lead-form id, and the service label sent to the backend will all be wrong.
- Don't introduce new contact-method values on the frontend without updating `send-form/index.php` to accept them — the backend hard-rejects unknown methods.
- Don't add the `@fortawesome/fontawesome-free` package as a regular dependency; the sprite-build workflow exists specifically to keep it out of `node_modules` after the sprite is regenerated.
