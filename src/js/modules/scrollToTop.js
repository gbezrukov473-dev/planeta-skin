/**
 * Модуль кнопки "Наверх"
 */
export function initScrollToTop() {
  const button = document.getElementById("scroll-to-top");
  if (!button) return;

  const cookieBanner = document.getElementById("cookie-banner");

  // Обновляем позицию кнопки в зависимости от видимости баннера
  function updateButtonPosition() {
    if (cookieBanner && !cookieBanner.classList.contains("hidden")) {
      // Если баннер виден, поднимаем кнопку выше
      if (window.innerWidth <= 640) {
        button.style.bottom = "10rem";
      } else {
        button.style.bottom = "10rem";
      }
    } else {
      // Обычная позиция
      if (window.innerWidth <= 640) {
        button.style.bottom = "6rem";
      } else {
        button.style.bottom = "2rem";
      }
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
  window.addEventListener("scroll", toggleButton);
  
  // Следим за изменением размера окна
  window.addEventListener("resize", updateButtonPosition);
  
  // Следим за появлением/исчезновением баннера
  if (cookieBanner) {
    const observer = new MutationObserver(updateButtonPosition);
    observer.observe(cookieBanner, {
      attributes: true,
      attributeFilter: ["class"]
    });
  }
  
  // Слушаем событие закрытия баннера
  window.addEventListener("cookieBannerClosed", () => {
    // Небольшая задержка для завершения анимации закрытия
    setTimeout(updateButtonPosition, 100);
  });
  
  // Проверяем начальное состояние
  toggleButton();
  updateButtonPosition();
}
