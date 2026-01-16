import { getPrefersReducedMotion } from "../utils/prefersReducedMotion.js";

/**
 * Hero слайдер
 */
export function initHeroSlider() {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const prevBtn = document.getElementById("slider-prev");
  const nextBtn = document.getElementById("slider-next");
  const clickLeft = document.getElementById("slider-click-left");
  const clickRight = document.getElementById("slider-click-right");
  const heroContainer = document.getElementById("hero-slider");
  const prefersReducedMotion = getPrefersReducedMotion();

  if (slides.length === 0) return;

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

/**
 * Слайдер оборудования
 */
export function initEquipmentSlider() {
  const equipSlides = Array.from(document.querySelectorAll(".equip-slide"));
  const prefersReducedMotion = getPrefersReducedMotion();

  if (equipSlides.length === 0 || prefersReducedMotion) return;

  let equipIndex = 0;

  setInterval(() => {
    equipSlides[equipIndex].classList.remove("opacity-100");
    equipSlides[equipIndex].classList.add("opacity-0");

    equipIndex = (equipIndex + 1) % equipSlides.length;

    equipSlides[equipIndex].classList.remove("opacity-0");
    equipSlides[equipIndex].classList.add("opacity-100");
  }, 4000);
}

/**
 * Слайдер результатов (карусели до/после)
 */
export function initRemovalSlider() {
  // Ищем новые слайдеры .results-slider и старые .slider-container
  const sliderContainers = document.querySelectorAll(".results-slider, .slider-container");
  const prefersReducedMotion = getPrefersReducedMotion();

  if (sliderContainers.length === 0) return;

  sliderContainers.forEach(sliderContainer => {
    const slider = sliderContainer.querySelector(".slider");
    if (!slider) return;

    const imgs = slider.querySelectorAll("[data-img-url]");
    const dotsContainer = sliderContainer.querySelector(".index-container");
    const arrowButtons = sliderContainer.querySelectorAll("[data-index-change]");

    if (dotsContainer) dotsContainer.innerHTML = "";

    imgs.forEach((div, index) => {
      const url = div.getAttribute("data-img-url");
      if (!url) return;

      // Устанавливаем background-image (браузер загрузит его)
      div.style.backgroundImage = `url(${url})`;

      // Добавляем класс lightbox-trigger и data-src для интеграции с lightbox.js
      div.classList.add("lightbox-trigger");
      div.setAttribute("data-src", url);

      if (dotsContainer) {
        const dot = document.createElement("button");
        dot.setAttribute("aria-label", `Слайд ${index + 1}`);
        dotsContainer.appendChild(dot);
      }
    });

    const indexButtons = dotsContainer ? dotsContainer.querySelectorAll("button") : [];
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

      slider.style.transform = `translateX(-${nextIndex * 100}%)`;
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

    sliderContainer.addEventListener("mouseenter", stopAuto);
    sliderContainer.addEventListener("mouseleave", startAuto);
  });
}
