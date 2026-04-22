/**
 * Модуль кнопки "Наверх"
 */
export function initScrollToTop() {
  const button = document.getElementById("scroll-to-top");
  if (!button) return;

  const cookieBanner = document.getElementById("cookie-banner");
  const cartToggle = document.querySelector("[data-cart-toggle]");

  // Обновляем позицию кнопки в зависимости от видимости баннера и наличия корзины
  function updateButtonPosition() {
    const bannerVisible = cookieBanner && !cookieBanner.classList.contains("hidden");
    const isMobile = window.innerWidth <= 640;

    // Если на странице есть плавающая кнопка корзины — ставим "Наверх" над ней,
    // чтобы они не перекрывали друг друга. Кнопка корзины живет на bottom-6 (1.5rem).
    // На мобиле она шире (иконка + итого), поэтому нужен доп. запас.
    const hasCart = !!cartToggle && !cartToggle.classList.contains("hidden");
    const cartOffset = hasCart ? (isMobile ? 5 : 5.5) : 0; // rem — высота кнопки корзины + зазор

    let bottomRem;
    if (bannerVisible) {
      bottomRem = (isMobile ? 9 : 8) + cartOffset;
    } else {
      bottomRem = (isMobile ? 1.5 : 2) + cartOffset;
    }
    button.style.bottom = bottomRem + "rem";
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
