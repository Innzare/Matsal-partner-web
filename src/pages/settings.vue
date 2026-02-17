<script lang="ts" setup>
import { useRestaurantStore } from '@/stores/restaurant'
import type { WeekDay } from '@/types'
import { WEEKDAY_LABELS } from '@/types'

const restaurantStore = useRestaurantStore()
const snackbar = ref(false)
const snackbarText = ref('')

// Local form copy
const form = ref({
  name: '',
  description: '',
  address: '',
  phone: '',
  coverImage: '',
  deliveryTime: '',
  minOrderAmount: 0,
  cuisineTypes: [] as string[],
  workingHours: {} as Record<WeekDay, { open: string; close: string; isOpen: boolean }>,
})

const weekDays = Object.keys(WEEKDAY_LABELS) as WeekDay[]

const cuisineOptions = [
  'Грузинская', 'Кавказская', 'Европейская', 'Итальянская',
  'Японская', 'Китайская', 'Фастфуд', 'Домашняя кухня',
  'Выпечка', 'Десерты', 'Здоровая еда', 'Халяль',
]

onMounted(async () => {
  await restaurantStore.loadRestaurant()
  syncForm()
})

function syncForm() {
  const r = restaurantStore.restaurant
  if (!r) return
  form.value = {
    name: r.name,
    description: r.description,
    address: r.address,
    phone: r.phone,
    coverImage: r.coverImage,
    deliveryTime: r.deliveryTime,
    minOrderAmount: r.minOrderAmount,
    cuisineTypes: [...r.cuisineTypes],
    workingHours: structuredClone(r.workingHours),
  }
}

async function saveSettings() {
  await restaurantStore.updateRestaurant({
    name: form.value.name,
    description: form.value.description,
    address: form.value.address,
    phone: form.value.phone,
    coverImage: form.value.coverImage,
    deliveryTime: form.value.deliveryTime,
    minOrderAmount: form.value.minOrderAmount,
    cuisineTypes: form.value.cuisineTypes,
    workingHours: form.value.workingHours,
  })
  snackbarText.value = 'Настройки сохранены'
  snackbar.value = true
}

async function toggleOpen() {
  await restaurantStore.toggleOpen()
  snackbarText.value = restaurantStore.restaurant?.isOpen ? 'Заведение открыто' : 'Заведение закрыто'
  snackbar.value = true
}
</script>

<template>
  <div class="px-8 py-4">
    <div v-if="restaurantStore.isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="restaurantStore.restaurant">
      <!-- Status toggle -->
      <v-card flat rounded="xl" class="mb-6 pa-5">
        <div class="d-flex align-center justify-space-between">
          <div>
            <p class="text-h6 font-weight-bold">Статус заведения</p>
            <p class="text-body-2 text-grey-darken-1">
              Сейчас: <strong :class="restaurantStore.restaurant.isOpen ? 'text-green' : 'text-red'">
                {{ restaurantStore.restaurant.isOpen ? 'Открыто' : 'Закрыто' }}
              </strong>
            </p>
          </div>
          <v-switch
            :model-value="restaurantStore.restaurant.isOpen"
            color="green"
            hide-details
            @update:model-value="toggleOpen"
          />
        </div>
      </v-card>

      <div class="d-flex ga-6" style="align-items: start">
        <!-- Left column -->
        <div style="flex: 1; min-width: 0">
          <!-- Basic info -->
          <v-card flat rounded="xl" class="mb-6 pa-5">
            <p class="text-h6 font-weight-bold mb-4">Основная информация</p>

            <v-text-field
              v-model="form.name"
              label="Название заведения"
              variant="outlined"
              density="compact"
              class="mb-3"
            />

            <v-textarea
              v-model="form.description"
              label="Описание"
              variant="outlined"
              density="compact"
              rows="3"
              class="mb-3"
            />

            <v-text-field
              v-model="form.address"
              label="Адрес"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-map-marker"
              class="mb-3"
            />

            <v-text-field
              v-model="form.phone"
              label="Телефон"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-phone"
              class="mb-3"
            />

            <v-combobox
              v-model="form.cuisineTypes"
              :items="cuisineOptions"
              label="Тип кухни"
              variant="outlined"
              density="compact"
              multiple
              chips
              closable-chips
            />
          </v-card>

          <!-- Cover image -->
          <v-card flat rounded="xl" class="mb-6 pa-5">
            <p class="text-h6 font-weight-bold mb-4">Обложка</p>

            <v-text-field
              v-model="form.coverImage"
              label="URL изображения"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-image"
              class="mb-3"
            />

            <v-img
              v-if="form.coverImage"
              :src="form.coverImage"
              height="200"
              cover
              rounded="lg"
            >
              <template v-slot:error>
                <div class="d-flex align-center justify-center bg-grey-lighten-3 h-100">
                  <v-icon icon="mdi-image-off" size="40" color="grey" />
                </div>
              </template>
            </v-img>
          </v-card>
        </div>

        <!-- Right column -->
        <div style="flex: 1; min-width: 0">
          <!-- Delivery settings -->
          <v-card flat rounded="xl" class="mb-6 pa-5">
            <p class="text-h6 font-weight-bold mb-4">Доставка</p>

            <v-text-field
              v-model="form.deliveryTime"
              label="Время доставки (мин)"
              variant="outlined"
              density="compact"
              hint="Например: 35-40"
              persistent-hint
              class="mb-3"
            />

            <v-text-field
              v-model.number="form.minOrderAmount"
              label="Минимальная сумма заказа (₽)"
              variant="outlined"
              density="compact"
              type="number"
            />
          </v-card>

          <!-- Working hours -->
          <v-card flat rounded="xl" class="mb-6 pa-5">
            <p class="text-h6 font-weight-bold mb-4">Время работы</p>

            <div
              v-for="day in weekDays"
              :key="day"
              class="d-flex align-center ga-3 mb-2"
            >
              <v-switch
                v-model="form.workingHours[day].isOpen"
                color="green"
                density="compact"
                hide-details
                style="flex: 0 0 auto"
              />

              <span class="text-body-2" style="width: 110px">{{ WEEKDAY_LABELS[day] }}</span>

              <template v-if="form.workingHours[day].isOpen">
                <v-text-field
                  v-model="form.workingHours[day].open"
                  type="time"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="max-width: 130px"
                />
                <span class="text-grey">—</span>
                <v-text-field
                  v-model="form.workingHours[day].close"
                  type="time"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="max-width: 130px"
                />
              </template>
              <span v-else class="text-caption text-grey">Выходной</span>
            </div>
          </v-card>

          <!-- Info cards -->
          <v-card flat rounded="xl" class="pa-5">
            <p class="text-h6 font-weight-bold mb-4">Информация</p>
            <div class="d-flex ga-4">
              <div class="text-center">
                <p class="text-h4 font-weight-bold">{{ restaurantStore.restaurant.rating }}</p>
                <p class="text-caption text-grey">Рейтинг</p>
              </div>
              <div class="text-center">
                <p class="text-h4 font-weight-bold">{{ restaurantStore.restaurant.reviewsCount }}</p>
                <p class="text-caption text-grey">Отзывов</p>
              </div>
            </div>
          </v-card>
        </div>
      </div>

      <!-- Save button -->
      <div class="d-flex justify-end mt-6">
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          :loading="restaurantStore.isSaving"
          prepend-icon="mdi-content-save"
          @click="saveSettings"
        >
          Сохранить изменения
        </v-btn>
      </div>
    </template>

    <v-snackbar v-model="snackbar" :timeout="3000" color="green">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>
