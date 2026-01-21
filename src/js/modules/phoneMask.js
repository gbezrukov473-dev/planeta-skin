/**
 * Нативная маска телефона для российских номеров
 * Формат: +7 (9XX) XXX-XX-XX
 * 
 * Особенности:
 * - Блокирует ввод 8 в начале (частая ошибка пользователей)
 * - Принимает только 9 в качестве первой цифры после +7
 * - Автоматически форматирует при вводе и вставке
 */

/**
 * Инициализация маски на всех полях с классом .mask-phone
 */
export function initPhoneMask() {
  const inputs = document.querySelectorAll('.mask-phone');
  inputs.forEach(input => applyPhoneMask(input));
}

/**
 * Применяет маску к конкретному input-элементу
 */
function applyPhoneMask(input) {
  // Атрибуты для мобильных устройств
  input.setAttribute('autocomplete', 'tel');
  input.setAttribute('inputmode', 'tel');
  input.setAttribute('placeholder', '+7 (9__) ___-__-__');

  // Основной обработчик ввода
  input.addEventListener('input', handleInput);
  
  // Обработчик фокуса — ставим префикс
  input.addEventListener('focus', handleFocus);
  
  // Обработчик потери фокуса — очищаем если пусто
  input.addEventListener('blur', handleBlur);
  
  // Обработчик вставки
  input.addEventListener('paste', handlePaste);
  
  // Блокировка недопустимых клавиш
  input.addEventListener('keydown', handleKeydown);
}

/**
 * Форматирует строку цифр в маску +7 (XXX) XXX-XX-XX
 */
function formatPhone(digits) {
  // Убираем всё кроме цифр
  digits = digits.replace(/\D/g, '');
  
  // Убираем ведущую 7 или 8 если есть (мы добавим 7 сами)
  if (digits.length > 0 && (digits[0] === '7' || digits[0] === '8')) {
    digits = digits.substring(1);
  }
  
  // Блокируем если первая цифра не 9 (для российских мобильных)
  // Разрешаем пустую строку и строки начинающиеся с 9
  if (digits.length > 0 && digits[0] !== '9') {
    // Если ввели что-то кроме 9 — игнорируем эту цифру
    digits = digits.substring(1);
  }
  
  // Ограничиваем 10 цифрами (без кода страны)
  digits = digits.substring(0, 10);
  
  // Формируем строку
  let formattedValue = '+7 (';
  
  if (digits.length > 0) {
    formattedValue += digits.substring(0, 3);
  }
  if (digits.length >= 3) {
    formattedValue += ') ' + digits.substring(3, 6);
  }
  if (digits.length >= 6) {
    formattedValue += '-' + digits.substring(6, 8);
  }
  if (digits.length >= 8) {
    formattedValue += '-' + digits.substring(8, 10);
  }
  
  return formattedValue;
}

/**
 * Извлекает цифры номера (без кода страны)
 */
function extractDigits(value) {
  let digits = value.replace(/\D/g, '');
  
  // Убираем код страны (7 или 8)
  if (digits.length > 0 && (digits[0] === '7' || digits[0] === '8')) {
    digits = digits.substring(1);
  }
  
  return digits;
}

/**
 * Обработчик ввода
 */
function handleInput(e) {
  const input = e.target;
  const digits = extractDigits(input.value);
  input.value = formatPhone(digits);
}

/**
 * Обработчик нажатия клавиш — блокируем 8 в начале
 */
function handleKeydown(e) {
  const input = e.target;
  const digits = extractDigits(input.value);
  
  // Если номер пустой и нажали 8 — блокируем
  if (digits.length === 0 && e.key === '8') {
    e.preventDefault();
    return;
  }
  
  // Если номер пустой и нажали не 9 и не служебную клавишу — блокируем
  if (digits.length === 0) {
    const isDigit = /^[0-9]$/.test(e.key);
    const isAllowed = e.key === '9' || !isDigit;
    
    if (isDigit && !isAllowed) {
      e.preventDefault();
      return;
    }
  }
  
  // Не даём удалить "+7 ("
  if (e.key === 'Backspace') {
    const cursorPos = input.selectionStart;
    if (cursorPos <= 4) {
      e.preventDefault();
      return;
    }
  }
}

/**
 * Обработчик фокуса
 */
function handleFocus(e) {
  const input = e.target;
  
  // Если пусто — ставим префикс
  if (!input.value || input.value.length < 4) {
    input.value = '+7 (';
  }
  
  // Ставим курсор в конец
  setTimeout(() => {
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }, 0);
}

/**
 * Обработчик потери фокуса
 */
function handleBlur(e) {
  const input = e.target;
  const digits = extractDigits(input.value);
  
  // Если нет цифр — очищаем поле полностью
  if (digits.length === 0) {
    input.value = '';
  }
}

/**
 * Обработчик вставки
 */
function handlePaste(e) {
  e.preventDefault();
  const input = e.target;
  const pastedText = (e.clipboardData || window.clipboardData).getData('text');
  
  // Извлекаем цифры из вставленного текста
  let digits = pastedText.replace(/\D/g, '');
  
  // Убираем код страны если есть
  if (digits.length > 0 && (digits[0] === '7' || digits[0] === '8')) {
    digits = digits.substring(1);
  }
  
  // Форматируем и вставляем
  input.value = formatPhone(digits);
  
  // Курсор в конец
  const len = input.value.length;
  input.setSelectionRange(len, len);
  
  // Триггерим input event для валидации форм
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
