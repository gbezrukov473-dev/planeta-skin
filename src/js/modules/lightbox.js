/**
 * Модуль лайтбокса для изображений с навигацией
 */
export function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");
  const lightboxPrev = document.getElementById("lightbox-prev");
  const lightboxNext = document.getElementById("lightbox-next");

  if (!lightbox || !lightboxImg || !lightboxClose) return;

  // Собираем все изображения для навигации
  let images = [];
  let currentIndex = 0;

  // Инициализируем массив изображений из всех триггеров
  function initImages() {
    const triggers = document.querySelectorAll(".lightbox-trigger");
    images = Array.from(triggers).map((trigger) => {
      return (
        trigger.getAttribute("data-src") ||
        trigger.getAttribute("data-img-url") ||
        trigger.getAttribute("href") ||
        trigger.getAttribute("src") ||
        ""
      );
    }).filter(Boolean);
  }

  initImages();

  const openLightbox = (src, index = -1) => {
    if (!src) return;
    
    // Переинициализируем массив изображений на случай, если элементы были добавлены динамически
    initImages();
    
    // Находим индекс текущего изображения
    if (index === -1) {
      currentIndex = images.indexOf(src);
      if (currentIndex === -1) {
        // Если изображение не найдено, добавляем его
        images.push(src);
        currentIndex = images.length - 1;
      }
    } else {
      currentIndex = index;
    }

    lightboxImg.src = src;
    lightbox.classList.remove("hidden");
    lightbox.classList.add("flex");
    updateNavigation();
  };

  const closeLightbox = () => {
    lightbox.classList.add("hidden");
    lightbox.classList.remove("flex");
    lightboxImg.src = "";
    currentIndex = 0;
  };

  const showNext = () => {
    if (images.length === 0) {
      initImages();
    }
    if (images.length === 0) return;
    currentIndex = (currentIndex + 1) % images.length;
    lightboxImg.src = images[currentIndex];
    updateNavigation();
  };

  const showPrev = () => {
    if (images.length === 0) {
      initImages();
    }
    if (images.length === 0) return;
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    lightboxImg.src = images[currentIndex];
    updateNavigation();
  };

  const updateNavigation = () => {
    if (lightboxPrev) {
      lightboxPrev.style.display = images.length > 1 ? "flex" : "none";
    }
    if (lightboxNext) {
      lightboxNext.style.display = images.length > 1 ? "flex" : "none";
    }
  };

  // Используем делегирование событий для работы с динамически добавленными элементами
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".lightbox-trigger");
    if (!trigger) return;
    
    e.preventDefault();
    const src =
      trigger.getAttribute("data-src") ||
      trigger.getAttribute("data-img-url") ||
      trigger.getAttribute("href") ||
      trigger.getAttribute("src");
    if (src) {
      openLightbox(src);
    }
  });

  lightboxClose.addEventListener("click", closeLightbox);

  if (lightboxPrev) {
    lightboxPrev.addEventListener("click", (e) => {
      e.stopPropagation();
      showPrev();
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener("click", (e) => {
      e.stopPropagation();
      showNext();
    });
  }

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.classList.contains("hidden")) return;
    
    if (e.key === "Escape") {
      closeLightbox();
    } else if (e.key === "ArrowLeft") {
      showPrev();
    } else if (e.key === "ArrowRight") {
      showNext();
    }
  });
}
