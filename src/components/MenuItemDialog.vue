<script lang="ts" setup>
import type { MenuItem, MenuCategory, ModifierGroup, Allergen } from '@/types'
import { ALLERGEN_LABELS } from '@/types'

const props = defineProps<{
  modelValue: boolean
  item?: MenuItem | null
  categories: MenuCategory[]
  modifierGroups: ModifierGroup[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: Omit<MenuItem, 'id' | 'sortOrder'>]
}>()

const isEdit = computed(() => !!props.item)
const formRef = ref()

const form = ref({
  name: '',
  description: '',
  price: 0,
  weight: 0,
  category: null as number | null,
  image: '',
  available: true,
  allergens: [] as Allergen[],
  modifierGroups: [] as number[],
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

// Watch for item changes to populate form
watch(() => props.item, (item) => {
  if (item) {
    form.value = {
      name: item.name,
      description: item.description,
      price: item.price,
      weight: item.weight,
      category: item.category,
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
    category: null,
    image: '',
    available: true,
    allergens: [],
    modifierGroups: [],
    calories: null,
    protein: null,
    fat: null,
    carbs: null,
  }
}

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
    category: form.value.category!,
    image: form.value.image || undefined,
    available: form.value.available,
    allergens: form.value.allergens,
    modifierGroups: form.value.modifierGroups,
    nutrition,
  })

  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="700"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between pt-5 px-6">
        <span class="text-h6">{{ isEdit ? 'Редактировать позицию' : 'Новая позиция' }}</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="emit('update:modelValue', false)" />
      </v-card-title>

      <v-card-text class="px-6">
        <v-form ref="formRef">
          <!-- Основное -->
          <v-text-field
            v-model="form.name"
            label="Название *"
            variant="outlined"
            density="compact"
            :rules="[rules.required]"
            class="mb-3"
          />

          <v-textarea
            v-model="form.description"
            label="Описание"
            variant="outlined"
            density="compact"
            rows="2"
            class="mb-3"
          />

          <div class="d-flex ga-3 mb-3">
            <v-text-field
              v-model.number="form.price"
              label="Цена (₽) *"
              variant="outlined"
              density="compact"
              type="number"
              :rules="[rules.required, rules.positive]"
            />
            <v-text-field
              v-model.number="form.weight"
              label="Вес (г)"
              variant="outlined"
              density="compact"
              type="number"
            />
          </div>

          <v-select
            v-model="form.category"
            :items="categoryOptions"
            item-value="value"
            item-title="title"
            label="Категория *"
            variant="outlined"
            density="compact"
            :rules="[rules.required]"
            class="mb-3"
          />

          <v-text-field
            v-model="form.image"
            label="URL изображения"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-image"
            class="mb-3"
          />

          <v-img
            v-if="form.image"
            :src="form.image"
            height="120"
            max-width="200"
            cover
            rounded="lg"
            class="mb-3"
          />

          <v-switch
            v-model="form.available"
            label="В наличии"
            color="green"
            density="compact"
            hide-details
            class="mb-4"
          />

          <v-divider class="mb-4" />

          <!-- Аллергены -->
          <p class="text-body-2 font-weight-medium mb-2">Аллергены</p>
          <v-chip-group v-model="form.allergens" multiple class="mb-4">
            <v-chip
              v-for="a in allergenOptions"
              :key="a.value"
              :value="a.value"
              filter
              variant="outlined"
              size="small"
            >
              {{ a.title }}
            </v-chip>
          </v-chip-group>

          <!-- КБЖУ -->
          <p class="text-body-2 font-weight-medium mb-2">КБЖУ (на порцию)</p>
          <div class="d-flex ga-3 mb-4">
            <v-text-field v-model.number="form.calories" label="Ккал" variant="outlined" density="compact" type="number" />
            <v-text-field v-model.number="form.protein" label="Белки" variant="outlined" density="compact" type="number" />
            <v-text-field v-model.number="form.fat" label="Жиры" variant="outlined" density="compact" type="number" />
            <v-text-field v-model.number="form.carbs" label="Углеводы" variant="outlined" density="compact" type="number" />
          </div>

          <!-- Модификаторы -->
          <v-select
            v-model="form.modifierGroups"
            :items="modifierGroupOptions"
            item-value="value"
            item-title="title"
            label="Группы модификаторов"
            variant="outlined"
            density="compact"
            multiple
            chips
            closable-chips
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Отмена</v-btn>
        <v-btn color="primary" variant="flat" @click="handleSave">
          {{ isEdit ? 'Сохранить' : 'Создать' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
