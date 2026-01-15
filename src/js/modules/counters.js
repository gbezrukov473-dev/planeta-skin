/**
 * Модуль анимированных счетчиков
 */
export function initCounters() {
  const statsSection = document.getElementById("stats-section");
  const counters = document.querySelectorAll(".counter");
  let countersStarted = false;

  if (!statsSection) return;

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
