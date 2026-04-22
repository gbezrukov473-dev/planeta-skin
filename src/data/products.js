/**
 * Стартовый каталог интернет-магазина Pro You.
 *
 * Источник: прайс 2026 (колонка РРЦ2 — рекомендованная розничная цена
 * для интернет-продаж).
 *
 * Принцип подбора (по просьбе клиники): начинаем с малого — ходовые позиции
 * разных категорий и ценовых диапазонов. Постепенно дополняем ассортимент.
 *
 * Чтобы добавить/убрать товар — правим этот файл + синхронно
 * `send-form/catalog.php` (серверное зеркало для email и логов).
 *
 * Поля:
 *  id       — внутренний slug (должен совпадать с ключом в PHP)
 *  name     — полное название продукта
 *  short    — короткое описание (1–2 предложения, для карточки)
 *  line     — название линии (для группировки в форме заказа)
 *  category — ключ категории из CATEGORIES
 *  size     — объем/вес
 *  price    — цена в ₽ (целое число)
 *  code     — артикул из прайса (для админа)
 *  badge    — опциональная плашка («Хит», «Новинка», «SPF»)
 */

export const CATEGORIES = [
  { id: 'all',        label: 'Все средства' },
  { id: 'cleansing',  label: 'Очищение' },
  { id: 'toner',      label: 'Тоники' },
  { id: 'serum',      label: 'Сыворотки' },
  { id: 'cream',      label: 'Кремы' },
  { id: 'eye',        label: 'Для глаз' },
  { id: 'mask',       label: 'Маски' },
  { id: 'set',        label: 'Наборы' },
];

export const PRODUCTS = [
  // --- Очищение ---
  {
    id: 'mic-calendula',
    name: 'Мицеллярная вода Pro You Calendula pH Balance',
    short: 'Мягкое очищение и снятие макияжа. Подходит для чувствительной кожи.',
    line: 'Basic',
    category: 'cleansing',
    size: '300 мл',
    price: 9600,
    code: '1-15A',
    badge: 'Хит',
  },
  {
    id: 'enzyme-powder',
    name: 'Энзимная пудра для умывания Pro You Enzyme Powder Cleanser',
    short: 'Активируется водой. Растворяет ороговевшие клетки, выравнивает текстуру кожи.',
    line: 'Basic',
    category: 'cleansing',
    size: '70 г',
    price: 9770,
    code: '1-9A',
  },
  {
    id: 'foam-lemon',
    name: 'Очищающая крем-пенка Pro You Lemon Fresh Foam Cleanser',
    short: 'Освежающая пенка с экстрактом лимона. Деликатно очищает и тонизирует.',
    line: 'Basic',
    category: 'cleansing',
    size: '120 г',
    price: 8900,
    code: '1-14A',
  },

  // --- Тоники ---
  {
    id: 'toner-wrinkle',
    name: 'Тонер Pro You Wrinkle Peptide',
    short: 'Антивозрастной тонер с пептидами. Подготавливает кожу к уходу и разглаживает морщины.',
    line: 'Wrinkle Peptide',
    category: 'toner',
    size: '130 мл',
    price: 9700,
    code: '2-1А',
  },
  {
    id: 'toner-aroma-ac',
    name: 'Тонер Pro You Aroma AC',
    short: 'Для проблемной и жирной кожи. Сужает поры, снижает воспаления.',
    line: 'Aroma AC',
    category: 'toner',
    size: '130 мл',
    price: 8400,
    code: '2-5А',
  },

  // --- Сыворотки и концентраты ---
  {
    id: 'serum-wrinkle',
    name: 'Сыворотка Pro You Wrinkle Peptide Serum',
    short: 'Концентрат с пептидами против мимических морщин. Подтягивает и уплотняет кожу.',
    line: 'Wrinkle Peptide',
    category: 'serum',
    size: '50 мл',
    price: 13100,
    code: '6-1А',
    badge: 'Хит',
  },
  {
    id: 'serum-whitening',
    name: 'Сыворотка Pro You Whitening Serum',
    short: 'Сыворотка против пигментации с арбутином и витамином C. Выравнивает тон.',
    line: 'Whitening',
    category: 'serum',
    size: '50 мл',
    price: 13100,
    code: '6-2А',
  },
  {
    id: 'fluid-vitc',
    name: 'Флюид Pro You Vitamin C Fluid 15%',
    short: 'Высокая концентрация витамина C. Антиоксидант, сияние, борьба с пигментом.',
    line: 'Vitamin C',
    category: 'serum',
    size: '30 мл',
    price: 13100,
    code: '5-7А',
  },

  // --- Кремы ---
  {
    id: 'cream-retinol',
    name: 'Крем Pro You Retinol Cream',
    short: 'Крем с ретинолом для обновления кожи и коррекции возрастных изменений.',
    line: 'Retinol',
    category: 'cream',
    size: '40 г',
    price: 9800,
    code: '8-11А',
  },
  {
    id: 'cream-wrinkle',
    name: 'Крем Pro You Wrinkle Peptide Cream',
    short: 'Пептидный крем для упругости и коррекции морщин. Ежедневный антивозрастной уход.',
    line: 'Wrinkle Peptide',
    category: 'cream',
    size: '60 г',
    price: 13200,
    code: '7-1А',
  },
  {
    id: 'cream-hydration',
    name: 'Крем Pro You Hydration Cream',
    short: 'Крем для сухой и обезвоженной кожи с Lipidure-PBM. Долгое увлажнение.',
    line: 'Hydration',
    category: 'cream',
    size: '60 г',
    price: 11800,
    code: '7-6А',
  },
  {
    id: 'cream-spf50',
    name: 'Крем Pro You SPF 50 Vita White Sun Protection PA+++',
    short: 'Солнцезащитный крем с осветляющим эффектом. Обязателен после пилингов и лазера.',
    line: 'Vita White',
    category: 'cream',
    size: '50 г',
    price: 9100,
    code: '8-6А',
    badge: 'SPF 50',
  },

  // --- Для глаз ---
  {
    id: 'patch-black-pearl',
    name: 'Гидрогелевые патчи Pro You Premium Black Pearl Eye Patch',
    short: 'Гидрогелевые патчи с черным жемчугом. Снимают отеки, разглаживают.',
    line: 'Eye Care',
    category: 'eye',
    size: '60 шт',
    price: 5000,
    code: 'PPP',
    badge: 'Хит',
  },
  {
    id: 'eye-cream-wrinkle',
    name: 'Крем для кожи вокруг глаз Pro You Wrinkle Peptide Eye Cream',
    short: 'Пептидный крем для деликатной зоны вокруг глаз. Работает с морщинками и усталостью.',
    line: 'Wrinkle Peptide',
    category: 'eye',
    size: '30 г',
    price: 13200,
    code: '8-1А',
  },

  // --- Маски ---
  {
    id: 'mask-phyto-collagen',
    name: 'Кремовая маска Pro You Phyto Collagen Mask',
    short: 'Интенсивная маска с фитоколлагеном. Возвращает упругость и свежесть.',
    line: 'Phyto Collagen',
    category: 'mask',
    size: '150 г',
    price: 9600,
    code: '11-6А',
  },
  {
    id: 'mask-sheet-placenta',
    name: 'Набор тканевых масок Pro You Bio Placenta Bright',
    short: 'Тканевые маски с био-плацентой. Курс для сияния и восстановления.',
    line: 'Bio Placenta',
    category: 'mask',
    size: '25 мл × 10 шт',
    price: 9900,
    code: '16-7А',
  },

  // --- Наборы ---
  {
    id: 'set-mini-wrinkle',
    name: 'Набор мини-версий Pro You Wrinkle Peptide',
    short: 'Дорожный набор: тонер, сыворотка, лосьон, крем. Попробовать серию или взять с собой.',
    line: 'Wrinkle Peptide',
    category: 'set',
    size: '8 мл + 5 мл + 8 мл + 6 г',
    price: 2100,
    code: 'SS-3',
    badge: 'Попробовать',
  },
  {
    id: 'set-metacos',
    name: 'Подарочный набор Pro You Metacos Platinum Wrinkle Peptide',
    short: 'Премиальная линия с платиной и пептидами: тонер, сыворотка, лосьон, крем, крем для глаз.',
    line: 'Metacos Platinum',
    category: 'set',
    size: '130 + 50 + 130 + 50 + 30 мл/г',
    price: 57800,
    code: '25-1S',
    badge: 'Premium',
  },
];
