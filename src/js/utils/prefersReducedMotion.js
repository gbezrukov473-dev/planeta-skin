/**
 * Утилита для проверки предпочтений пользователя по анимациям
 */
export function getPrefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}
