/**
 * Утилиты для работы с телефонными номерами (российский формат)
 */

/**
 * Мягкая маска (без подстановки и без "дозабивки" цифр)
 */
export function setupRuPhoneMask(input) {
  input.setAttribute("inputmode", "tel");
  input.setAttribute("autocomplete", "tel");

  let previousValue = "";
  let previousDigits = "";

  input.addEventListener("keydown", (e) => {
    // Сохраняем состояние до изменения
    previousValue = input.value;
    previousDigits = previousValue.replace(/\D/g, "");
  });

  input.addEventListener("input", (e) => {
    const raw = String(input.value || "");
    const cursorPos = input.selectionStart || 0;
    let currentDigits = raw.replace(/\D/g, "");

    // Определяем, было ли это удаление
    const wasBackspace = currentDigits.length < previousDigits.length;

    // Если удаление и текущее количество цифр такое же как было
    // (удалили только форматирующий символ), удаляем ещё одну цифру
    if (wasBackspace && raw.length < previousValue.length) {
      // Находим позицию удаления в предыдущей строке
      const deletedCharsCount = previousValue.length - raw.length;
      const positionBeforeDelete = cursorPos + deletedCharsCount;
      
      // Считаем, сколько цифр было до позиции удаления
      const beforeDelete = previousValue.slice(0, positionBeforeDelete);
      const digitsBeforeDelete = beforeDelete.replace(/\D/g, "").length;
      
      // Если удалили не цифру, а форматирующий символ - удаляем предыдущую цифру
      if (currentDigits.length === previousDigits.length && digitsBeforeDelete > 0) {
        currentDigits = previousDigits.slice(0, digitsBeforeDelete - 1) + previousDigits.slice(digitsBeforeDelete);
      }
    }

    if (!currentDigits) {
      input.value = "";
      previousValue = "";
      previousDigits = "";
      return;
    }

    // лимит по цифрам, чтобы не улетало
    currentDigits = currentDigits.slice(0, 11);

    const formatted = formatPhoneLive(currentDigits);
    
    input.value = formatted;
    previousValue = formatted;
    previousDigits = currentDigits;

    // Ставим курсор в конец
    setTimeout(() => {
      input.setSelectionRange(formatted.length, formatted.length);
    }, 0);
  });

  input.addEventListener("blur", () => {
    // если остался мусор типа "8" или "7", чистим
    const digits = String(input.value || "").replace(/\D/g, "");
    if (digits === "7" || digits === "8" || digits === "") {
      input.value = "";
      previousValue = "";
      previousDigits = "";
    }
  });

  function formatPhoneLive(digits) {
    // Если меньше 2 цифр, не форматируем (чтобы можно было удалить)
    if (digits.length < 2) {
      return digits;
    }

    // 1) пользователь вводит 8 + 10 цифр (полный формат РФ) -> показываем как +7
    if (digits[0] === "8" && digits.length === 11) {
      const rest = digits.slice(1);
      return formatPlus7(rest);
    }

    // 2) пользователь вводит 7... -> показываем +7
    if (digits[0] === "7" && digits.length >= 2) {
      const rest = digits.slice(1);
      return formatPlus7(rest);
    }

    // 3) пользователь вводит мобильный без префикса: 9XXXXXXXXX -> показываем +7(...)
    if (digits[0] === "9" && digits.length >= 10) {
      return formatPlus7(digits);
    }

    // 4) если начал с 8, но еще не добил 11 цифр, показываем "8 (...) ..."
    if (digits[0] === "8" && digits.length >= 2) {
      const rest = digits.slice(1);
      return formatDomestic8(rest);
    }

    // 5) если начал с 9, но меньше 10 цифр, показываем как есть (чтобы можно было удалить)
    if (digits[0] === "9" && digits.length < 10) {
      return digits;
    }

    // остальное: просто цифры (чтобы не ломать ввод)
    return digits;
  }

  function formatPlus7(rest10) {
    const p = String(rest10 || "").slice(0, 10);

    const a = p.slice(0, 3);
    const b = p.slice(3, 6);
    const c = p.slice(6, 8);
    const e = p.slice(8, 10);

    let out = "+7";
    if (a) out += ` (${a}`;
    if (a.length === 3) out += ")";
    if (b) out += ` ${b}`;
    if (c) out += `-${c}`;
    if (e) out += `-${e}`;
    return out;
  }

  function formatDomestic8(rest10) {
    const p = String(rest10 || "").slice(0, 10);

    const a = p.slice(0, 3);
    const b = p.slice(3, 6);
    const c = p.slice(6, 8);
    const e = p.slice(8, 10);

    let out = "8";
    if (a.length > 0) {
      out += ` (${a}`;
      if (a.length === 3) out += ")";
    }
    if (b.length > 0) {
      if (a.length === 3) out += ` ${b}`;
      else out += b;
    }
    if (c.length > 0) {
      if (b.length > 0) out += `-${c}`;
      else out += c;
    }
    if (e.length > 0) {
      if (c.length > 0) out += `-${e}`;
      else out += e;
    }
    return out;
  }
}

/**
 * Строгая нормализация для проверки/отправки (важно: не "угадывает" сомнительные варианты)
 */
export function normalizeRuPhoneStrict(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (!digits) return { ok: false };

  // 8XXXXXXXXXX (11 цифр) -> 7XXXXXXXXXX
  if (digits.length === 11 && digits[0] === "8") {
    digits = "7" + digits.slice(1);
  }

  // 7XXXXXXXXXX (11 цифр) -> ok
  if (digits.length === 11 && digits[0] === "7") {
    const p = digits.slice(1);
    return {
      ok: true,
      e164: `+${digits}`,
      display: `+7 (${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6, 8)}-${p.slice(8, 10)}`
    };
  }

  // XXXXXXXXXX (10 цифр) -> считаем номером РФ и добавляем 7
  // Принимаем любые 10 цифр, не только начинающиеся с 9 (городские номера тоже валидны)
  if (digits.length === 10) {
    digits = "7" + digits;
    const p = digits.slice(1);
    return {
      ok: true,
      e164: `+${digits}`,
      display: `+7 (${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6, 8)}-${p.slice(8, 10)}`
    };
  }

  return { ok: false };
}
