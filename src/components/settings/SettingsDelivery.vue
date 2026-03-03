<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useRestaurantStore } from '@/stores/restaurant'

const restaurantStore = useRestaurantStore()
const emit = defineEmits<{ save: [text: string] }>()

const form = ref({
  deliveryTime: '',
  minOrderAmount: 0,
  deliveryFee: 100,
  freeDeliveryFrom: 1500,
  maxDeliveryRadius: 10,
  deliveryEnabled: true,
  pickupEnabled: true,
  dineInEnabled: true,
})

watch(() => restaurantStore.restaurant, (r) => {
  if (!r) return
  form.value.deliveryTime = r.deliveryTime ?? ''
  form.value.minOrderAmount = r.minOrderAmount
}, { immediate: true })

async function saveDelivery() {
  await restaurantStore.updateRestaurant({
    deliveryTime: form.value.deliveryTime,
    minOrderAmount: form.value.minOrderAmount,
  })
  emit('save', 'Настройки доставки сохранены')
}
</script>

<template>
  <div class="settings-section">
    <div class="section-title">Доставка и заказы</div>
    <div class="section-desc">Параметры доставки, самовывоза и обслуживания</div>

    <!-- Order types -->
    <v-card flat rounded="xl" class="pa-6 mb-5">
      <p class="text-subtitle-1 font-weight-bold mb-4">Типы заказов</p>
      <div class="d-flex flex-column ga-3">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-3">
            <v-avatar color="primary" size="36" variant="tonal">
              <v-icon icon="mdi-moped" size="20" />
            </v-avatar>
            <div>
              <p class="font-weight-medium">Доставка</p>
              <p class="text-caption text-grey">Доставка курьером до двери</p>
            </div>
          </div>
          <v-switch v-model="form.deliveryEnabled" color="green" hide-details density="compact" />
        </div>

        <v-divider />

        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-3">
            <v-avatar color="orange" size="36" variant="tonal">
              <v-icon icon="mdi-shopping-outline" size="20" />
            </v-avatar>
            <div>
              <p class="font-weight-medium">Самовывоз</p>
              <p class="text-caption text-grey">Клиент забирает заказ сам</p>
            </div>
          </div>
          <v-switch v-model="form.pickupEnabled" color="green" hide-details density="compact" />
        </div>

        <v-divider />

        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-3">
            <v-avatar color="blue" size="36" variant="tonal">
              <v-icon icon="mdi-silverware-fork-knife" size="20" />
            </v-avatar>
            <div>
              <p class="font-weight-medium">В зале</p>
              <p class="text-caption text-grey">Обслуживание в ресторане</p>
            </div>
          </div>
          <v-switch v-model="form.dineInEnabled" color="green" hide-details density="compact" />
        </div>
      </div>
    </v-card>

    <!-- Delivery params -->
    <v-card flat rounded="xl" class="pa-6 mb-5">
      <p class="text-subtitle-1 font-weight-bold mb-4">Параметры доставки</p>
      <div class="d-flex flex-wrap ga-4">
        <v-text-field
          v-model="form.deliveryTime" label="Время доставки (мин)"
          variant="outlined" density="comfortable"
          hint="Например: 35-40" persistent-hint
          style="min-width: 200px; flex: 1"
        />
        <v-text-field
          v-model.number="form.minOrderAmount" label="Минимальный заказ"
          variant="outlined" density="comfortable" type="number" suffix="₽"
          style="min-width: 200px; flex: 1" hide-details
        />
        <v-text-field
          v-model.number="form.deliveryFee" label="Стоимость доставки"
          variant="outlined" density="comfortable" type="number" suffix="₽"
          style="min-width: 200px; flex: 1" hide-details
        />
      </div>
      <div class="d-flex flex-wrap ga-4 mt-4">
        <v-text-field
          v-model.number="form.freeDeliveryFrom" label="Бесплатная доставка от"
          variant="outlined" density="comfortable" type="number" suffix="₽"
          style="min-width: 200px; flex: 1" hide-details
        />
        <v-text-field
          v-model.number="form.maxDeliveryRadius" label="Радиус доставки"
          variant="outlined" density="comfortable" type="number" suffix="км"
          style="min-width: 200px; flex: 1" hide-details
        />
        <div style="min-width: 200px; flex: 1" />
      </div>

      <div class="d-flex justify-end mt-5">
        <v-btn
          color="primary" variant="flat" rounded="lg"
          :loading="restaurantStore.isSaving" @click="saveDelivery"
        >
          Сохранить
        </v-btn>
      </div>
    </v-card>
  </div>
</template>
