/**
 * Скрипт для замены Font Awesome иконок на SVG-спрайт
 * Запуск: node scripts/replace-icons.js
 */

const fs = require('fs');
const path = require('path');

// Маппинг FA классов на SVG ID
const iconMapping = {
    // Solid (fas)
    'fa-arrow-left': 'i-arrow-left',
    'fa-arrow-right': 'i-arrow-right',
    'fa-arrow-up': 'i-arrow-up',
    'fa-bars': 'i-bars',
    'fa-bolt': 'i-bolt',
    'fa-calendar-alt': 'i-calendar-alt',
    'fa-calendar-check': 'i-calendar-check',
    'fa-check': 'i-check',
    'fa-check-circle': 'i-check-circle',
    'fa-check-double': 'i-check-double',
    'fa-chevron-down': 'i-chevron-down',
    'fa-chevron-left': 'i-chevron-left',
    'fa-chevron-right': 'i-chevron-right',
    'fa-clock': 'i-clock',
    'fa-credit-card': 'i-credit-card',
    'fa-crosshairs': 'i-crosshairs',
    'fa-exchange-alt': 'i-exchange-alt',
    'fa-feather-alt': 'i-feather-alt',
    'fa-file-medical': 'i-file-medical',
    'fa-fire': 'i-fire',
    'fa-gift': 'i-gift',
    'fa-hand-sparkles': 'i-hand-sparkles',
    'fa-heart': 'i-heart',
    'fa-image': 'i-image',
    'fa-infinity': 'i-infinity',
    'fa-key': 'i-key',
    'fa-layer-group': 'i-layer-group',
    'fa-leaf': 'i-leaf',
    'fa-magic': 'i-magic',
    'fa-male': 'i-male',
    'fa-map-marker-alt': 'i-map-marker-alt',
    'fa-map-marked-alt': 'i-map-marked-alt',
    'fa-medal': 'i-medal',
    'fa-microchip': 'i-microchip',
    'fa-microscope': 'i-microscope',
    'fa-parking': 'i-parking',
    'fa-phone-alt': 'i-phone-alt',
    'fa-plus': 'i-plus',
    'fa-quote-right': 'i-quote-right',
    'fa-running': 'i-running',
    'fa-search-plus': 'i-search-plus',
    'fa-shield-alt': 'i-shield-alt',
    'fa-shopping-bag': 'i-shopping-bag',
    'fa-shopping-cart': 'i-shopping-cart',
    'fa-smile': 'i-smile',
    'fa-snowflake': 'i-snowflake',
    'fa-star': 'i-star',
    'fa-sun': 'i-sun',
    'fa-times': 'i-times',
    'fa-tshirt': 'i-tshirt',
    'fa-user-md': 'i-user-md',
    'fa-walking': 'i-walking',
    'fa-wave-square': 'i-wave-square',
    // Brands (fab)
    'fa-instagram': 'i-instagram',
    'fa-vk': 'i-vk',
    'fa-yandex': 'i-yandex',
};

// Иконки far (regular) - особый случай
const regularIconMapping = {
    'fa-clock': 'i-clock-outline',
    'fa-image': 'i-image',
};

// HTML файлы для обработки
const htmlFiles = [
    'index.html',
    'laser.html',
    'hardware.html',
    'removal.html',
    'inject.html',
    'aesthetic.html',
    'body.html',
    'specialists.html',
    'equipment.html',
    'about.html',
    'reviews.html',
    'promo.html',
    'certificates.html',
    'legal.html',
    'policy.html',
    'thanks.html',
    'templates/header.html',
    'templates/footer.html',
];

function replaceIcons(content) {
    // Регулярное выражение для поиска <i class="...fa-...">
    // Обрабатывает: fas, far, fab + fa-iconname + дополнительные классы
    const iconRegex = /<i\s+class="([^"]*(?:fas|far|fab)[^"]*fa-[a-z0-9-]+[^"]*)"\s*(?:aria-hidden="true")?\s*><\/i>/gi;

    return content.replace(iconRegex, (match, classAttr) => {
        // Определяем тип иконки (fas/far/fab)
        const isFar = /\bfar\b/.test(classAttr);
        const isFab = /\bfab\b/.test(classAttr);
        
        // Извлекаем имя иконки
        const iconMatch = classAttr.match(/fa-([a-z0-9-]+)/);
        if (!iconMatch) return match;
        
        const faIconName = `fa-${iconMatch[1]}`;
        let svgId;
        
        // Определяем ID для SVG
        if (isFar && regularIconMapping[faIconName]) {
            svgId = regularIconMapping[faIconName];
        } else if (iconMapping[faIconName]) {
            svgId = iconMapping[faIconName];
        } else {
            console.warn(`⚠️  Иконка не найдена в маппинге: ${faIconName}`);
            return match;
        }
        
        // Извлекаем классы для сохранения (все кроме fa-*, fas, far, fab)
        const classesToKeep = classAttr
            .split(/\s+/)
            .filter(cls => 
                cls && 
                !cls.startsWith('fa-') && 
                cls !== 'fas' && 
                cls !== 'far' && 
                cls !== 'fab'
            )
            .join(' ');
        
        // Формируем итоговые классы
        const finalClasses = classesToKeep 
            ? `icon ${classesToKeep}` 
            : 'icon';
        
        return `<svg class="${finalClasses}" aria-hidden="true"><use href="/img/icons.svg#${svgId}"></use></svg>`;
    });
}

function removeFontAwesomeCDN(content) {
    // Удаляем строку подключения Font Awesome CDN
    const cdnRegex = /\s*<link[^>]*font-awesome[^>]*>\s*/gi;
    return content.replace(cdnRegex, '\n');
}

function processFile(filePath) {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
        console.log(`⏭️  Файл не существует: ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf-8');
    const originalContent = content;
    
    // Заменяем иконки
    content = replaceIcons(content);
    
    // Удаляем Font Awesome CDN
    content = removeFontAwesomeCDN(content);
    
    if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`✅ Обработан: ${filePath}`);
    } else {
        console.log(`⏭️  Без изменений: ${filePath}`);
    }
}

// Обработка всех файлов
console.log('🔄 Начинаем замену Font Awesome иконок на SVG-спрайт...\n');

htmlFiles.forEach(file => {
    processFile(file);
});

console.log('\n✨ Готово!');
console.log('\n📋 Не забудьте:');
console.log('   1. Проверить, что public/img/icons.svg существует');
console.log('   2. Убедиться, что .icon класс добавлен в CSS');
console.log('   3. Запустить сборку и проверить отображение иконок');
