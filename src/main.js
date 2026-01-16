import "./style.css";

// Импорт модулей
import { initPreloader } from "./js/modules/preloader.js";
import { initMobileMenu } from "./js/modules/mobileMenu.js";
import { initScrollToForm } from "./js/modules/scrollToForm.js";
import { initHeroSlider, initEquipmentSlider, initRemovalSlider } from "./js/modules/sliders.js";
import { initScroller } from "./js/modules/scroller.js";
import { initCounters } from "./js/modules/counters.js";
import { initLightbox } from "./js/modules/lightbox.js";
import { initLeadForms } from "./js/modules/forms.js";
import { initScrollToTop } from "./js/modules/scrollToTop.js";
import { initCookieBanner } from "./js/modules/cookieBanner.js";

// === SERVICE WORKER REGISTRATION ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
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
  
  // Стили для баннера
  const style = document.createElement('style');
  style.textContent = `
    #sw-update-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #fff;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
      padding: 1rem;
      z-index: 10000;
      animation: sw-slide-up 0.3s ease-out;
    }
    @keyframes sw-slide-up {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .sw-update-content {
      max-width: 600px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .sw-update-text {
      font-family: 'Open Sans', sans-serif;
      font-size: 0.9375rem;
      color: #334155;
      font-weight: 500;
    }
    .sw-update-buttons {
      display: flex;
      gap: 0.5rem;
    }
    .sw-update-btn {
      font-family: 'Open Sans', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    .sw-update-btn:active {
      transform: scale(0.98);
    }
    .sw-update-btn--primary {
      background: #44C8D2;
      color: #fff;
    }
    .sw-update-btn--primary:hover {
      background: #3bb5bf;
    }
    .sw-update-btn--secondary {
      background: #e2e8f0;
      color: #64748b;
    }
    .sw-update-btn--secondary:hover {
      background: #cbd5e1;
    }
    @media (max-width: 480px) {
      .sw-update-content {
        flex-direction: column;
        text-align: center;
      }
    }
  `;
  
  document.head.appendChild(style);
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
  // Инициализация всех модулей
  initPreloader();
  initMobileMenu();
  initScrollToForm();
  initHeroSlider();
  initEquipmentSlider();
  initRemovalSlider();
  initScroller();
  initCounters();
  initLightbox();
  initLeadForms();
  initScrollToTop();
  initCookieBanner();
});
