/**
 * Единый деплой-плагин для двух целей:
 *  - reg.ru (Apache + PHP, основной хостинг, пригодные URL /page/)
 *  - GitHub Pages (статический предпросмотр для клиента)
 *
 * Что делает:
 *  1. На билде подставляет версию Service Worker (dist/sw.js), не трогая исходник.
 *  2. Перекладывает dist/page.html -> dist/page/index.html, чтобы "красивые"
 *     URL работали нативно и без .htaccess-трюков.
 *  3. Для GH Pages дополнительно префиксит абсолютные пути значением base
 *     и переводит action форм на production-домен reg.ru.
 */
import fs from 'fs';
import path from 'path';

// Страницы, которые остаются в корне (без вложения в папку)
const KEEP_AT_ROOT = new Set(['index.html', '404.html', 'offline.html']);

/**
 * @param {object} opts
 * @param {boolean} opts.isGhPages    true, если собираем для GitHub Pages
 * @param {string}  opts.base         base-путь Vite (например, '/planeta-skin/')
 * @param {string}  opts.prodOrigin   полный origin прод-домена (для форм на GH Pages)
 */
export function deployPlugin(opts) {
  const { isGhPages = false, base = '/', prodOrigin = 'https://hs-planet.ru' } = opts || {};

  const buildVersion = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let outDir = 'dist';

  return {
    name: 'planeta-deploy',
    apply: 'build',

    configResolved(config) {
      outDir = config.build?.outDir || 'dist';
    },

    /**
     * Постобработка HTML: формы + префикс base.
     * Запускается ПОСЛЕ базовой генерации HTML в Vite и плагина шаблонов.
     */
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        if (isGhPages) {
          // Формы должны уйти на реальный бэкенд reg.ru (cross-origin)
          html = html.replace(
            /action="\/send-form\/index\.php"/g,
            `action="${prodOrigin}/send-form/index.php"`
          );

          // Префиксуем абсолютные внутренние ссылки /foo -> /<repo>/foo.
          // Затрагиваем только безопасные атрибуты, протокольные и якорные - не трогаем.
          if (base && base !== '/') {
            html = prefixAbsolutePaths(html, base);
          }
        }

        return html;
      },
    },

    /**
     * Пост-обработка dist после записи бандла:
     *  - sw.js: подставляем версию
     *  - page.html -> page/index.html
     */
    closeBundle() {
      const distDir = path.resolve(outDir);
      if (!fs.existsSync(distDir)) return;

      stampServiceWorker(distDir, buildVersion);
      restructurePages(distDir);
    },
  };
}

/**
 * Заменяет __BUILD_VERSION__ в dist/sw.js на реальную дату.
 */
function stampServiceWorker(distDir, version) {
  const swPath = path.join(distDir, 'sw.js');
  if (!fs.existsSync(swPath)) return;

  let content = fs.readFileSync(swPath, 'utf-8');
  if (content.includes('__BUILD_VERSION__')) {
    content = content.replace(/__BUILD_VERSION__/g, version);
    fs.writeFileSync(swPath, content, 'utf-8');
    console.log(`[deploy] Service Worker version: pzk-sw-v${version}`);
  }
}

/**
 * Перекладывает dist/foo.html в dist/foo/index.html — кроме
 * index.html, 404.html, offline.html.
 */
function restructurePages(distDir) {
  const files = fs.readdirSync(distDir);
  for (const file of files) {
    if (!file.endsWith('.html')) continue;
    if (KEEP_AT_ROOT.has(file)) continue;

    const slug = file.replace(/\.html$/, '');
    const targetDir = path.join(distDir, slug);
    const targetFile = path.join(targetDir, 'index.html');
    const sourceFile = path.join(distDir, file);

    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.renameSync(sourceFile, targetFile);
  }
  console.log('[deploy] Страницы разложены по папкам: /page/ -> /page/index.html');
}

/**
 * Добавляет base-префикс ко всем абсолютным путям в HTML:
 *  href="/foo"      -> href="/<base>/foo"
 *  src="/foo"       -> src="/<base>/foo"
 *  action="/foo"    -> action="/<base>/foo"  (если не переписан выше)
 *  poster="/foo"    -> poster="/<base>/foo"
 *
 * Не трогает:
 *  - протокольные URL (http://, https://, //cdn)
 *  - mailto:, tel:, javascript:
 *  - якоря (#...)
 *  - уже префиксованные значения
 *  - srcset (у нас в проекте не используется для критичных путей, и парсинг сложнее)
 *  - canonical/og:url в <link>/<meta content="https://...">
 */
function prefixAbsolutePaths(html, base) {
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
  const attrs = ['href', 'src', 'action', 'poster', 'data-src', 'data-thanks'];
  const attrRe = new RegExp(
    `\\b(${attrs.join('|')})="\\/(?!\\/)([^"#][^"]*)"`,
    'g'
  );

  return html.replace(attrRe, (match, attr, rest) => {
    // уже префиксовано?
    if (('/' + rest).startsWith(prefix + '/')) return match;
    return `${attr}="${prefix}/${rest}"`;
  });
}
