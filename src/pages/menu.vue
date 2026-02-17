<script lang="ts" setup>
import { useMenuStore } from '@/stores/menu'
import type { MenuItem } from '@/types'

const menuStore = useMenuStore()

const itemDialog = ref(false)
const categoriesDialog = ref(false)
const modifiersDialog = ref(false)
const deleteDialog = ref(false)

const editingItem = ref<MenuItem | null>(null)
const deleteItemId = ref<number | null>(null)
const selectedIds = ref<number[]>([])
const viewMode = ref<'grid' | 'list'>('grid')

onMounted(() => {
  menuStore.loadMenu()
})

// Item actions
function openCreateDialog() {
  editingItem.value = null
  itemDialog.value = true
}

function openEditDialog(item: MenuItem) {
  editingItem.value = item
  itemDialog.value = true
}

function openDeleteDialog(id: number) {
  deleteItemId.value = id
  deleteDialog.value = true
}

function confirmDelete() {
  if (deleteItemId.value) {
    menuStore.deleteItem(deleteItemId.value)
    deleteItemId.value = null
  }
}

function handleSave(data: Omit<MenuItem, 'id' | 'sortOrder'>) {
  if (editingItem.value) {
    menuStore.updateItem(editingItem.value.id, data)
  } else {
    menuStore.addItem(data)
  }
}

// Selection
function toggleSelect(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function bulkDisable() {
  menuStore.bulkToggleAvailability(selectedIds.value, false)
  selectedIds.value = []
}

function bulkEnable() {
  menuStore.bulkToggleAvailability(selectedIds.value, true)
  selectedIds.value = []
}

function bulkDelete() {
  menuStore.bulkDelete(selectedIds.value)
  selectedIds.value = []
}

// Categories
const categoryTabs = computed(() => {
  return [
    { id: null, name: 'Все' },
    ...menuStore.sortedCategories,
  ]
})
</script>

<template>
  <div class="px-8 py-4">
    <!-- Toolbar -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="d-flex align-center ga-3">
        <v-text-field
          v-model="menuStore.searchQuery"
          label="Поиск позиции..."
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-magnify"
          rounded="xl"
          hide-details
          style="min-width: 300px"
          bg-color="white"
        />
      </div>

      <div class="d-flex align-center ga-2">
        <v-btn variant="outlined" prepend-icon="mdi-format-list-bulleted" size="small" @click="categoriesDialog = true">
          Категории
        </v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-tune" size="small" @click="modifiersDialog = true">
          Модификаторы
        </v-btn>
        <v-btn-toggle v-model="viewMode" mandatory density="compact" rounded="lg">
          <v-btn value="grid" icon="mdi-view-grid" size="small" />
          <v-btn value="list" icon="mdi-view-list" size="small" />
        </v-btn-toggle>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreateDialog">
          Добавить
        </v-btn>
      </div>
    </div>

    <!-- Category tabs -->
    <v-chip-group v-model="menuStore.selectedCategory" class="mb-4">
      <v-chip
        v-for="cat in categoryTabs"
        :key="cat.id ?? 'all'"
        :value="cat.id"
        filter
        variant="elevated"
        size="small"
      >
        {{ cat.name }}
      </v-chip>
    </v-chip-group>

    <!-- Bulk actions -->
    <v-slide-y-transition>
      <div v-if="selectedIds.length > 0" class="d-flex align-center ga-2 mb-4 pa-3 bg-blue-lighten-5 rounded-lg">
        <span class="text-body-2 font-weight-medium">Выбрано: {{ selectedIds.length }}</span>
        <v-spacer />
        <v-btn size="small" variant="tonal" color="green" @click="bulkEnable">Включить</v-btn>
        <v-btn size="small" variant="tonal" color="orange" @click="bulkDisable">Выключить</v-btn>
        <v-btn size="small" variant="tonal" color="red" @click="bulkDelete">Удалить</v-btn>
        <v-btn size="small" variant="text" @click="selectedIds = []">Снять</v-btn>
      </div>
    </v-slide-y-transition>

    <!-- Loading -->
    <div v-if="menuStore.isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="d-flex flex-wrap ga-4">
      <div v-for="item in menuStore.filteredItems" :key="item.id" style="width: 280px">
        <MenuItemCard
          :item="item"
          :selected="selectedIds.includes(item.id)"
          @edit="openEditDialog"
          @delete="openDeleteDialog"
          @toggle-availability="menuStore.toggleAvailability"
          @select="toggleSelect"
        />
      </div>

      <p v-if="menuStore.filteredItems.length === 0" class="text-caption text-grey text-center w-100 py-8">
        Нет позиций
      </p>
    </div>

    <!-- List View -->
    <v-card v-else flat rounded="xl">
      <v-data-table
        :items="menuStore.filteredItems"
        :headers="[
          { key: 'image', title: '', width: '64px', sortable: false },
          { key: 'name', title: 'Название' },
          { key: 'price', title: 'Цена', align: 'end' as const },
          { key: 'weight', title: 'Вес', align: 'end' as const },
          { key: 'available', title: 'Статус' },
          { key: 'actions', title: '', sortable: false, width: '120px' },
        ]"
        hover
      >
        <template v-slot:item.image="{ item }">
          <v-avatar size="48" rounded="lg">
            <v-img v-if="item.image" :src="item.image" cover />
            <v-icon v-else icon="mdi-food" />
          </v-avatar>
        </template>

        <template v-slot:item.price="{ item }">
          <span class="font-weight-medium">{{ item.price }} ₽</span>
        </template>

        <template v-slot:item.weight="{ item }">
          <span class="text-grey">{{ item.weight }} г</span>
        </template>

        <template v-slot:item.available="{ item }">
          <v-switch
            :model-value="item.available"
            color="green"
            density="compact"
            hide-details
            @update:model-value="menuStore.toggleAvailability(item.id)"
          />
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" @click="openEditDialog(item)" />
          <v-btn icon="mdi-delete" size="small" variant="text" color="red" @click="openDeleteDialog(item.id)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialogs -->
    <MenuItemDialog
      v-model="itemDialog"
      :item="editingItem"
      :categories="menuStore.categories"
      :modifier-groups="menuStore.modifierGroups"
      @save="handleSave"
    />

    <CategoriesDialog
      v-model="categoriesDialog"
      :categories="menuStore.categories"
      @add="menuStore.addCategory"
      @update="menuStore.updateCategory"
      @delete="menuStore.deleteCategory"
      @reorder="menuStore.reorderCategories"
    />

    <ModifiersDialog
      v-model="modifiersDialog"
      :modifier-groups="menuStore.modifierGroups"
      @add="menuStore.addModifierGroup"
      @update="menuStore.updateModifierGroup"
      @delete="menuStore.deleteModifierGroup"
    />

    <ConfirmDialog
      v-model="deleteDialog"
      title="Удалить позицию?"
      text="Позиция будет удалена из меню."
      confirm-text="Удалить"
      confirm-color="red"
      @confirm="confirmDelete"
    />
  </div>
</template>
