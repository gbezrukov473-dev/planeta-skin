import "./style.css";

/**
 * Стратегия загрузки:
 *  - core-модули (preloader, мобильное меню, формы, телефон-маска, lazy-images,
 *    скролл-вспомогательные, cookie-баннер) подключаются всегда — они нужны
 *    практически на каждой странице или дёшево обходятся при отсутствии целевых
 *    DOM-узлов.
 *  - тяжёлые / редкие модули (shop, lightbox, sliders, counters, scroller)
 *    лениво грузятся только если на странице есть соответствующий маркер.
 *    Это срезает ~25 КБ JS на страницах без магазина и слайдеров.
 */
import { initPreloader } from "./js/modules/preloader.js";
import { initMobileMenu } from "./js/modules/mobileMenu.js";
import { initScrollToForm } from "./js/modules/scrollToForm.js";
import { initLeadForms } from "./js/modules/forms.js";
import { initScrollToTop } from "./js/modules/scrollToTop.js";
import { initCookieBanner } from "./js/modules/cookieBanner.js";
import { initLazyImages } from "./js/modules/lazyImages.js";
import { initPhoneMask } from "./js/modules/phoneMask.js";

// === SERVICE WORKER REGISTRATION ===
// base-путь проекта (BASE_URL заканчивается слэшем: '/' или '/planeta-skin/')
const BASE = import.meta.env.BASE_URL || '/';
const SW_URL = `${BASE}sw.js`;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(SW_URL, { scope: BASE })
      .then((registration) => {
        console.log('[App] ServiceWorker registered:', registration.scope);
        
        // Проверяем, есть ли уже waiting SW
        if (registration.waiting) {
          showUpdateBanner(registration.waiting);
        }
        
        // Отслеживаем обновления
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[App] ServiceWorker update found');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[App] New ServiceWorker waiting');
              showUpdateBanner(newWorker);
            }
          });
        });
      })
      .catch((error) => {
        console.error('[App] ServiceWorker registration failed:', error);
      });
    
    // Перезагружаем страницу при смене контроллера (после skipWaiting)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[App] Controller changed, reloading...');
        window.location.reload();
      }
    });
  });
}

/**
 * Показывает баннер с предложением обновить сайт
 */
function showUpdateBanner(waitingWorker) {
  // Проверяем, не показан ли уже баннер
  if (document.getElementById('sw-update-banner')) {
    return;
  }
  
  const banner = document.createElement('div');
  banner.id = 'sw-update-banner';
  banner.innerHTML = `
    <div class="sw-update-content">
      <span class="sw-update-text">Доступна новая версия сайта</span>
      <div class="sw-update-buttons">
        <button class="sw-update-btn sw-update-btn--primary" id="sw-update-refresh">Обновить</button>
        <button class="sw-update-btn sw-update-btn--secondary" id="sw-update-dismiss">Позже</button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);
  
  // Обработчик кнопки "Обновить"
  document.getElementById('sw-update-refresh').addEventListener('click', () => {
    console.log('[App] User clicked refresh, sending SKIP_WAITING');
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  });
  
  // Обработчик кнопки "Позже"
  document.getElementById('sw-update-dismiss').addEventListener('click', () => {
    banner.remove();
  });
}

// === УТИЛИТА ДЛЯ РУЧНОЙ ОЧИСТКИ КЕША (запускать из консоли) ===
window.__pzkClearCaches = async () => {
  console.log('[App] Clearing all caches...');
  
  // Удаляем все кеши
  const cacheNames = await caches.keys();
  for (const name of cacheNames) {
    await caches.delete(name);
    console.log('[App] Deleted cache:', name);
  }
  
  // Отменяем регистрацию всех SW
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    await registration.unregister();
    console.log('[App] Unregistered SW:', registration.scope);
  }
  
  console.log('[App] All caches cleared. Reload the page.');
  return 'Done! Reload the page to re-register SW.';
};

document.addEventListener("DOMContentLoaded", () => {
  // Core — на каждой странице
  initPreloader();
  initMobileMenu();
  initScrollToForm();
  initLeadForms();
  initScrollToTop();
  initCookieBanner();
  initLazyImages();
  initPhoneMask();

  // Лениво — по DOM-маркерам. Если маркера нет, чанк не загружается вообще.
  if (document.getElementById("shop-root")) {
    import("./js/modules/shop.js").then((m) => m.initShop());
  }

  if (document.getElementById("lightbox")) {
    import("./js/modules/lightbox.js").then((m) => m.initLightbox());
  }

  if (document.getElementById("stats-section")) {
    import("./js/modules/counters.js").then((m) => m.initCounters());
  }

  if (document.querySelector(".scroller")) {
    import("./js/modules/scroller.js").then((m) => m.initScroller());
  }

  // Слайдеры — три независимых init-а в одном файле. DOM-проверки внутри
  // самих init-ов защищают от запуска без целевых узлов, поэтому достаточно
  // одной общей проверки «есть хоть один слайдер-маркер».
  if (
    document.querySelector(".slide, .equip-slide, .results-slider, .slider-container")
  ) {
    import("./js/modules/sliders.js").then((m) => {
      m.initHeroSlider();
      m.initEquipmentSlider();
      m.initRemovalSlider();
    });
  }
});
