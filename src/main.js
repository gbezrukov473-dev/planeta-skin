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
