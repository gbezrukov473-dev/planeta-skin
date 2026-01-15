/**
 * Модуль баннера согласия на cookies
 */
export function initCookieBanner() {
  const banner = document.getElementById("cookie-banner");
  if (!banner) return;

  const acceptButton = document.getElementById("cookie-accept");
  const storageKey = "cookie_consent_accepted";

  // Проверяем, было ли уже дано согласие
  const consentGiven = localStorage.getItem(storageKey);
  
  if (consentGiven === "true") {
    banner.classList.add("hidden");
    return;
  }

  // Показываем баннер, когда пользователь прокрутил примерно до середины страницы
  let bannerShown = false;
  
  function checkScrollPosition() {
    if (bannerShown) return;
    
    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollPercent = (scrollPosition / documentHeight) * 100;
    
    // Показываем баннер, когда пользователь прокрутил примерно на 40-60% страницы
    if (scrollPercent >= 40 && scrollPercent <= 60) {
      banner.classList.remove("hidden");
      bannerShown = true;
      // Удаляем обработчик после показа
      window.removeEventListener("scroll", checkScrollPosition);
    }
  }

  // Обработчик согласия
  if (acceptButton) {
    acceptButton.addEventListener("click", () => {
      localStorage.setItem(storageKey, "true");
      banner.classList.add("hidden");
    });
  }

  // Показываем баннер при прокрутке
  window.addEventListener("scroll", checkScrollPosition, { passive: true });
  
  // Если страница короткая или пользователь уже прокрутил, показываем через небольшую задержку
  setTimeout(() => {
    if (!bannerShown) {
      const scrollPercent = ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100;
      // Если страница короткая или пользователь уже прокрутил достаточно
      if (document.documentElement.scrollHeight <= window.innerHeight * 1.5 || scrollPercent >= 30) {
        banner.classList.remove("hidden");
        bannerShown = true;
        window.removeEventListener("scroll", checkScrollPosition);
      }
    }
  }, 3000);
}
