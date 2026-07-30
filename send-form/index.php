<?php
declare(strict_types=1);

/**
 * Planeta Skin - lead form handler
 * - JSON-ответы для fetch (Accept: application/json)
 * - редиректы обратно на страницу формы, если не JSON
 * - honeypot + fill_time + rate limit + SmartCaptcha (на проде обязательна)
 * - нормализация телефона
 * - лог в leads.jsonl (каталог вне вебрута, см. data_dir())
 */

require_once __DIR__ . '/catalog.php';

/* ---------------- config ---------------- */

// Куда редиректим после успеха
const THANKS_URL = '/thanks/';

// Максимальное количество одной позиции в корзине (защита от фиктивных заказов на миллион)
const MAX_QTY_PER_ITEM = 20;

// Максимальное количество разных позиций в одной заявке
const MAX_CART_ITEMS = 30;

// Телефон клиники — подставляется во все сообщения об ошибках отправки.
const CONTACT_PHONE = '+7 (911) 271-78-88';

// Боевые хосты. На них капча обязательна: если конфига нет, форма отвечает
// ошибкой, а не принимает заявку без проверки (см. fail-closed ниже).
const PROD_HOSTS = ['hs-planet.ru', 'www.hs-planet.ru'];

// Разрешенные origins для cross-origin отправки форм (GitHub Pages preview и т.п.).
// Добавьте сюда домены, с которых формам разрешено отправлять на этот бэкенд.
const ALLOWED_ORIGINS = [
    'https://hs-planet.ru',
    'https://www.hs-planet.ru',
    // Превью на Cloudflare Pages: PHP там не работает, формы бьют в прод-бэкенд
    // cross-origin. Хост должен совпадать с ALLOWED_REFERER_HOSTS ниже, иначе
    // preflight проходит, а сам POST режется проверкой Referer (и наоборот).
    'https://planeta-skin.pages.dev',
];

// Разрешенные хосты в заголовке Referer. Должны совпадать с тем, откуда
// действительно может приходить форма (включая превью на Cloudflare Pages).
const ALLOWED_REFERER_HOSTS = [
    'hs-planet.ru',
    'www.hs-planet.ru',
    'planeta-skin.pages.dev',
];

// User-Agent'ы, по которым однозначно видно бота. Совпадение по подстроке,
// case-insensitive. Реальные браузеры эти строки не присылают.
const BOT_UA_PATTERNS = [
    'curl/',
    'wget/',
    'python-requests/',
    'python-urllib',
    'go-http-client',
    'libwww-perl',
    'java/',
    'okhttp/',
    'axios/',
    'node-fetch',
    'postmanruntime',
    'httpclient',
    'scrapy',
    'phantomjs',
    'headlesschrome',
    'masscan',
    'nikto',
    'sqlmap',
];

// SmartCaptcha API
const SMARTCAPTCHA_VALIDATE_URL = 'https://smartcaptcha.yandexcloud.net/validate';

/**
 * Имя каталога с персональными данными (leads/drops/ratelimit).
 *
 * ВАЖНО: каталог создаётся на уровень ВЫШЕ вебрута. Раньше он лежал внутри
 * (send-form/../data) и закрывался только .htaccess — а на reg.ru статику
 * раздаёт фронтовый nginx напрямую, мимо Apache, поэтому .htaccess на неё
 * может не подействовать и leads.jsonl с телефонами клиентов скачивался бы
 * по предсказуемому URL. Единственная надёжная защита — вынести файлы туда,
 * где веб-сервер их физически не отдаст.
 *
 * Путь можно переопределить в config.local.php ключом 'data_dir'.
 */
const DATA_DIR_NAME = 'planeta-data';

/* ---------------- helpers ---------------- */

function wants_json(): bool {
    $accept = strtolower((string)($_SERVER['HTTP_ACCEPT'] ?? ''));
    $xhr = strtolower((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''));
    return str_contains($accept, 'application/json') || $xhr === 'xmlhttprequest';
}

function json_out(bool $ok, array $payload = [], int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store');
    echo json_encode(array_merge(['ok' => $ok], $payload), JSON_UNESCAPED_UNICODE);
    exit;
}

function safe_path(string $path, string $fallback = '/'): string {
    $path = trim($path);
    if ($path === '') return $fallback;

    // только относительные пути сайта, без протоколов/домена
    if (preg_match('~^https?://~i', $path)) return $fallback;

    // норм: "/laser.html?x=1#form"
    if ($path[0] !== '/') $path = '/' . $path;

    // "//evil.com" и "/\evil.com" браузеры трактуют как протокол-относительный
    // URL на чужой домен — режем, иначе получится open redirect через поле page.
    if (isset($path[1]) && ($path[1] === '/' || $path[1] === '\\')) return $fallback;

    return $path;
}

function redirect_303(string $to): void {
    header('Location: ' . $to, true, 303);
    exit;
}

function str_trim(string $v, int $max = 500): string {
    $v = trim($v);
    if (mb_strlen($v) > $max) $v = mb_substr($v, 0, $max);
    return $v;
}

function normalize_ru_phone(string $raw): array {
    $digits = preg_replace('/\D+/', '', $raw) ?? '';
    $digits = (string)$digits;

    if ($digits === '') return ['ok' => false];

    // если ввели 9XXXXXXXXX
    if (strlen($digits) === 10 && $digits[0] === '9') {
        $digits = '7' . $digits;
    }

    // 8XXXXXXXXXX -> 7XXXXXXXXXX
    if (strlen($digits) === 11 && $digits[0] === '8') {
        $digits = '7' . substr($digits, 1);
    }

    // 10 цифр -> добавим 7
    if (strlen($digits) === 10) {
        $digits = '7' . $digits;
    }

    // ограничим 11
    if (strlen($digits) > 11) {
        $digits = substr($digits, 0, 11);
    }

    if (strlen($digits) !== 11 || $digits[0] !== '7') return ['ok' => false];

    $p = substr($digits, 1);
    $display = '+7 (' . substr($p, 0, 3) . ') ' . substr($p, 3, 3) . '-' . substr($p, 6, 2) . '-' . substr($p, 8, 2);
    $e164 = '+' . $digits;

    return ['ok' => true, 'digits' => $digits, 'e164' => $e164, 'display' => $display];
}

function ensure_dir(string $dir): void {
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

/**
 * Читает config.local.php один раз за запрос. Файл gitignored, его может
 * не быть — тогда null (SMTP откатится на mail(), капча отработает по
 * правилам fail-closed ниже).
 */
function load_local_config(): ?array {
    static $cfg = null;
    static $loaded = false;

    if ($loaded) return $cfg;
    $loaded = true;

    $path = __DIR__ . '/config.local.php';
    if (!is_file($path)) return null;

    $raw = @include $path;
    $cfg = is_array($raw) ? $raw : null;

    return $cfg;
}

/**
 * Создаёт каталог и кладёт в него запрещающий .htaccess, если его там нет.
 *
 * Нужен только для легаси-режима, когда data_dir() не смог создать каталог
 * вне вебрута и откатился на send-form/../data. Тогда файлы с ПД лежат в
 * публичной зоне и .htaccess — единственная (и, из-за nginx на reg.ru,
 * ненадёжная) преграда, поэтому восстанавливаем его при каждом запросе.
 * .htaccess действует и на подкаталоги (ratelimit/), отдельно их не закрываем.
 */
function ensure_protected_dir(string $dir): void {
    ensure_dir($dir);
    $ht = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . '.htaccess';
    if (!is_file($ht)) {
        @file_put_contents(
            $ht,
            "# Автосоздано send-form/index.php: каталог с ПД закрыт от веба.\n"
            . "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n"
            . "<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n"
        );
    }
}

/**
 * Пригоден ли каталог для хранения ПД: существует (или создался) и доступен
 * на запись. Права 0700 — читать файлы должен только пользователь, от которого
 * работает PHP.
 */
function dir_is_usable(string $dir): bool {
    if ($dir === '') return false;
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) return false;
    return is_writable($dir);
}

/**
 * Разовый переезд логов из старого каталога (внутри вебрута) в новый.
 * Идемпотентно: файлы, уже лежащие в новом месте, не трогаем.
 */
function migrate_legacy_data(string $from, string $to): void {
    if (!is_dir($from)) return;

    $realFrom = realpath($from);
    $realTo   = realpath($to);
    if ($realFrom !== false && $realFrom === $realTo) return;

    foreach ((@glob($from . '/*.jsonl') ?: []) as $src) {
        $dst = rtrim($to, '/\\') . DIRECTORY_SEPARATOR . basename($src);
        if (!is_file($dst)) @rename($src, $dst);
    }
}

/**
 * Возвращает каталог для логов с ПД, создавая его при необходимости.
 *
 * Порядок выбора:
 *  1) config.local.php → 'data_dir' (абсолютный путь, задаётся на хостинге);
 *  2) <родитель вебрута>/planeta-data — вне зоны видимости веб-сервера;
 *  3) send-form/../data — легаси-путь ВНУТРИ вебрута. Используется, только
 *     если первые два недоступны на запись: терять заявки хуже, чем хранить
 *     их в вебруте. В этом случае каталог закрывается .htaccess и в error_log
 *     пишется предупреждение — это состояние надо чинить руками.
 */
function data_dir(): string {
    static $resolved = null;
    if ($resolved !== null) return $resolved;

    $legacy = __DIR__ . '/../data';
    $default = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . DATA_DIR_NAME;

    $candidates = [];
    $cfg = load_local_config();
    if (!empty($cfg['data_dir']) && is_string($cfg['data_dir'])) {
        $candidates[] = rtrim($cfg['data_dir'], '/\\');
    }
    // send-form/ → корень сайта → его родитель (уже вне вебрута)
    $candidates[] = $default;

    foreach ($candidates as $dir) {
        if (dir_is_usable($dir)) {
            // Страховка на случай нестандартной разметки хостинга, где родитель
            // вебрута сам оказался доступен по HTTP: каталог всё равно закрываем.
            ensure_protected_dir($dir);

            // Забираем логи из всех прежних мест: из вебрута (самый первый
            // вариант) и из каталога по умолчанию — на случай, когда data_dir
            // прописали позже, уже после накопления заявок.
            migrate_legacy_data($legacy, $dir);
            migrate_legacy_data($default, $dir);

            return $resolved = $dir;
        }
    }

    error_log(
        '[planeta-skin] ВНИМАНИЕ: каталог для персональных данных не удалось создать вне вебрута, '
        . 'используется ' . $legacy . ' — задайте data_dir в send-form/config.local.php'
    );
    ensure_protected_dir($legacy);

    return $resolved = $legacy;
}

/**
 * Месячная ротация JSONL-лога: если месяц последней модификации файла
 * отличается от текущего, переименовываем его в <name>-YYYY-MM.jsonl.
 * Идемпотентно — можно звать перед каждой записью.
 */
function rotate_monthly(string $file): void {
    if (!is_file($file)) return;
    $mtime = @filemtime($file);
    if ($mtime && date('Y-m', $mtime) !== date('Y-m')) {
        $archive = preg_replace('/\.jsonl$/', '-' . date('Y-m', $mtime) . '.jsonl', $file);
        if ($archive !== null && !is_file($archive)) @rename($file, $archive);
    }
}

/**
 * Счётчики операционных проблем по дням (<data_dir>/ops-counters.json).
 *
 * Проблема, которую они решают: непрошедшие письма видны только в
 * mail-failures.jsonl, а этот файл никто не открывает — сбой может копиться
 * неделями. Счётчик за последние сутки подклеивается к письму о заявке, то есть
 * попадает туда, куда клиника и так смотрит каждый день.
 *
 * Считается сейчас единственный ключ — mail_failures. Отказы форм тоже когда-то
 * попадали в письмо, но администраторы не могут открыть drops.jsonl, поэтому
 * строку убрали, а вместе с ней и счётчик soft_drops.
 *
 * Хранятся только три последних дня — файл не растёт.
 */
function ops_bump(string $key): void {
    $file = data_dir() . '/ops-counters.json';

    $fp = @fopen($file, 'c+');
    if (!$fp) return;

    flock($fp, LOCK_EX);

    $raw = stream_get_contents($fp);
    $data = (is_string($raw) && $raw !== '') ? json_decode($raw, true) : [];
    if (!is_array($data)) $data = [];

    $today = date('Y-m-d');
    $data[$today][$key] = (int)($data[$today][$key] ?? 0) + 1;

    $keep = [$today, date('Y-m-d', strtotime('-1 day')), date('Y-m-d', strtotime('-2 day'))];
    $data = array_intersect_key($data, array_flip($keep));

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data, JSON_UNESCAPED_UNICODE));

    flock($fp, LOCK_UN);
    fclose($fp);
}

/**
 * Суммарные счётчики за сегодня и вчера. Пустой массив — проблем не было.
 *
 * @return array<string,int>
 */
function ops_recent(): array {
    $file = data_dir() . '/ops-counters.json';
    if (!is_file($file)) return [];

    $data = json_decode((string)@file_get_contents($file), true);
    if (!is_array($data)) return [];

    $sum = [];
    foreach ([date('Y-m-d'), date('Y-m-d', strtotime('-1 day'))] as $day) {
        foreach ((array)($data[$day] ?? []) as $key => $value) {
            $sum[$key] = ($sum[$key] ?? 0) + (int)$value;
        }
    }

    return array_filter($sum);
}

/**
 * Обслуживание логов:
 *  - месячная ротация leads.jsonl и drops.jsonl;
 *  - чистка записей в каталоге ratelimit старше TTL.
 *
 * Идемпотентно — можно звать на каждом запросе.
 */
function maintain_logs(string $logDir, string $rlDir): void {
    rotate_monthly($logDir . '/leads.jsonl');
    rotate_monthly($logDir . '/drops.jsonl');

    // чистка ratelimit: файлы старше часа не нужны
    if (is_dir($rlDir)) {
        $now = time();
        foreach ((array) @scandir($rlDir) as $f) {
            if ($f === '.' || $f === '..' || !str_ends_with($f, '.json')) continue;
            $p = $rlDir . '/' . $f;
            if (is_file($p) && ($now - (int) @filemtime($p)) > 3600) @unlink($p);
        }
    }
}

/**
 * Валидирует корзину, пришедшую с клиента, против серверного каталога.
 *
 * Клиент отдаёт массив строк вида:
 *   {productId, variantId, name, size, code, price, qty}
 * но мы доверяем только variantId и qty — название/размер/цена и код
 * перезатираются из shop_catalog() (серверный канон). Старый формат
 * со значением `id` тоже принимаем, чтобы не сломать заявки от вкладок,
 * открытых до выкатки.
 *
 * @param string $rawJson raw JSON из поля cart_json
 * @return array{ok:bool, items:array<int,array{id:string,name:string,size:string,price:int,qty:int,sum:int,line:string,code:string}>, total:int, error?:string}
 */
function build_order_from_cart(string $rawJson): array {
    $rawJson = trim($rawJson);
    if ($rawJson === '') {
        return ['ok' => false, 'items' => [], 'total' => 0, 'error' => 'Корзина пустая.'];
    }

    $decoded = json_decode($rawJson, true);
    if (!is_array($decoded)) {
        return ['ok' => false, 'items' => [], 'total' => 0, 'error' => 'Не удалось прочитать корзину.'];
    }

    if (count($decoded) > MAX_CART_ITEMS) {
        return ['ok' => false, 'items' => [], 'total' => 0, 'error' => 'Слишком много позиций в заказе.'];
    }

    $catalog = shop_catalog();
    $items = [];
    $total = 0;

    foreach ($decoded as $row) {
        if (!is_array($row)) continue;

        // Новый формат — variantId. Старый — id. Поддерживаем оба.
        $variantId = '';
        if (isset($row['variantId'])) $variantId = (string)$row['variantId'];
        elseif (isset($row['id']))     $variantId = (string)$row['id'];

        $qty = isset($row['qty']) ? (int)$row['qty'] : 0;

        if ($variantId === '' || !isset($catalog[$variantId])) continue;
        if ($qty < 1) continue;
        if ($qty > MAX_QTY_PER_ITEM) $qty = MAX_QTY_PER_ITEM;

        $p = $catalog[$variantId];
        $sum = $p['price'] * $qty;

        $items[] = [
            'id'    => $variantId,
            'name'  => $p['name'],
            'size'  => $p['size'],
            'price' => $p['price'],
            'qty'   => $qty,
            'sum'   => $sum,
            'line'  => $p['line'],
            'code'  => $p['code'],
        ];

        $total += $sum;
    }

    if (empty($items)) {
        return ['ok' => false, 'items' => [], 'total' => 0, 'error' => 'В корзине нет действительных позиций.'];
    }

    return ['ok' => true, 'items' => $items, 'total' => $total];
}

/**
 * Загружает SMTP-конфиг из config.local.php (gitignored). Возвращает null,
 * если файла нет, конфиг невалиден или smtp.enabled выключен — в этом случае
 * index.php откатывается на mail().
 *
 * @return array{host:string,port:int,secure:string,username:string,password:string,from:string,fromName:string}|null
 */
function load_smtp_config(): ?array {
    $cfg = load_local_config();
    if (!is_array($cfg) || !isset($cfg['smtp']) || !is_array($cfg['smtp'])) return null;

    $smtp = $cfg['smtp'];
    if (empty($smtp['enabled'])) return null;
    if (empty($smtp['host']) || empty($smtp['username']) || empty($smtp['password'])) return null;

    return [
        'host'     => (string)$smtp['host'],
        'port'     => (int)($smtp['port'] ?? 465),
        'secure'   => (string)($smtp['secure'] ?? 'ssl'),
        'username' => (string)$smtp['username'],
        'password' => (string)$smtp['password'],
        'from'     => (string)($smtp['from'] ?? $smtp['username']),
        'fromName' => (string)($smtp['fromName'] ?? ''),
    ];
}

/**
 * Подключает PHPMailer. Поддерживает два способа установки:
 *  1) composer require phpmailer/phpmailer  → send-form/vendor/autoload.php
 *  2) ручная распаковка релиза в send-form/lib/PHPMailer/src/
 * Возвращает true, если классы PHPMailer\PHPMailer\PHPMailer и SMTP доступны.
 */
function load_phpmailer(): bool {
    if (class_exists('\\PHPMailer\\PHPMailer\\PHPMailer')) return true;

    $vendor = __DIR__ . '/vendor/autoload.php';
    if (is_file($vendor)) {
        require_once $vendor;
        return class_exists('\\PHPMailer\\PHPMailer\\PHPMailer');
    }

    $libDir = __DIR__ . '/lib/PHPMailer/src';
    if (is_dir($libDir)) {
        require_once $libDir . '/Exception.php';
        require_once $libDir . '/SMTP.php';
        require_once $libDir . '/PHPMailer.php';
        return class_exists('\\PHPMailer\\PHPMailer\\PHPMailer');
    }

    return false;
}

/**
 * Отправляет письмо. Сначала пробует SMTP (если настроен и PHPMailer доступен),
 * иначе откатывается на mail() с правильными заголовками.
 *
 * Возвращает true при успехе, false при провале — но index.php в любом случае
 * считает заявку принятой, потому что она уже залогирована в leads.jsonl.
 */
function send_lead_email(string $to, string $subject, string $body, string $fromDomain): bool {
    $smtp = load_smtp_config();

    if ($smtp !== null && load_phpmailer()) {
        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host       = $smtp['host'];
            $mail->Port       = $smtp['port'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $smtp['username'];
            $mail->Password   = $smtp['password'];
            if ($smtp['secure'] === 'ssl') {
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
            } elseif ($smtp['secure'] === 'tls') {
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            }
            $mail->CharSet    = 'UTF-8';
            $mail->Encoding   = \PHPMailer\PHPMailer\PHPMailer::ENCODING_8BIT;

            $mail->setFrom($smtp['from'], $smtp['fromName']);
            $mail->addAddress($to);
            $mail->addReplyTo($to);

            $mail->Subject = $subject;
            $mail->Body    = $body;

            return (bool)$mail->send();
        } catch (\Throwable $e) {
            error_log('[planeta-skin] SMTP send failed: ' . $e->getMessage());
            // ниже — откат на mail()
        }
    }

    // ----- Fallback: mail() с корректными заголовками -----
    $fromEmail = 'no-reply@' . $fromDomain;
    $fromName  = 'Планета здоровой кожи';

    $messageId = sprintf(
        '<%s.%s@%s>',
        date('YmdHis'),
        bin2hex(random_bytes(6)),
        $fromDomain
    );

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $encodedFrom    = '=?UTF-8?B?' . base64_encode($fromName) . '?= <' . $fromEmail . '>';

    $headers  = 'From: ' . $encodedFrom . "\r\n";
    $headers .= 'Reply-To: ' . $to . "\r\n";
    $headers .= 'Return-Path: ' . $fromEmail . "\r\n";
    $headers .= 'Message-ID: ' . $messageId . "\r\n";
    $headers .= 'Date: ' . date('r') . "\r\n";
    $headers .= 'MIME-Version: 1.0' . "\r\n";
    $headers .= 'Content-Type: text/plain; charset=UTF-8' . "\r\n";
    $headers .= 'Content-Transfer-Encoding: 8bit' . "\r\n";
    $headers .= 'X-Mailer: planeta-skin-site' . "\r\n";
    $headers .= 'Auto-Submitted: auto-generated' . "\r\n";

    return @mail($to, $encodedSubject, $body, $headers, '-f' . $fromEmail);
}

/**
 * Загружает капча-конфиг из config.local.php. Возвращает null, если файла нет,
 * секция отсутствует, или captcha.enabled = false. В этом случае проверка
 * капчи пропускается (полезно для локалки, но в проде включать обязательно).
 *
 * @return array{server_key:string}|null
 */
function load_captcha_config(): ?array {
    $cfg = load_local_config();
    if (!is_array($cfg) || !isset($cfg['captcha']) || !is_array($cfg['captcha'])) return null;

    $c = $cfg['captcha'];
    if (empty($c['enabled'])) return null;
    if (empty($c['server_key'])) return null;

    $key = (string)$c['server_key'];

    /**
     * Самая частая ошибка настройки: в server_key вставлен КЛИЕНТСКИЙ ключ.
     * Ключи выглядят почти одинаково (оба 53 символа), но клиентский начинается
     * с ysc1_, а серверный — с ysc2_. С ysc1_ Яндекс отвечает 403 «Authentication
     * failed. Invalid secret» на каждую заявку, и форма превращается в «не удалось
     * пройти проверку я не робот» — то есть винит посетителя в поломке конфига.
     *
     * Возвращаем null: дальше сработает штатный fail-closed для прода — человек
     * увидит честное «техническая проблема на сервере» и телефон, заявка попадёт
     * в drops.jsonl как captcha_misconfigured, а в error_log — строка ниже.
     */
    if (str_starts_with($key, 'ysc1_')) {
        error_log(
            '[planeta-skin] captcha: в config.local.php captcha.server_key начинается с ysc1_ — '
            . 'это КЛИЕНТСКИЙ ключ (тот же, что в src/js/config.js). Нужен СЕРВЕРНЫЙ ключ той же '
            . 'капчи, он начинается с ysc2_: консоль Yandex Cloud → SmartCaptcha → ваша капча → ключ сервера.'
        );
        return null;
    }

    return ['server_key' => $key];
}

/**
 * Осознанное разрешение работать на проде БЕЗ капчи (captcha.allow_missing).
 *
 * Нужно как аварийный клапан: если Yandex SmartCaptcha недоступна или ключи
 * протухли, владелец сайта может временно вернуть приём заявок, поставив флаг
 * вручную. По умолчанию выключено — отсутствие конфига на проде трактуется
 * как поломка, а не как «капча не нужна».
 */
function captcha_allow_missing(): bool {
    $cfg = load_local_config();
    return is_array($cfg)
        && isset($cfg['captcha']) && is_array($cfg['captcha'])
        && !empty($cfg['captcha']['allow_missing']);
}

/**
 * Проверяет токен SmartCaptcha через Yandex API. Возвращает true, если токен
 * действительный. Сетевые ошибки трактуем как НЕвалидный токен (fail closed) —
 * лучше попросить пользователя повторить, чем пропустить ботов в окно сбоя API.
 */
function verify_smartcaptcha(string $token, string $serverKey, string $ip, ?string &$reason = null): bool {
    if ($token === '') {
        $reason = 'empty_token';
        error_log('[planeta-skin] captcha: пустой smart-token — виджет не отдал токен (адблок, ошибка SDK или старая сборка фронтенда без капчи)');
        return false;
    }

    $payload = http_build_query([
        'secret' => $serverKey,
        'token'  => $token,
        'ip'     => $ip,
    ], '', '&', PHP_QUERY_RFC3986);

    if (function_exists('curl_init')) {
        $ch = curl_init(SMARTCAPTCHA_VALIDATE_URL);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 4,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
        ]);
        $resp = curl_exec($ch);
        $http = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);
        // 403 от Яндекса — это НЕ сетевая проблема, а отвергнутый серверный
        // ключ («Authentication failed. Invalid secret»). Разделяем случаи:
        // иначе в логе окажется совет чинить исходящий HTTPS, который исправен.
        if ($http === 403) {
            $reason = 'bad_secret';
            error_log(
                '[planeta-skin] captcha: Yandex не принял серверный ключ (HTTP 403). '
                . 'В config.local.php должен лежать ключ вида ysc2_ от той же капчи, '
                . 'что и клиентский ysc1_ в src/js/config.js. Ответ: ' . substr((string)$resp, 0, 200)
            );
            return false;
        }

        if (!is_string($resp) || $http !== 200) {
            $reason = 'network';
            error_log(sprintf(
                '[planeta-skin] captcha: запрос к Yandex не удался (HTTP %d, curl: %s). '
                . 'Похоже на заблокированный исходящий HTTPS с хостинга.',
                $http,
                $curlErr !== '' ? $curlErr : 'без ошибки'
            ));
            return false;
        }
    } else {
        $ctx = stream_context_create([
            'http' => [
                'method'        => 'POST',
                'header'        => "Content-Type: application/x-www-form-urlencoded\r\n",
                'content'       => $payload,
                'timeout'       => 4,
                'ignore_errors' => true,
            ],
        ]);
        $resp = @file_get_contents(SMARTCAPTCHA_VALIDATE_URL, false, $ctx);
        if (!is_string($resp)) {
            $reason = 'network';
            error_log('[planeta-skin] captcha: file_get_contents к Yandex не удался (cURL на хостинге нет, исходящий HTTPS закрыт?)');
            return false;
        }
    }

    $data = json_decode($resp, true);
    if (!is_array($data)) {
        $reason = 'bad_response';
        error_log('[planeta-skin] captcha: ответ Yandex не разобран как JSON: ' . substr($resp, 0, 200));
        return false;
    }

    if (($data['status'] ?? '') !== 'ok') {
        $reason = 'rejected';
        // Самая частая причина здесь — ключи от разных капча-инстансов:
        // клиентский ysc1_ в src/js/config.js и серверный ysc2_ в config.local.php
        // должны принадлежать одной капче в консоли Yandex Cloud.
        error_log(sprintf(
            '[planeta-skin] captcha: Yandex отклонил токен (status=%s, message=%s, длина токена=%d). '
            . 'Проверьте, что ysc1_ на фронте и ysc2_ на сервере — от одной капчи, '
            . 'и что на сервере лежит актуальная сборка dist/.',
            (string)($data['status'] ?? 'нет'),
            (string)($data['message'] ?? 'нет'),
            strlen($token)
        ));
        return false;
    }

    return true;
}

function is_bot_ua(string $ua): bool {
    $ua = trim($ua);
    if ($ua === '') return true; // пустой UA — заведомо не браузер

    $needle = strtolower($ua);
    foreach (BOT_UA_PATTERNS as $pattern) {
        if (str_contains($needle, $pattern)) return true;
    }
    return false;
}

/**
 * Проверяет, что Referer пришёл с одного из разрешённых хостов.
 * Пустой Referer считаем подозрительным (реальные браузеры в same-origin POST
 * по умолчанию его шлют, а боты с cURL — нет).
 */
function referer_ok(string $referer): bool {
    if ($referer === '') return false;
    $host = parse_url($referer, PHP_URL_HOST);
    if (!is_string($host) || $host === '') return false;
    return in_array(strtolower($host), ALLOWED_REFERER_HOSTS, true);
}

function rate_limit_ok(string $dir, string $ip, int $maxAttempts = 10, int $windowSec = 600): bool {
    ensure_dir($dir);

    $key = hash('sha256', $ip);
    $file = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . $key . '.json';

    $now = time();
    $data = [];

    $fp = @fopen($file, 'c+');
    if (!$fp) return true; // если не можем записать, не блокируем (чтобы не ломать конверсию)

    flock($fp, LOCK_EX);

    $contents = stream_get_contents($fp);
    if (is_string($contents) && $contents !== '') {
        $decoded = json_decode($contents, true);
        if (is_array($decoded)) $data = $decoded;
    }

    // оставляем только окна последних N секунд
    $data = array_values(array_filter($data, fn($t) => is_int($t) && ($now - $t) <= $windowSec));

    if (count($data) >= $maxAttempts) {
        flock($fp, LOCK_UN);
        fclose($fp);
        return false;
    }

    $data[] = $now;

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data, JSON_UNESCAPED_UNICODE));

    flock($fp, LOCK_UN);
    fclose($fp);

    return true;
}

/* ---------------- main ---------------- */

// CORS / Origin check
$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
$selfHost = (string)($_SERVER['HTTP_HOST'] ?? '');
$isSameOrigin = $origin === '' || parse_url($origin, PHP_URL_HOST) === $selfHost;

if ($origin !== '' && !$isSameOrigin) {
    if (!in_array($origin, ALLOWED_ORIGINS, true)) {
        json_out(false, ['message' => 'Origin not allowed'], 403);
    }
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Accept, Content-Type, X-Requested-With');
}

// Preflight
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    redirect_303('/');
}

// куда возвращаться при ошибке (для не-JSON)
$pageFromPost = str_trim((string)($_POST['page'] ?? ''), 400);
$returnTo = safe_path($pageFromPost !== '' ? $pageFromPost : '/', '/');
$returnToWithAnchor = $returnTo . (str_contains($returnTo, '#') ? '' : '#form');

/**
 * Антибот-сигналы делятся на две группы.
 *
 * ЖЁСТКИЕ (bot_ua, referer_foreign, honeypot, fill_time_fast) — за ними живого
 * человека быть не может. Они отдают фейковый успех (303 на /thanks/ или JSON
 * ok:true), чтобы бот не понял, что именно его выдало, и не подбирал обход.
 *
 * МЯГКИЕ (пустой Referer, пустой fill_time) — так выглядит и бот, и реальный
 * человек в приватном режиме или с отключённым JS. Раньше они тоже отдавали
 * фейковое «спасибо»: человек уходил уверенным, что записался, а заявки не было.
 * Теперь такие запросы получают честную ошибку с телефоном (reject_lead).
 *
 * Дроп любой группы пишется в drops.jsonl с причиной и контактами из формы:
 * по логу видно масштаб ложных срабатываний, а клиенту можно перезвонить.
 */
function log_silent_drop(string $reason): void {
    $logDir = data_dir();
    rotate_monthly($logDir . '/drops.jsonl');

    $entry = [
        'date'    => date('Y-m-d H:i:s'),
        'reason'  => $reason,
        'ip'      => (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'),
        'ua'      => str_trim((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 300),
        'referer' => str_trim((string)($_SERVER['HTTP_REFERER'] ?? ''), 400),
        'page'    => str_trim((string)($_POST['page'] ?? ''), 400),
        'form_id' => str_trim((string)($_POST['form_id'] ?? ''), 60),
        'name'    => str_trim((string)($_POST['name'] ?? ''), 100),
        'phone'   => str_trim((string)($_POST['phone'] ?? ''), 80),
    ];

    @file_put_contents(
        $logDir . '/drops.jsonl',
        json_encode($entry, JSON_UNESCAPED_UNICODE) . PHP_EOL,
        FILE_APPEND
    );
}

function silent_drop(string $reason): void {
    log_silent_drop($reason);
    if (wants_json()) json_out(true, ['redirect' => THANKS_URL]);
    redirect_303(THANKS_URL);
}

/**
 * Честный отказ: в отличие от silent_drop() НЕ притворяется успехом.
 *
 * Применяется там, где за сигналом может стоять живой человек (приватный
 * браузер без Referer, выключённый JS, сломанная капча). Пользователь видит
 * причину и телефон, а контакты всё равно уходят в drops.jsonl — клинике
 * есть кому перезвонить, даже если отправка не прошла.
 */
function reject_lead(string $reason, string $message, string $errorCode, string $returnTo, int $status = 422): void {
    log_silent_drop($reason);
    if (wants_json()) json_out(false, ['message' => $message], $status);
    redirect_303($returnTo . (str_contains($returnTo, '?') ? '&' : '?') . 'lead_error=' . $errorCode);
}

/**
 * Конфиг капчи загружаем до антибот-эвристик: когда капча включена, она —
 * основной фильтр ботов, и «мягкие» сигналы (пустой Referer, пустой fill_time)
 * можно не делать фатальными — реальный человек с приватным браузером дойдёт
 * до капчи и пройдёт её, а бот — нет.
 */
$captchaCfg = load_captcha_config();
$captchaEnabled = $captchaCfg !== null;

// Bot UA: cURL, python-requests, axios без браузера и т.п.
if (is_bot_ua((string)($_SERVER['HTTP_USER_AGENT'] ?? ''))) {
    silent_drop('bot_ua');
}

// Referer с ЧУЖОГО хоста — однозначно чужая форма или прямой POST бота: режем всегда.
// Пустой Referer бывает и у живых людей (приватный режим, антитрекинг-расширения),
// поэтому при включённой капче пропускаем такой запрос дальше — его проверит капча.
// Без капчи (локалка/деградация) сохраняем прежнее строгое поведение.
$referer = (string)($_SERVER['HTTP_REFERER'] ?? '');
if ($referer !== '' && !referer_ok($referer)) {
    silent_drop('referer_foreign');
}
if ($referer === '' && !$captchaEnabled) {
    reject_lead(
        'referer_empty',
        'Не удалось подтвердить, что форма отправлена с нашего сайта. Обновите страницу '
        . 'и попробуйте ещё раз или позвоните: ' . CONTACT_PHONE,
        'browser',
        $returnToWithAnchor
    );
}

// honeypot
$honeypot = str_trim((string)($_POST['website'] ?? ''), 200);
if ($honeypot !== '') {
    silent_drop('honeypot');
}

// Слишком быстрое заполнение (< 900 мс) — сигнал бота: живой человек так не успеет.
// Пустой fill_time_ms означает «нет JS». Без JS не будет и токена капчи, поэтому
// при включённой капче такой запрос честно упрётся в неё и получит осмысленную
// ошибку. Без капчи отвечаем сами — но тоже честно, а не фейковым «спасибо».
$fillTimeMs = (int)($_POST['fill_time_ms'] ?? 0);
if ($fillTimeMs > 0 && $fillTimeMs < 900) {
    silent_drop('fill_time_fast');
}
if ($fillTimeMs <= 0 && !$captchaEnabled) {
    reject_lead(
        'fill_time_empty',
        'Похоже, в браузере отключён JavaScript — форму не получится отправить. '
        . 'Включите его и попробуйте ещё раз или позвоните: ' . CONTACT_PHONE,
        'nojs',
        $returnToWithAnchor
    );
}

// rate-limit по IP
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rlDir = data_dir() . '/ratelimit';
if (!rate_limit_ok($rlDir, $ip, 10, 600)) {
    $msg = 'Слишком много попыток. Попробуйте чуть позже или позвоните: ' . CONTACT_PHONE;
    if (wants_json()) json_out(false, ['message' => $msg], 429);
    redirect_303($returnToWithAnchor . (str_contains($returnToWithAnchor, '?') ? '&' : '?') . 'lead_error=rate');
}

/**
 * SmartCaptcha. В отличие от UA/Referer/honeypot это НЕ silent_drop —
 * у настоящего пользователя капча иногда подтормаживает или истекает,
 * поэтому даём осмысленное сообщение (фронт сбросит виджет и пользователь
 * сможет нажать «Отправить» ещё раз).
 *
 * На локалке и на превью-хостах отсутствие config.local.php просто отключает
 * проверку. На проде это трактуется как поломка: раньше форма продолжала
 * принимать заявки без всякой проверки (fail-open) и об этом узнавали только
 * из письма постфактум. Теперь — fail-closed: заявка не принимается, человек
 * видит телефон, контакты падают в drops.jsonl, а в error_log уходит причина.
 *
 * Аварийный клапан: captcha.allow_missing = true в config.local.php возвращает
 * приём заявок без капчи (например, если SmartCaptcha недоступна).
 */
$captchaMissingOnProd = !$captchaEnabled
    && in_array(strtolower((string)($_SERVER['HTTP_HOST'] ?? '')), PROD_HOSTS, true);

if ($captchaMissingOnProd) {
    error_log('[planeta-skin] ВНИМАНИЕ: SmartCaptcha выключена на проде — проверьте send-form/config.local.php (captcha.enabled + server_key)');

    if (!captcha_allow_missing()) {
        reject_lead(
            'captcha_misconfigured',
            'Форма временно не работает из-за технической проблемы на сервере. '
            . 'Позвоните, пожалуйста: ' . CONTACT_PHONE . ' — мы запишем вас сразу.',
            'captcha_config',
            $returnToWithAnchor,
            503
        );
    }
}

if ($captchaEnabled) {
    // Токены SmartCaptcha длиннее 4096 символов не встречаются, но обрезка
    // молча превратила бы валидный токен в невалидный — поэтому режем с запасом.
    $captchaToken = str_trim((string)($_POST['smart-token'] ?? ''), 8192);

    $captchaReason = null;
    if (!verify_smartcaptcha($captchaToken, $captchaCfg['server_key'], $ip, $captchaReason)) {
        // Неверный ключ, недоступный сервис или неразобранный ответ — это
        // поломка на нашей стороне. Просить в таком случае «попробуйте ещё раз»
        // жестоко: результат не изменится, сколько ни жми. Отправляем к телефону.
        $ourFault = in_array($captchaReason, ['bad_secret', 'network', 'bad_response'], true);

        // Через reject_lead, а не напрямую: у человека, не прошедшего капчу,
        // раньше терялись и заявка, и контакты. Теперь телефон попадает
        // в drops.jsonl с точной причиной — и перезвонить есть кому,
        // и причину сбоя видно без доступа к error_log хостинга.
        reject_lead(
            'captcha_' . ($captchaReason ?? 'failed'),
            $ourFault
                ? 'Форма временно не работает из-за технической проблемы на сервере. '
                  . 'Позвоните, пожалуйста: ' . CONTACT_PHONE . ' — мы запишем вас сразу.'
                : 'Не удалось пройти проверку «я не робот». Попробуйте ещё раз или позвоните: ' . CONTACT_PHONE,
            $ourFault ? 'captcha_config' : 'captcha',
            $returnToWithAnchor,
            $ourFault ? 503 : 422
        );
    }
}

// сбор
$name = str_trim((string)($_POST['name'] ?? ''), 100); // опционально
$phoneRaw = str_trim((string)($_POST['phone'] ?? ''), 80);
$contactMethod = str_trim((string)($_POST['contact_method'] ?? 'call'), 20);
$comment = str_trim((string)($_POST['comment'] ?? ''), 800);
$service = str_trim((string)($_POST['service'] ?? ''), 120);
$formId = str_trim((string)($_POST['form_id'] ?? ''), 60);
$policyVersion = str_trim((string)($_POST['policy_version'] ?? ''), 40);
$referrer = str_trim((string)($_POST['referrer'] ?? ''), 400);

// Заказ косметики (если форма пришла из магазина)
$isShopOrder = $formId === 'shop_cosmetics_order' || !empty($_POST['cart_json']);
$order = null;
if ($isShopOrder) {
    $order = build_order_from_cart((string)($_POST['cart_json'] ?? ''));
    if (!$order['ok']) {
        $msg = $order['error'] ?? 'Корзина не заполнена.';
        if (wants_json()) json_out(false, ['message' => $msg], 422);
        redirect_303($returnToWithAnchor . (str_contains($returnToWithAnchor, '?') ? '&' : '?') . 'lead_error=cart');
    }
    // Для заказов service собираем сами: «Заказ магазина — N позиций на X ₽»
    if ($service === '' || stripos($service, 'подбор') !== false) {
        $service = 'Заказ косметики Pro You — ' . count($order['items']) . ' поз. на ' . number_format($order['total'], 0, ',', ' ') . ' ₽';
    }
}

$consent = isset($_POST['consent']);

$utm = [
    'utm_source' => str_trim((string)($_POST['utm_source'] ?? ''), 120),
    'utm_medium' => str_trim((string)($_POST['utm_medium'] ?? ''), 120),
    'utm_campaign' => str_trim((string)($_POST['utm_campaign'] ?? ''), 120),
    'utm_content' => str_trim((string)($_POST['utm_content'] ?? ''), 120),
    'utm_term' => str_trim((string)($_POST['utm_term'] ?? ''), 120),
    'gclid' => str_trim((string)($_POST['gclid'] ?? ''), 200),
    'yclid' => str_trim((string)($_POST['yclid'] ?? ''), 200),
];

// валидация
$fieldErrors = [];

// phone обязателен
$normalized = normalize_ru_phone($phoneRaw);
if (!$normalized['ok']) {
    $fieldErrors['phone'] = 'Похоже, номер неполный. Проверьте, пожалуйста.';
}

// name опционален, но если есть, пусть будет адекватным
if ($name !== '' && mb_strlen($name) < 2) {
    $fieldErrors['name'] = 'Напишите, пожалуйста, как к вам обращаться (минимум 2 символа).';
}

// consent обязателен
if (!$consent) {
    $fieldErrors['consent'] = 'Нужно согласие на обработку персональных данных.';
}

$allowedMethods = ['call', 'max'];
if (!in_array($contactMethod, $allowedMethods, true)) {
    $contactMethod = 'call';
}

// Человекочитаемая подпись способа связи — используется в email-уведомлении
$methodLabel = $contactMethod === 'max' ? 'MAX (мессенджер)' : 'Звонок';

if (!empty($fieldErrors)) {
    if (wants_json()) {
        json_out(false, [
            'message' => 'Проверьте форму, пожалуйста.',
            'fieldErrors' => $fieldErrors,
        ], 422);
    }

    // fallback без JS: вернемся на страницу формы с кодом ошибки (без ПД в URL)
    redirect_303($returnToWithAnchor . (str_contains($returnToWithAnchor, '?') ? '&' : '?') . 'lead_error=1');
}

// логирование
$logDir = data_dir();
maintain_logs($logDir, $rlDir);

$logData = [
    'date' => date('Y-m-d H:i:s'),
    'ip' => $ip,
    'ua' => (string)($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'),

    'form_id' => $formId,
    'page' => $pageFromPost,
    'referrer' => $referrer,
    'service' => $service,

    'name' => $name,
    'phone' => $normalized['e164'],
    'contact_method' => $contactMethod,
    'comment' => $comment,

    'consent' => true,
    'policy_version' => $policyVersion,

    'utm' => $utm,
];

if ($order && $order['ok']) {
    $logData['order'] = [
        'items' => $order['items'],
        'total' => $order['total'],
    ];
}

@file_put_contents(
    $logDir . '/leads.jsonl',
    json_encode($logData, JSON_UNESCAPED_UNICODE) . PHP_EOL,
    FILE_APPEND
);

// email (может быть выключен/ограничен на хостинге, но пусть будет)
$to = 'mc@hs-planet.ru';
$subject = 'Новая заявка с сайта';

$lines = [];
$isOrder = $order && $order['ok'];

$lines[] = $isOrder ? 'Новый заказ косметики Pro You' : 'Новая заявка';
$lines[] = '';
$lines[] = 'Телефон: ' . $normalized['display'];
if ($name !== '') $lines[] = 'Имя: ' . $name;
$lines[] = 'Способ связи: ' . $methodLabel;
if ($service !== '') $lines[] = 'Услуга: ' . $service;
$lines[] = 'Страница: ' . ($pageFromPost !== '' ? $pageFromPost : $returnTo);

if ($isOrder) {
    $lines[] = '';
    $lines[] = 'Состав заказа:';
    foreach ($order['items'] as $it) {
        $lines[] = sprintf(
            ' — [%s] %s (%s) × %d × %s ₽ = %s ₽',
            $it['code'] ?? '—',
            $it['name'],
            $it['size'],
            $it['qty'],
            number_format($it['price'], 0, ',', ' '),
            number_format($it['sum'], 0, ',', ' ')
        );
    }
    $lines[] = '';
    $lines[] = 'Итого: ' . number_format($order['total'], 0, ',', ' ') . ' ₽';
    // Подсказка про расчет — в клинике подтверждают заказ и согласуют оплату и получение.
    $subject = 'Заказ с сайта на ' . number_format($order['total'], 0, ',', ' ') . ' ₽';
}

if ($comment !== '') {
    $lines[] = '';
    $lines[] = 'Комментарий:';
    $lines[] = $comment;
}
$lines[] = '';
$lines[] = 'Дата: ' . date('d.m.Y H:i');
$lines[] = 'Согласие: получено';

// Досюда с $captchaMissingOnProd = true можно дойти только при явно включённом
// аварийном клапане captcha.allow_missing — иначе заявка отклоняется выше.
if ($captchaMissingOnProd) {
    $lines[] = '';
    $lines[] = '⚠ ВНИМАНИЕ: проверка SmartCaptcha ВЫКЛЮЧЕНА, форма работает в аварийном режиме '
        . '(captcha.allow_missing = true в send-form/config.local.php). Защиты от ботов сейчас нет — '
        . 'верните капчу и снимите флаг, как только это станет возможно.';
}

/**
 * Сводка операционных проблем за последние сутки. Появляется только когда есть
 * о чём сообщить, чтобы не превращаться в шум, который перестают читать.
 *
 * Строки про отклонённые отправки здесь больше нет: она отсылала к drops.jsonl,
 * а у администраторов, читающих эти письма, доступа к файлам на сервере нет —
 * получалась тревога без возможности что-то с ней сделать. Отказы по-прежнему
 * пишутся в drops.jsonl для того, кто может туда посмотреть.
 */
$ops = ops_recent();
if (!empty($ops['mail_failures'])) {
    $lines[] = '';
    $lines[] = '— За последние сутки —';
    $lines[] = 'Писем не доставлено: ' . $ops['mail_failures']
        . '. Заявки при этом сохранены, список — в mail-failures.jsonl.';
}

$body = implode("\n", $lines);

/*
 * Отправка email. send_lead_email() сначала пробует SMTP (если в
 * config.local.php прописаны креды и установлен PHPMailer), иначе откатывается
 * на mail() с корректными заголовками. Заявка в любом случае уже залогирована
 * в data/leads.jsonl выше — почта это бонусный канал доставки.
 *
 * Провал отправки фиксируем в data/mail-failures.jsonl: почтовый сбой сам по
 * себе невидим (заявки продолжают тихо копиться в leads.jsonl), а по этому логу
 * его можно заметить и перезвонить клиентам, чьи письма не дошли.
 */
if (!send_lead_email($to, $subject, $body, 'hs-planet.ru')) {
    // Счётчик увидят в следующем успешно доставленном письме: пока почта лежит,
    // сообщить о поломке почтой всё равно невозможно.
    ops_bump('mail_failures');

    @file_put_contents(
        $logDir . '/mail-failures.jsonl',
        json_encode([
            'date'    => date('Y-m-d H:i:s'),
            'phone'   => $normalized['e164'],
            'form_id' => $formId,
            'subject' => $subject,
        ], JSON_UNESCAPED_UNICODE) . PHP_EOL,
        FILE_APPEND
    );
}

// успех
if (wants_json()) {
    json_out(true, ['redirect' => THANKS_URL]);
}
redirect_303(THANKS_URL);
