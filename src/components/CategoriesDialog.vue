<script lang="ts" setup>
import type { MenuCategory } from '@/types'

const props = defineProps<{
  modelValue: boolean
  categories: MenuCategory[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  add: [name: string]
  update: [id: number, name: string]
  delete: [id: number]
  reorder: [categories: MenuCategory[]]
}>()

const newCategoryName = ref('')
const editingId = ref<number | null>(null)
const editingName = ref('')
const deleteConfirmId = ref<number | null>(null)

const sortedCategories = computed(() =>
  [...props.categories].sort((a, b) => a.sortOrder - b.sortOrder),
)

function addCategory() {
  if (newCategoryName.value.trim()) {
    emit('add', newCategoryName.value.trim())
    newCategoryName.value = ''
  }
}

function startEdit(cat: MenuCategory) {
  editingId.value = cat.id
  editingName.value = cat.name
}

function saveEdit() {
  if (editingId.value && editingName.value.trim()) {
    emit('update', editingId.value, editingName.value.trim())
    editingId.value = null
  }
}

function cancelEdit() {
  editingId.value = null
}

function confirmDelete(id: number) {
  deleteConfirmId.value = id
}

function doDelete() {
  if (deleteConfirmId.value) {
    emit('delete', deleteConfirmId.value)
    deleteConfirmId.value = null
  }
}

function moveUp(index: number) {
  if (index === 0) return
  const list = [...sortedCategories.value]
  const temp = list[index]!
  list[index] = list[index - 1]!
  list[index - 1] = temp
  emit('reorder', list)
}

function moveDown(index: number) {
  if (index === sortedCategories.value.length - 1) return
  const list = [...sortedCategories.value]
  const temp = list[index]!
  list[index] = list[index + 1]!
  list[index + 1] = temp
  emit('reorder', list)
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between pt-5 px-6">
        <span class="text-h6">Управление категориями</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="emit('update:modelValue', false)" />
      </v-card-title>

      <v-card-text class="px-6">
        <!-- Add new -->
        <div class="d-flex ga-2 mb-4">
          <v-text-field
            v-model="newCategoryName"
            label="Новая категория"
            variant="outlined"
            density="compact"
            hide-details
            @keyup.enter="addCategory"
          />
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!newCategoryName.trim()"
            @click="addCategory"
          >
            Добавить
          </v-btn>
        </div>

        <!-- List -->
        <v-list density="compact">
          <v-list-item
            v-for="(cat, index) in sortedCategories"
            :key="cat.id"
            class="px-0"
          >
            <template v-if="editingId === cat.id">
              <div class="d-flex align-center ga-2 w-100">
                <v-text-field
                  v-model="editingName"
                  variant="outlined"
                  density="compact"
                  hide-details
                  autofocus
                  @keyup.enter="saveEdit"
                  @keyup.escape="cancelEdit"
                />
                <v-btn icon="mdi-check" size="small" color="green" variant="text" @click="saveEdit" />
                <v-btn icon="mdi-close" size="small" variant="text" @click="cancelEdit" />
              </div>
            </template>

            <template v-else>
              <div class="d-flex align-center justify-space-between w-100">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-drag" size="small" class="text-grey cursor-grab" />
                  <span class="text-body-2">{{ cat.name }}</span>
                </div>
                <div class="d-flex ga-0">
                  <v-btn icon="mdi-chevron-up" size="x-small" variant="text" :disabled="index === 0" @click="moveUp(index)" />
                  <v-btn icon="mdi-chevron-down" size="x-small" variant="text" :disabled="index === sortedCategories.length - 1" @click="moveDown(index)" />
                  <v-btn icon="mdi-pencil" size="x-small" variant="text" @click="startEdit(cat)" />
                  <v-btn icon="mdi-delete" size="x-small" variant="text" color="red" @click="confirmDelete(cat.id)" />
                </div>
              </div>
            </template>
          </v-list-item>
        </v-list>

        <p v-if="sortedCategories.length === 0" class="text-caption text-grey text-center py-4">
          Нет категорий
        </p>
      </v-card-text>
    </v-card>

    <!-- Delete confirm -->
    <ConfirmDialog
      :model-value="deleteConfirmId !== null"
      title="Удалить категорию?"
      text="Все позиции этой категории тоже будут удалены."
      confirm-text="Удалить"
      confirm-color="red"
      @confirm="doDelete"
      @cancel="deleteConfirmId = null"
      @update:model-value="!$event && (deleteConfirmId = null)"
    />
  </v-dialog>
</template>
