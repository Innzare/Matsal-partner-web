import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RestaurantProfile } from '@/types'
import { IS_MOCK } from '@/api'
import { MOCK_RESTAURANT } from '@/api/mock-data'

export const useRestaurantStore = defineStore('restaurant', () => {
  const restaurant = ref<RestaurantProfile | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)

  const loadRestaurant = async () => {
    isLoading.value = true
    try {
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 300))
        restaurant.value = structuredClone(MOCK_RESTAURANT)
        return
      }
      // TODO: real API
    } finally {
      isLoading.value = false
    }
  }

  const updateRestaurant = async (data: Partial<RestaurantProfile>) => {
    if (!restaurant.value) return
    isSaving.value = true
    try {
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 500))
        restaurant.value = { ...restaurant.value, ...data }
        return
      }
      // TODO: real API
    } finally {
      isSaving.value = false
    }
  }

  const toggleOpen = async () => {
    if (!restaurant.value) return
    await updateRestaurant({ isOpen: !restaurant.value.isOpen })
  }

  return {
    restaurant,
    isLoading,
    isSaving,
    loadRestaurant,
    updateRestaurant,
    toggleOpen,
  }
})
