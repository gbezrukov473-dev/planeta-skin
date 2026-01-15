/**
 * Утилиты для работы с формами
 */

export function setHidden(form, name, value) {
  let el = form.querySelector(`[name="${name}"]`);
  if (!el) {
    el = document.createElement("input");
    el.type = "hidden";
    el.name = name;
    form.appendChild(el);
  }
  el.value = value ?? "";
}

export function getHidden(form, name) {
  const el = form.querySelector(`[name="${name}"]`);
  return el ? el.value : "";
}

export function setSending(btn, isSending) {
  if (!btn) return;
  if (!btn.dataset.text) btn.dataset.text = btn.textContent || "Отправить";

  btn.disabled = isSending;
  btn.setAttribute("aria-busy", isSending ? "true" : "false");
  btn.textContent = isSending ? "Отправляем..." : btn.dataset.text;
  btn.classList.toggle("opacity-70", isSending);
  btn.classList.toggle("cursor-not-allowed", isSending);
}

export function showError(box, html) {
  if (!box) return;
  box.innerHTML = html;
  box.classList.remove("hidden");
}

export function showSuccess(box, text) {
  if (!box) return;
  box.textContent = text;
  box.classList.remove("hidden");
}

export function clearFormMessage(box) {
  if (!box) return;
  box.classList.add("hidden");
  box.innerHTML = "";
  box.textContent = "";
}

export function clearOneFieldError(form, field) {
  const name = field.getAttribute("name");
  const holder = name ? form.querySelector(`[data-error-for="${name}"]`) : null;

  if (holder) {
    holder.classList.add("hidden");
    holder.textContent = "";
  }

  if (field.type !== "checkbox") {
    field.classList.remove("border-red-400", "ring-2", "ring-red-200");
  }
}

export function setFieldError(form, field, message) {
  const name = field.getAttribute("name");
  const holder = name ? form.querySelector(`[data-error-for="${name}"]`) : null;

  if (field.type === "checkbox") {
    if (holder) {
      holder.textContent = message || "Ошибка";
      holder.classList.remove("hidden");
    }
    return;
  }

  field.classList.add("border-red-400", "ring-2", "ring-red-200");

  if (holder) {
    holder.textContent = message || "Ошибка";
    holder.classList.remove("hidden");
  }
}

export function persistAndFillTracking(form) {
  const keys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "gclid",
    "yclid",
  ];

  const params = new URLSearchParams(location.search);

  keys.forEach((k) => {
    const v = params.get(k);
    if (v) {
      try { sessionStorage.setItem(k, v); } catch (e) {}
    }
  });

  keys.forEach((k) => {
    let v = "";
    try { v = sessionStorage.getItem(k) || ""; } catch (e) {}
    if (v) setHidden(form, k, v);
  });
}
