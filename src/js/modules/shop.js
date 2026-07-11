/**
 * Модуль интернет-магазина Pro You для cosmetics.html.
 *
 * Что делает:
 *  - рендерит каталог из src/data/products.js;
 *  - держит корзину в localStorage по variant.id (не product.id);
 *  - управляет drawer (боковая панель с товарами);
 *  - перед submit формы заказа кладёт cart_json и передаёт инициативу
 *    стандартному initLeadForms (валидация, нормализация, отправка, ошибки).
 *
 * Корзина и заказ работают через `variant.id`, поэтому когда у товара
 * появится второй объём, переключатель и логика начнут работать без
 * дополнительной перестройки.
 *
 * Активируется только если на странице есть <div id="shop-root">.
 */

import { PRODUCTS, CATEGORIES } from "../../data/products.js";

// v2 — после перехода с product.id на variant.id. Старая v1-корзина
// автоматически отбрасывается (формат несовместим).
const STORAGE_KEY = "pzk_cart_v2";
const LEGACY_STORAGE_KEY = "pzk_cart_v1";

// «Виртуальная» категория — рендерится в баре, но в CATEGORIES не лежит,
// чтобы экспорт оставался зеркалом CATEGORIES_SOURCE.
const ALL_FILTER = { id: "all", title: "Все средства" };

const state = {
  cart: /** @type {Record<string, number>} */ ({}), // ключ — variant.id
  filter: "all",
  selectedVariant: /** @type {Record<string, string>} */ ({}), // product.id → variant.id
};

/* ---------------- bootstrap ---------------- */

export function initShop() {
  const root = document.getElementById("shop-root");
  if (!root) return;

  // Подчищаем устаревшую корзину прошлого формата. Она бы всё равно не
  // подцепилась (ключи product.id ≠ variant.id), но пусть не висит в storage.
  try { localStorage.removeItem(LEGACY_STORAGE_KEY); } catch (_) {}

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
      // Принимаем только variant.id, который реально есть в каталоге и
      // у которого валидное qty > 0. Это и есть мягкая миграция —
      // невалидные/устаревшие записи отбрасываются.
      state.cart = Object.fromEntries(
        Object.entries(parsed).filter(([variantId, qty]) => {
          if (!findVariantById(variantId)) return false;
          const n = Number(qty);
          return Number.isFinite(n) && n > 0;
        }).map(([variantId, qty]) => [variantId, Math.min(20, Math.floor(Number(qty)))])
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

/* ---------------- product / variant helpers ---------------- */

export function getPublicVariants(product) {
  if (!product || !Array.isArray(product.variants)) return [];
  return product.variants.filter(
    (v) => v && !v.hidden && Number.isFinite(+v?.price) && +v.price > 0
  );
}

export function getDefaultVariant(product) {
  return getPublicVariants(product)[0] || null;
}

export function getSelectedVariant(product) {
  const variants = getPublicVariants(product);
  if (!variants.length) return null;
  const chosenId = state.selectedVariant[product.id];
  return variants.find((v) => v.id === chosenId) || variants[0];
}

export function findVariantById(variantId) {
  for (const p of PRODUCTS) {
    const v = (p.variants || []).find((x) => x && x.id === variantId);
    if (v) return v;
  }
  return null;
}

export function findProductByVariantId(variantId) {
  return PRODUCTS.find((p) => (p.variants || []).some((v) => v && v.id === variantId)) || null;
}

export function cartEntries() {
  return Object.entries(state.cart)
    .map(([variantId, qty]) => {
      const product = findProductByVariantId(variantId);
      const variant = findVariantById(variantId);
      if (!product || !variant) return null;
      return { product, variant, qty };
    })
    .filter(Boolean);
}

/* ---------------- formatting ---------------- */

const formatRub = (n) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";

const cartTotal = () =>
  cartEntries().reduce((sum, { variant, qty }) => sum + variant.price * qty, 0);

const cartCount = () =>
  Object.values(state.cart).reduce((s, q) => s + q, 0);

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

// Инициалы для плейсхолдера: 1–2 буквы из линии или из первых слов названия.
function initialsFor(product) {
  const src = (product.line || product.name || "?").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

/* ---------------- render: categories ---------------- */

function renderCategories(root) {
  const bar = root.querySelector("[data-category-bar]");
  if (!bar) return;

  const items = [ALL_FILTER, ...CATEGORIES];

  bar.innerHTML = items.map((c) => {
    const active = c.id === state.filter;
    // Hover-классы только на неактивных — на активной кнопке текст не должен
    // «теряться» в окрашенном фоне.
    const variant = active
      ? "bg-brand-turquoise text-white border-brand-turquoise"
      : "bg-white text-gray-600 border-gray-200 hover:border-brand-turquoise hover:text-brand-turquoise";
    return `
      <button
        type="button"
        data-filter="${c.id}"
        class="category-chip whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition ${variant}">
        ${escapeHtml(c.title)}
      </button>`;
  }).join("");

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
      b.classList.toggle("hover:border-brand-turquoise", !active);
      b.classList.toggle("hover:text-brand-turquoise", !active);
    });
    renderCatalog(root);
  });
}

/* ---------------- render: catalog grid ---------------- */

function renderCatalog(root) {
  const grid = root.querySelector("[data-catalog-grid]");
  if (!grid) return;

  const all = PRODUCTS.filter((p) => getPublicVariants(p).length > 0);
  const list = state.filter === "all" ? all : all.filter((p) => p.category === state.filter);

  if (!list.length) {
    grid.innerHTML = `<p class="col-span-full text-center text-gray-500 py-12">В этой категории пока пусто.</p>`;
    return;
  }

  grid.innerHTML = list.map(productCard).join("");

  grid.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.add));
  });
  grid.querySelectorAll("[data-inc]").forEach((btn) => {
    btn.addEventListener("click", () => changeQty(btn.dataset.inc, +1));
  });
  grid.querySelectorAll("[data-dec]").forEach((btn) => {
    btn.addEventListener("click", () => changeQty(btn.dataset.dec, -1));
  });
  grid.querySelectorAll("[data-variant]").forEach((btn) => {
    btn.addEventListener("click", () => selectVariant(btn.dataset.productId, btn.dataset.variant));
  });
}

function productCard(product) {
  const variant = getSelectedVariant(product);
  if (!variant) return "";

  const variants = getPublicVariants(product);
  const qty = state.cart[variant.id] || 0;

  // Картинка варианта поверх градиента: если файла нет (404), onerror прячет
  // <img>, и снизу остаётся читаемый плейсхолдер с инициалами.
  const hue = hashHue(product.line || product.id);
  const initials = initialsFor(product);
  const gradient = `linear-gradient(135deg, hsl(${hue} 60% 92%) 0%, hsl(${(hue + 40) % 360} 55% 84%) 100%)`;

  const imgTag = variant.image
    ? `<img src="${escapeHtml(variant.image)}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async"
            onerror="this.style.display='none'"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">`
    : "";

  const art = `
    <div class="product-art relative aspect-[3/2] w-full overflow-hidden"
         style="background-image: ${gradient};">
      <span class="absolute inset-0 flex items-center justify-center font-serif text-5xl font-bold text-white/70 select-none">${escapeHtml(initials)}</span>
      ${imgTag}
      ${product.badge ? `<span class="absolute top-3 left-3 bg-white/95 text-brand-dark text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm z-10">${escapeHtml(product.badge)}</span>` : ""}
    </div>`;

  // Переключатель объёмов — только если их больше одного публичного.
  const variantSwitcher = variants.length > 1
    ? `<div class="flex flex-wrap gap-1.5 mb-3" role="radiogroup" aria-label="Объём">
         ${variants.map((v) => {
           const active = v.id === variant.id;
           return `<button type="button" data-product-id="${escapeHtml(product.id)}" data-variant="${escapeHtml(v.id)}"
                     role="radio" aria-checked="${active}"
                     class="text-xs font-bold px-3 py-1.5 rounded-lg border transition ${active ? "bg-brand-turquoise text-white border-brand-turquoise" : "bg-white text-gray-600 border-gray-200 hover:border-brand-turquoise hover:text-brand-turquoise"}">${escapeHtml(v.size)}</button>`;
         }).join("")}
       </div>`
    : "";

  const qtyBlock = qtyControlHtml(variant.id, qty);

  return `
    <article class="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col group hover:shadow-lg transition" data-product-card="${escapeHtml(product.id)}">
      ${art}
      <div class="p-5 flex-1 flex flex-col">
        <div class="text-[10px] font-bold text-brand-turquoise uppercase tracking-wider mb-1">${escapeHtml(product.line || "Pro You")}</div>
        <h3 class="font-serif text-base text-brand-dark mb-2 leading-snug">${escapeHtml(product.name)}</h3>
        <p class="text-xs text-gray-500 mb-4 line-clamp-3">${escapeHtml(product.short || "")}</p>
        <div class="text-xs text-gray-400 mb-1" data-product-size>${escapeHtml(variant.size)}</div>
        <div class="text-[10px] text-gray-300 mb-3" data-product-code>Артикул: ${escapeHtml(variant.code)}</div>
        ${variantSwitcher}
        <div class="mt-auto flex items-center justify-between gap-3 mb-3">
          <span class="font-serif text-xl text-brand-dark font-bold" data-product-price>${formatRub(variant.price)}</span>
        </div>
        <div data-qty-wrap="${escapeHtml(variant.id)}">${qtyBlock}</div>
      </div>
    </article>`;
}

function qtyControlHtml(variantId, qty) {
  const v = escapeHtml(variantId);
  if (qty > 0) {
    return `
      <div class="flex items-center gap-2 rounded-xl border border-brand-turquoise bg-white p-1">
        <button type="button" data-dec="${v}" class="w-9 h-9 rounded-lg bg-brand-light/50 hover:bg-brand-turquoise hover:text-white flex items-center justify-center font-bold text-lg transition" aria-label="Уменьшить">−</button>
        <span class="flex-1 text-center font-bold text-brand-dark">${qty}</span>
        <button type="button" data-inc="${v}" class="w-9 h-9 rounded-lg bg-brand-light/50 hover:bg-brand-turquoise hover:text-white flex items-center justify-center font-bold text-lg transition" aria-label="Увеличить">+</button>
      </div>`;
  }
  return `
    <button type="button" data-add="${v}"
      class="w-full bg-brand-peach text-brand-dark font-bold py-3 px-4 rounded-xl hover:bg-brand-turquoise hover:text-white transition text-sm shadow-sm">
      В корзину
    </button>`;
}

/* ---------------- cart mutations ---------------- */

function addToCart(variantId) {
  const v = findVariantById(variantId);
  if (!v) return;
  state.cart[variantId] = Math.min(20, (state.cart[variantId] || 0) + 1);
  saveCart();
  refreshCartUI();
  repaintVariantQty(variantId);
  pulseCartButton();
}

function changeQty(variantId, delta) {
  if (!findVariantById(variantId)) return;
  const next = (state.cart[variantId] || 0) + delta;
  if (next <= 0) delete state.cart[variantId];
  else if (next > 20) state.cart[variantId] = 20;
  else state.cart[variantId] = next;
  saveCart();
  refreshCartUI();
  repaintVariantQty(variantId);
}

// Перерисовываем qty-блок везде, где есть data-qty-wrap для этого variantId
// (и в каталоге, и при необходимости в корзине).
function repaintVariantQty(variantId) {
  const qty = state.cart[variantId] || 0;
  document.querySelectorAll(`[data-qty-wrap="${cssEscape(variantId)}"]`).forEach((wrap) => {
    wrap.innerHTML = qtyControlHtml(variantId, qty);
    const newBtn = wrap.querySelector("[data-add]");
    if (newBtn) newBtn.addEventListener("click", () => addToCart(variantId));
    wrap.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => changeQty(variantId, +1)));
    wrap.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => changeQty(variantId, -1)));
  });
}

// CSS.escape недоступен в IE/старых движках, но cosmetics.html — современный.
function cssEscape(s) {
  return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/"/g, '\\"');
}

function selectVariant(productId, variantId) {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return;
  const variants = getPublicVariants(product);
  if (!variants.some((v) => v.id === variantId)) return;
  state.selectedVariant[productId] = variantId;

  const card = document.querySelector(`[data-product-card="${cssEscape(productId)}"]`);
  if (!card) return;

  const variant = variants.find((v) => v.id === variantId);
  const sizeEl = card.querySelector("[data-product-size]");
  const codeEl = card.querySelector("[data-product-code]");
  const priceEl = card.querySelector("[data-product-price]");
  if (sizeEl) sizeEl.textContent = variant.size;
  if (codeEl) codeEl.textContent = "Артикул: " + variant.code;
  if (priceEl) priceEl.textContent = formatRub(variant.price);

  // Перевыставляем active на кнопках переключателя
  card.querySelectorAll("[data-variant]").forEach((btn) => {
    const active = btn.dataset.variant === variantId;
    btn.setAttribute("aria-checked", active ? "true" : "false");
    btn.classList.toggle("bg-brand-turquoise", active);
    btn.classList.toggle("text-white", active);
    btn.classList.toggle("border-brand-turquoise", active);
    btn.classList.toggle("bg-white", !active);
    btn.classList.toggle("text-gray-600", !active);
    btn.classList.toggle("border-gray-200", !active);
  });

  // qty-блок должен показывать кол-во выбранного варианта; data-qty-wrap
  // меняется тоже. Полная перерисовка карточки проще и надёжнее.
  renderCatalog(document.getElementById("shop-root"));
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
  const closeBtns = root.querySelectorAll("[data-cart-close]");
  const gotoCatalogBtns = root.querySelectorAll("[data-cart-goto-catalog]");
  const openCartBtns = root.querySelectorAll("[data-open-cart]");
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
  closeBtns.forEach((el) => el.addEventListener("click", close));
  backdrop?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !drawer?.classList.contains("translate-x-full")) close();
  });

  gotoCatalogBtns.forEach((el) => {
    el.addEventListener("click", () => {
      close();
      const catalog = document.getElementById("catalog");
      if (catalog) catalog.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  openCartBtns.forEach((el) => el.addEventListener("click", open));

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
    // Перерисуем все карточки, чтобы кнопка «В корзину» вернулась.
    document.querySelectorAll("[data-qty-wrap]").forEach((w) => {
      const variantId = w.getAttribute("data-qty-wrap");
      repaintVariantQty(variantId);
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

  document.querySelectorAll("[data-cart-total]").forEach((el) => {
    el.textContent = formatRub(total);
  });

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

  itemsBox.innerHTML = entries.map(({ product, variant, qty }) => {
    const thumb = variant.image
      ? `<img src="${escapeHtml(variant.image)}" alt="" loading="lazy" decoding="async"
              onerror="this.style.display='none'"
              class="w-24 h-16 object-cover bg-slate-50 rounded-xl shrink-0">`
      : `<div class="w-24 h-16 rounded-xl shrink-0 flex items-center justify-center text-white/70 font-serif font-bold text-lg"
              style="background-image: linear-gradient(135deg, hsl(${hashHue(product.line || product.id)} 60% 92%) 0%, hsl(${(hashHue(product.line || product.id) + 40) % 360} 55% 84%) 100%);">${escapeHtml(initialsFor(product))}</div>`;
    const vid = escapeHtml(variant.id);
    return `
    <li class="flex gap-3 py-4 border-b border-gray-100 last:border-b-0">
      ${thumb}
      <div class="flex-1 min-w-0">
        <div class="text-[10px] font-bold text-brand-turquoise uppercase tracking-wider mb-0.5">${escapeHtml(product.line || "Pro You")}</div>
        <p class="text-sm font-semibold text-brand-dark leading-snug mb-1">${escapeHtml(product.name)}</p>
        <p class="text-xs text-gray-400 mb-2">${escapeHtml(variant.size)} · ${escapeHtml(variant.code)} · ${formatRub(variant.price)}</p>
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5">
            <button type="button" data-dec="${vid}" class="w-7 h-7 rounded-md hover:bg-brand-light flex items-center justify-center text-gray-600" aria-label="Уменьшить">−</button>
            <span class="w-7 text-center text-sm font-bold">${qty}</span>
            <button type="button" data-inc="${vid}" class="w-7 h-7 rounded-md hover:bg-brand-light flex items-center justify-center text-gray-600" aria-label="Увеличить">+</button>
          </div>
          <button type="button" data-remove="${vid}" class="ml-auto text-xs text-gray-400 hover:text-red-500 underline">Убрать</button>
        </div>
      </div>
      <div class="font-bold text-brand-dark whitespace-nowrap">${formatRub(variant.price * qty)}</div>
    </li>`;
  }).join("");

  itemsBox.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => changeQty(b.dataset.inc, +1)));
  itemsBox.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => changeQty(b.dataset.dec, -1)));
  itemsBox.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.remove;
    delete state.cart[id];
    saveCart();
    refreshCartUI();
    repaintVariantQty(id);
  }));

  setCartContext(true, entries.length, total);
}

function setCartContext(hasItems, itemsCount, total) {
  const form = document.getElementById("order-form");
  if (!form) return;

  // cart_json — единственное поле, которое реально идёт на сервер для сборки заказа.
  // Передаём productId + variantId + полный «снимок» товара. Сервер всё равно
  // ресолвит цены по variantId из своего каталога (клиенту не доверяем),
  // но эти поля помогают читать письмо/лог и облегчают возможный аудит.
  const hidden = form.querySelector('input[name="cart_json"]');
  if (hidden) {
    hidden.value = JSON.stringify(
      cartEntries().map(({ product, variant, qty }) => ({
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        size: variant.size,
        code: variant.code,
        price: variant.price,
        qty,
      }))
    );
  }

  const service = form.querySelector('input[name="service"]');
  if (service) {
    service.value = hasItems
      ? `Заказ косметики Pro You — ${itemsCount} поз. на ${formatRub(total)}`
      : "Заказ косметики Pro You";
  }

  const submit = form.querySelector('button[type="submit"]');
  if (submit) {
    submit.disabled = !hasItems;
    submit.classList.toggle("opacity-60", !hasItems);
    submit.classList.toggle("cursor-not-allowed", !hasItems);
  }

  const emptyHint = form.querySelector("[data-order-empty]");
  if (emptyHint) emptyHint.classList.toggle("hidden", hasItems);

  const summaryWrap = form.querySelector("[data-order-summary-wrap]");
  if (summaryWrap) summaryWrap.classList.toggle("hidden", !hasItems);

  const summary = form.querySelector("[data-order-summary]");
  if (summary) {
    summary.innerHTML = hasItems
      ? cartEntries().map(({ product, variant, qty }) =>
          `<li class="flex justify-between gap-3 text-sm">
             <span class="text-gray-600">${escapeHtml(product.name)} · ${escapeHtml(variant.size)} × ${qty}</span>
             <span class="font-semibold text-brand-dark whitespace-nowrap">${formatRub(variant.price * qty)}</span>
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
        // Карточки каталога рендерились с qty > 0 (контрол «− 1 +»),
        // после очистки нужно вернуть им кнопку «В корзину».
        document.querySelectorAll("[data-qty-wrap]").forEach((w) => {
          const variantId = w.getAttribute("data-qty-wrap");
          repaintVariantQty(variantId);
        });
        obs.disconnect();
      }
    });
    obs.observe(successBox, { attributes: true, attributeFilter: ["class"] });
  }
}
