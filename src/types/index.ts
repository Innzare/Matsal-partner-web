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
  id: number
  name: string
  price: number
}

export interface ModifierGroup {
  id: number
  name: string
  required: boolean
  maxSelect: number
  modifiers: Modifier[]
}

export interface MenuCategory {
  id: number
  name: string
  sortOrder: number
}

export interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: number
  available: boolean
  image?: string
  weight: number
  nutrition?: NutritionInfo
  allergens: Allergen[]
  modifierGroups: number[]
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
  description: string
  address: string
  phone: string
  coverImage: string
  logo?: string
  rating: number
  reviewsCount: number
  isOpen: boolean
  workingHours: Record<WeekDay, DaySchedule>
  deliveryTime: string
  minOrderAmount: number
  cuisineTypes: string[]
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
