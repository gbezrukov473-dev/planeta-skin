/**
 * Модуль мобильного меню с поддержкой доступности (A11Y)
 */
export function initMobileMenu() {
  const menuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (!menuBtn || !mobileMenu) return;

  const closeMenu = () => {
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.classList.remove("is-open");
    menuBtn.setAttribute("aria-label", "Открыть меню");
    mobileMenu.classList.add("hidden");
  };

  const toggleMenu = () => {
    const isExpanded = menuBtn.getAttribute("aria-expanded") === "true";
    const next = !isExpanded;
    menuBtn.setAttribute("aria-expanded", String(next));
    menuBtn.classList.toggle("is-open", next);
    menuBtn.setAttribute("aria-label", next ? "Закрыть меню" : "Открыть меню");
    mobileMenu.classList.toggle("hidden");
  };

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // закрытие по клику вне
  document.addEventListener("click", (e) => {
    if (
      !mobileMenu.classList.contains("hidden") &&
      !mobileMenu.contains(e.target) &&
      !menuBtn.contains(e.target)
    ) {
      closeMenu();
    }
  });

  // закрытие по Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !mobileMenu.classList.contains("hidden")) {
      closeMenu();
      menuBtn.focus();
    }
  });
}
