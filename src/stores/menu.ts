import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MenuItem, MenuCategory, ModifierGroup } from '@/types'
import { api } from '@/api'

interface MenuResponse {
  categories: MenuCategory[]
  items: MenuItem[]
  modifierGroups: ModifierGroup[]
}

export const useMenuStore = defineStore('menu', () => {
  const items = ref<MenuItem[]>([])
  const categories = ref<MenuCategory[]>([])
  const modifierGroups = ref<ModifierGroup[]>([])
  const selectedCategory = ref<string | null>(null)
  const isLoading = ref(false)
  const searchQuery = ref('')

  // Getters
  const filteredItems = computed(() => {
    let result = items.value

    if (selectedCategory.value !== null) {
      result = result.filter(i => i.categoryId === selectedCategory.value)
    }

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(i => i.name.toLowerCase().includes(q))
    }

    return result.sort((a, b) => a.sortOrder - b.sortOrder)
  })

  const unavailableItems = computed(() => items.value.filter(i => !i.available))

  const sortedCategories = computed(() =>
    [...categories.value].sort((a, b) => a.sortOrder - b.sortOrder),
  )

  // Actions
  const loadMenu = async (force = false) => {
    if (!force && items.value.length > 0) return
    isLoading.value = true
    try {
      const data = await api.get<MenuResponse>('/menu')
      items.value = data.items
      categories.value = data.categories
      modifierGroups.value = data.modifierGroups
    } finally {
      isLoading.value = false
    }
  }

  // Menu items CRUD
  const addItem = async (item: Omit<MenuItem, 'id' | 'sortOrder'>) => {
    const { modifierGroups: mgIds, ...rest } = item
    const created = await api.post<MenuItem>('/menu/items', { ...rest, modifierGroupIds: mgIds })
    items.value.push(created)
    return created
  }

  const updateItem = async (id: string, data: Partial<MenuItem>) => {
    const { modifierGroups: mgIds, ...rest } = data
    const payload = mgIds !== undefined ? { ...rest, modifierGroupIds: mgIds } : rest
    const updated = await api.patch<MenuItem>(`/menu/items/${id}`, payload)
    const index = items.value.findIndex(i => i.id === id)
    if (index !== -1) items.value[index] = updated
    return updated
  }

  const deleteItem = async (id: string) => {
    await api.delete(`/menu/items/${id}`)
    items.value = items.value.filter(i => i.id !== id)
  }

  const toggleAvailability = async (id: string) => {
    const updated = await api.patch<MenuItem>(`/menu/items/${id}/toggle`)
    const index = items.value.findIndex(i => i.id === id)
    if (index !== -1) items.value[index] = updated
  }

  const bulkToggleAvailability = async (ids: string[], available: boolean) => {
    await api.post('/menu/items/bulk-toggle', { ids, available })
    ids.forEach(id => {
      const item = items.value.find(i => i.id === id)
      if (item) item.available = available
    })
  }

  const bulkDelete = async (ids: string[]) => {
    await api.post('/menu/items/bulk-delete', { ids })
    items.value = items.value.filter(i => !ids.includes(i.id))
  }

  // Categories CRUD
  const addCategory = async (name: string, type?: string | null) => {
    const created = await api.post<MenuCategory>('/menu/categories', { name, type: type ?? undefined })
    categories.value.push(created)
    return created
  }

  const updateCategory = async (id: string, name: string, type?: string | null) => {
    const updated = await api.patch<MenuCategory>(`/menu/categories/${id}`, { name, type: type !== undefined ? type : undefined })
    const cat = categories.value.find(c => c.id === id)
    if (cat) {
      cat.name = updated.name
      cat.type = updated.type
    }
  }

  const deleteCategory = async (id: string) => {
    await api.delete(`/menu/categories/${id}`)
    categories.value = categories.value.filter(c => c.id !== id)
    items.value = items.value.filter(i => i.categoryId !== id)
  }

  const reorderCategories = async (reordered: MenuCategory[]) => {
    const ids = reordered.map(c => c.id)
    const updated = await api.patch<MenuCategory[]>('/menu/categories-reorder', { ids })
    categories.value = updated
  }

  // Modifier groups CRUD
  const addModifierGroup = async (group: Omit<ModifierGroup, 'id'>) => {
    const created = await api.post<ModifierGroup>('/menu/modifier-groups', group)
    modifierGroups.value.push(created)
    return created
  }

  const updateModifierGroup = async (id: string, data: Partial<ModifierGroup>) => {
    const updated = await api.patch<ModifierGroup>(`/menu/modifier-groups/${id}`, data)
    const index = modifierGroups.value.findIndex(g => g.id === id)
    if (index !== -1) modifierGroups.value[index] = updated
  }

  const deleteModifierGroup = async (id: string) => {
    await api.delete(`/menu/modifier-groups/${id}`)
    modifierGroups.value = modifierGroups.value.filter(g => g.id !== id)
    items.value.forEach(item => {
      item.modifierGroups = item.modifierGroups.filter(gId => gId !== id)
    })
  }

  // Image upload
  const uploadItemImage = async (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const updated = await api.upload<MenuItem>(`/menu/items/${id}/upload-image`, formData)
    const index = items.value.findIndex(i => i.id === id)
    if (index !== -1) items.value[index] = { ...items.value[index], ...updated, modifierGroups: updated.modifierGroups }
    return updated
  }

  const deleteItemImage = async (id: string) => {
    const updated = await api.delete<MenuItem>(`/menu/items/${id}/image`)
    const index = items.value.findIndex(i => i.id === id)
    if (index !== -1) items.value[index] = { ...items.value[index], ...updated, modifierGroups: updated.modifierGroups }
    return updated
  }

  return {
    items,
    categories,
    modifierGroups,
    selectedCategory,
    isLoading,
    searchQuery,
    filteredItems,
    unavailableItems,
    sortedCategories,
    loadMenu,
    addItem,
    updateItem,
    deleteItem,
    toggleAvailability,
    bulkToggleAvailability,
    bulkDelete,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    addModifierGroup,
    updateModifierGroup,
    deleteModifierGroup,
    uploadItemImage,
    deleteItemImage,
  }
})
