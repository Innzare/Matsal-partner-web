<script lang="ts" setup>
import type { MenuItem, MenuCategory, ModifierGroup, Allergen } from '@/types'
import { ALLERGEN_LABELS } from '@/types'
import { useMenuStore } from '@/stores/menu'

const props = defineProps<{
  modelValue: boolean
  item?: MenuItem | null
  categories: MenuCategory[]
  modifierGroups: ModifierGroup[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: Omit<MenuItem, 'id' | 'sortOrder'>, pendingImage?: File]
}>()

const menuStore = useMenuStore()

const isEdit = computed(() => !!props.item)
const formRef = ref()
const fileInputRef = ref<HTMLInputElement>()
const pendingImageFile = ref<File | null>(null)
const pendingImagePreview = ref<string | null>(null)
const imageUploading = ref(false)

const form = ref({
  name: '',
  description: '',
  price: 0,
  weight: 0,
  categoryId: null as string | null,
  image: '',
  available: true,
  allergens: [] as string[],
  modifierGroups: [] as string[],
  calories: null as number | null,
  protein: null as number | null,
  fat: null as number | null,
  carbs: null as number | null,
})

const allergenOptions = Object.entries(ALLERGEN_LABELS).map(([value, title]) => ({
  value: value as Allergen,
  title,
}))

const modifierGroupOptions = computed(() =>
  props.modifierGroups.map(g => ({ value: g.id, title: g.name })),
)

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
      weight: item.weight,
      categoryId: item.categoryId,
      image: item.image || '',
      available: item.available,
      allergens: [...item.allergens],
      modifierGroups: [...item.modifierGroups],
      calories: item.nutrition?.calories ?? null,
      protein: item.nutrition?.protein ?? null,
      fat: item.nutrition?.fat ?? null,
      carbs: item.nutrition?.carbs ?? null,
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
    weight: 0,
    categoryId: null,
    image: '',
    available: true,
    allergens: [],
    modifierGroups: [],
    calories: null,
    protein: null,
    fat: null,
    carbs: null,
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
    // При редактировании — загружаем сразу
    imageUploading.value = true
    menuStore.uploadItemImage(props.item.id, file)
      .then((updated) => {
        form.value.image = updated.image || ''
      })
      .catch(() => {})
      .finally(() => { imageUploading.value = false })
  } else {
    // При создании — сохраняем для загрузки после создания
    pendingImageFile.value = file
    pendingImagePreview.value = URL.createObjectURL(file)
  }

  input.value = ''
}

async function onDeleteImage() {
  if (isEdit.value && props.item) {
    imageUploading.value = true
    try {
      await menuStore.deleteItemImage(props.item.id)
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

  const hasNutrition = form.value.calories || form.value.protein || form.value.fat || form.value.carbs
  const nutrition = hasNutrition
    ? {
        calories: form.value.calories || 0,
        protein: form.value.protein || 0,
        fat: form.value.fat || 0,
        carbs: form.value.carbs || 0,
      }
    : undefined

  emit('save', {
    name: form.value.name,
    description: form.value.description,
    price: form.value.price,
    weight: form.value.weight,
    categoryId: form.value.categoryId!,
    image: form.value.image || undefined,
    available: form.value.available,
    allergens: form.value.allergens,
    modifierGroups: form.value.modifierGroups,
    nutrition,
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
    <v-card rounded="xl" class="mid-dialog">
      <!-- Header -->
      <div class="mid-header">
        <div>
          <p class="mid-header__title">{{ isEdit ? 'Редактировать позицию' : 'Новая позиция' }}</p>
          <p class="mid-header__sub">Заполните информацию о блюде</p>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" density="compact" @click="close" />
      </div>

      <v-divider />

      <!-- Content -->
      <v-card-text class="mid-body">
        <v-form ref="formRef">
          <!-- Section: Basic -->
          <div class="mid-section">
            <p class="mid-section__title">Основное</p>

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
              <v-text-field
                v-model.number="form.weight"
                label="Вес (г)"
                variant="outlined"
                density="comfortable"
                type="number"
                hide-details
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

          <!-- Section: Image -->
          <div class="mid-section">
            <p class="mid-section__title">Изображение</p>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style="display: none"
              @change="onFileChange"
            />
            <div class="mid-img-area">
              <div v-if="displayImage" class="mid-img-preview-wrap">
                <v-img :src="displayImage" width="160" height="120" cover rounded="lg">
                  <template v-slot:error>
                    <div class="d-flex align-center justify-center h-100 bg-grey-lighten-3">
                      <v-icon icon="mdi-image-off" size="20" color="grey" />
                    </div>
                  </template>
                </v-img>
                <div class="mid-img-actions">
                  <button class="mid-img-btn" type="button" @click="fileInputRef?.click()">
                    <v-icon icon="mdi-pencil" size="14" />
                  </button>
                  <button class="mid-img-btn mid-img-btn--danger" type="button" @click="onDeleteImage">
                    <v-icon icon="mdi-delete-outline" size="14" />
                  </button>
                </div>
                <div v-if="imageUploading" class="mid-img-loader">
                  <v-progress-circular size="24" width="2" indeterminate color="white" />
                </div>
              </div>
              <div v-else class="mid-img-upload" @click="fileInputRef?.click()">
                <v-icon icon="mdi-cloud-upload-outline" size="28" color="grey-lighten-1" />
                <span class="mid-img-upload__text">Нажмите для загрузки</span>
                <span class="mid-img-upload__hint">JPG, PNG, WebP, GIF до 5 МБ</span>
              </div>
            </div>
          </div>

          <!-- Section: Availability -->
          <div class="mid-section mid-section--row">
            <div>
              <p class="mid-section__title mb-0">Наличие</p>
              <p class="mid-section__sub">Позиция видна клиентам</p>
            </div>
            <v-switch
              v-model="form.available"
              color="green"
              density="compact"
              hide-details
            />
          </div>

          <!-- Section: Allergens -->
          <div class="mid-section">
            <p class="mid-section__title">Аллергены</p>
            <div class="mid-allergens">
              <div
                v-for="a in allergenOptions"
                :key="a.value"
                class="mid-allergen"
                :class="{ 'mid-allergen--active': form.allergens.includes(a.value) }"
                @click="
                  form.allergens.includes(a.value)
                    ? form.allergens.splice(form.allergens.indexOf(a.value), 1)
                    : form.allergens.push(a.value)
                "
              >
                {{ a.title }}
              </div>
            </div>
          </div>

          <!-- Section: Nutrition -->
          <div class="mid-section">
            <p class="mid-section__title">КБЖУ <span class="mid-section__hint">на порцию</span></p>
            <div class="mid-nutrition">
              <div class="mid-nutrition__item">
                <v-text-field
                  v-model.number="form.calories"
                  variant="outlined"
                  density="compact"
                  type="number"
                  hide-details
                  placeholder="0"
                />
                <span class="mid-nutrition__label">Ккал</span>
              </div>
              <div class="mid-nutrition__item">
                <v-text-field
                  v-model.number="form.protein"
                  variant="outlined"
                  density="compact"
                  type="number"
                  hide-details
                  placeholder="0"
                />
                <span class="mid-nutrition__label">Белки</span>
              </div>
              <div class="mid-nutrition__item">
                <v-text-field
                  v-model.number="form.fat"
                  variant="outlined"
                  density="compact"
                  type="number"
                  hide-details
                  placeholder="0"
                />
                <span class="mid-nutrition__label">Жиры</span>
              </div>
              <div class="mid-nutrition__item">
                <v-text-field
                  v-model.number="form.carbs"
                  variant="outlined"
                  density="compact"
                  type="number"
                  hide-details
                  placeholder="0"
                />
                <span class="mid-nutrition__label">Углеводы</span>
              </div>
            </div>
          </div>

          <!-- Section: Modifiers -->
          <div class="mid-section mid-section--last">
            <p class="mid-section__title">Модификаторы</p>
            <v-select
              v-model="form.modifierGroups"
              :items="modifierGroupOptions"
              item-value="value"
              item-title="title"
              label="Группы модификаторов"
              variant="outlined"
              density="comfortable"
              multiple
              chips
              closable-chips
              hide-details
            />
          </div>
        </v-form>
      </v-card-text>

      <v-divider />

      <!-- Footer -->
      <div class="mid-footer">
        <v-btn variant="text" color="grey" rounded="lg" @click="close">Отмена</v-btn>
        <v-btn color="primary" variant="flat" rounded="lg" @click="handleSave">
          {{ isEdit ? 'Сохранить' : 'Создать' }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.mid-dialog {
  overflow: hidden;
}

/* ── Header ── */
.mid-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 16px;
}

.mid-header__title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
}

.mid-header__sub {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 2px;
}

/* ── Body ── */
.mid-body {
  padding: 0 !important;
}

/* ── Sections ── */
.mid-section {
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.mid-section--last {
  border-bottom: none;
}

.mid-section--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mid-section__title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.mid-section__sub {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.mid-section__hint {
  font-weight: 400;
  color: #9ca3af;
}

/* ── Image upload ── */
.mid-img-area {
  display: flex;
}

.mid-img-preview-wrap {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

.mid-img-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.mid-img-preview-wrap:hover .mid-img-actions {
  opacity: 1;
}

.mid-img-btn {
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

.mid-img-btn:hover {
  background: rgba(0, 0, 0, 0.75);
}

.mid-img-btn--danger:hover {
  background: rgba(220, 38, 38, 0.85);
}

.mid-img-loader {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
}

.mid-img-upload {
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

.mid-img-upload:hover {
  border-color: #EA004B;
  background: #fef2f5;
}

.mid-img-upload__text {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.mid-img-upload__hint {
  font-size: 11px;
  color: #9ca3af;
}

/* ── Allergens ── */
.mid-allergens {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mid-allergen {
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  background: #f3f4f6;
  cursor: pointer;
  transition: all 0.12s;
  user-select: none;
}

.mid-allergen:hover {
  background: #e5e7eb;
}

.mid-allergen--active {
  background: #EA004B;
  color: #fff;
}

/* ── Nutrition ── */
.mid-nutrition {
  display: flex;
  gap: 10px;
}

.mid-nutrition__item {
  flex: 1;
  text-align: center;
}

.mid-nutrition__label {
  display: block;
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}

/* ── Footer ── */
.mid-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 24px;
}
</style>
