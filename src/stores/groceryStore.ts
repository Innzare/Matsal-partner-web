import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GroceryStoreProfile } from '@/types'
import { api } from '@/api'

export const useGroceryStoreStore = defineStore('groceryStore', () => {
  const store = ref<GroceryStoreProfile | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)

  const loadStore = async (force = false) => {
    if (!force && store.value) return
    isLoading.value = true
    try {
      const data = await api.get<GroceryStoreProfile>('/auth/grocery-store/my-store')
      store.value = data
    } finally {
      isLoading.value = false
    }
  }

  const updateStore = async (data: Partial<GroceryStoreProfile>) => {
    if (!store.value) return
    isSaving.value = true
    try {
      const updated = await api.patch<GroceryStoreProfile>('/auth/grocery-store/my-store', data)
      store.value = updated
    } finally {
      isSaving.value = false
    }
  }

  const uploadImage = async (file: File, type: 'logo' | 'cover') => {
    if (!store.value) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    const updated = await api.upload<GroceryStoreProfile>('/auth/grocery-store/upload-image', formData)
    store.value = updated
    return updated
  }

  const deleteImage = async (type: 'logo' | 'cover') => {
    if (!store.value) return
    const updated = await api.delete<GroceryStoreProfile>(`/auth/grocery-store/delete-image?type=${type}`)
    store.value = updated
    return updated
  }

  const toggleOpen = async () => {
    if (!store.value) return
    await updateStore({ isOpen: !store.value.isOpen })
  }

  return {
    store,
    isLoading,
    isSaving,
    loadStore,
    updateStore,
    uploadImage,
    deleteImage,
    toggleOpen,
  }
})
