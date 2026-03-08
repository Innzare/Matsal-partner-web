<script lang="ts" setup>
import type { GroceryCategory } from '@/types'
import { useCatalogStore } from '@/stores/catalog'
import draggable from 'vuedraggable'

const props = defineProps<{
  modelValue: boolean
  categories: GroceryCategory[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  add: [name: string, image?: string | null]
  update: [id: string, data: { name?: string; image?: string | null }]
  delete: [id: string]
  reorder: [categories: GroceryCategory[]]
}>()

const catalogStore = useCatalogStore()

const newCategoryName = ref('')
const editingId = ref<string | null>(null)
const editingName = ref('')
const deleteConfirmId = ref<string | null>(null)

const localCategories = ref<GroceryCategory[]>([])

watch(() => props.categories, (cats) => {
  localCategories.value = [...cats].sort((a, b) => a.sortOrder - b.sortOrder)
}, { immediate: true, deep: true })

// Category image upload
const catImageInputRef = ref<HTMLInputElement>()
const uploadingCatId = ref<string | null>(null)

function addCategory() {
  if (newCategoryName.value.trim()) {
    emit('add', newCategoryName.value.trim())
    newCategoryName.value = ''
  }
}

function startEdit(cat: GroceryCategory) {
  editingId.value = cat.id
  editingName.value = cat.name
}

function saveEdit() {
  if (editingId.value && editingName.value.trim()) {
    emit('update', editingId.value, { name: editingName.value.trim() })
    editingId.value = null
  }
}

function cancelEdit() {
  editingId.value = null
}

function confirmDelete(id: string) {
  deleteConfirmId.value = id
}

function doDelete() {
  if (deleteConfirmId.value) {
    emit('delete', deleteConfirmId.value)
    deleteConfirmId.value = null
  }
}

function triggerCatImageUpload(catId: string) {
  uploadingCatId.value = catId
  catImageInputRef.value?.click()
}

async function onCatImageChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !uploadingCatId.value) return

  try {
    await catalogStore.uploadCategoryImage(uploadingCatId.value, file)
  } catch {}

  uploadingCatId.value = null
  input.value = ''
}

async function deleteCatImage(catId: string) {
  try {
    await catalogStore.deleteCategoryImage(catId)
  } catch {}
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
    max-width="560"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card rounded="xl" class="gcd-dialog">
      <!-- Header -->
      <div class="gcd-header">
        <div>
          <p class="gcd-header__title">Категории</p>
          <p class="gcd-header__sub">{{ localCategories.length }} категорий</p>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" density="compact" @click="close" />
      </div>

      <v-divider />

      <!-- Hidden file input for category images -->
      <input
        ref="catImageInputRef"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style="display: none"
        @change="onCatImageChange"
      />

      <!-- Add form -->
      <div class="gcd-add">
        <v-text-field
          v-model="newCategoryName"
          placeholder="Название категории..."
          variant="outlined"
          density="compact"
          hide-details
          rounded="lg"
          class="gcd-add__input"
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
      <div class="gcd-list">
        <p v-if="localCategories.length === 0" class="text-center text-caption text-grey py-8">
          Нет категорий. Добавьте первую.
        </p>

        <draggable
          v-else
          v-model="localCategories"
          item-key="id"
          handle=".gcd-item__handle"
          ghost-class="gcd-item--ghost"
          animation="200"
          @end="onDragEnd"
        >
          <template #item="{ element: cat, index }">
            <div class="gcd-item" :class="{ 'gcd-item--editing': editingId === cat.id }">
              <!-- Normal view -->
              <template v-if="editingId !== cat.id">
                <div class="gcd-item__handle">
                  <v-icon icon="mdi-drag" size="18" />
                </div>
                <span class="gcd-item__order">{{ index + 1 }}</span>

                <!-- Category image thumbnail -->
                <div class="gcd-item__thumb" @click="triggerCatImageUpload(cat.id)">
                  <v-img v-if="cat.image" :src="cat.image" width="32" height="32" cover class="gcd-item__thumb-img" />
                  <v-icon v-else icon="mdi-image-plus" size="16" color="grey-lighten-1" />
                </div>

                <span class="gcd-item__name">{{ cat.name }}</span>

                <div class="gcd-item__actions">
                  <button v-if="cat.image" class="gcd-item__btn gcd-item__btn--danger" @click="deleteCatImage(cat.id)" title="Удалить фото">
                    <v-icon icon="mdi-image-remove" size="15" />
                  </button>
                  <button class="gcd-item__btn" @click="startEdit(cat)">
                    <v-icon icon="mdi-pencil-outline" size="15" />
                  </button>
                  <button class="gcd-item__btn gcd-item__btn--danger" @click="confirmDelete(cat.id)">
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
                  class="gcd-item__edit-input"
                  @keyup.enter="saveEdit"
                  @keyup.escape="cancelEdit"
                />
                <button class="gcd-item__btn gcd-item__btn--save" @click="saveEdit">
                  <v-icon icon="mdi-check" size="16" />
                </button>
                <button class="gcd-item__btn" @click="cancelEdit">
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
      text="Все товары этой категории тоже будут удалены."
      confirm-text="Удалить"
      confirm-color="red"
      @confirm="doDelete"
      @cancel="deleteConfirmId = null"
      @update:model-value="!$event && (deleteConfirmId = null)"
    />
  </v-dialog>
</template>

<style scoped>
.gcd-dialog {
  overflow: hidden;
}

/* Header */
.gcd-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 16px;
}

.gcd-header__title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
}

.gcd-header__sub {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

/* Add */
.gcd-add {
  display: flex;
  gap: 10px;
  padding: 16px 24px;
}

.gcd-add__input {
  flex: 1;
}

/* List */
.gcd-list {
  padding: 8px 16px 16px;
  max-height: 400px;
  overflow-y: auto;
}

/* Item */
.gcd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  transition: background 0.1s;
}

.gcd-item:hover {
  background: #f9fafb;
}

.gcd-item--editing {
  background: #f0f9ff;
}

.gcd-item--ghost {
  opacity: 0.4;
  background: #eff6ff;
}

.gcd-item__handle {
  cursor: grab;
  color: #d1d5db;
  display: flex;
  align-items: center;
  padding: 2px;
}

.gcd-item__handle:active {
  cursor: grabbing;
}

.gcd-item__order {
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

.gcd-item__thumb {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f3f4f6;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.1s;
}

.gcd-item__thumb:hover {
  opacity: 0.8;
}

.gcd-item__thumb-img {
  width: 100%;
  height: 100%;
}

.gcd-item__name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
}

.gcd-item__edit-input {
  flex: 1;
}

.gcd-item__actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.1s;
}

.gcd-item:hover .gcd-item__actions {
  opacity: 1;
}

.gcd-item__btn {
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

.gcd-item__btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.gcd-item__btn--danger:hover {
  background: #fef2f2;
  color: #dc2626;
}

.gcd-item__btn--save {
  color: #16a34a;
}

.gcd-item__btn--save:hover {
  background: #f0fdf4;
}
</style>
