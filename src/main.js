import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  // --- НАСТРОЙКИ ---
  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  // --- 1. ПРЕЛОАДЕР (FAILSAFE) ---
  const preloader = document.getElementById("preloader");
  const colorLayer = document.getElementById("preloader-color");

  if (preloader) {
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

  // --- 2. МОБИЛЬНОЕ МЕНЮ (A11Y) ---
  const menuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (menuBtn && mobileMenu) {
    const closeMenu = () => {
      menuBtn.setAttribute("aria-expanded", "false");
      mobileMenu.classList.add("hidden");
    };

    const toggleMenu = () => {
      const isExpanded = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!isExpanded));
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

  // --- 3. СКРОЛЛ К ФОРМЕ ---
  const scrollButtons = document.querySelectorAll(".js-scroll-to-form");
  const formSection = document.getElementById("form");

  if (formSection) {
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

  // --- 4. HERO СЛАЙДЕР ---
  const slides = Array.from(document.querySelectorAll(".slide"));
  const prevBtn = document.getElementById("slider-prev");
  const nextBtn = document.getElementById("slider-next");
  const clickLeft = document.getElementById("slider-click-left");
  const clickRight = document.getElementById("slider-click-right");
  const heroContainer = document.getElementById("hero-slider");

  let currentSlide = 0;
  let heroIntervalId = null;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      const active = i === index;

      slide.classList.toggle("opacity-100", active);
      slide.classList.toggle("opacity-0", !active);

      slide.classList.toggle("pointer-events-auto", active);
      slide.classList.toggle("pointer-events-none", !active);

      slide.classList.toggle("z-20", active);
      slide.classList.toggle("z-10", !active);

      slide.setAttribute("aria-hidden", active ? "false" : "true");
    });
  }

  function nextSlide() {
    if (!slides.length) return;
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }

  function prevSlide() {
    if (!slides.length) return;
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
  }

  function stopHeroTimer() {
    if (heroIntervalId) {
      clearInterval(heroIntervalId);
      heroIntervalId = null;
    }
  }

  function startHeroTimer() {
    if (prefersReducedMotion || slides.length < 2) return;
    stopHeroTimer();
    heroIntervalId = setInterval(nextSlide, 5000);
  }

  function resetHeroTimer() {
    if (prefersReducedMotion || slides.length < 2) return;
    startHeroTimer();
  }

  if (slides.length > 0) {
    showSlide(currentSlide);

    const handleManualNext = () => {
      nextSlide();
      resetHeroTimer();
    };
    const handleManualPrev = () => {
      prevSlide();
      resetHeroTimer();
    };

    if (nextBtn) nextBtn.addEventListener("click", handleManualNext);
    if (prevBtn) prevBtn.addEventListener("click", handleManualPrev);
    if (clickRight) clickRight.addEventListener("click", handleManualNext);
    if (clickLeft) clickLeft.addEventListener("click", handleManualPrev);

    startHeroTimer();

    // пауза при наведении
    if (heroContainer && !prefersReducedMotion) {
      heroContainer.addEventListener("mouseenter", stopHeroTimer);
      heroContainer.addEventListener("mouseleave", startHeroTimer);
    }

    // пауза при уходе со вкладки
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopHeroTimer();
      else startHeroTimer();
    });
  }

  // --- 5. СЛАЙДЕР ОБОРУДОВАНИЯ ---
  const equipSlides = Array.from(document.querySelectorAll(".equip-slide"));
  let equipIndex = 0;

  if (equipSlides.length > 0 && !prefersReducedMotion) {
    setInterval(() => {
      equipSlides[equipIndex].classList.remove("opacity-100");
      equipSlides[equipIndex].classList.add("opacity-0");

      equipIndex = (equipIndex + 1) % equipSlides.length;

      equipSlides[equipIndex].classList.remove("opacity-0");
      equipSlides[equipIndex].classList.add("opacity-100");
    }, 4000);
  }

  // --- 6. КАРУСЕЛЬ ЛИЦЕНЗИЙ (Infinite Scroll) ---
  const scrollers = document.querySelectorAll(".scroller");

  const makeHiddenClone = (node) => {
    const clone = node.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    if (clone.hasAttribute("tabindex")) clone.setAttribute("tabindex", "-1");

    clone
      .querySelectorAll("a, button, input, select, textarea, [tabindex]")
      .forEach((el) => el.setAttribute("tabindex", "-1"));

    return clone;
  };

  if (!prefersReducedMotion) {
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

  // --- 7. СЧЕТЧИКИ ---
  const statsSection = document.getElementById("stats-section");
  const counters = document.querySelectorAll(".counter");
  let countersStarted = false;

  if (statsSection) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !countersStarted) {
        countersStarted = true;

        counters.forEach((counter) => {
          const target = Number(counter.getAttribute("data-target") || 0);
          if (!target) return;

          const duration = 2000;
          const step = target / (duration / 16);

          let current = 0;
          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              counter.innerText = String(target);
              clearInterval(timer);
            } else {
              counter.innerText = String(Math.ceil(current));
            }
          }, 16);
        });

        observer.disconnect();
      }
    });

    observer.observe(statsSection);
  }

  // --- 8. СЛАЙДЕР ИЗ СТАТЬИ (Removal) ---
  const removalSlider = document.querySelector(".slider");

  if (removalSlider) {
    const imgs = removalSlider.querySelectorAll("[data-img-url]");
    const dotsContainer = document.querySelector(".index-container");

    if (dotsContainer) dotsContainer.innerHTML = "";

    imgs.forEach((div, index) => {
      const url = div.getAttribute("data-img-url");
      if (!url) return;

      div.style.backgroundImage = `url(${url})`;

      // лайтбокс по клику
      div.addEventListener("click", () => {
        const lb = document.getElementById("lightbox");
        const lbImg = document.getElementById("lightbox-img");
        if (lb && lbImg) {
          lbImg.src = url;
          lb.classList.remove("hidden");
          lb.classList.add("flex");
        }
      });

      if (dotsContainer) {
        const dot = document.createElement("button");
        dot.setAttribute("aria-label", `Слайд ${index + 1}`);
        dotsContainer.appendChild(dot);
      }
    });

    const indexButtons = document.querySelectorAll(".index-container > button");
    const arrowButtons = document.querySelectorAll("[data-index-change]");
    let currIndex = 0;
    let autoSlideId = null;
    let autoRunning = false;

    function slideTo(nextIndex) {
      if (imgs.length === 0) return;

      if (nextIndex < 0) nextIndex = imgs.length - 1;
      if (nextIndex >= imgs.length) nextIndex = 0;

      if (indexButtons.length > 0) {
        indexButtons[currIndex]?.classList.remove("active");
        indexButtons[currIndex] && (indexButtons[currIndex].style.backgroundColor = "");
        indexButtons[currIndex] && (indexButtons[currIndex].style.transform = "");

        indexButtons[nextIndex]?.classList.add("active");
        indexButtons[nextIndex] && (indexButtons[nextIndex].style.backgroundColor = "#44C8D2");
        indexButtons[nextIndex] && (indexButtons[nextIndex].style.transform = "scale(1.2)");
      }

      removalSlider.style.transform = `translateX(-${nextIndex * 100}%)`;
      currIndex = nextIndex;
    }

    if (indexButtons.length > 0) {
      indexButtons[0].classList.add("active");
      indexButtons[0].style.backgroundColor = "#44C8D2";
      indexButtons[0].style.transform = "scale(1.2)";
    }

    indexButtons.forEach((btn, i) => {
      btn.addEventListener("click", () => {
        slideTo(i);
        stopAuto();
        startAuto();
      });
    });

    arrowButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const delta = Number(btn.getAttribute("data-index-change") || 0);
        slideTo(currIndex + delta);
        stopAuto();
        startAuto();
      });
    });

    function startAuto() {
      if (prefersReducedMotion || autoRunning || imgs.length < 2) return;
      autoSlideId = setInterval(() => slideTo(currIndex + 1), 5000);
      autoRunning = true;
    }

    function stopAuto() {
      if (autoSlideId) clearInterval(autoSlideId);
      autoSlideId = null;
      autoRunning = false;
    }

    startAuto();

    const sliderContainer = document.querySelector(".slider-container");
    if (sliderContainer) {
      sliderContainer.addEventListener("mouseenter", stopAuto);
      sliderContainer.addEventListener("mouseleave", startAuto);

      document.addEventListener("touchstart", (e) => {
        if (!sliderContainer.contains(e.target)) startAuto();
        else stopAuto();
      });
    }
  }

  // --- 9. ЛАЙТБОКС (Общий) ---
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");
  const triggers = document.querySelectorAll(".lightbox-trigger");

  if (lightbox && lightboxImg && lightboxClose) {
    const openLightbox = (src) => {
      if (!src) return;
      lightboxImg.src = src;
      lightbox.classList.remove("hidden");
      lightbox.classList.add("flex");
    };

    const closeLightbox = () => {
      lightbox.classList.add("hidden");
      lightbox.classList.remove("flex");
      lightboxImg.src = "";
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        const src =
          trigger.getAttribute("data-src") ||
          trigger.getAttribute("href") ||
          trigger.getAttribute("src");
        openLightbox(src);
      });
    });

    lightboxClose.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lightbox.classList.contains("hidden")) {
        closeLightbox();
      }
    });
  }

  // --- 10. ФОРМЫ (Эталонная форма: мягкая маска, строгая валидация, UX, антиспам) ---
  initLeadForms();

  function initLeadForms() {
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

    // Маска телефона
    if (phoneEl) {
      setupRuPhoneMask(phoneEl);

      // Снимаем красную подсветку, как только номер стал валидным
      phoneEl.addEventListener("input", () => {
        const n = normalizeRuPhoneStrict(phoneEl.value);
        if (n.ok) clearOneFieldError(form, phoneEl);

        // если поле очистили, тоже убираем красное
        const digits = String(phoneEl.value || "").replace(/\D/g, "");
        if (!digits) clearOneFieldError(form, phoneEl);
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

  // Мягкая маска (без подстановки и без “дозабивки” цифр)
  function setupRuPhoneMask(input) {
    input.setAttribute("inputmode", "tel");
    input.setAttribute("autocomplete", "tel");

    input.addEventListener("input", () => {
      const raw = String(input.value || "");
      let d = raw.replace(/\D/g, "");

      if (!d) {
        input.value = "";
        return;
      }

      // лимит по цифрам, чтобы не улетало
      d = d.slice(0, 11);

      input.value = formatPhoneLive(d);
    });

    input.addEventListener("blur", () => {
      // если остался мусор типа "8" или "7", чистим
      const digits = String(input.value || "").replace(/\D/g, "");
      if (digits === "7" || digits === "8" || digits === "") input.value = "";
    });

    function formatPhoneLive(digits) {
      // 1) пользователь вводит 8 + 10 цифр (полный формат РФ) -> показываем как +7
      if (digits[0] === "8" && digits.length === 11) {
        const rest = digits.slice(1);
        return formatPlus7(rest);
      }

      // 2) пользователь вводит 7... -> показываем +7
      if (digits[0] === "7") {
        const rest = digits.slice(1);
        return formatPlus7(rest);
      }

      // 3) пользователь вводит мобильный без префикса: 9XXXXXXXXX -> показываем +7(...)
      if (digits[0] === "9") {
        return formatPlus7(digits);
      }

      // 4) если начал с 8, но еще не добил 11 цифр, показываем “8 (...) ...”
      if (digits[0] === "8") {
        const rest = digits.slice(1);
        return formatDomestic8(rest);
      }

      // остальное: просто цифры (чтобы не ломать ввод)
      return digits;
    }

    function formatPlus7(rest10) {
      const p = String(rest10 || "").slice(0, 10);

      const a = p.slice(0, 3);
      const b = p.slice(3, 6);
      const c = p.slice(6, 8);
      const e = p.slice(8, 10);

      let out = "+7";
      if (a) out += ` (${a}`;
      if (a.length === 3) out += ")";
      if (b) out += ` ${b}`;
      if (c) out += `-${c}`;
      if (e) out += `-${e}`;
      return out;
    }

    function formatDomestic8(rest10) {
      const p = String(rest10 || "").slice(0, 10);

      const a = p.slice(0, 3);
      const b = p.slice(3, 6);
      const c = p.slice(6, 8);
      const e = p.slice(8, 10);

      let out = "8";
      if (a) out += ` (${a}`;
      if (a.length === 3) out += ")";
      if (b) out += ` ${b}`;
      if (c) out += `-${c}`;
      if (e) out += `-${e}`;
      return out;
    }
  }

  // Строгая нормализация для проверки/отправки (важно: не “угадывает” сомнительные варианты)
  function normalizeRuPhoneStrict(value) {
    let digits = String(value || "").replace(/\D/g, "");
    if (!digits) return { ok: false };

    // 8XXXXXXXXXX (11 цифр) -> 7XXXXXXXXXX
    if (digits.length === 11 && digits[0] === "8") {
      digits = "7" + digits.slice(1);
    }

    // 7XXXXXXXXXX (11 цифр) -> ok
    if (digits.length === 11 && digits[0] === "7") {
      const p = digits.slice(1);
      return {
        ok: true,
        e164: `+${digits}`,
        display: `+7 (${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6, 8)}-${p.slice(8, 10)}`
      };
    }

    // 9XXXXXXXXX (10 цифр) -> считаем мобильным РФ и добавляем 7
    if (digits.length === 10 && digits[0] === "9") {
      digits = "7" + digits;
      const p = digits.slice(1);
      return {
        ok: true,
        e164: `+${digits}`,
        display: `+7 (${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6, 8)}-${p.slice(8, 10)}`
      };
    }

    return { ok: false };
  }

  function persistAndFillTracking(form) {
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

  function setHidden(form, name, value) {
    let el = form.querySelector(`[name="${name}"]`);
    if (!el) {
      el = document.createElement("input");
      el.type = "hidden";
      el.name = name;
      form.appendChild(el);
    }
    el.value = value ?? "";
  }

  function getHidden(form, name) {
    const el = form.querySelector(`[name="${name}"]`);
    return el ? el.value : "";
  }

  function setSending(btn, isSending) {
    if (!btn) return;
    if (!btn.dataset.text) btn.dataset.text = btn.textContent || "Отправить";

    btn.disabled = isSending;
    btn.setAttribute("aria-busy", isSending ? "true" : "false");
    btn.textContent = isSending ? "Отправляем..." : btn.dataset.text;
    btn.classList.toggle("opacity-70", isSending);
    btn.classList.toggle("cursor-not-allowed", isSending);
  }

  function showError(box, html) {
    if (!box) return;
    box.innerHTML = html;
    box.classList.remove("hidden");
  }

  function showSuccess(box, text) {
    if (!box) return;
    box.textContent = text;
    box.classList.remove("hidden");
  }

  function clearFormMessage(box) {
    if (!box) return;
    box.classList.add("hidden");
    box.innerHTML = "";
    box.textContent = "";
  }

  function clearOneFieldError(form, field) {
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

  function setFieldError(form, field, message) {
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
});