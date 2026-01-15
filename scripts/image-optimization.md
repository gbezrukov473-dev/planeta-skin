# Оптимизация изображений

## Автоматическая конвертация в WebP

### Установка зависимостей
```bash
npm install --save-dev sharp
```

### Запуск конвертации
```bash
node scripts/convert-to-webp.js
```

Это создаст WebP версии всех изображений в `public/img/webp/`

## Использование в HTML

### Вариант 1: Picture элемент (рекомендуется)

```html
<picture>
  <source srcset="/img/webp/image-name.webp" type="image/webp">
  <img src="/img/image-name.jpg" alt="Описание" loading="lazy" width="400" height="300">
</picture>
```

### Вариант 2: Атрибут srcset (для адаптивных изображений)

```html
<picture>
  <source 
    srcset="/img/webp/image-name-small.webp 400w,
            /img/webp/image-name-medium.webp 800w,
            /img/webp/image-name-large.webp 1200w"
    type="image/webp"
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw">
  <img 
    srcset="/img/image-name-small.jpg 400w,
            /img/image-name-medium.jpg 800w,
            /img/image-name-large.jpg 1200w"
    src="/img/image-name-medium.jpg"
    alt="Описание"
    loading="lazy"
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw">
</picture>
```

## Ручная конвертация

Если не хотите использовать скрипт, можно использовать онлайн-инструменты:
- https://squoosh.app/
- https://convertio.co/jpg-webp/
- https://cloudconvert.com/jpg-to-webp

Или командная строка с cwebp (Google WebP):
```bash
cwebp -q 85 input.jpg -o output.webp
```

## Рекомендации

1. **Качество**: 80-85 для фотографий, 90-95 для логотипов
2. **Размеры**: Создавайте несколько размеров для разных экранов
3. **Lazy loading**: Всегда используйте `loading="lazy"` для изображений ниже fold
4. **Width/Height**: Указывайте размеры для предотвращения layout shift
