import { getPrefersReducedMotion } from "../utils/prefersReducedMotion.js";

/**
 * Карусель лицензий (Infinite Scroll)
 */
export function initScroller() {
  const scrollers = document.querySelectorAll(".scroller");
  const prefersReducedMotion = getPrefersReducedMotion();

  if (prefersReducedMotion) return;

  const makeHiddenClone = (node) => {
    const clone = node.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    if (clone.hasAttribute("tabindex")) clone.setAttribute("tabindex", "-1");

    clone
      .querySelectorAll("a, button, input, select, textarea, [tabindex]")
      .forEach((el) => el.setAttribute("tabindex", "-1"));

    return clone;
  };

  scrollers.forEach((scroller) => {
    const inner = scroller.querySelector(".scroller__inner");
    if (!inner) return;

    // защита от повторной инициализации
    if (scroller.dataset.inited === "true") return;
    scroller.dataset.inited = "true";

    scroller.setAttribute("data-animated", "true");

    // даем CSS примениться (nowrap, max-content и т.д.)
    requestAnimationFrame(() => {
      const originalItems = Array.from(inner.children);
      if (originalItems.length === 0) return;

      // 1) Добиваем базовую ширину до ширины контейнера (иначе на десктопе будут "пустоты")
      let guard = 0;
      while (inner.scrollWidth < scroller.clientWidth && guard < 30) {
        originalItems.forEach((item) => inner.appendChild(makeHiddenClone(item)));
        guard++;
      }

      // 2) Дублируем всю базу ОДИН раз для бесшовной прокрутки (-50%)
      const baseItems = Array.from(inner.children);
      baseItems.forEach((item) => inner.appendChild(makeHiddenClone(item)));
    });
  });
}
