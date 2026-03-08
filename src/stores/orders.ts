import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PartnerOrder, PartnerOrderStatus, OrderItem, OrderCustomer } from '@/types'
import { api, IS_MOCK } from '@/api'
import { MOCK_ORDERS } from '@/api/mock-data'
import { useAuthStore } from './auth'

// Маппинг статусов бэкенда → partner-web
type BackendStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED'

const STATUS_MAP: Record<BackendStatus, PartnerOrderStatus> = {
  PENDING: 'incoming',
  CONFIRMED: 'preparing',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERING: 'completed',
  DELIVERED: 'completed',
  CANCELLED: 'rejected',
}

// Трансформация заказа с бэкенда в формат partner-web
function transformOrder(raw: any): PartnerOrder {
  const address = raw.deliveryAddress || {}

  const customer: OrderCustomer = {
    name: raw.customer?.name || 'Клиент',
    phone: raw.customer?.phone || '',
    address: address.streetWithHouse
      ? `${address.city ? address.city + ', ' : ''}${address.streetWithHouse}`
      : '',
    floor: address.floor || undefined,
    apartment: address.flat || undefined,
    comment: address.comment || raw.comment || undefined,
  }

  const items: OrderItem[] = (raw.items || []).map((item: any) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  }))

  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    status: STATUS_MAP[raw.status as BackendStatus] || 'incoming',
    orderType: 'delivery', // Пока только доставка
    customer,
    items,
    itemsCount: items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: raw.total,
    deliveryFee: raw.deliveryPrice || 0,
    createdAt: raw.createdAt,
    acceptedAt: raw.confirmedAt || undefined,
    readyAt: raw.readyAt || undefined,
    completedAt: raw.deliveredAt || raw.deliveringAt || undefined,
    rejectedAt: raw.cancelledAt || undefined,
    rejectReason: raw.cancelReason || undefined,
  }
}

export const useOrdersStore = defineStore('orders', () => {
  const authStore = useAuthStore()
  const ordersPrefix = computed(() =>
    authStore.establishmentType === 'grocery' ? '/grocery-store/orders' : '/restaurant/orders'
  )

  const orders = ref<PartnerOrder[]>([])
  const selectedOrder = ref<PartnerOrder | null>(null)
  const isLoading = ref(false)
  const statusFilter = ref<PartnerOrderStatus | 'all'>('all')
  const searchQuery = ref('')

  // Getters
  const incomingOrders = computed(() => orders.value.filter(o => o.status === 'incoming'))
  const preparingOrders = computed(() => orders.value.filter(o => o.status === 'preparing'))
  const readyOrders = computed(() => orders.value.filter(o => o.status === 'ready'))
  const completedOrders = computed(() => orders.value.filter(o => o.status === 'completed'))
  const rejectedOrders = computed(() => orders.value.filter(o => o.status === 'rejected'))

  const incomingCount = computed(() => incomingOrders.value.length)

  const filteredOrders = computed(() => {
    let result = orders.value

    if (statusFilter.value !== 'all') {
      result = result.filter(o => o.status === statusFilter.value)
    }

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(o =>
        o.orderNumber.toString().includes(q) ||
        o.customer.name.toLowerCase().includes(q),
      )
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  // Stats
  const todayRevenue = computed(() => {
    const today = new Date().toDateString()
    return orders.value
      .filter(o => o.status === 'completed' && o.completedAt && new Date(o.completedAt).toDateString() === today)
      .reduce((sum, o) => sum + o.totalPrice, 0)
  })

  const todayOrdersCount = computed(() => {
    const today = new Date().toDateString()
    return orders.value
      .filter(o => new Date(o.createdAt).toDateString() === today)
      .length
  })

  // Actions
  const loadOrders = async (force = false) => {
    if (!force && orders.value.length > 0) return
    isLoading.value = true
    try {
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 300))
        orders.value = structuredClone(MOCK_ORDERS)
      } else {
        const rawOrders = await api.get<any[]>(ordersPrefix.value)
        orders.value = rawOrders.map(transformOrder)
      }
    } finally {
      isLoading.value = false
    }
  }

  const acceptOrder = async (id: string) => {
    if (IS_MOCK) {
      const order = orders.value.find(o => o.id === id)
      if (order && order.status === 'incoming') {
        order.status = 'preparing'
        order.acceptedAt = new Date().toISOString()
      }
      return
    }

    await api.patch(`${ordersPrefix.value}/${id}/status`, { status: 'CONFIRMED' })
    const order = orders.value.find(o => o.id === id)
    if (order) {
      order.status = 'preparing'
      order.acceptedAt = new Date().toISOString()
    }
  }

  const rejectOrder = async (id: string, reason: string) => {
    if (IS_MOCK) {
      const order = orders.value.find(o => o.id === id)
      if (order && order.status === 'incoming') {
        order.status = 'rejected'
        order.rejectedAt = new Date().toISOString()
        order.rejectReason = reason
      }
      return
    }

    await api.patch(`${ordersPrefix.value}/${id}/status`, { status: 'CANCELLED', cancelReason: reason })
    const order = orders.value.find(o => o.id === id)
    if (order) {
      order.status = 'rejected'
      order.rejectedAt = new Date().toISOString()
      order.rejectReason = reason
    }
  }

  const markReady = async (id: string) => {
    if (IS_MOCK) {
      const order = orders.value.find(o => o.id === id)
      if (order && order.status === 'preparing') {
        order.status = 'ready'
        order.readyAt = new Date().toISOString()
      }
      return
    }

    // Может быть CONFIRMED или PREPARING — нужно довести до READY
    // CONFIRMED → PREPARING → READY (два шага)
    // PREPARING → READY (один шаг)
    try {
      await api.patch(`${ordersPrefix.value}/${id}/status`, { status: 'PREPARING' })
    } catch {
      // Уже в PREPARING — игнорируем
    }
    await api.patch(`${ordersPrefix.value}/${id}/status`, { status: 'READY' })
    const order = orders.value.find(o => o.id === id)
    if (order) {
      order.status = 'ready'
      order.readyAt = new Date().toISOString()
    }
  }

  const markPickedUp = async (id: string) => {
    if (IS_MOCK) {
      const order = orders.value.find(o => o.id === id)
      if (order && order.status === 'ready') {
        order.status = 'completed'
        order.completedAt = new Date().toISOString()
      }
      return
    }

    await api.patch(`${ordersPrefix.value}/${id}/status`, { status: 'DELIVERING' })
    const order = orders.value.find(o => o.id === id)
    if (order) {
      order.status = 'completed'
      order.completedAt = new Date().toISOString()
    }
  }

  /** Добавить новый заказ из WebSocket (order:new) */
  const addOrder = (raw: any) => {
    const order = transformOrder(raw)
    // Не дублировать
    if (!orders.value.find(o => o.id === order.id)) {
      orders.value.unshift(order)
    }
  }

  /** Обновить заказ из WebSocket (order:statusUpdate) */
  const updateOrderFromSocket = (raw: any) => {
    const updated = transformOrder(raw)
    const idx = orders.value.findIndex(o => o.id === updated.id)
    if (idx !== -1) {
      orders.value[idx] = updated
    }
  }

  /** Удалить/обновить отменённый заказ из WebSocket (order:cancelled) */
  const cancelOrderFromSocket = (raw: any) => {
    const updated = transformOrder(raw)
    const idx = orders.value.findIndex(o => o.id === updated.id)
    if (idx !== -1) {
      orders.value[idx] = updated
    }
  }

  return {
    orders,
    selectedOrder,
    isLoading,
    statusFilter,
    searchQuery,
    incomingOrders,
    preparingOrders,
    readyOrders,
    completedOrders,
    rejectedOrders,
    incomingCount,
    filteredOrders,
    todayRevenue,
    todayOrdersCount,
    loadOrders,
    acceptOrder,
    rejectOrder,
    markReady,
    markPickedUp,
    addOrder,
    updateOrderFromSocket,
    cancelOrderFromSocket,
  }
})
