<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useRestaurantStore } from '@/stores/restaurant'
import type { WeekDay } from '@/types'
import { WEEKDAY_LABELS } from '@/types'

const restaurantStore = useRestaurantStore()
const emit = defineEmits<{ save: [text: string] }>()

const weekDays = Object.keys(WEEKDAY_LABELS) as WeekDay[]

const workingHours = ref(
  Object.fromEntries(
    weekDays.map((d) => [d, { open: '10:00', close: '22:00', isOpen: true }])
  ) as Record<WeekDay, { open: string; close: string; isOpen: boolean }>
)

watch(() => restaurantStore.restaurant, (r) => {
  if (!r) return
  workingHours.value = r.workingHours
    ? JSON.parse(JSON.stringify(r.workingHours))
    : JSON.parse(JSON.stringify(workingHours.value))
}, { immediate: true })

function copyAllSchedule(sourceDay: WeekDay) {
  const source = workingHours.value[sourceDay]
  for (const day of weekDays) {
    if (day !== sourceDay) {
      workingHours.value[day] = { ...source }
    }
  }
  emit('save', 'Расписание скопировано на все дни')
}

async function saveSchedule() {
  await restaurantStore.updateRestaurant({ workingHours: workingHours.value })
  emit('save', 'Расписание сохранено')
}
</script>

<template>
  <div class="settings-section">
    <div class="section-title">Расписание работы</div>
    <div class="section-desc">Настройте время работы для каждого дня недели</div>

    <v-card flat rounded="xl" class="pa-6 mb-5">
      <!-- Quick actions -->
      <div class="d-flex align-center ga-2 mb-5">
        <v-btn variant="tonal" size="small" rounded="lg"
          @click="weekDays.forEach((d) => (workingHours[d].isOpen = true))"
        >
          Открыть все дни
        </v-btn>
        <v-btn variant="tonal" size="small" rounded="lg" color="grey"
          @click="weekDays.slice(5).forEach((d) => (workingHours[d].isOpen = false))"
        >
          Выходные — выкл
        </v-btn>
      </div>

      <!-- Days grid -->
      <div class="schedule-grid">
        <div
          v-for="day in weekDays" :key="day"
          class="schedule-row"
          :class="{ 'schedule-row--off': !workingHours[day].isOpen }"
        >
          <v-switch
            v-model="workingHours[day].isOpen" color="green"
            density="compact" hide-details class="schedule-row__switch"
          />
          <span class="schedule-row__day">{{ WEEKDAY_LABELS[day] }}</span>

          <template v-if="workingHours[day].isOpen">
            <v-text-field
              v-model="workingHours[day].open" type="time"
              variant="outlined" density="compact" hide-details class="schedule-row__time"
            />
            <span class="text-grey-darken-1">—</span>
            <v-text-field
              v-model="workingHours[day].close" type="time"
              variant="outlined" density="compact" hide-details class="schedule-row__time"
            />
            <v-btn icon variant="text" size="x-small" color="grey" @click="copyAllSchedule(day)">
              <v-icon icon="mdi-content-copy" size="16" />
              <v-tooltip activator="parent" location="top">Скопировать на все дни</v-tooltip>
            </v-btn>
          </template>
          <span v-else class="text-body-2 text-grey ml-2">Выходной</span>
        </div>
      </div>

      <div class="d-flex justify-end mt-5">
        <v-btn
          color="primary" variant="flat" rounded="lg"
          :loading="restaurantStore.isSaving" @click="saveSchedule"
        >
          Сохранить расписание
        </v-btn>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.schedule-grid { display: flex; flex-direction: column; gap: 8px; }
.schedule-row {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 12px; border-radius: 10px; background: #fafafa;
  transition: background 0.15s;
}
.schedule-row--off { opacity: 0.6; }
.schedule-row__switch { flex: 0 0 auto; }
.schedule-row__day { width: 120px; font-size: 14px; font-weight: 500; }
.schedule-row__time { max-width: 120px; }

.dark .schedule-row { background: #252538; }
.dark .schedule-row__day { color: #e4e4e7; }

@media (max-width: 767px) {
  .schedule-row { flex-wrap: wrap; gap: 8px; }
  .schedule-row__day { width: auto; min-width: 100px; }
}
</style>
