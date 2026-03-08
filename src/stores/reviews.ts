import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Review } from '@/types'
import { api, IS_MOCK } from '@/api'
import { MOCK_REVIEWS } from '@/api/mock-data'

interface ReviewStats {
  average: number
  total: number
  distribution: { stars: number; count: number }[]
}

export const useReviewsStore = defineStore('reviews', () => {
  const reviews = ref<Review[]>([])
  const isLoading = ref(false)

  const loadReviews = async (force = false) => {
    if (!force && reviews.value.length > 0) return
    isLoading.value = true
    try {
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 300))
        reviews.value = structuredClone(MOCK_REVIEWS)
        return
      }
      reviews.value = await api.get<Review[]>('/restaurant/reviews')
    } finally {
      isLoading.value = false
    }
  }

  const replyToReview = async (reviewId: string, text: string) => {
    if (IS_MOCK) {
      await new Promise(r => setTimeout(r, 400))
      const review = reviews.value.find(r => r.id === reviewId)
      if (review) {
        review.reply = text
        review.repliedAt = new Date().toISOString()
      }
      return
    }
    const updated = await api.patch<Review>(`/restaurant/reviews/${reviewId}/reply`, { text })
    const idx = reviews.value.findIndex(r => r.id === reviewId)
    if (idx !== -1) {
      reviews.value[idx] = updated
    }
  }

  // Getters
  const sortedReviews = computed(() =>
    [...reviews.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  )

  const averageRating = computed(() => {
    if (reviews.value.length === 0) return 0
    const sum = reviews.value.reduce((s, r) => s + r.rating, 0)
    return Math.round((sum / reviews.value.length) * 10) / 10
  })

  const ratingDistribution = computed(() => {
    const dist = [0, 0, 0, 0, 0] // index 0 = 1 star, index 4 = 5 stars
    reviews.value.forEach(r => {
      dist[r.rating - 1]++
    })
    return dist
  })

  const repliedCount = computed(() => reviews.value.filter(r => r.reply).length)
  const unrepliedCount = computed(() => reviews.value.filter(r => !r.reply).length)

  const recentReviews = computed(() => sortedReviews.value.slice(0, 3))

  return {
    reviews,
    isLoading,
    loadReviews,
    replyToReview,
    sortedReviews,
    averageRating,
    ratingDistribution,
    repliedCount,
    unrepliedCount,
    recentReviews,
  }
})
