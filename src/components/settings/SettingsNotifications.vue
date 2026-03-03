<script lang="ts" setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const emit = defineEmits<{ save: [text: string] }>()

const prefs = ref({
  newOrder: true,
  orderStatusChange: true,
  newReview: true,
  lowStock: false,
  dailyReport: true,
  weeklyReport: true,
  sound: true,
  browserPush: false,
  email: true,
  emailAddress: authStore.user?.email || '',
  telegram: false,
  telegramChatId: '',
})

const eventItems = [
  { key: 'newOrder', icon: 'mdi-receipt-text', label: 'Новый заказ', desc: 'При поступлении нового заказа' },
  { key: 'orderStatusChange', icon: 'mdi-swap-horizontal', label: 'Смена статуса', desc: 'Когда заказ меняет статус' },
  { key: 'newReview', icon: 'mdi-star-outline', label: 'Новый отзыв', desc: 'Когда клиент оставляет отзыв' },
  { key: 'lowStock', icon: 'mdi-alert-outline', label: 'Стоп-лист', desc: 'Когда позиция скоро закончится' },
]

async function saveNotifications() {
  await new Promise((r) => setTimeout(r, 400))
  emit('save', 'Уведомления сохранены')
}
</script>

<template>
  <div class="settings-section">
    <div class="section-title">Уведомления</div>
    <div class="section-desc">Настройте какие уведомления вы хотите получать</div>

    <!-- Events -->
    <v-card flat rounded="xl" class="pa-6 mb-5">
      <p class="text-subtitle-1 font-weight-bold mb-4">События</p>
      <div
        class="notif-row" v-for="item in eventItems" :key="item.key"
      >
        <v-avatar
          :color="(prefs as any)[item.key] ? 'primary' : 'grey-lighten-2'"
          size="36" variant="tonal"
        >
          <v-icon :icon="item.icon" size="18" />
        </v-avatar>
        <div class="notif-row__text">
          <p class="font-weight-medium">{{ item.label }}</p>
          <p class="text-caption text-grey">{{ item.desc }}</p>
        </div>
        <v-switch
          v-model="(prefs as any)[item.key]" color="green"
          hide-details density="compact"
        />
      </div>
    </v-card>

    <!-- Reports -->
    <v-card flat rounded="xl" class="pa-6 mb-5">
      <p class="text-subtitle-1 font-weight-bold mb-4">Отчёты</p>

      <div class="notif-row">
        <v-avatar color="blue" size="36" variant="tonal">
          <v-icon icon="mdi-chart-bar" size="18" />
        </v-avatar>
        <div class="notif-row__text">
          <p class="font-weight-medium">Ежедневный отчёт</p>
          <p class="text-caption text-grey">Итоги дня: заказы, выручка, рейтинг</p>
        </div>
        <v-switch v-model="prefs.dailyReport" color="green" hide-details density="compact" />
      </div>

      <div class="notif-row">
        <v-avatar color="purple" size="36" variant="tonal">
          <v-icon icon="mdi-chart-timeline-variant" size="18" />
        </v-avatar>
        <div class="notif-row__text">
          <p class="font-weight-medium">Еженедельный отчёт</p>
          <p class="text-caption text-grey">Аналитика за неделю с графиками</p>
        </div>
        <v-switch v-model="prefs.weeklyReport" color="green" hide-details density="compact" />
      </div>
    </v-card>

    <!-- Channels -->
    <v-card flat rounded="xl" class="pa-6 mb-5">
      <p class="text-subtitle-1 font-weight-bold mb-4">Каналы доставки</p>

      <div class="notif-row">
        <v-avatar color="orange" size="36" variant="tonal">
          <v-icon icon="mdi-volume-high" size="18" />
        </v-avatar>
        <div class="notif-row__text">
          <p class="font-weight-medium">Звук</p>
          <p class="text-caption text-grey">Звуковое уведомление в браузере</p>
        </div>
        <v-switch v-model="prefs.sound" color="green" hide-details density="compact" />
      </div>

      <div class="notif-row">
        <v-avatar color="red" size="36" variant="tonal">
          <v-icon icon="mdi-bell-ring-outline" size="18" />
        </v-avatar>
        <div class="notif-row__text">
          <p class="font-weight-medium">Push-уведомления</p>
          <p class="text-caption text-grey">Уведомления браузера даже если вкладка не активна</p>
        </div>
        <v-switch v-model="prefs.browserPush" color="green" hide-details density="compact" />
      </div>

      <v-divider class="my-3" />

      <div class="notif-row">
        <v-avatar color="green" size="36" variant="tonal">
          <v-icon icon="mdi-email-outline" size="18" />
        </v-avatar>
        <div class="notif-row__text">
          <p class="font-weight-medium">Email</p>
          <v-text-field
            v-if="prefs.email" v-model="prefs.emailAddress"
            variant="outlined" density="compact" hide-details
            placeholder="email@example.com" class="mt-1" style="max-width: 280px"
          />
          <p v-else class="text-caption text-grey">Отправка на электронную почту</p>
        </div>
        <v-switch v-model="prefs.email" color="green" hide-details density="compact" />
      </div>

      <div class="notif-row">
        <v-avatar color="blue" size="36" variant="tonal">
          <v-icon icon="mdi-send" size="18" />
        </v-avatar>
        <div class="notif-row__text">
          <p class="font-weight-medium">Telegram</p>
          <v-text-field
            v-if="prefs.telegram" v-model="prefs.telegramChatId"
            variant="outlined" density="compact" hide-details
            placeholder="Chat ID или @username" class="mt-1" style="max-width: 280px"
          />
          <p v-else class="text-caption text-grey">Уведомления в Telegram-бот</p>
        </div>
        <v-switch v-model="prefs.telegram" color="green" hide-details density="compact" />
      </div>
    </v-card>

    <div class="d-flex justify-end">
      <v-btn color="primary" variant="flat" rounded="lg" @click="saveNotifications">
        Сохранить настройки
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.notif-row { display: flex; align-items: center; gap: 14px; padding: 10px 0; }
.notif-row + .notif-row { border-top: 1px solid #f3f4f6; }
.notif-row__text { flex: 1; min-width: 0; }

.dark .notif-row + .notif-row { border-top-color: #2e2e42; }
</style>
