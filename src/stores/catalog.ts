import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GroceryProduct, GroceryCategory } from '@/types'
import { api } from '@/api'

interface CatalogResponse {
  categories: GroceryCategory[]
  products: GroceryProduct[]
}

export const useCatalogStore = defineStore('catalog', () => {
  const products = ref<GroceryProduct[]>([])
  const categories = ref<GroceryCategory[]>([])
  const selectedCategory = ref<string | null>(null)
  const isLoading = ref(false)
  const searchQuery = ref('')

  // Getters
  const filteredProducts = computed(() => {
    let result = products.value

    if (selectedCategory.value !== null) {
      result = result.filter(p => p.categoryId === selectedCategory.value)
    }

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(p => p.name.toLowerCase().includes(q))
    }

    return result.sort((a, b) => a.sortOrder - b.sortOrder)
  })

  const unavailableProducts = computed(() => products.value.filter(p => !p.available))

  const sortedCategories = computed(() =>
    [...categories.value].sort((a, b) => a.sortOrder - b.sortOrder),
  )

  // Actions
  const loadCatalog = async (force = false) => {
    if (!force && products.value.length > 0) return
    isLoading.value = true
    try {
      const data = await api.get<CatalogResponse>('/grocery-catalog')
      products.value = data.products
      categories.value = data.categories
    } finally {
      isLoading.value = false
    }
  }

  // Products CRUD
  const addProduct = async (product: Omit<GroceryProduct, 'id' | 'sortOrder'>) => {
    const created = await api.post<GroceryProduct>('/grocery-catalog/products', product)
    products.value.push(created)
    return created
  }

  const updateProduct = async (id: string, data: Partial<GroceryProduct>) => {
    const updated = await api.patch<GroceryProduct>(`/grocery-catalog/products/${id}`, data)
    const index = products.value.findIndex(p => p.id === id)
    if (index !== -1) products.value[index] = updated
    return updated
  }

  const deleteProduct = async (id: string) => {
    await api.delete(`/grocery-catalog/products/${id}`)
    products.value = products.value.filter(p => p.id !== id)
  }

  const toggleAvailability = async (id: string) => {
    const updated = await api.patch<GroceryProduct>(`/grocery-catalog/products/${id}/toggle`)
    const index = products.value.findIndex(p => p.id === id)
    if (index !== -1) products.value[index] = updated
  }

  const bulkToggleAvailability = async (ids: string[], available: boolean) => {
    await api.post('/grocery-catalog/products/bulk-toggle', { ids, available })
    ids.forEach(id => {
      const product = products.value.find(p => p.id === id)
      if (product) product.available = available
    })
  }

  const bulkDelete = async (ids: string[]) => {
    await api.post('/grocery-catalog/products/bulk-delete', { ids })
    products.value = products.value.filter(p => !ids.includes(p.id))
  }

  // Categories CRUD
  const addCategory = async (name: string, image?: string | null) => {
    const created = await api.post<GroceryCategory>('/grocery-catalog/categories', { name, image: image ?? undefined })
    categories.value.push(created)
    return created
  }

  const updateCategory = async (id: string, data: { name?: string; image?: string | null }) => {
    const updated = await api.patch<GroceryCategory>(`/grocery-catalog/categories/${id}`, data)
    const cat = categories.value.find(c => c.id === id)
    if (cat) {
      cat.name = updated.name
      cat.image = updated.image
    }
  }

  const deleteCategory = async (id: string) => {
    await api.delete(`/grocery-catalog/categories/${id}`)
    categories.value = categories.value.filter(c => c.id !== id)
    products.value = products.value.filter(p => p.categoryId !== id)
  }

  const reorderCategories = async (reordered: GroceryCategory[]) => {
    const ids = reordered.map(c => c.id)
    const updated = await api.patch<GroceryCategory[]>('/grocery-catalog/categories-reorder', { ids })
    categories.value = updated
  }

  // Image upload
  const uploadProductImage = async (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const updated = await api.upload<GroceryProduct>(`/grocery-catalog/products/${id}/upload-image`, formData)
    const index = products.value.findIndex(p => p.id === id)
    if (index !== -1) products.value[index] = updated
    return updated
  }

  const deleteProductImage = async (id: string) => {
    const updated = await api.delete<GroceryProduct>(`/grocery-catalog/products/${id}/image`)
    const index = products.value.findIndex(p => p.id === id)
    if (index !== -1) products.value[index] = updated
    return updated
  }

  const uploadCategoryImage = async (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const updated = await api.upload<GroceryCategory>(`/grocery-catalog/categories/${id}/upload-image`, formData)
    const cat = categories.value.find(c => c.id === id)
    if (cat) cat.image = updated.image
    return updated
  }

  const deleteCategoryImage = async (id: string) => {
    const updated = await api.delete<GroceryCategory>(`/grocery-catalog/categories/${id}/image`)
    const cat = categories.value.find(c => c.id === id)
    if (cat) cat.image = updated.image
    return updated
  }

  return {
    products,
    categories,
    selectedCategory,
    isLoading,
    searchQuery,
    filteredProducts,
    unavailableProducts,
    sortedCategories,
    loadCatalog,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleAvailability,
    bulkToggleAvailability,
    bulkDelete,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    uploadProductImage,
    deleteProductImage,
    uploadCategoryImage,
    deleteCategoryImage,
  }
})
