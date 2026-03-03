import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RestaurantProfile } from '@/types'
import { api } from '@/api'

export const useRestaurantStore = defineStore('restaurant', () => {
  const restaurant = ref<RestaurantProfile | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)

  const loadRestaurant = async (force = false) => {
    if (!force && restaurant.value) return
    isLoading.value = true
    try {
      const data = await api.get<RestaurantProfile>('/auth/restaurant/my-restaurant')
      restaurant.value = data
    } finally {
      isLoading.value = false
    }
  }

  const updateRestaurant = async (data: Partial<RestaurantProfile>) => {
    if (!restaurant.value) return
    isSaving.value = true
    try {
      const updated = await api.patch<RestaurantProfile>('/auth/restaurant/my-restaurant', data)
      restaurant.value = updated
    } finally {
      isSaving.value = false
    }
  }

  const uploadImage = async (file: File, type: 'logo' | 'cover') => {
    if (!restaurant.value) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    const updated = await api.upload<RestaurantProfile>('/auth/restaurant/upload-image', formData)
    restaurant.value = updated
    return updated
  }

  const deleteImage = async (type: 'logo' | 'cover') => {
    if (!restaurant.value) return
    const updated = await api.delete<RestaurantProfile>(`/auth/restaurant/delete-image?type=${type}`)
    restaurant.value = updated
    return updated
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
    uploadImage,
    deleteImage,
    toggleOpen,
  }
})
