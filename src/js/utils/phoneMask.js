/**
 * Строгая нормализация телефона РФ для отправки/валидации.
 * Живая маска ввода находится в src/js/modules/phoneMask.js.
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
      display: `+7 (${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6, 8)}-${p.slice(8, 10)}`,
    };
  }

  // XXXXXXXXXX (10 цифр) -> считаем номером РФ
  if (digits.length === 10) {
    digits = "7" + digits;
    const p = digits.slice(1);
    return {
      ok: true,
      e164: `+${digits}`,
      display: `+7 (${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6, 8)}-${p.slice(8, 10)}`,
    };
  }

  return { ok: false };
}
