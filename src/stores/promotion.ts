import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PromoPlacement, PromoSlot } from '@/types'
import { PROMO_SLOTS } from '@/types'
import { IS_MOCK } from '@/api'
import { MOCK_PROMOTIONS } from '@/api/mock-data'

/** Рассчитать цену по слоту и произвольному числу дней.
 *  Чем больше дней — тем ниже цена за день (скидка до 40% при 365 днях, sqrt-кривая). */
export function calcPrice(slot: PromoSlot, days: number): number {
  const info = PROMO_SLOTS.find(s => s.slot === slot)!
  if (days === 7) return info.price7
  if (days === 14) return info.price14
  const discount = 1 - 0.40 * Math.sqrt((days - 1) / 364)
  return Math.round(info.pricePerDay * days * discount)
}

export const usePromotionStore = defineStore('promotion', () => {
  const placements = ref<PromoPlacement[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)

  // ── Getters ──

  const activePlacements = computed(() =>
    placements.value.filter(p => p.status === 'active'),
  )

  const totalSpent = computed(() =>
    placements.value.reduce((sum, p) => sum + p.price, 0),
  )

  const totalImpressions = computed(() =>
    placements.value.reduce((sum, p) => sum + p.impressions, 0),
  )

  const totalClicks = computed(() =>
    placements.value.reduce((sum, p) => sum + p.clicks, 0),
  )

  const avgCtr = computed(() => {
    if (totalImpressions.value === 0) return 0
    return ((totalClicks.value / totalImpressions.value) * 100)
  })

  // ── Actions ──

  const load = async (force = false) => {
    if (!force && placements.value.length > 0) return
    isLoading.value = true
    try {
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 300))
        placements.value = structuredClone(MOCK_PROMOTIONS)
        return
      }
      // TODO: real API — GET /promotions
    } finally {
      isLoading.value = false
    }
  }

  const createPlacement = async (slot: PromoSlot, duration: number) => {
    isSaving.value = true
    try {
      const price = calcPrice(slot, duration)

      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 500))
        const now = new Date()
        const end = new Date(now.getTime() + duration * 86400000)
        const newPlacement: PromoPlacement = {
          id: `promo-${Date.now()}`,
          slot,
          status: 'pending',
          startDate: now.toISOString(),
          endDate: end.toISOString(),
          duration,
          price,
          impressions: 0,
          clicks: 0,
          createdAt: now.toISOString(),
        }
        placements.value.unshift(newPlacement)
        return newPlacement
      }
      // TODO: real API — POST /promotions
    } finally {
      isSaving.value = false
    }
  }

  const cancelPlacement = async (id: string) => {
    if (IS_MOCK) {
      const p = placements.value.find(p => p.id === id)
      if (p) p.status = 'cancelled'
      return
    }
    // TODO: real API — PATCH /promotions/:id/cancel
  }

  return {
    placements,
    isLoading,
    isSaving,
    activePlacements,
    totalSpent,
    totalImpressions,
    totalClicks,
    avgCtr,
    load,
    createPlacement,
    cancelPlacement,
  }
})