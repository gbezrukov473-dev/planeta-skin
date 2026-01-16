/**
 * Lazy Loading изображений с blur-up эффектом
 * 
 * Использует IntersectionObserver для умной загрузки изображений
 * при скролле. Изображения должны иметь data-src (или data-srcset).
 */

/**
 * Загружает изображение
 */
function loadImage(img) {
  // Подставляем src
  if (img.dataset.src) {
    img.src = img.dataset.src;
  }
  
  // Подставляем srcset
  if (img.dataset.srcset) {
    img.srcset = img.dataset.srcset;
  }
  
  // Подставляем sizes
  if (img.dataset.sizes) {
    img.sizes = img.dataset.sizes;
  }
  
  // Обработчик загрузки
  img.addEventListener('load', () => {
    img.classList.add('is-loaded');
    // Очищаем data-атрибуты
    delete img.dataset.src;
    delete img.dataset.srcset;
    delete img.dataset.sizes;
  }, { once: true });
  
  // Обработчик ошибки
  img.addEventListener('error', () => {
    img.classList.add('is-error');
    console.warn('[LazyImages] Failed to load:', img.dataset.src || img.src);
  }, { once: true });
}

/**
 * Инициализация lazy loading изображений
 */
export function initLazyImages() {
  // Находим все изображения с data-src или data-srcset
  const lazyImages = document.querySelectorAll('img[data-src], img[data-srcset]');
  
  if (lazyImages.length === 0) {
    return;
  }
  
  // Проверяем поддержку IntersectionObserver
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            loadImage(img);
            observer.unobserve(img);
          }
        });
      },
      {
        // Загружаем изображения заранее (600px до viewport)
        rootMargin: '600px 0px',
        threshold: 0.01
      }
    );
    
    lazyImages.forEach((img) => {
      imageObserver.observe(img);
    });
    
    console.log(`[LazyImages] Observing ${lazyImages.length} images`);
  } else {
    // Fallback: загружаем все сразу
    console.log('[LazyImages] IntersectionObserver not supported, loading all');
    lazyImages.forEach((img) => {
      loadImage(img);
    });
  }
}
