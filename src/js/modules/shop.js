/**
 * Модуль интернет-магазина Pro You для cosmetics.html.
 *
 * Что делает:
 *  - рендерит каталог из src/data/products.js;
 *  - держит корзину в localStorage;
 *  - управляет drawer (боковая панель с товарами);
 *  - перед submit формы заказа кладёт cart_json и передаёт инициативу
 *    стандартному initLeadForms (валидация, нормализация, отправка, ошибки).
 *
 * Активируется только если на странице есть <div id="shop-root">.
 */

import { PRODUCTS, CATEGORIES } from "../../data/products.js";

const STORAGE_KEY = "pzk_cart_v1";

const state = {
  cart: /** @type {Record<string, number>} */ ({}),
  filter: "all",
};

/* ---------------- bootstrap ---------------- */

export function initShop() {
  const root = document.getElementById("shop-root");
  if (!root) return;

  loadCart();
  renderCategories(root);
  renderCatalog(root);
  attachCartUI(root);
  attachOrderForm(root);
  refreshCartUI();
}

/* ---------------- storage ---------------- */

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object") {
      state.cart = Object.fromEntries(
        Object.entries(parsed).filter(([id, qty]) =>
          PRODUCTS.some((p) => p.id === id) && Number.isFinite(+qty) && +qty > 0
        )
      );
    }
  } catch (_) {
    state.cart = {};
  }
}

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
  } catch (_) {}
}

/* ---------------- helpers ---------------- */

const formatRub = (n) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";

const productById = (id) => PRODUCTS.find((p) => p.id === id);

const cartEntries = () =>
  Object.entries(state.cart).map(([id, qty]) => ({ product: productById(id), qty }))
    .filter((x) => x.product);

const cartTotal = () =>
  cartEntries().reduce((sum, { product, qty }) => sum + product.price * qty, 0);

const cartCount = () =>
  Object.values(state.cart).reduce((s, q) => s + q, 0);

/* ---------------- render: categories ---------------- */

function renderCategories(root) {
  const bar = root.querySelector("[data-category-bar]");
  if (!bar) return;

  bar.innerHTML = CATEGORIES.map((c) => `
    <button
      type="button"
      data-filter="${c.id}"
      class="category-chip whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition
        ${c.id === state.filter
          ? "bg-brand-turquoise text-white border-brand-turquoise"
          : "bg-white text-gray-600 border-gray-200 hover:border-brand-turquoise hover:text-brand-turquoise"}">
      ${c.label}
    </button>
  `).join("");

  bar.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    state.filter = btn.dataset.filter;
    bar.querySelectorAll("[data-filter]").forEach((b) => {
      const active = b.dataset.filter === state.filter;
      b.classList.toggle("bg-brand-turquoise", active);
      b.classList.toggle("text-white", active);
      b.classList.toggle("border-brand-turquoise", active);
      b.classList.toggle("bg-white", !active);
      b.classList.toggle("text-gray-600", !active);
      b.classList.toggle("border-gray-200", !active);
    });
    renderCatalog(root);
  });
}

/* ---------------- render: catalog grid ---------------- */

function renderCatalog(root) {
  const grid = root.querySelector("[data-catalog-grid]");
  if (!grid) return;

  const list = state.filter === "all"
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === state.filter);

  if (!list.length) {
    grid.innerHTML = `<p class="col-span-full text-center text-gray-500 py-12">В этой категории пока пусто. Ассортимент постепенно расширяем.</p>`;
    return;
  }

  grid.innerHTML = list.map(productCard).join("");

  // qty controls
  grid.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.add));
  });
  grid.querySelectorAll("[data-inc]").forEach((btn) => {
    btn.addEventListener("click", () => changeQty(btn.dataset.inc, +1));
  });
  grid.querySelectorAll("[data-dec]").forEach((btn) => {
    btn.addEventListener("click", () => changeQty(btn.dataset.dec, -1));
  });
}

function productCard(p) {
  const qty = state.cart[p.id] || 0;
  const initial = p.line?.[0] || p.name[0];

  // Placeholder «фото»: градиент под цвет линии + первая буква (крупно).
  // Когда появятся настоящие фото — подменим блок .product-art на <img>.
  const hue = hashHue(p.line || p.id);
  const art = `
    <div class="product-art relative aspect-square w-full overflow-hidden bg-gradient-to-br"
         style="background-image: linear-gradient(135deg, hsl(${hue} 60% 92%) 0%, hsl(${(hue + 40) % 360} 55% 84%) 100%);">
      <span class="absolute inset-0 flex items-center justify-center font-serif text-6xl font-bold text-white/70 select-none">${escapeHtml(initial)}</span>
      ${p.badge ? `<span class="absolute top-3 left-3 bg-white/90 text-brand-dark text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm">${escapeHtml(p.badge)}</span>` : ""}
    </div>`;

  const qtyBlock = qty > 0
    ? `
      <div class="flex items-center gap-2 rounded-xl border border-brand-turquoise bg-white p-1">
        <button type="button" data-dec="${p.id}" class="w-9 h-9 rounded-lg bg-brand-light/50 hover:bg-brand-turquoise hover:text-white flex items-center justify-center font-bold text-lg transition" aria-label="Уменьшить">−</button>
        <span class="flex-1 text-center font-bold text-brand-dark" data-qty-for="${p.id}">${qty}</span>
        <button type="button" data-inc="${p.id}" class="w-9 h-9 rounded-lg bg-brand-light/50 hover:bg-brand-turquoise hover:text-white flex items-center justify-center font-bold text-lg transition" aria-label="Увеличить">+</button>
      </div>`
    : `
      <button type="button" data-add="${p.id}"
        class="w-full bg-brand-peach text-brand-dark font-bold py-3 px-4 rounded-xl hover:bg-brand-turquoise hover:text-white transition text-sm shadow-sm">
        В корзину
      </button>`;

  return `
    <article class="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col group hover:shadow-lg transition">
      ${art}
      <div class="p-5 flex-1 flex flex-col">
        <div class="text-[10px] font-bold text-brand-turquoise uppercase tracking-wider mb-1">${escapeHtml(p.line || "Pro You")}</div>
        <h3 class="font-serif text-base text-brand-dark mb-2 leading-snug">${escapeHtml(p.name)}</h3>
        <p class="text-xs text-gray-500 mb-4 line-clamp-3">${escapeHtml(p.short || "")}</p>
        <div class="text-xs text-gray-400 mb-4">${escapeHtml(p.size)}</div>
        <div class="mt-auto flex items-center justify-between gap-3 mb-3">
          <span class="font-serif text-xl text-brand-dark font-bold">${formatRub(p.price)}</span>
        </div>
        <div data-qty-wrap="${p.id}">${qtyBlock}</div>
      </div>
    </article>`;
}

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

/* ---------------- cart mutations ---------------- */

function addToCart(id) {
  if (!productById(id)) return;
  state.cart[id] = (state.cart[id] || 0) + 1;
  saveCart();
  refreshCartUI();
  repaintProductCard(id);
  pulseCartButton();
}

function changeQty(id, delta) {
  if (!productById(id)) return;
  const next = (state.cart[id] || 0) + delta;
  if (next <= 0) delete state.cart[id];
  else if (next > 20) state.cart[id] = 20;
  else state.cart[id] = next;
  saveCart();
  refreshCartUI();
  repaintProductCard(id);
}

function repaintProductCard(id) {
  const wrap = document.querySelector(`[data-qty-wrap="${id}"]`);
  if (!wrap) return;
  const p = productById(id);
  const qty = state.cart[id] || 0;
  wrap.innerHTML = qty > 0
    ? `
      <div class="flex items-center gap-2 rounded-xl border border-brand-turquoise bg-white p-1">
        <button type="button" data-dec="${p.id}" class="w-9 h-9 rounded-lg bg-brand-light/50 hover:bg-brand-turquoise hover:text-white flex items-center justify-center font-bold text-lg transition" aria-label="Уменьшить">−</button>
        <span class="flex-1 text-center font-bold text-brand-dark">${qty}</span>
        <button type="button" data-inc="${p.id}" class="w-9 h-9 rounded-lg bg-brand-light/50 hover:bg-brand-turquoise hover:text-white flex items-center justify-center font-bold text-lg transition" aria-label="Увеличить">+</button>
      </div>`
    : `
      <button type="button" data-add="${p.id}"
        class="w-full bg-brand-peach text-brand-dark font-bold py-3 px-4 rounded-xl hover:bg-brand-turquoise hover:text-white transition text-sm shadow-sm">
        В корзину
      </button>`;

  const newBtn = wrap.querySelector("[data-add]");
  if (newBtn) newBtn.addEventListener("click", () => addToCart(id));
  wrap.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => changeQty(id, +1)));
  wrap.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => changeQty(id, -1)));
}

function pulseCartButton() {
  const btn = document.querySelector("[data-cart-toggle]");
  if (!btn) return;
  btn.classList.remove("cart-pulse");
  void btn.offsetWidth;
  btn.classList.add("cart-pulse");
}

/* ---------------- cart UI (floating button + drawer) ---------------- */

function attachCartUI(root) {
  const toggle = root.querySelector("[data-cart-toggle]");
  const drawer = root.querySelector("[data-cart-drawer]");
  const backdrop = root.querySelector("[data-cart-backdrop]");
  const closeBtn = root.querySelector("[data-cart-close]");
  const checkoutBtn = root.querySelector("[data-cart-checkout]");
  const clearBtn = root.querySelector("[data-cart-clear]");

  const open = () => {
    drawer?.classList.remove("translate-x-full");
    drawer?.setAttribute("aria-hidden", "false");
    backdrop?.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  };
  const close = () => {
    drawer?.classList.add("translate-x-full");
    drawer?.setAttribute("aria-hidden", "true");
    backdrop?.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  };

  toggle?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !drawer?.classList.contains("translate-x-full")) close();
  });

  checkoutBtn?.addEventListener("click", () => {
    close();
    const form = document.getElementById("order-form");
    if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  clearBtn?.addEventListener("click", () => {
    if (!Object.keys(state.cart).length) return;
    if (!confirm("Очистить корзину?")) return;
    state.cart = {};
    saveCart();
    refreshCartUI();
    // перерисуем все карточки (кнопка «В корзину» вернётся)
    Object.keys(state.cart); // no-op
    document.querySelectorAll("[data-qty-wrap]").forEach((w) => {
      const id = w.getAttribute("data-qty-wrap");
      repaintProductCard(id);
    });
  });
}

function refreshCartUI() {
  const count = cartCount();
  const total = cartTotal();

  const badge = document.querySelector("[data-cart-count]");
  if (badge) {
    badge.textContent = count > 0 ? count : "";
    badge.classList.toggle("hidden", count === 0);
  }

  const totalEls = document.querySelectorAll("[data-cart-total]");
  totalEls.forEach((el) => { el.textContent = formatRub(total); });

  const toggle = document.querySelector("[data-cart-toggle]");
  if (toggle) toggle.classList.toggle("hidden", false);

  const itemsBox = document.querySelector("[data-cart-items]");
  const emptyBox = document.querySelector("[data-cart-empty]");
  const checkoutBtn = document.querySelector("[data-cart-checkout]");

  if (!itemsBox || !emptyBox) return;

  const entries = cartEntries();
  if (!entries.length) {
    itemsBox.innerHTML = "";
    emptyBox.classList.remove("hidden");
    if (checkoutBtn) checkoutBtn.disabled = true;
    setCartContext(false, 0, 0);
    return;
  }

  emptyBox.classList.add("hidden");
  if (checkoutBtn) checkoutBtn.disabled = false;

  itemsBox.innerHTML = entries.map(({ product: p, qty }) => `
    <li class="flex gap-3 py-4 border-b border-gray-100 last:border-b-0">
      <div class="flex-1 min-w-0">
        <div class="text-[10px] font-bold text-brand-turquoise uppercase tracking-wider mb-0.5">${escapeHtml(p.line || "Pro You")}</div>
        <p class="text-sm font-semibold text-brand-dark leading-snug mb-1">${escapeHtml(p.name)}</p>
        <p class="text-xs text-gray-400 mb-2">${escapeHtml(p.size)} · ${formatRub(p.price)}</p>
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5">
            <button type="button" data-dec="${p.id}" class="w-7 h-7 rounded-md hover:bg-brand-light flex items-center justify-center text-gray-600" aria-label="Уменьшить">−</button>
            <span class="w-7 text-center text-sm font-bold">${qty}</span>
            <button type="button" data-inc="${p.id}" class="w-7 h-7 rounded-md hover:bg-brand-light flex items-center justify-center text-gray-600" aria-label="Увеличить">+</button>
          </div>
          <button type="button" data-remove="${p.id}" class="ml-auto text-xs text-gray-400 hover:text-red-500 underline">Убрать</button>
        </div>
      </div>
      <div class="font-bold text-brand-dark whitespace-nowrap">${formatRub(p.price * qty)}</div>
    </li>
  `).join("");

  itemsBox.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => changeQty(b.dataset.inc, +1)));
  itemsBox.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => changeQty(b.dataset.dec, -1)));
  itemsBox.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.remove;
    delete state.cart[id];
    saveCart();
    refreshCartUI();
    repaintProductCard(id);
  }));

  setCartContext(true, entries.length, total);
}

function setCartContext(hasItems, itemsCount, total) {
  const form = document.getElementById("order-form");
  if (!form) return;

  // cart_json — единственное поле, которое реально идёт на сервер для сборки заказа
  const hidden = form.querySelector('input[name="cart_json"]');
  if (hidden) {
    hidden.value = JSON.stringify(
      Object.entries(state.cart).map(([id, qty]) => ({ id, qty }))
    );
  }

  // service/description — человекочитаемая подсказка для клиники
  const service = form.querySelector('input[name="service"]');
  if (service) {
    service.value = hasItems
      ? `Заказ косметики Pro You — ${itemsCount} поз. на ${formatRub(total)}`
      : "Заказ косметики Pro You";
  }

  // мягкий UX: заблокировать кнопку submit, пока корзина пуста
  const submit = form.querySelector('button[type="submit"]');
  if (submit) {
    submit.disabled = !hasItems;
    submit.classList.toggle("opacity-60", !hasItems);
    submit.classList.toggle("cursor-not-allowed", !hasItems);
  }

  // баннер «Корзина пуста» внутри формы
  const emptyHint = form.querySelector("[data-order-empty]");
  if (emptyHint) emptyHint.classList.toggle("hidden", hasItems);

  // сводка в форме
  const summary = form.querySelector("[data-order-summary]");
  if (summary) {
    summary.innerHTML = hasItems
      ? cartEntries().map(({ product: p, qty }) =>
          `<li class="flex justify-between gap-3 text-sm">
             <span class="text-gray-600">${escapeHtml(p.name)} × ${qty}</span>
             <span class="font-semibold text-brand-dark whitespace-nowrap">${formatRub(p.price * qty)}</span>
           </li>`
        ).join("")
      : "";
  }
}

/* ---------------- order form ---------------- */

function attachOrderForm(root) {
  const form = root.querySelector("#order-form");
  if (!form) return;

  // На сабмит актуализируем cart_json ещё раз (на случай, если пользователь
  // менял количество с другой вкладки).
  form.addEventListener("submit", () => {
    setCartContext(!!Object.keys(state.cart).length, cartEntries().length, cartTotal());
  }, { capture: true });

  // После успеха (перехват через MutationObserver на data-form-success)
  const successBox = form.querySelector("[data-form-success]");
  if (successBox) {
    const obs = new MutationObserver(() => {
      if (!successBox.classList.contains("hidden")) {
        state.cart = {};
        saveCart();
        refreshCartUI();
        obs.disconnect();
      }
    });
    obs.observe(successBox, { attributes: true, attributeFilter: ["class"] });
  }
}
