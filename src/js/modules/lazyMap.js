/**
 * Модуль для ленивой загрузки карты Яндекс при достижении 70% страницы
 */
export function initLazyMap() {
  const mapIframe = document.querySelector('footer iframe[data-src]');
  if (!mapIframe) return;

  const mapSrc = mapIframe.getAttribute('data-src');
  if (!mapSrc) return;

  let mapLoaded = false;

  // Функция для загрузки карты
  function loadMap() {
    if (mapLoaded) return;
    
    mapIframe.src = mapSrc;
    mapIframe.removeAttribute('data-src');
    mapLoaded = true;
    
    // Удаляем слушатели после загрузки
    window.removeEventListener('scroll', checkScrollPosition);
    if (observer) observer.disconnect();
  }

  // Проверяем процент прокрутки страницы
  function checkScrollPosition() {
    if (mapLoaded) return;
    
    const scrollPercent = 
      ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100;
    
    if (scrollPercent >= 70) {
      loadMap();
    }
  }

  // IntersectionObserver для отслеживания видимости футера
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !mapLoaded) {
          loadMap();
        }
      });
    },
    {
      rootMargin: '200px', // Загружаем немного раньше, чем футер станет полностью видимым
      threshold: 0.1
    }
  );

  // Отслеживаем футер
  const footer = document.querySelector('footer');
  if (footer) {
    observer.observe(footer);
  }

  // Также отслеживаем прокрутку страницы
  window.addEventListener('scroll', checkScrollPosition, { passive: true });

  // Проверяем начальное состояние - если страница короткая, загружаем через 2 секунды
  setTimeout(() => {
    if (!mapLoaded) {
      const pageHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      
      // Если страница короткая (футер виден или почти виден)
      if (pageHeight <= viewportHeight * 1.5) {
        loadMap();
      } else {
        // Проверяем текущий скролл
        checkScrollPosition();
      }
    }
  }, 2000);
}
