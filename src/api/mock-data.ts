import type {
  PartnerOrder,
  MenuItem,
  MenuCategory,
  ModifierGroup,
  RestaurantProfile,
} from '@/types'

// ===== Заказы =====

export const MOCK_ORDERS: PartnerOrder[] = [
  {
    id: 'ord-001',
    orderNumber: 1042,
    status: 'incoming',
    orderType: 'delivery',
    customer: { name: 'Ахмед Магомедов', address: 'пр. Кадырова 15, кв. 42', phone: '+7 (938) 111-22-33', floor: '5', apartment: '42' },
    items: [
      { name: 'Хинкали (10 шт)', quantity: 1, price: 450 },
      { name: 'Хачапури по-аджарски', quantity: 1, price: 380 },
      { name: 'Лимонад Тархун', quantity: 2, price: 150 },
    ],
    itemsCount: 4,
    totalPrice: 1130,
    deliveryFee: 100,
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
  },
  {
    id: 'ord-002',
    orderNumber: 1043,
    status: 'incoming',
    orderType: 'pickup',
    customer: { name: 'Мадина Исаева', address: 'ул. Маяковского 8, кв. 15', phone: '+7 (938) 222-33-44', floor: '3', apartment: '15' },
    items: [
      { name: 'Шашлык из баранины', quantity: 2, price: 520 },
      { name: 'Салат Оливье', quantity: 1, price: 280 },
    ],
    itemsCount: 3,
    totalPrice: 1320,
    deliveryFee: 100,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'ord-003',
    orderNumber: 1041,
    status: 'preparing',
    orderType: 'delivery',
    customer: { name: 'Руслан Кадыров', address: 'ул. Первомайская 22', phone: '+7 (938) 333-44-55' },
    items: [
      { name: 'Чебуреки (3 шт)', quantity: 1, price: 300 },
      { name: 'Борщ', quantity: 1, price: 350 },
      { name: 'Хлеб лаваш', quantity: 2, price: 80 },
    ],
    itemsCount: 4,
    totalPrice: 810,
    deliveryFee: 100,
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    acceptedAt: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: 'ord-004',
    orderNumber: 1040,
    status: 'preparing',
    orderType: 'dine_in',
    customer: { name: 'Зарема Хасанова', address: 'пр. Путина 50, кв. 7', phone: '+7 (938) 444-55-66', floor: '2', apartment: '7', comment: 'Позвонить за 5 минут' },
    items: [
      { name: 'Пицца Маргарита', quantity: 1, price: 450 },
      { name: 'Пицца Пепперони', quantity: 1, price: 520 },
      { name: 'Кола 0.5л', quantity: 2, price: 120 },
    ],
    itemsCount: 4,
    totalPrice: 1210,
    deliveryFee: 0,
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    acceptedAt: new Date(Date.now() - 22 * 60000).toISOString(),
  },
  {
    id: 'ord-005',
    orderNumber: 1039,
    status: 'ready',
    orderType: 'delivery',
    customer: { name: 'Ибрагим Дудаев', address: 'ул. Ленина 3, кв. 88', phone: '+7 (938) 555-66-77', floor: '9', apartment: '88' },
    items: [
      { name: 'Люля-кебаб', quantity: 2, price: 380 },
      { name: 'Рис с овощами', quantity: 1, price: 250 },
    ],
    itemsCount: 3,
    totalPrice: 1010,
    deliveryFee: 100,
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    acceptedAt: new Date(Date.now() - 37 * 60000).toISOString(),
    readyAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'ord-006',
    orderNumber: 1038,
    status: 'completed',
    orderType: 'delivery',
    customer: { name: 'Амина Сулейманова', address: 'ул. Гагарина 12', phone: '+7 (938) 666-77-88' },
    items: [
      { name: 'Харчо', quantity: 1, price: 380 },
      { name: 'Хинкали (5 шт)', quantity: 1, price: 250 },
    ],
    itemsCount: 2,
    totalPrice: 630,
    deliveryFee: 100,
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    acceptedAt: new Date(Date.now() - 117 * 60000).toISOString(),
    readyAt: new Date(Date.now() - 90 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 80 * 60000).toISOString(),
  },
  {
    id: 'ord-007',
    orderNumber: 1037,
    status: 'completed',
    orderType: 'pickup',
    customer: { name: 'Хасан Мусаев', address: 'пр. Кадырова 77', phone: '+7 (938) 777-88-99' },
    items: [
      { name: 'Долма (8 шт)', quantity: 1, price: 420 },
      { name: 'Чай зелёный', quantity: 2, price: 100 },
    ],
    itemsCount: 3,
    totalPrice: 620,
    deliveryFee: 100,
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
    acceptedAt: new Date(Date.now() - 177 * 60000).toISOString(),
    readyAt: new Date(Date.now() - 150 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 140 * 60000).toISOString(),
  },
  {
    id: 'ord-008',
    orderNumber: 1036,
    status: 'rejected',
    orderType: 'delivery',
    customer: { name: 'Лейла Абдулаева', address: 'ул. Мира 5', phone: '+7 (938) 888-99-00' },
    items: [
      { name: 'Стейк рибай', quantity: 1, price: 1200 },
    ],
    itemsCount: 1,
    totalPrice: 1200,
    deliveryFee: 100,
    createdAt: new Date(Date.now() - 200 * 60000).toISOString(),
    rejectedAt: new Date(Date.now() - 198 * 60000).toISOString(),
    rejectReason: 'Позиция закончилась',
  },
  {
    id: 'ord-009',
    orderNumber: 1035,
    status: 'completed',
    orderType: 'pickup',
    customer: { name: 'Магомед Алиев', address: 'ул. Чернышевского 18, кв. 3', phone: '+7 (938) 999-00-11' },
    items: [
      { name: 'Шаурма куриная', quantity: 2, price: 280 },
      { name: 'Картофель фри', quantity: 1, price: 180 },
      { name: 'Айран 0.5л', quantity: 2, price: 80 },
    ],
    itemsCount: 5,
    totalPrice: 900,
    deliveryFee: 0,
    createdAt: new Date(Date.now() - 300 * 60000).toISOString(),
    acceptedAt: new Date(Date.now() - 297 * 60000).toISOString(),
    readyAt: new Date(Date.now() - 275 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 260 * 60000).toISOString(),
  },
  {
    id: 'ord-010',
    orderNumber: 1034,
    status: 'completed',
    orderType: 'dine_in',
    customer: { name: 'Патимат Гамзатова', address: 'пр. Победы 33', phone: '+7 (938) 000-11-22' },
    items: [
      { name: 'Суп-пюре грибной', quantity: 1, price: 320 },
      { name: 'Цезарь с курицей', quantity: 1, price: 380 },
      { name: 'Чай чёрный', quantity: 1, price: 100 },
    ],
    itemsCount: 3,
    totalPrice: 800,
    deliveryFee: 100,
    createdAt: new Date(Date.now() - 400 * 60000).toISOString(),
    acceptedAt: new Date(Date.now() - 397 * 60000).toISOString(),
    readyAt: new Date(Date.now() - 370 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 355 * 60000).toISOString(),
  },
]

// ===== Категории меню =====

export const MOCK_CATEGORIES: MenuCategory[] = [
  { id: 1, name: 'Выпечка', sortOrder: 1 },
  { id: 2, name: 'Горячее', sortOrder: 2 },
  { id: 3, name: 'Супы', sortOrder: 3 },
  { id: 4, name: 'Напитки', sortOrder: 4 },
]

// ===== Позиции меню =====

export const MOCK_MENU_ITEMS: MenuItem[] = [
  // Выпечка
  { id: 1, name: 'Хачапури по-аджарски', description: 'Традиционное грузинское блюдо с сыром и яйцом', price: 380, category: 1, available: true, weight: 350, image: 'https://img.freepik.com/free-photo/khachapuri-with-egg-plate_140725-5765.jpg?w=740', nutrition: { calories: 450, protein: 18, fat: 22, carbs: 42 }, allergens: ['gluten', 'dairy', 'eggs'], modifierGroups: [], sortOrder: 1 },
  { id: 2, name: 'Чебуреки (3 шт)', description: 'Хрустящие чебуреки с мясной начинкой', price: 300, category: 1, available: true, weight: 300, nutrition: { calories: 520, protein: 22, fat: 28, carbs: 44 }, allergens: ['gluten'], modifierGroups: [1], sortOrder: 2 },
  { id: 3, name: 'Хлеб лаваш', description: 'Свежий тонкий лаваш', price: 80, category: 1, available: true, weight: 150, allergens: ['gluten'], modifierGroups: [], sortOrder: 3 },

  // Горячее
  { id: 4, name: 'Шашлык из баранины', description: 'Сочный шашлык из отборной баранины на углях', price: 520, category: 2, available: true, weight: 300, image: 'https://img.freepik.com/free-photo/side-view-kebab-with-grilled-vegetables-sliced-onion-plate_141793-4882.jpg?w=740', nutrition: { calories: 380, protein: 32, fat: 24, carbs: 2 }, allergens: [], modifierGroups: [2], sortOrder: 1 },
  { id: 5, name: 'Люля-кебаб', description: 'Ароматный кебаб из рубленого мяса со специями', price: 380, category: 2, available: true, weight: 250, nutrition: { calories: 340, protein: 28, fat: 20, carbs: 8 }, allergens: [], modifierGroups: [2], sortOrder: 2 },
  { id: 6, name: 'Хинкали (10 шт)', description: 'Грузинские пельмени с ароматным бульоном внутри', price: 450, category: 2, available: true, weight: 500, nutrition: { calories: 480, protein: 24, fat: 18, carbs: 52 }, allergens: ['gluten'], modifierGroups: [1], sortOrder: 3 },
  { id: 7, name: 'Долма (8 шт)', description: 'Виноградные листья с начинкой из мяса и риса', price: 420, category: 2, available: false, weight: 400, allergens: [], modifierGroups: [], sortOrder: 4 },

  // Супы
  { id: 8, name: 'Харчо', description: 'Острый грузинский суп с говядиной и рисом', price: 380, category: 3, available: true, weight: 350, nutrition: { calories: 280, protein: 18, fat: 12, carbs: 28 }, allergens: ['nuts'], modifierGroups: [3], sortOrder: 1 },
  { id: 9, name: 'Борщ', description: 'Классический борщ со сметаной', price: 350, category: 3, available: true, weight: 350, nutrition: { calories: 220, protein: 12, fat: 8, carbs: 30 }, allergens: ['dairy'], modifierGroups: [3], sortOrder: 2 },
  { id: 10, name: 'Суп-пюре грибной', description: 'Нежный крем-суп из белых грибов', price: 320, category: 3, available: true, weight: 300, allergens: ['dairy'], modifierGroups: [3], sortOrder: 3 },

  // Напитки
  { id: 11, name: 'Лимонад Тархун', description: 'Домашний лимонад с тархуном', price: 150, category: 4, available: true, weight: 400, allergens: [], modifierGroups: [], sortOrder: 1 },
  { id: 12, name: 'Чай зелёный', description: 'Листовой зелёный чай', price: 100, category: 4, available: true, weight: 300, allergens: [], modifierGroups: [], sortOrder: 2 },
  { id: 13, name: 'Чай чёрный', description: 'Листовой чёрный чай с чабрецом', price: 100, category: 4, available: true, weight: 300, allergens: [], modifierGroups: [], sortOrder: 3 },
  { id: 14, name: 'Айран 0.5л', description: 'Традиционный кисломолочный напиток', price: 80, category: 4, available: true, weight: 500, allergens: ['dairy'], modifierGroups: [], sortOrder: 4 },
]

// ===== Группы модификаторов =====

export const MOCK_MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: 1,
    name: 'Начинка',
    required: false,
    maxSelect: 2,
    modifiers: [
      { id: 1, name: 'Мясо', price: 0 },
      { id: 2, name: 'Сыр', price: 50 },
      { id: 3, name: 'Картофель', price: 30 },
    ],
  },
  {
    id: 2,
    name: 'Размер порции',
    required: true,
    maxSelect: 1,
    modifiers: [
      { id: 4, name: 'Стандарт', price: 0 },
      { id: 5, name: 'Большая (+50%)', price: 150 },
      { id: 6, name: 'Двойная', price: 280 },
    ],
  },
  {
    id: 3,
    name: 'Дополнительно к супу',
    required: false,
    maxSelect: 3,
    modifiers: [
      { id: 7, name: 'Сметана', price: 30 },
      { id: 8, name: 'Сухарики', price: 40 },
      { id: 9, name: 'Зелень', price: 20 },
    ],
  },
]

// ===== Профиль ресторана =====

export const MOCK_RESTAURANT: RestaurantProfile = {
  id: 'rest-001',
  name: 'Тбилисо',
  description: 'Ресторан грузинской кухни. Традиционные блюда, приготовленные по семейным рецептам с использованием свежих продуктов.',
  address: 'пр. Кадырова 30',
  phone: '+7 (938) 000-00-01',
  coverImage: 'https://img.freepik.com/free-photo/top-view-table-full-delicious-food-composition_23-2149141353.jpg?w=1380',
  rating: 4.7,
  reviewsCount: 253,
  isOpen: true,
  workingHours: {
    monday: { open: '10:00', close: '23:00', isOpen: true },
    tuesday: { open: '10:00', close: '23:00', isOpen: true },
    wednesday: { open: '10:00', close: '23:00', isOpen: true },
    thursday: { open: '10:00', close: '23:00', isOpen: true },
    friday: { open: '10:00', close: '00:00', isOpen: true },
    saturday: { open: '11:00', close: '00:00', isOpen: true },
    sunday: { open: '11:00', close: '22:00', isOpen: true },
  },
  deliveryTime: '35-40',
  minOrderAmount: 500,
  cuisineTypes: ['Грузинская', 'Кавказская', 'Европейская'],
}
