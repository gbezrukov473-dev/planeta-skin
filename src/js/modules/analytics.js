/**
 * Аналитика: Яндекс.Метрика + Top.Mail.Ru.
 *
 * Счётчики НЕ подключаются, пока пользователь не принял cookies. Метрика
 * работает с webvisor:true — она записывает действия в формах, то есть
 * собирает персональные данные. Раньше снипеты стояли инлайном в <head>
 * каждой страницы и грузились безусловно, а баннер согласия только писал
 * отметку в localStorage — согласие было декоративным.
 *
 * Точки входа:
 *  - согласие уже сохранено (cookie_consent = accepted) → грузим сразу;
 *  - пользователь нажал «Принять» → ловим событие cookieBannerClosed
 *    и подключаем счётчики без перезагрузки страницы.
 *
 * Отказ или отсутствие решения — счётчики не подключаются вообще.
 * Ключ localStorage и значения должны совпадать с cookieBanner.js.
 */
import { METRIKA_ID, TOP_MAIL_RU_ID } from "../config.js";

const CONSENT_KEY = "cookie_consent";
const CONSENT_ACCEPTED = "accepted";

const METRIKA_SRC = "https://mc.yandex.ru/metrika/tag.js";
const TOP_MAIL_RU_SRC = "https://top-fwz1.mail.ru/js/code.js";

let loaded = false;

export function initAnalytics() {
  // Опт-аут для отдельных страниц: <meta name="pzk-analytics" content="off">.
  // Используется на thanks.html — страница закрыта от индексации, и решение
  // не считать её отдельным просмотром принято осознанно (см. комментарий там).
  if (document.querySelector('meta[name="pzk-analytics"][content="off"]')) return;

  if (readConsent() === CONSENT_ACCEPTED) {
    loadCounters();
    return;
  }

  window.addEventListener("cookieBannerClosed", (event) => {
    if (event.detail && event.detail.state === CONSENT_ACCEPTED) loadCounters();
  });
}

function readConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch (_) {
    return null;
  }
}

function loadCounters() {
  if (loaded) return;
  loaded = true;

  // Хинты добавляем здесь, а не в <head>: до согласия соединение с доменами
  // аналитики открывать незачем.
  addResourceHint("preconnect", "https://mc.yandex.ru");
  addResourceHint("preconnect", "https://top-fwz1.mail.ru");

  loadMetrika();
  loadTopMailRu();
}

function loadMetrika() {
  if (!METRIKA_ID) return;

  // Очередь вызовов до загрузки tag.js — как в официальном снипете Метрики.
  if (!window.ym) {
    window.ym = function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.l = 1 * new Date();
  }

  injectScript(METRIKA_SRC);

  window.ym(METRIKA_ID, "init", {
    webvisor: true,
    clickmap: true,
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true,
  });
}

function loadTopMailRu() {
  if (!TOP_MAIL_RU_ID) return;

  const tmr = (window._tmr = window._tmr || []);
  tmr.push({ id: String(TOP_MAIL_RU_ID), type: "pageView", start: Date.now() });

  injectScript(TOP_MAIL_RU_SRC, "tmr-code");
}

function injectScript(src, id) {
  if (id && document.getElementById(id)) return;
  if (Array.prototype.some.call(document.scripts, (s) => s.src === src)) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  if (id) script.id = id;

  const first = document.getElementsByTagName("script")[0];
  if (first && first.parentNode) first.parentNode.insertBefore(script, first);
  else document.head.appendChild(script);
}

function addResourceHint(rel, href) {
  if (document.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;

  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  link.crossOrigin = "";
  document.head.appendChild(link);
}
