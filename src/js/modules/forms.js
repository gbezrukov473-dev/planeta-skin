import { normalizeRuPhoneStrict } from "../utils/phoneMask.js";
import {
  setHidden,
  getHidden,
  setSending,
  showError,
  showSuccess,
  clearFormMessage,
  clearOneFieldError,
  setFieldError,
  persistAndFillTracking,
} from "../utils/formUtils.js";

/**
 * Инициализация форм заявок
 */
export function initLeadForms() {
  const forms = document.querySelectorAll("form.js-lead-form");
  forms.forEach(setupLeadForm);
}

function setupLeadForm(form) {
  const startedAt = Date.now();
  let inFlight = false;

  const phoneEl = form.querySelector('input[name="phone"]');
  const consentEl = form.querySelector('input[name="consent"]');
  const honeypotEl = form.querySelector('input[name="website"]');
  const submitBtn = form.querySelector('button[type="submit"]');

  const errorBox = form.querySelector("[data-form-error]");
  const successBox = form.querySelector("[data-form-success]");

  const methodHidden = form.querySelector('input[name="contact_method"]');
  const methodBtns = form.querySelectorAll(".method-btn[data-method]");

  // Скрытые поля
  setHidden(form, "page", location.pathname + location.search + location.hash);
  setHidden(form, "referrer", document.referrer || "");
  setHidden(form, "form_id", form.dataset.formId || getHidden(form, "form_id") || "lead");

  const serviceFromData = (form.dataset.service || "").trim();
  if (serviceFromData) setHidden(form, "service", serviceFromData);

  persistAndFillTracking(form);

  // Способ связи (call / whatsapp)
  const allowedMethods = ["call", "whatsapp"];

  const setMethod = (method) => {
    if (!allowedMethods.includes(method)) method = "call";
    if (methodHidden) methodHidden.value = method;

    methodBtns.forEach((btn) => {
      const active = btn.dataset.method === method;
      btn.setAttribute("aria-checked", active ? "true" : "false");

      btn.classList.toggle("bg-brand-turquoise", active);
      btn.classList.toggle("text-white", active);
      btn.classList.toggle("border-brand-turquoise", active);

      btn.classList.toggle("bg-gray-50", !active);
      btn.classList.toggle("text-gray-700", !active);
      btn.classList.toggle("border-gray-200", !active);
    });
  };

  if (methodBtns.length) {
    methodBtns.forEach((btn) => btn.addEventListener("click", () => setMethod(btn.dataset.method)));
    setMethod((methodHidden?.value || "call").trim() || "call");
  }

  // Маска телефона (инициализируется нативным модулем phoneMask.js)
  if (phoneEl) {
    // Функция проверки и снятия ошибки при полном номере
    const checkPhoneComplete = () => {
      const digits = String(phoneEl.value || "").replace(/\D/g, "");
      // Проверяем, что номер содержит достаточно цифр (11 цифр: 7 + 10)
      if (digits.length >= 11) {
        clearOneFieldError(form, phoneEl);
      }
      // если поле очистили, тоже убираем красное
      if (!digits) clearOneFieldError(form, phoneEl);
    };

    // Слушаем несколько событий для надежности (jQuery maskedinput может не триггерить input)
    phoneEl.addEventListener("input", checkPhoneComplete);
    phoneEl.addEventListener("keyup", checkPhoneComplete);
    phoneEl.addEventListener("change", checkPhoneComplete);

    // Валидация при потере фокуса - показываем ошибку если номер неполный
    phoneEl.addEventListener("blur", () => {
      const digits = String(phoneEl.value || "").replace(/\D/g, "");
      // Если есть цифры, но номер неполный (меньше 11 цифр) - показываем ошибку
      if (digits.length > 0 && digits.length < 11) {
        setFieldError(form, phoneEl, "Похоже, номер неполный. Проверьте, пожалуйста.");
      }
    });
  }

  // Снимаем ошибку consent, когда поставили галочку
  if (consentEl) {
    consentEl.addEventListener("change", () => {
      if (consentEl.checked) clearOneFieldError(form, consentEl);
    });
  }

  // Если задан service, покажем строку "Услуга: ..."
  const serviceRow = form.querySelector("[data-service-row]");
  const serviceLabel = form.querySelector("[data-service-label]");
  const serviceVal = (getHidden(form, "service") || "").trim();
  if (serviceRow && serviceLabel && serviceVal) {
    serviceLabel.textContent = serviceVal;
    serviceRow.classList.remove("hidden");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (inFlight) return;

    clearFormMessage(errorBox);
    clearFormMessage(successBox);

    // Антиспам: honeypot
    if (honeypotEl && honeypotEl.value.trim()) {
      goThanks(form);
      return;
    }

    // Антиспам: слишком быстро
    const fillTime = Date.now() - startedAt;
    setHidden(form, "fill_time_ms", String(fillTime));
    if (fillTime < 900) {
      goThanks(form);
      return;
    }

    // Валидация (строгая)
    const firstInvalid = validateLeadForm(form);
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // Телефон нормализуем только когда уже валиден
    const normalized = normalizeRuPhoneStrict(phoneEl?.value || "");
    if (phoneEl && normalized.ok) phoneEl.value = normalized.display;

    setSending(submitBtn, true);
    inFlight = true;

    try {
      const res = await fetch(form.action, {
        method: (form.method || "POST").toUpperCase(),
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      const ct = (res.headers.get("content-type") || "").toLowerCase();

      if (ct.includes("application/json")) {
        const data = await res.json().catch(() => null);

        if (data && data.ok) {
          showSuccess(successBox, "Спасибо! Мы скоро перезвоним.");
          setTimeout(() => {
            window.location.href = data.redirect || form.dataset.thanks || "thanks.html";
          }, 900);
          return;
        }

        if (data && data.fieldErrors) {
          Object.entries(data.fieldErrors).forEach(([name, msg]) => {
            const field = form.querySelector(`[name="${name}"]`);
            if (field) setFieldError(form, field, String(msg || ""));
          });
        }

        showError(
          errorBox,
          (data && data.message) ||
            'Не получилось отправить. Позвоните нам: <a class="underline" href="tel:+79112717888">+7 (911) 271-78-88</a>'
        );

        setSending(submitBtn, false);
        inFlight = false;
        return;
      }

      if (res.redirected && res.url) {
        window.location.href = res.url;
        return;
      }

      showError(
        errorBox,
        'Не получилось отправить. Позвоните нам: <a class="underline" href="tel:+79112717888">+7 (911) 271-78-88</a>'
      );

      setSending(submitBtn, false);
      inFlight = false;
    } catch (err) {
      showError(
        errorBox,
        'Не получилось отправить. Проверьте связь или позвоните нам: <a class="underline" href="tel:+79112717888">+7 (911) 271-78-88</a>'
      );

      setSending(submitBtn, false);
      inFlight = false;
    }
  });

  function goThanks(form) {
    window.location.href = form.dataset.thanks || "thanks.html";
  }
}

function validateLeadForm(form) {
  const phone = form.querySelector('input[name="phone"]');
  const consent = form.querySelector('input[name="consent"]');

  // phone обязателен
  const normalized = normalizeRuPhoneStrict(phone?.value || "");
  if (!normalized.ok) {
    if (phone) setFieldError(form, phone, "Похоже, номер неполный. Проверьте, пожалуйста.");
    return phone || null;
  }

  // consent обязателен
  if (consent && !consent.checked) {
    setFieldError(
      form,
      consent,
      "Чтобы отправить заявку, нужно согласиться на обработку персональных данных и ознакомиться с политикой."
    );
    return consent;
  }

  return null;
}
