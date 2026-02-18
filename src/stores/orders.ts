import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PartnerOrder, PartnerOrderStatus } from '@/types'
import { IS_MOCK } from '@/api'
import { MOCK_ORDERS } from '@/api/mock-data'

export const useOrdersStore = defineStore('orders', () => {
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
        return
      }
      // TODO: real API
    } finally {
      isLoading.value = false
    }
  }

  const acceptOrder = (id: string) => {
    const order = orders.value.find(o => o.id === id)
    if (order && order.status === 'incoming') {
      order.status = 'preparing'
      order.acceptedAt = new Date().toISOString()
    }
  }

  const rejectOrder = (id: string, reason: string) => {
    const order = orders.value.find(o => o.id === id)
    if (order && order.status === 'incoming') {
      order.status = 'rejected'
      order.rejectedAt = new Date().toISOString()
      order.rejectReason = reason
    }
  }

  const markReady = (id: string) => {
    const order = orders.value.find(o => o.id === id)
    if (order && order.status === 'preparing') {
      order.status = 'ready'
      order.readyAt = new Date().toISOString()
    }
  }

  const markPickedUp = (id: string) => {
    const order = orders.value.find(o => o.id === id)
    if (order && order.status === 'ready') {
      order.status = 'completed'
      order.completedAt = new Date().toISOString()
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
  }
})
