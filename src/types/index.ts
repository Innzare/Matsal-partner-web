// ===== Заказы =====

export type PartnerOrderStatus = 'incoming' | 'preparing' | 'ready' | 'completed' | 'rejected'

export type OrderType = 'delivery' | 'pickup' | 'dine_in'

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  delivery: 'Доставка',
  pickup: 'Самовывоз',
  dine_in: 'В зале',
}

export const ORDER_TYPE_COLORS: Record<OrderType, string> = {
  delivery: '#EA004B',
  pickup: '#F97316',
  dine_in: '#3b82f6',
}

export interface OrderItem {
  name: string
  quantity: number
  price: number
}

export interface OrderCustomer {
  name: string
  address: string
  phone: string
  floor?: string
  apartment?: string
  comment?: string
}

export interface PartnerOrder {
  id: string
  orderNumber: number
  status: PartnerOrderStatus
  orderType: OrderType
  customer: OrderCustomer
  items: OrderItem[]
  itemsCount: number
  totalPrice: number
  deliveryFee: number
  createdAt: string
  acceptedAt?: string
  readyAt?: string
  completedAt?: string
  rejectedAt?: string
  rejectReason?: string
}

// ===== Меню =====

export type Allergen = 'gluten' | 'dairy' | 'eggs' | 'nuts' | 'soy' | 'fish' | 'shellfish'

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  gluten: 'Глютен',
  dairy: 'Молоко',
  eggs: 'Яйца',
  nuts: 'Орехи',
  soy: 'Соя',
  fish: 'Рыба',
  shellfish: 'Морепродукты',
}

export interface NutritionInfo {
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface Modifier {
  id: string
  name: string
  price: number
}

export interface ModifierGroup {
  id: string
  name: string
  required: boolean
  maxSelect: number
  modifiers: Modifier[]
}

export type CategoryDisplayType = 'recomendation' | 'popular'

export const CATEGORY_TYPE_OPTIONS: { value: string | null; title: string; color: string }[] = [
  { value: null, title: 'Обычная', color: 'grey' },
  { value: 'recomendation', title: 'Рекомендация', color: 'orange' },
  { value: 'popular', title: 'Популярное', color: 'blue' },
]

export interface MenuCategory {
  id: string
  name: string
  type?: string | null
  sortOrder: number
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  available: boolean
  image?: string | null
  weight: number
  nutrition?: NutritionInfo | null
  allergens: string[]
  modifierGroups: string[]
  sortOrder: number
}

// ===== Ресторан =====

export interface DaySchedule {
  open: string
  close: string
  isOpen: boolean
}

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export const WEEKDAY_LABELS: Record<WeekDay, string> = {
  monday: 'Понедельник',
  tuesday: 'Вторник',
  wednesday: 'Среда',
  thursday: 'Четверг',
  friday: 'Пятница',
  saturday: 'Суббота',
  sunday: 'Воскресенье',
}

export interface RestaurantProfile {
  id: string
  name: string
  description: string | null
  address: string
  phone: string | null
  imageUrl: string | null
  logo: string | null
  rating: number
  reviewsCount: number
  isActive: boolean
  isOpen: boolean
  workingHours: Record<WeekDay, DaySchedule> | null
  deliveryTime: string | null
  minOrderAmount: number
  cuisineTypes: string[]
  createdAt: string
  updatedAt: string
}

// ===== Отзывы =====

export interface Review {
  id: number
  author: string
  avatar?: string
  rating: number
  text: string
  date: string
  orderType: OrderType
  orderNumber: number
  items: string[]
  reply?: string
  repliedAt?: string
}

// ===== Статусы заказов =====

export const ORDER_STATUS_LABELS: Record<PartnerOrderStatus, string> = {
  incoming: 'Новый',
  preparing: 'Готовится',
  ready: 'Готов',
  completed: 'Завершён',
  rejected: 'Отклонён',
}

export const ORDER_STATUS_COLORS: Record<PartnerOrderStatus, string> = {
  incoming: 'blue',
  preparing: 'orange',
  ready: 'green',
  completed: 'grey',
  rejected: 'red',
}

// ===== Уведомления =====

export type NotificationType =
  | 'new_order'
  | 'order_status'
  | 'new_review'
  | 'order_rejected'
  | 'system'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  createdAt: string
  isRead: boolean
  orderId?: string
  orderNumber?: number
  reviewId?: number
  meta?: Record<string, string | number>
}

export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  new_order:     'mdi-receipt-text',
  order_status:  'mdi-swap-horizontal',
  new_review:    'mdi-star-outline',
  order_rejected:'mdi-close-circle-outline',
  system:        'mdi-bell-outline',
}

export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  new_order:     '#3b82f6',
  order_status:  '#f97316',
  new_review:    '#eab308',
  order_rejected:'#ef4444',
  system:        '#8b5cf6',
}

// ===== Продвижение =====

export type PromoSlot =
  | 'promo_banner'
  | 'popular_brands'
  | 'near_you'
  | 'often_order'
  | 'top_category'
  | 'app_open_modal'
  | 'timed_popup'
  | 'special_offers'

export type PromoStatus = 'active' | 'pending' | 'expired' | 'cancelled'

export interface PromoPlacement {
  id: string
  slot: PromoSlot
  status: PromoStatus
  startDate: string
  endDate: string
  duration: number
  price: number
  impressions: number
  clicks: number
  createdAt: string
}

export interface PromoSlotInfo {
  slot: PromoSlot
  title: string
  description: string
  icon: string
  color: string
  /** Цена за 7 дней и за 14 дней — быстрые пресеты */
  price7: number
  price14: number
  /** Цена за 1 день для расчёта кастомного срока */
  pricePerDay: number
  maxImpressions: string
  /** Доступен только по премиум-подписке */
  premium?: boolean
}

export const PROMO_SLOTS: PromoSlotInfo[] = [
  // ── Premium slots (самые посещаемые) ──
  {
    slot: 'app_open_modal',
    title: 'Модалка при открытии',
    description: 'Полноэкранное модальное окно при запуске приложения — максимальный охват',
    icon: 'mdi-cellphone-screenshot',
    color: '#8b5cf6',
    price7: 8300,
    price14: 14700,
    pricePerDay: 1400,
    maxImpressions: '~60 000',
    premium: true,
  },
  {
    slot: 'promo_banner',
    title: 'Промо-баннер',
    description: 'Баннер в карусели на главном экране — максимальная видимость',
    icon: 'mdi-image-area',
    color: '#ea004b',
    price7: 6500,
    price14: 11500,
    pricePerDay: 1100,
    maxImpressions: '~50 000',
    premium: true,
  },
  {
    slot: 'timed_popup',
    title: 'Всплывающее окно',
    description: 'Попап через 30 сек. после входа — высокая вовлечённость',
    icon: 'mdi-timer-outline',
    color: '#06b6d4',
    price7: 4800,
    price14: 8400,
    pricePerDay: 800,
    maxImpressions: '~35 000',
    premium: true,
  },
  // ── Стандартные слоты ──
  {
    slot: 'popular_brands',
    title: 'Популярные бренды',
    description: 'Логотип в секции «Популярные бренды» на главной',
    icon: 'mdi-fire',
    color: '#f97316',
    price7: 3900,
    price14: 6800,
    pricePerDay: 650,
    maxImpressions: '~30 000',
  },
  {
    slot: 'often_order',
    title: 'Часто заказывают',
    description: 'Попадание в секцию «Часто заказывают» для новых клиентов',
    icon: 'mdi-repeat',
    color: '#22c55e',
    price7: 3000,
    price14: 5200,
    pricePerDay: 500,
    maxImpressions: '~25 000',
  },
  {
    slot: 'near_you',
    title: 'Рядом с вами',
    description: 'Приоритетное размещение в секции «Рядом с вами»',
    icon: 'mdi-map-marker-radius',
    color: '#3b82f6',
    price7: 2550,
    price14: 4500,
    pricePerDay: 430,
    maxImpressions: '~20 000',
  },
  {
    slot: 'special_offers',
    title: 'Спецпредложения',
    description: 'Карточка в секции «Спецпредложения» с бейджем скидки',
    icon: 'mdi-tag-multiple-outline',
    color: '#ec4899',
    price7: 2250,
    price14: 4000,
    pricePerDay: 380,
    maxImpressions: '~18 000',
  },
  {
    slot: 'top_category',
    title: 'Топ в категории',
    description: 'Первое место при фильтре по вашей категории кухни',
    icon: 'mdi-trophy-outline',
    color: '#eab308',
    price7: 1900,
    price14: 3400,
    pricePerDay: 320,
    maxImpressions: '~15 000',
  },
]

export const PROMO_STATUS_LABELS: Record<PromoStatus, string> = {
  active: 'Активно',
  pending: 'Ожидание',
  expired: 'Истекло',
  cancelled: 'Отменено',
}

export const PROMO_STATUS_COLORS: Record<PromoStatus, string> = {
  active: 'green',
  pending: 'orange',
  expired: 'grey',
  cancelled: 'red',
}

// ===== Push-рассылки =====

export type PushAudience = 'all' | 'recent' | 'inactive'

export const PUSH_AUDIENCE_LABELS: Record<PushAudience, string> = {
  all: 'Все клиенты',
  recent: 'Активные (30 дн.)',
  inactive: 'Давно не заказывали',
}

export type PushScheduleMode = 'now' | 'scheduled'

export type PushCampaignStatus = 'draft' | 'sending' | 'sent' | 'scheduled' | 'cancelled'

export const PUSH_STATUS_LABELS: Record<PushCampaignStatus, string> = {
  draft: 'Черновик',
  sending: 'Отправляется',
  sent: 'Отправлено',
  scheduled: 'Запланировано',
  cancelled: 'Отменено',
}

export const PUSH_STATUS_COLORS: Record<PushCampaignStatus, string> = {
  draft: 'grey',
  sending: 'blue',
  sent: 'green',
  scheduled: 'orange',
  cancelled: 'red',
}

export interface PushCampaign {
  id: string
  title: string
  body: string
  imageUrl?: string
  audience: PushAudience
  scheduleMode: PushScheduleMode
  scheduledAt?: string
  status: PushCampaignStatus
  createdAt: string
  sentAt?: string
  sent: number
  delivered: number
  opened: number
  clicked: number
}

// ===== Буст в поиске =====

export type BoostLevel = 'standard' | 'pro' | 'top3'

export interface BoostLevelInfo {
  level: BoostLevel
  title: string
  description: string
  positionBoost: number
  pricePerDay: number
  icon: string
  color: string
}

export const BOOST_LEVELS: BoostLevelInfo[] = [
  {
    level: 'standard',
    title: 'Стандарт',
    description: 'Поднимает позицию на 10 мест в общей выдаче',
    positionBoost: 10,
    pricePerDay: 290,
    icon: 'mdi-trending-up',
    color: '#3b82f6',
  },
  {
    level: 'pro',
    title: 'Про',
    description: 'Поднимает позицию на 25 мест — значительный прирост видимости',
    positionBoost: 25,
    pricePerDay: 590,
    icon: 'mdi-rocket-launch',
    color: '#8b5cf6',
  },
  {
    level: 'top3',
    title: 'Топ-3',
    description: 'Гарантирует место в тройке лидеров в вашей категории',
    positionBoost: 999,
    pricePerDay: 990,
    icon: 'mdi-trophy',
    color: '#ea004b',
  },
]

export type BoostStatus = 'active' | 'pending' | 'expired' | 'cancelled'

export const BOOST_STATUS_LABELS: Record<BoostStatus, string> = {
  active: 'Активен',
  pending: 'Ожидание',
  expired: 'Истёк',
  cancelled: 'Отменён',
}

export const BOOST_STATUS_COLORS: Record<BoostStatus, string> = {
  active: 'green',
  pending: 'orange',
  expired: 'grey',
  cancelled: 'red',
}

export interface SearchBoostSubscription {
  id: string
  level: BoostLevel
  status: BoostStatus
  startDate: string
  endDate: string
  duration: number
  price: number
  positionBefore: number
  positionAfter: number
  viewsGained: number
  ordersGained: number
  createdAt: string
}

// ===== Бейдж «Рекомендуемое» =====

export type BadgeStatus = 'active' | 'inactive' | 'pending' | 'expired'

export const BADGE_STATUS_LABELS: Record<BadgeStatus, string> = {
  active: 'Активен',
  inactive: 'Неактивен',
  pending: 'Ожидание',
  expired: 'Истёк',
}

export const BADGE_STATUS_COLORS: Record<BadgeStatus, string> = {
  active: 'green',
  inactive: 'grey',
  pending: 'orange',
  expired: 'grey',
}

export interface BadgePurchase {
  id: string
  status: BadgeStatus
  startDate: string
  endDate: string
  duration: number
  price: number
  impressions: number
  extraClicks: number
  conversionLift: number
  createdAt: string
}

export const BADGE_PRICE_PER_DAY = 450
export const BADGE_PRICE_7 = 2800
export const BADGE_PRICE_14 = 5200
