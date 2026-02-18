import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MenuItem, MenuCategory, ModifierGroup } from '@/types'
import { IS_MOCK } from '@/api'
import { MOCK_MENU_ITEMS, MOCK_CATEGORIES, MOCK_MODIFIER_GROUPS } from '@/api/mock-data'

export const useMenuStore = defineStore('menu', () => {
  const items = ref<MenuItem[]>([])
  const categories = ref<MenuCategory[]>([])
  const modifierGroups = ref<ModifierGroup[]>([])
  const selectedCategory = ref<number | null>(null)
  const isLoading = ref(false)
  const searchQuery = ref('')

  // Getters
  const filteredItems = computed(() => {
    let result = items.value

    if (selectedCategory.value !== null) {
      result = result.filter(i => i.category === selectedCategory.value)
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
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 300))
        items.value = structuredClone(MOCK_MENU_ITEMS)
        categories.value = structuredClone(MOCK_CATEGORIES)
        modifierGroups.value = structuredClone(MOCK_MODIFIER_GROUPS)
        return
      }
      // TODO: real API
    } finally {
      isLoading.value = false
    }
  }

  // Menu items CRUD
  const addItem = (item: Omit<MenuItem, 'id' | 'sortOrder'>) => {
    const maxId = items.value.reduce((max, i) => Math.max(max, i.id), 0)
    const categoryItems = items.value.filter(i => i.category === item.category)
    const maxSort = categoryItems.reduce((max, i) => Math.max(max, i.sortOrder), 0)
    items.value.push({ ...item, id: maxId + 1, sortOrder: maxSort + 1 })
  }

  const updateItem = (id: number, data: Partial<MenuItem>) => {
    const index = items.value.findIndex(i => i.id === id)
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...data } as MenuItem
    }
  }

  const deleteItem = (id: number) => {
    items.value = items.value.filter(i => i.id !== id)
  }

  const toggleAvailability = (id: number) => {
    const item = items.value.find(i => i.id === id)
    if (item) {
      item.available = !item.available
    }
  }

  const bulkToggleAvailability = (ids: number[], available: boolean) => {
    ids.forEach(id => {
      const item = items.value.find(i => i.id === id)
      if (item) item.available = available
    })
  }

  const bulkDelete = (ids: number[]) => {
    items.value = items.value.filter(i => !ids.includes(i.id))
  }

  // Categories CRUD
  const addCategory = (name: string) => {
    const maxId = categories.value.reduce((max, c) => Math.max(max, c.id), 0)
    const maxSort = categories.value.reduce((max, c) => Math.max(max, c.sortOrder), 0)
    categories.value.push({ id: maxId + 1, name, sortOrder: maxSort + 1 })
  }

  const updateCategory = (id: number, name: string) => {
    const cat = categories.value.find(c => c.id === id)
    if (cat) cat.name = name
  }

  const deleteCategory = (id: number) => {
    categories.value = categories.value.filter(c => c.id !== id)
    items.value = items.value.filter(i => i.category !== id)
  }

  const reorderCategories = (reordered: MenuCategory[]) => {
    categories.value = reordered.map((c, i) => ({ ...c, sortOrder: i + 1 }))
  }

  // Modifier groups CRUD
  const addModifierGroup = (group: Omit<ModifierGroup, 'id'>) => {
    const maxId = modifierGroups.value.reduce((max, g) => Math.max(max, g.id), 0)
    modifierGroups.value.push({ ...group, id: maxId + 1 })
  }

  const updateModifierGroup = (id: number, data: Partial<ModifierGroup>) => {
    const index = modifierGroups.value.findIndex(g => g.id === id)
    if (index !== -1) {
      modifierGroups.value[index] = { ...modifierGroups.value[index], ...data } as ModifierGroup
    }
  }

  const deleteModifierGroup = (id: number) => {
    modifierGroups.value = modifierGroups.value.filter(g => g.id !== id)
    items.value.forEach(item => {
      item.modifierGroups = item.modifierGroups.filter(gId => gId !== id)
    })
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
  }
})
