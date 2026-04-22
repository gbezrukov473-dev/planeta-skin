/**
 * Баннер согласия на cookies. Показывается один раз — либо после того,
 * как пользователь прокрутил больше ~30% страницы, либо через 5 секунд
 * бездействия, в зависимости от того, что произойдет раньше.
 */
export function initCookieBanner() {
  const banner = document.getElementById("cookie-banner");
  if (!banner) return;

  const STORAGE_KEY = "cookie_consent";
  const STATE_ACCEPTED = "accepted";
  const STATE_DECLINED = "declined";

  const state = safeGet(STORAGE_KEY);
  if (state === STATE_ACCEPTED || state === STATE_DECLINED) {
    banner.classList.add("hidden");
    return;
  }

  let shown = false;

  const show = () => {
    if (shown) return;
    shown = true;
    banner.classList.remove("hidden");
    window.removeEventListener("scroll", onScroll);
    clearTimeout(fallbackTimer);
  };

  const finalize = (value) => {
    safeSet(STORAGE_KEY, value);
    banner.classList.add("hidden");
    window.dispatchEvent(new CustomEvent("cookieBannerClosed", { detail: { state: value } }));
  };

  const onScroll = () => {
    const viewport = window.scrollY + window.innerHeight;
    const docH = document.documentElement.scrollHeight || 1;
    if ((viewport / docH) * 100 >= 30) show();
  };

  const acceptBtn = document.getElementById("cookie-accept");
  if (acceptBtn) acceptBtn.addEventListener("click", () => finalize(STATE_ACCEPTED));

  const declineBtn = document.getElementById("cookie-decline");
  if (declineBtn) declineBtn.addEventListener("click", () => finalize(STATE_DECLINED));

  window.addEventListener("scroll", onScroll, { passive: true });
  const fallbackTimer = setTimeout(show, 5000);
}

function safeGet(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, val); } catch (_) { /* no-op */ }
}
