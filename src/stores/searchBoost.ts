import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SearchBoostSubscription, BoostLevel } from '@/types'
import { BOOST_LEVELS } from '@/types'
import { IS_MOCK } from '@/api'
import { MOCK_BOOST_SUBSCRIPTIONS } from '@/api/mock-data'

/** Рассчитать цену буста: скидка до 35% при 365 днях */
export function calcBoostPrice(level: BoostLevel, days: number): number {
  const info = BOOST_LEVELS.find(b => b.level === level)!
  const discount = 1 - 0.35 * Math.sqrt((days - 1) / 364)
  return Math.round(info.pricePerDay * days * discount)
}

export const useSearchBoostStore = defineStore('searchBoost', () => {
  const subscriptions = ref<SearchBoostSubscription[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)

  // ── Getters ──

  const activeSubscription = computed(() =>
    subscriptions.value.find(s => s.status === 'active') ?? null,
  )

  const totalViewsGained = computed(() =>
    subscriptions.value.reduce((s, b) => s + b.viewsGained, 0),
  )

  const totalOrdersGained = computed(() =>
    subscriptions.value.reduce((s, b) => s + b.ordersGained, 0),
  )

  // ── Actions ──

  const load = async (force = false) => {
    if (!force && subscriptions.value.length > 0) return
    isLoading.value = true
    try {
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 300))
        subscriptions.value = structuredClone(MOCK_BOOST_SUBSCRIPTIONS)
        return
      }
      // TODO: GET /search-boost
    } finally {
      isLoading.value = false
    }
  }

  const purchase = async (level: BoostLevel, duration: number) => {
    isSaving.value = true
    try {
      const price = calcBoostPrice(level, duration)
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 500))
        const now = new Date()
        const end = new Date(now.getTime() + duration * 86400000)
        const newSub: SearchBoostSubscription = {
          id: `boost-${Date.now()}`,
          level,
          status: 'pending',
          startDate: now.toISOString(),
          endDate: end.toISOString(),
          duration,
          price,
          positionBefore: Math.floor(Math.random() * 30 + 10),
          positionAfter: Math.floor(Math.random() * 5 + 1),
          viewsGained: 0,
          ordersGained: 0,
          createdAt: now.toISOString(),
        }
        subscriptions.value.unshift(newSub)
        return newSub
      }
      // TODO: POST /search-boost
    } finally {
      isSaving.value = false
    }
  }

  const cancel = async (id: string) => {
    if (IS_MOCK) {
      const s = subscriptions.value.find(s => s.id === id)
      if (s) s.status = 'cancelled'
      return
    }
    // TODO: PATCH /search-boost/:id/cancel
  }

  return {
    subscriptions, isLoading, isSaving,
    activeSubscription, totalViewsGained, totalOrdersGained,
    load, purchase, cancel,
  }
})
