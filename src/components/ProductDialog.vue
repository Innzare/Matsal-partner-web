<script lang="ts" setup>
import type { GroceryProduct, GroceryCategory } from '@/types'
import { useCatalogStore } from '@/stores/catalog'

const props = defineProps<{
  modelValue: boolean
  item?: GroceryProduct | null
  categories: GroceryCategory[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: Omit<GroceryProduct, 'id' | 'sortOrder'>, pendingImage?: File]
}>()

const catalogStore = useCatalogStore()

const isEdit = computed(() => !!props.item)
const formRef = ref()
const fileInputRef = ref<HTMLInputElement>()
const pendingImageFile = ref<File | null>(null)
const pendingImagePreview = ref<string | null>(null)
const imageUploading = ref(false)

const UNIT_OPTIONS = [
  { value: 'шт', title: 'шт' },
  { value: 'кг', title: 'кг' },
  { value: 'г', title: 'г' },
  { value: 'л', title: 'л' },
  { value: 'мл', title: 'мл' },
]

const form = ref({
  name: '',
  description: '',
  price: 0,
  categoryId: null as string | null,
  image: '',
  available: true,
  unit: 'шт',
  unitValue: 1,
  barcode: '',
})

const categoryOptions = computed(() =>
  props.categories.map(c => ({ value: c.id, title: c.name })),
)

const rules = {
  required: (v: any) => !!v || 'Обязательное поле',
  positive: (v: number) => v > 0 || 'Должно быть больше 0',
}

watch(() => props.item, (item) => {
  if (item) {
    form.value = {
      name: item.name,
      description: item.description,
      price: item.price,
      categoryId: item.categoryId,
      image: item.image || '',
      available: item.available,
      unit: item.unit || 'шт',
      unitValue: item.unitValue || 1,
      barcode: item.barcode || '',
    }
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  form.value = {
    name: '',
    description: '',
    price: 0,
    categoryId: null,
    image: '',
    available: true,
    unit: 'шт',
    unitValue: 1,
    barcode: '',
  }
  clearPendingImage()
}

function clearPendingImage() {
  pendingImageFile.value = null
  if (pendingImagePreview.value) {
    URL.revokeObjectURL(pendingImagePreview.value)
    pendingImagePreview.value = null
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  clearPendingImage()

  if (isEdit.value && props.item) {
    imageUploading.value = true
    catalogStore.uploadProductImage(props.item.id, file)
      .then((updated) => {
        form.value.image = updated.image || ''
      })
      .catch(() => {})
      .finally(() => { imageUploading.value = false })
  } else {
    pendingImageFile.value = file
    pendingImagePreview.value = URL.createObjectURL(file)
  }

  input.value = ''
}

async function onDeleteImage() {
  if (isEdit.value && props.item) {
    imageUploading.value = true
    try {
      await catalogStore.deleteProductImage(props.item.id)
      form.value.image = ''
    } catch {}
    finally { imageUploading.value = false }
  } else {
    clearPendingImage()
    form.value.image = ''
  }
}

const displayImage = computed(() => {
  if (pendingImagePreview.value) return pendingImagePreview.value
  return form.value.image || null
})

async function handleSave() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  emit('save', {
    name: form.value.name,
    description: form.value.description,
    price: form.value.price,
    categoryId: form.value.categoryId!,
    image: form.value.image || undefined,
    available: form.value.available,
    unit: form.value.unit,
    unitValue: form.value.unitValue,
    barcode: form.value.barcode || undefined,
  }, pendingImageFile.value || undefined)

  clearPendingImage()
  emit('update:modelValue', false)
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="640"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card rounded="xl" class="pd-dialog">
      <!-- Header -->
      <div class="pd-header">
        <div>
          <p class="pd-header__title">{{ isEdit ? 'Редактировать товар' : 'Новый товар' }}</p>
          <p class="pd-header__sub">Заполните информацию о товаре</p>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" density="compact" @click="close" />
      </div>

      <v-divider />

      <!-- Content -->
      <v-card-text class="pd-body">
        <v-form ref="formRef">
          <!-- Section: Basic -->
          <div class="pd-section">
            <p class="pd-section__title">Основное</p>

            <v-text-field
              v-model="form.name"
              label="Название"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
              hide-details="auto"
              class="mb-3"
            />

            <v-textarea
              v-model="form.description"
              label="Описание"
              variant="outlined"
              density="comfortable"
              rows="2"
              hide-details
              class="mb-3"
            />

            <div class="d-flex ga-3">
              <v-text-field
                v-model.number="form.price"
                label="Цена (₽)"
                variant="outlined"
                density="comfortable"
                type="number"
                :rules="[rules.required, rules.positive]"
                hide-details="auto"
                style="flex: 1"
              />
              <v-select
                v-model="form.categoryId"
                :items="categoryOptions"
                item-value="value"
                item-title="title"
                label="Категория"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                hide-details="auto"
                style="flex: 1"
              />
            </div>
          </div>

          <!-- Section: Unit & Barcode -->
          <div class="pd-section">
            <p class="pd-section__title">Единица измерения</p>
            <div class="d-flex ga-3">
              <v-text-field
                v-model.number="form.unitValue"
                label="Значение"
                variant="outlined"
                density="comfortable"
                type="number"
                hide-details
                style="flex: 1"
              />
              <v-select
                v-model="form.unit"
                :items="UNIT_OPTIONS"
                item-value="value"
                item-title="title"
                label="Единица"
                variant="outlined"
                density="comfortable"
                hide-details
                style="flex: 1"
              />
              <v-text-field
                v-model="form.barcode"
                label="Штрих-код"
                variant="outlined"
                density="comfortable"
                hide-details
                style="flex: 1"
              />
            </div>
          </div>

          <!-- Section: Image -->
          <div class="pd-section">
            <p class="pd-section__title">Изображение</p>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style="display: none"
              @change="onFileChange"
            />
            <div class="pd-img-area">
              <div v-if="displayImage" class="pd-img-preview-wrap">
                <v-img :src="displayImage" width="160" height="120" cover rounded="lg">
                  <template v-slot:error>
                    <div class="d-flex align-center justify-center h-100 bg-grey-lighten-3">
                      <v-icon icon="mdi-image-off" size="20" color="grey" />
                    </div>
                  </template>
                </v-img>
                <div class="pd-img-actions">
                  <button class="pd-img-btn" type="button" @click="fileInputRef?.click()">
                    <v-icon icon="mdi-pencil" size="14" />
                  </button>
                  <button class="pd-img-btn pd-img-btn--danger" type="button" @click="onDeleteImage">
                    <v-icon icon="mdi-delete-outline" size="14" />
                  </button>
                </div>
                <div v-if="imageUploading" class="pd-img-loader">
                  <v-progress-circular size="24" width="2" indeterminate color="white" />
                </div>
              </div>
              <div v-else class="pd-img-upload" @click="fileInputRef?.click()">
                <v-icon icon="mdi-cloud-upload-outline" size="28" color="grey-lighten-1" />
                <span class="pd-img-upload__text">Нажмите для загрузки</span>
                <span class="pd-img-upload__hint">JPG, PNG, WebP, GIF до 5 МБ</span>
              </div>
            </div>
          </div>

          <!-- Section: Availability -->
          <div class="pd-section pd-section--row pd-section--last">
            <div>
              <p class="pd-section__title mb-0">Наличие</p>
              <p class="pd-section__sub">Товар виден клиентам</p>
            </div>
            <v-switch
              v-model="form.available"
              color="green"
              density="compact"
              hide-details
            />
          </div>
        </v-form>
      </v-card-text>

      <v-divider />

      <!-- Footer -->
      <div class="pd-footer">
        <v-btn variant="text" color="grey" rounded="lg" @click="close">Отмена</v-btn>
        <v-btn color="primary" variant="flat" rounded="lg" @click="handleSave">
          {{ isEdit ? 'Сохранить' : 'Создать' }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.pd-dialog {
  overflow: hidden;
}

/* Header */
.pd-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 16px;
}

.pd-header__title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
}

.pd-header__sub {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 2px;
}

/* Body */
.pd-body {
  padding: 0 !important;
}

/* Sections */
.pd-section {
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.pd-section--last {
  border-bottom: none;
}

.pd-section--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pd-section__title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.pd-section__sub {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

/* Image upload */
.pd-img-area {
  display: flex;
}

.pd-img-preview-wrap {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

.pd-img-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.pd-img-preview-wrap:hover .pd-img-actions {
  opacity: 1;
}

.pd-img-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  cursor: pointer;
  transition: background 0.1s;
}

.pd-img-btn:hover {
  background: rgba(0, 0, 0, 0.75);
}

.pd-img-btn--danger:hover {
  background: rgba(220, 38, 38, 0.85);
}

.pd-img-loader {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
}

.pd-img-upload {
  width: 100%;
  padding: 20px;
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.15s;
  background: #f9fafb;
}

.pd-img-upload:hover {
  border-color: #EA004B;
  background: #fef2f5;
}

.pd-img-upload__text {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.pd-img-upload__hint {
  font-size: 11px;
  color: #9ca3af;
}

/* Footer */
.pd-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 24px;
}
</style>
