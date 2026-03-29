import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRestaurantStore } from '@/stores/restaurant'
import { useGroceryStoreStore } from '@/stores/groceryStore'
import { api } from '@/api'
import type { EstablishmentAddress } from '@/types'

/**
 * Composable для унифицированного доступа к данным заведения (ресторан или магазин).
 * Автоматически выбирает нужный store по типу пользователя.
 */
export function useEstablishment() {
  const authStore = useAuthStore()
  const restaurantStore = useRestaurantStore()
  const groceryStoreStore = useGroceryStoreStore()

  const isGrocery = computed(() => authStore.isGrocery)

  const data = computed(() =>
    isGrocery.value ? groceryStoreStore.store : restaurantStore.restaurant,
  )

  const isLoading = computed(() =>
    isGrocery.value ? groceryStoreStore.isLoading : restaurantStore.isLoading,
  )

  const isSaving = computed(() =>
    isGrocery.value ? groceryStoreStore.isSaving : restaurantStore.isSaving,
  )

  async function load(force = false) {
    if (isGrocery.value) {
      await groceryStoreStore.loadStore(force)
    } else {
      await restaurantStore.loadRestaurant(force)
    }
  }

  async function update(payload: Record<string, any>) {
    if (isGrocery.value) {
      await groceryStoreStore.updateStore(payload)
    } else {
      await restaurantStore.updateRestaurant(payload)
    }
  }

  async function uploadImage(file: File, type: 'logo' | 'cover') {
    if (isGrocery.value) {
      return groceryStoreStore.uploadImage(file, type)
    } else {
      return restaurantStore.uploadImage(file, type)
    }
  }

  async function deleteImage(type: 'logo' | 'cover') {
    if (isGrocery.value) {
      return groceryStoreStore.deleteImage(type)
    } else {
      return restaurantStore.deleteImage(type)
    }
  }

  async function toggleOpen() {
    if (isGrocery.value) {
      await groceryStoreStore.toggleOpen()
    } else {
      await restaurantStore.toggleOpen()
    }
  }

  const label = computed(() => (isGrocery.value ? 'магазин' : 'ресторан'))
  const labelCapitalized = computed(() => (isGrocery.value ? 'Магазин' : 'Ресторан'))

  // ===== Адреса филиалов =====

  const addressPrefix = computed(() =>
    isGrocery.value ? '/auth/grocery-store/addresses' : '/auth/restaurant/addresses',
  )

  async function getAddresses() {
    return api.get<EstablishmentAddress[]>(addressPrefix.value)
  }

  async function addAddress(data: { address: string; lat: number; lon: number }) {
    return api.post<EstablishmentAddress>(addressPrefix.value, data)
  }

  async function updateAddress(id: string, data: { address?: string; lat?: number; lon?: number }) {
    return api.patch<EstablishmentAddress>(`${addressPrefix.value}/${id}`, data)
  }

  async function deleteAddress(id: string) {
    return api.delete(`${addressPrefix.value}/${id}`)
  }

  return {
    isGrocery,
    data,
    isLoading,
    isSaving,
    load,
    update,
    uploadImage,
    deleteImage,
    toggleOpen,
    label,
    labelCapitalized,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
  }
}
