/**
 * Модуль скролла к форме
 */
export function initScrollToForm() {
  const scrollButtons = document.querySelectorAll(".js-scroll-to-form");
  const formSection = document.getElementById("form");
  const mobileMenu = document.getElementById("mobile-menu");
  const menuBtn = document.getElementById("mobile-menu-btn");

  if (!formSection) return;

  scrollButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      formSection.scrollIntoView({ behavior: "smooth" });

      // если моб меню открыто - закрываем
      if (mobileMenu && !mobileMenu.classList.contains("hidden")) {
        mobileMenu.classList.add("hidden");
        if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  });
}
