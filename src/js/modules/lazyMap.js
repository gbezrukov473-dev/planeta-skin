/**
 * Модуль для ленивой загрузки карты Яндекс при достижении 70% страницы
 */
export function initLazyMap() {
  const mapContainer = document.querySelector('footer iframe[title*="Карта"]');
  if (!mapContainer) return;

  // Если карта уже загружена, выходим
  if (mapContainer.src && !mapContainer.src.includes('data:')) {
    return;
  }

  // Сохраняем оригинальный src
  const originalSrc = mapContainer.getAttribute('data-src') || mapContainer.src;
  if (!originalSrc) return;

  // Устанавливаем пустой src или data-src
  mapContainer.src = '';
  mapContainer.setAttribute('data-src', originalSrc);

  // Функция для загрузки карты
  function loadMap() {
    if (mapContainer.src) return; // Уже загружена
    
    const src = mapContainer.getAttribute('data-src');
    if (src) {
      mapContainer.src = src;
      mapContainer.removeAttribute('data-src');
    }
  }

  // Используем IntersectionObserver для определения, когда пользователь достиг 70% страницы
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Вычисляем процент прокрутки страницы
          const scrollPercent = 
            ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100;
          
          // Загружаем карту, если пользователь прокрутил на 70% или больше
          if (scrollPercent >= 70) {
            loadMap();
            observer.disconnect();
          }
        }
      });
    },
    {
      // Начинаем отслеживать, когда контейнер карты находится в viewport
      rootMargin: '0px',
      threshold: 0.1
    }
  );

  // Альтернативный подход: отслеживаем прокрутку страницы
  let mapLoaded = false;
  function checkScrollPosition() {
    if (mapLoaded) return;
    
    const scrollPercent = 
      ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100;
    
    if (scrollPercent >= 70) {
      loadMap();
      mapLoaded = true;
      window.removeEventListener('scroll', checkScrollPosition, { passive: true });
      observer.disconnect();
    }
  }

  // Начинаем отслеживать прокрутку
  window.addEventListener('scroll', checkScrollPosition, { passive: true });
  
  // Также отслеживаем видимость контейнера карты
  observer.observe(mapContainer.parentElement);

  // Если страница короткая или пользователь уже прокрутил достаточно, загружаем сразу
  setTimeout(() => {
    if (!mapLoaded) {
      const scrollPercent = 
        ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100;
      if (document.documentElement.scrollHeight <= window.innerHeight * 1.5 || scrollPercent >= 70) {
        loadMap();
        mapLoaded = true;
        window.removeEventListener('scroll', checkScrollPosition, { passive: true });
        observer.disconnect();
      }
    }
  }, 1000);
}
