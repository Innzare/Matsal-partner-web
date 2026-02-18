<script lang="ts" setup>
import type { MenuCategory } from '@/types'
import draggable from 'vuedraggable'

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

const localCategories = ref<MenuCategory[]>([])

watch(() => props.categories, (cats) => {
  localCategories.value = [...cats].sort((a, b) => a.sortOrder - b.sortOrder)
}, { immediate: true, deep: true })

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

function onDragEnd() {
  emit('reorder', localCategories.value)
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="480"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card rounded="xl" class="cd-dialog">
      <!-- Header -->
      <div class="cd-header">
        <div>
          <p class="cd-header__title">Категории</p>
          <p class="cd-header__sub">{{ localCategories.length }} категорий</p>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" density="compact" @click="close" />
      </div>

      <v-divider />

      <!-- Add form -->
      <div class="cd-add">
        <v-text-field
          v-model="newCategoryName"
          placeholder="Название категории..."
          variant="outlined"
          density="compact"
          hide-details
          rounded="lg"
          class="cd-add__input"
          @keyup.enter="addCategory"
        />
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          :disabled="!newCategoryName.trim()"
          @click="addCategory"
        >
          Добавить
        </v-btn>
      </div>

      <v-divider />

      <!-- List with drag -->
      <div class="cd-list">
        <p v-if="localCategories.length === 0" class="text-center text-caption text-grey py-8">
          Нет категорий. Добавьте первую.
        </p>

        <draggable
          v-else
          v-model="localCategories"
          item-key="id"
          handle=".cd-item__handle"
          ghost-class="cd-item--ghost"
          animation="200"
          @end="onDragEnd"
        >
          <template #item="{ element: cat, index }">
            <div class="cd-item" :class="{ 'cd-item--editing': editingId === cat.id }">
              <!-- Normal view -->
              <template v-if="editingId !== cat.id">
                <div class="cd-item__handle">
                  <v-icon icon="mdi-drag" size="18" />
                </div>
                <span class="cd-item__order">{{ index + 1 }}</span>
                <span class="cd-item__name">{{ cat.name }}</span>
                <div class="cd-item__actions">
                  <button class="cd-item__btn" @click="startEdit(cat)">
                    <v-icon icon="mdi-pencil-outline" size="15" />
                  </button>
                  <button class="cd-item__btn cd-item__btn--danger" @click="confirmDelete(cat.id)">
                    <v-icon icon="mdi-delete-outline" size="15" />
                  </button>
                </div>
              </template>

              <!-- Editing -->
              <template v-else>
                <v-text-field
                  v-model="editingName"
                  variant="outlined"
                  density="compact"
                  hide-details
                  autofocus
                  class="cd-item__edit-input"
                  @keyup.enter="saveEdit"
                  @keyup.escape="cancelEdit"
                />
                <button class="cd-item__btn cd-item__btn--save" @click="saveEdit">
                  <v-icon icon="mdi-check" size="16" />
                </button>
                <button class="cd-item__btn" @click="cancelEdit">
                  <v-icon icon="mdi-close" size="16" />
                </button>
              </template>
            </div>
          </template>
        </draggable>
      </div>
    </v-card>

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

<style scoped>
.cd-dialog {
  overflow: hidden;
}

/* ── Header ── */
.cd-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 16px;
}

.cd-header__title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
}

.cd-header__sub {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

/* ── Add ── */
.cd-add {
  display: flex;
  gap: 10px;
  padding: 16px 24px;
}

.cd-add__input {
  flex: 1;
}

/* ── List ── */
.cd-list {
  padding: 8px 16px 16px;
  max-height: 400px;
  overflow-y: auto;
}

/* ── Item ── */
.cd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  transition: background 0.1s;
}

.cd-item:hover {
  background: #f9fafb;
}

.cd-item--editing {
  background: #f0f9ff;
}

.cd-item--ghost {
  opacity: 0.4;
  background: #eff6ff;
}

.cd-item__handle {
  cursor: grab;
  color: #d1d5db;
  display: flex;
  align-items: center;
  padding: 2px;
}

.cd-item__handle:active {
  cursor: grabbing;
}

.cd-item__order {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border-radius: 4px;
  background: #f3f4f6;
}

.cd-item__name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
}

.cd-item__edit-input {
  flex: 1;
}

.cd-item__actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.1s;
}

.cd-item:hover .cd-item__actions {
  opacity: 1;
}

.cd-item__btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: none;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.1s;
}

.cd-item__btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.cd-item__btn--danger:hover {
  background: #fef2f2;
  color: #dc2626;
}

.cd-item__btn--save {
  color: #16a34a;
}

.cd-item__btn--save:hover {
  background: #f0fdf4;
}
</style>
