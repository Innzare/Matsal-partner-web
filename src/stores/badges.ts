import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BadgePurchase } from '@/types'
import { BADGE_PRICE_PER_DAY, BADGE_PRICE_7, BADGE_PRICE_14 } from '@/types'
import { IS_MOCK } from '@/api'
import { MOCK_BADGE_PURCHASES } from '@/api/mock-data'

/** Рассчитать цену бейджа: скидка до 30% при 365 днях */
export function calcBadgePrice(days: number): number {
  if (days === 7) return BADGE_PRICE_7
  if (days === 14) return BADGE_PRICE_14
  const discount = 1 - 0.30 * Math.sqrt((days - 1) / 364)
  return Math.round(BADGE_PRICE_PER_DAY * days * discount)
}

export const useBadgesStore = defineStore('badges', () => {
  const purchases = ref<BadgePurchase[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)

  // ── Getters ──

  const activeBadge = computed(() =>
    purchases.value.find(b => b.status === 'active') ?? null,
  )

  const hasBadge = computed(() => activeBadge.value !== null)

  const totalImpressions = computed(() =>
    purchases.value.reduce((s, b) => s + b.impressions, 0),
  )

  const totalExtraClicks = computed(() =>
    purchases.value.reduce((s, b) => s + b.extraClicks, 0),
  )

  const avgConversionLift = computed(() => {
    const withLift = purchases.value.filter(b => b.conversionLift > 0)
    if (!withLift.length) return 0
    return withLift.reduce((s, b) => s + b.conversionLift, 0) / withLift.length
  })

  // ── Actions ──

  const load = async (force = false) => {
    if (!force && purchases.value.length > 0) return
    isLoading.value = true
    try {
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 300))
        purchases.value = structuredClone(MOCK_BADGE_PURCHASES)
        return
      }
      // TODO: GET /badges
    } finally {
      isLoading.value = false
    }
  }

  const purchase = async (duration: number) => {
    isSaving.value = true
    try {
      const price = calcBadgePrice(duration)
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 500))
        const now = new Date()
        const end = new Date(now.getTime() + duration * 86400000)
        const newBadge: BadgePurchase = {
          id: `badge-${Date.now()}`,
          status: 'pending',
          startDate: now.toISOString(),
          endDate: end.toISOString(),
          duration,
          price,
          impressions: 0,
          extraClicks: 0,
          conversionLift: 0,
          createdAt: now.toISOString(),
        }
        purchases.value.unshift(newBadge)
        return newBadge
      }
      // TODO: POST /badges
    } finally {
      isSaving.value = false
    }
  }

  const cancel = async (id: string) => {
    if (IS_MOCK) {
      const b = purchases.value.find(b => b.id === id)
      if (b) b.status = 'cancelled'
      return
    }
    // TODO: PATCH /badges/:id/cancel
  }

  return {
    purchases, isLoading, isSaving,
    activeBadge, hasBadge, totalImpressions, totalExtraClicks, avgConversionLift,
    load, purchase, cancel,
  }
})
