# Примеры Schema.org разметки

Этот файл содержит примеры структурированных данных для разных страниц сайта.

## Главная страница (index.html)

Уже добавлена разметка `MedicalBusiness` в `index.html`.

## Страница услуги (laser.html, removal.html и т.д.)

Добавьте в `<head>` каждой страницы услуги:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Лазерная эпиляция Moveo",
  "description": "Александритовый лазер для удаления волос. Абсолютно безболезненно.",
  "provider": {
    "@type": "MedicalBusiness",
    "name": "Планета здоровой кожи",
    "telephone": "+79112717888"
  },
  "areaServed": {
    "@type": "City",
    "name": "Кудрово"
  },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "RUB",
    "price": "4900",
    "description": "Бикини + Подмышки (акция)"
  }
}
</script>
```

## Страница врача (specialists.html)

Для каждого врача:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Имя Врача",
  "jobTitle": "Врач-дерматолог",
  "worksFor": {
    "@type": "MedicalBusiness",
    "name": "Планета здоровой кожи"
  },
  "knowsAbout": ["Косметология", "Лазерная терапия", "Дерматология"]
}
</script>
```

## Отзывы (reviews.html)

Для каждого отзыва:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Review",
  "itemReviewed": {
    "@type": "MedicalBusiness",
    "name": "Планета здоровой кожи"
  },
  "author": {
    "@type": "Person",
    "name": "Имя клиента"
  },
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "5",
    "bestRating": "5"
  },
  "reviewBody": "Текст отзыва"
}
</script>
```

## Как проверить

Используйте инструменты:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)
