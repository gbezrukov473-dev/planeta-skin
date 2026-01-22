/**
 * Модуль кнопки "Наверх"
 */
export function initScrollToTop() {
  const button = document.getElementById("scroll-to-top");
  if (!button) return;

  const cookieBanner = document.getElementById("cookie-banner");

  // Обновляем позицию кнопки в зависимости от видимости баннера
  function updateButtonPosition() {
    const bannerVisible = cookieBanner && !cookieBanner.classList.contains("hidden");
    const isMobile = window.innerWidth <= 640;
    
    if (bannerVisible) {
      // Если баннер виден, поднимаем кнопку выше баннера
      button.style.bottom = isMobile ? "9rem" : "8rem";
    } else {
      // Обычная позиция - в углу
      button.style.bottom = isMobile ? "1.5rem" : "2rem";
    }
  }

  // Показываем/скрываем кнопку при прокрутке
  function toggleButton() {
    if (window.scrollY > 300) {
      button.classList.remove("opacity-0", "pointer-events-none");
      button.classList.add("opacity-100");
    } else {
      button.classList.add("opacity-0", "pointer-events-none");
      button.classList.remove("opacity-100");
    }
    updateButtonPosition();
  }

  // Плавная прокрутка наверх
  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  // Слушаем событие прокрутки
  window.addEventListener("scroll", toggleButton, { passive: true });
  
  // Следим за изменением размера окна
  window.addEventListener("resize", updateButtonPosition);
  
  // Следим за появлением/исчезновением баннера через MutationObserver
  if (cookieBanner) {
    const observer = new MutationObserver(() => {
      // Небольшая задержка для завершения анимации
      setTimeout(updateButtonPosition, 50);
    });
    observer.observe(cookieBanner, {
      attributes: true,
      attributeFilter: ["class"]
    });
  }
  
  // Слушаем кастомное событие закрытия баннера
  window.addEventListener("cookieBannerClosed", () => {
    setTimeout(updateButtonPosition, 50);
  });
  
  // Проверяем начальное состояние
  toggleButton();
}
