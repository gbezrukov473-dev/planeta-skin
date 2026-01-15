/**
 * Модуль прелоадера
 * Прелоадер добавлен только в index.html
 */
export function initPreloader() {
  const preloader = document.getElementById("preloader");
  const colorLayer = document.getElementById("preloader-color");

  // Если прелоадера нет на странице - выходим
  if (!preloader) return;

  let preloaderShown = false;
  try {
    preloaderShown = sessionStorage.getItem("preloaderShown") === "true";
  } catch (e) {
    // storage может быть недоступен - ок
  }

  const removePreloader = () => {
    if (preloader && preloader.isConnected) preloader.remove();
  };

  const hidePreloader = () => {
    if (!preloader || !preloader.isConnected) return;
    preloader.classList.add("preloader-hidden");
    setTimeout(removePreloader, 500);
  };

  // аварийно скрыть через 5 сек (если что-то зависло)
  const safetyTimeout = setTimeout(hidePreloader, 5000);

  if (preloaderShown) {
    clearTimeout(safetyTimeout);
    removePreloader();
  } else {
    try {
      sessionStorage.setItem("preloaderShown", "true");
    } catch (e) {}

    if (colorLayer) colorLayer.classList.add("animate-fill");

    window.addEventListener(
      "load",
      () => {
        clearTimeout(safetyTimeout);
        setTimeout(hidePreloader, 800);
      },
      { once: true }
    );
  }
}
