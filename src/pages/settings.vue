<script lang="ts" setup>
import { useRestaurantStore } from '@/stores/restaurant'
import { useAuthStore } from '@/stores/auth'
import type { WeekDay } from '@/types'
import { WEEKDAY_LABELS } from '@/types'

const restaurantStore = useRestaurantStore()
const authStore = useAuthStore()

const activeTab = ref(0)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('green')

// ── Profile form ──
const form = ref({
  name: '',
  description: '',
  address: '',
  phone: '',
  coverImage: '',
  deliveryTime: '',
  minOrderAmount: 0,
  cuisineTypes: [] as string[],
  workingHours: Object.fromEntries(
    (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as WeekDay[]).map(d => [d, { open: '10:00', close: '22:00', isOpen: true }])
  ) as Record<WeekDay, { open: string; close: string; isOpen: boolean }>,
})

const weekDays = Object.keys(WEEKDAY_LABELS) as WeekDay[]

const cuisineOptions = [
  'Грузинская', 'Кавказская', 'Европейская', 'Итальянская',
  'Японская', 'Китайская', 'Фастфуд', 'Домашняя кухня',
  'Выпечка', 'Десерты', 'Здоровая еда', 'Халяль',
]

// ── Delivery form ──
const deliveryForm = ref({
  deliveryTime: '',
  minOrderAmount: 0,
  deliveryFee: 100,
  freeDeliveryFrom: 1500,
  maxDeliveryRadius: 10,
  deliveryEnabled: true,
  pickupEnabled: true,
  dineInEnabled: true,
})

// ── Notification prefs ──
const notifPrefs = ref({
  newOrder: true,
  orderStatusChange: true,
  newReview: true,
  lowStock: false,
  dailyReport: true,
  weeklyReport: true,
  sound: true,
  browserPush: false,
  email: true,
  emailAddress: '',
  telegram: false,
  telegramChatId: '',
})

// ── Security ──
const securityForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordFormRef = ref()

const passwordRules = {
  current: [(v: string) => !!v || 'Введите текущий пароль'],
  new: [
    (v: string) => !!v || 'Введите новый пароль',
    (v: string) => v.length >= 8 || 'Минимум 8 символов',
    (v: string) => /[A-Z]/.test(v) || 'Нужна хотя бы одна заглавная буква',
    (v: string) => /[0-9]/.test(v) || 'Нужна хотя бы одна цифра',
  ],
  confirm: [
    (v: string) => !!v || 'Подтвердите пароль',
    (v: string) => v === securityForm.value.newPassword || 'Пароли не совпадают',
  ],
}

// ── Tabs config ──
const tabs = [
  { icon: 'mdi-store', label: 'Профиль' },
  { icon: 'mdi-truck-delivery', label: 'Доставка' },
  { icon: 'mdi-clock-outline', label: 'Расписание' },
  { icon: 'mdi-bell-outline', label: 'Уведомления' },
  { icon: 'mdi-shield-lock-outline', label: 'Безопасность' },
]

// ── Init ──
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
  deliveryForm.value.deliveryTime = r.deliveryTime
  deliveryForm.value.minOrderAmount = r.minOrderAmount
  notifPrefs.value.emailAddress = authStore.user?.email || ''
}

function showSnack(text: string, color = 'green') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

async function saveProfile() {
  await restaurantStore.updateRestaurant({
    name: form.value.name,
    description: form.value.description,
    address: form.value.address,
    phone: form.value.phone,
    coverImage: form.value.coverImage,
    cuisineTypes: form.value.cuisineTypes,
  })
  showSnack('Профиль сохранён')
}

async function saveDelivery() {
  await restaurantStore.updateRestaurant({
    deliveryTime: deliveryForm.value.deliveryTime,
    minOrderAmount: deliveryForm.value.minOrderAmount,
  })
  showSnack('Настройки доставки сохранены')
}

async function saveSchedule() {
  await restaurantStore.updateRestaurant({
    workingHours: form.value.workingHours,
  })
  showSnack('Расписание сохранено')
}

async function toggleOpen() {
  await restaurantStore.toggleOpen()
  showSnack(restaurantStore.restaurant?.isOpen ? 'Заведение открыто' : 'Заведение закрыто')
}

async function saveNotifications() {
  await new Promise(r => setTimeout(r, 400))
  showSnack('Уведомления сохранены')
}

async function changePassword() {
  const { valid } = await passwordFormRef.value.validate()
  if (!valid) return
  await new Promise(r => setTimeout(r, 600))
  securityForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  passwordFormRef.value.reset()
  showSnack('Пароль изменён')
}

function copyAllSchedule(sourceDay: WeekDay) {
  const source = form.value.workingHours[sourceDay]
  for (const day of weekDays) {
    if (day !== sourceDay) {
      form.value.workingHours[day] = { ...source }
    }
  }
  showSnack('Расписание скопировано на все дни')
}
</script>

<template>
  <div class="settings-page">
    <div v-if="restaurantStore.isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="restaurantStore.restaurant">
      <!-- Header -->
      <div class="settings-header">
        <div>
          <h1 class="settings-header__title">Настройки</h1>
          <p class="settings-header__sub">Управление заведением и профилем</p>
        </div>
        <div class="d-flex align-center ga-3">
          <v-chip
            :color="restaurantStore.restaurant.isOpen ? 'green' : 'red'"
            variant="flat"
            size="small"
          >
            {{ restaurantStore.restaurant.isOpen ? 'Открыто' : 'Закрыто' }}
          </v-chip>
          <v-switch
            :model-value="restaurantStore.restaurant.isOpen"
            color="green"
            hide-details
            density="compact"
            @update:model-value="toggleOpen"
          />
        </div>
      </div>

      <!-- Tabs layout -->
      <div class="settings-layout">
        <!-- Sidebar tabs -->
        <div class="settings-sidebar">
          <div
            v-for="(tab, i) in tabs"
            :key="i"
            class="settings-tab"
            :class="{ 'settings-tab--active': activeTab === i }"
            @click="activeTab = i"
          >
            <v-icon :icon="tab.icon" size="20" />
            <span>{{ tab.label }}</span>
          </div>
        </div>

        <!-- Content area -->
        <div class="settings-content">
          <!-- TAB 0: Profile -->
          <div v-show="activeTab === 0" class="settings-section">
            <div class="section-title">Информация о заведении</div>
            <div class="section-desc">Основные данные вашего ресторана, видимые клиентам</div>

            <v-card flat rounded="xl" class="pa-6 mb-5">
              <div class="d-flex ga-6 mb-5" style="align-items: start">
                <!-- Cover image -->
                <div class="settings-cover">
                  <v-img
                    v-if="form.coverImage"
                    :src="form.coverImage"
                    height="140"
                    width="220"
                    cover
                    rounded="lg"
                    class="settings-cover__img"
                  >
                    <template v-slot:error>
                      <div class="d-flex align-center justify-center bg-grey-lighten-3 h-100">
                        <v-icon icon="mdi-image-off" size="32" color="grey" />
                      </div>
                    </template>
                  </v-img>
                  <div v-else class="settings-cover__placeholder">
                    <v-icon icon="mdi-image-plus" size="32" color="grey" />
                  </div>
                  <v-text-field
                    v-model="form.coverImage"
                    label="URL обложки"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="mt-2"
                    style="width: 220px"
                  />
                </div>

                <!-- Fields -->
                <div style="flex: 1; min-width: 0">
                  <v-text-field
                    v-model="form.name"
                    label="Название заведения"
                    variant="outlined"
                    density="comfortable"
                    class="mb-4"
                    hide-details
                  />

                  <v-textarea
                    v-model="form.description"
                    label="Описание"
                    variant="outlined"
                    density="comfortable"
                    rows="3"
                    class="mb-4"
                    counter="500"
                    :rules="[(v: string) => v.length <= 500 || 'Максимум 500 символов']"
                  />

                  <div class="d-flex ga-4 mb-4">
                    <v-text-field
                      v-model="form.address"
                      label="Адрес"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-map-marker-outline"
                      hide-details
                      style="flex: 1"
                    />
                    <v-text-field
                      v-model="form.phone"
                      label="Телефон"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-phone-outline"
                      hide-details
                      placeholder="+7 (___) ___-__-__"
                      style="flex: 1"
                    />
                  </div>

                  <v-combobox
                    v-model="form.cuisineTypes"
                    :items="cuisineOptions"
                    label="Тип кухни"
                    variant="outlined"
                    density="comfortable"
                    multiple
                    chips
                    closable-chips
                    hide-details
                  />
                </div>
              </div>

              <!-- Stats row -->
              <v-divider class="mb-4" />
              <div class="d-flex ga-6 align-center">
                <div class="settings-stat">
                  <v-icon icon="mdi-star" color="amber" size="18" class="mr-1" />
                  <span class="settings-stat__value">{{ restaurantStore.restaurant.rating }}</span>
                  <span class="settings-stat__label">рейтинг</span>
                </div>
                <div class="settings-stat">
                  <v-icon icon="mdi-comment-text-outline" color="primary" size="18" class="mr-1" />
                  <span class="settings-stat__value">{{ restaurantStore.restaurant.reviewsCount }}</span>
                  <span class="settings-stat__label">отзывов</span>
                </div>
                <v-spacer />
                <v-btn
                  color="primary"
                  variant="flat"
                  rounded="lg"
                  :loading="restaurantStore.isSaving"
                  @click="saveProfile"
                >
                  Сохранить профиль
                </v-btn>
              </div>
            </v-card>
          </div>

          <!-- TAB 1: Delivery -->
          <div v-show="activeTab === 1" class="settings-section">
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
                  <v-switch v-model="deliveryForm.deliveryEnabled" color="green" hide-details density="compact" />
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
                  <v-switch v-model="deliveryForm.pickupEnabled" color="green" hide-details density="compact" />
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
                  <v-switch v-model="deliveryForm.dineInEnabled" color="green" hide-details density="compact" />
                </div>
              </div>
            </v-card>

            <!-- Delivery params -->
            <v-card flat rounded="xl" class="pa-6 mb-5">
              <p class="text-subtitle-1 font-weight-bold mb-4">Параметры доставки</p>
              <div class="d-flex flex-wrap ga-4">
                <v-text-field
                  v-model="deliveryForm.deliveryTime"
                  label="Время доставки (мин)"
                  variant="outlined"
                  density="comfortable"
                  hint="Например: 35-40"
                  persistent-hint
                  style="min-width: 200px; flex: 1"
                />
                <v-text-field
                  v-model.number="deliveryForm.minOrderAmount"
                  label="Минимальный заказ"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  suffix="₽"
                  style="min-width: 200px; flex: 1"
                  hide-details
                />
                <v-text-field
                  v-model.number="deliveryForm.deliveryFee"
                  label="Стоимость доставки"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  suffix="₽"
                  style="min-width: 200px; flex: 1"
                  hide-details
                />
              </div>
              <div class="d-flex flex-wrap ga-4 mt-4">
                <v-text-field
                  v-model.number="deliveryForm.freeDeliveryFrom"
                  label="Бесплатная доставка от"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  suffix="₽"
                  style="min-width: 200px; flex: 1"
                  hide-details
                />
                <v-text-field
                  v-model.number="deliveryForm.maxDeliveryRadius"
                  label="Радиус доставки"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  suffix="км"
                  style="min-width: 200px; flex: 1"
                  hide-details
                />
                <div style="min-width: 200px; flex: 1" />
              </div>

              <div class="d-flex justify-end mt-5">
                <v-btn
                  color="primary"
                  variant="flat"
                  rounded="lg"
                  :loading="restaurantStore.isSaving"
                  @click="saveDelivery"
                >
                  Сохранить
                </v-btn>
              </div>
            </v-card>
          </div>

          <!-- TAB 2: Schedule -->
          <div v-show="activeTab === 2" class="settings-section">
            <div class="section-title">Расписание работы</div>
            <div class="section-desc">Настройте время работы для каждого дня недели</div>

            <v-card flat rounded="xl" class="pa-6 mb-5">
              <!-- Quick actions -->
              <div class="d-flex align-center ga-2 mb-5">
                <v-btn
                  variant="tonal"
                  size="small"
                  rounded="lg"
                  @click="weekDays.forEach(d => form.workingHours[d].isOpen = true)"
                >
                  Открыть все дни
                </v-btn>
                <v-btn
                  variant="tonal"
                  size="small"
                  rounded="lg"
                  color="grey"
                  @click="weekDays.slice(5).forEach(d => form.workingHours[d].isOpen = false)"
                >
                  Выходные — выкл
                </v-btn>
              </div>

              <!-- Days grid -->
              <div class="schedule-grid">
                <div
                  v-for="day in weekDays"
                  :key="day"
                  class="schedule-row"
                  :class="{ 'schedule-row--off': !form.workingHours[day].isOpen }"
                >
                  <v-switch
                    v-model="form.workingHours[day].isOpen"
                    color="green"
                    density="compact"
                    hide-details
                    class="schedule-row__switch"
                  />

                  <span class="schedule-row__day">{{ WEEKDAY_LABELS[day] }}</span>

                  <template v-if="form.workingHours[day].isOpen">
                    <v-text-field
                      v-model="form.workingHours[day].open"
                      type="time"
                      variant="outlined"
                      density="compact"
                      hide-details
                      class="schedule-row__time"
                    />
                    <span class="text-grey-darken-1">—</span>
                    <v-text-field
                      v-model="form.workingHours[day].close"
                      type="time"
                      variant="outlined"
                      density="compact"
                      hide-details
                      class="schedule-row__time"
                    />

                    <v-btn
                      icon
                      variant="text"
                      size="x-small"
                      color="grey"
                      @click="copyAllSchedule(day)"
                    >
                      <v-icon icon="mdi-content-copy" size="16" />
                      <v-tooltip activator="parent" location="top">Скопировать на все дни</v-tooltip>
                    </v-btn>
                  </template>
                  <span v-else class="text-body-2 text-grey ml-2">Выходной</span>
                </div>
              </div>

              <div class="d-flex justify-end mt-5">
                <v-btn
                  color="primary"
                  variant="flat"
                  rounded="lg"
                  :loading="restaurantStore.isSaving"
                  @click="saveSchedule"
                >
                  Сохранить расписание
                </v-btn>
              </div>
            </v-card>
          </div>

          <!-- TAB 3: Notifications -->
          <div v-show="activeTab === 3" class="settings-section">
            <div class="section-title">Уведомления</div>
            <div class="section-desc">Настройте какие уведомления вы хотите получать</div>

            <!-- Events -->
            <v-card flat rounded="xl" class="pa-6 mb-5">
              <p class="text-subtitle-1 font-weight-bold mb-4">События</p>

              <div class="notif-row" v-for="item in [
                { key: 'newOrder', icon: 'mdi-receipt-text', label: 'Новый заказ', desc: 'При поступлении нового заказа' },
                { key: 'orderStatusChange', icon: 'mdi-swap-horizontal', label: 'Смена статуса', desc: 'Когда заказ меняет статус' },
                { key: 'newReview', icon: 'mdi-star-outline', label: 'Новый отзыв', desc: 'Когда клиент оставляет отзыв' },
                { key: 'lowStock', icon: 'mdi-alert-outline', label: 'Стоп-лист', desc: 'Когда позиция скоро закончится' },
              ]" :key="item.key">
                <v-avatar :color="(notifPrefs as any)[item.key] ? 'primary' : 'grey-lighten-2'" size="36" variant="tonal">
                  <v-icon :icon="item.icon" size="18" />
                </v-avatar>
                <div class="notif-row__text">
                  <p class="font-weight-medium">{{ item.label }}</p>
                  <p class="text-caption text-grey">{{ item.desc }}</p>
                </div>
                <v-switch v-model="(notifPrefs as any)[item.key]" color="green" hide-details density="compact" />
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
                <v-switch v-model="notifPrefs.dailyReport" color="green" hide-details density="compact" />
              </div>

              <div class="notif-row">
                <v-avatar color="purple" size="36" variant="tonal">
                  <v-icon icon="mdi-chart-timeline-variant" size="18" />
                </v-avatar>
                <div class="notif-row__text">
                  <p class="font-weight-medium">Еженедельный отчёт</p>
                  <p class="text-caption text-grey">Аналитика за неделю с графиками</p>
                </div>
                <v-switch v-model="notifPrefs.weeklyReport" color="green" hide-details density="compact" />
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
                <v-switch v-model="notifPrefs.sound" color="green" hide-details density="compact" />
              </div>

              <div class="notif-row">
                <v-avatar color="red" size="36" variant="tonal">
                  <v-icon icon="mdi-bell-ring-outline" size="18" />
                </v-avatar>
                <div class="notif-row__text">
                  <p class="font-weight-medium">Push-уведомления</p>
                  <p class="text-caption text-grey">Уведомления браузера даже если вкладка не активна</p>
                </div>
                <v-switch v-model="notifPrefs.browserPush" color="green" hide-details density="compact" />
              </div>

              <v-divider class="my-3" />

              <div class="notif-row">
                <v-avatar color="green" size="36" variant="tonal">
                  <v-icon icon="mdi-email-outline" size="18" />
                </v-avatar>
                <div class="notif-row__text">
                  <p class="font-weight-medium">Email</p>
                  <v-text-field
                    v-if="notifPrefs.email"
                    v-model="notifPrefs.emailAddress"
                    variant="outlined"
                    density="compact"
                    hide-details
                    placeholder="email@example.com"
                    class="mt-1"
                    style="max-width: 280px"
                  />
                  <p v-else class="text-caption text-grey">Отправка на электронную почту</p>
                </div>
                <v-switch v-model="notifPrefs.email" color="green" hide-details density="compact" />
              </div>

              <div class="notif-row">
                <v-avatar color="blue" size="36" variant="tonal">
                  <v-icon icon="mdi-send" size="18" />
                </v-avatar>
                <div class="notif-row__text">
                  <p class="font-weight-medium">Telegram</p>
                  <v-text-field
                    v-if="notifPrefs.telegram"
                    v-model="notifPrefs.telegramChatId"
                    variant="outlined"
                    density="compact"
                    hide-details
                    placeholder="Chat ID или @username"
                    class="mt-1"
                    style="max-width: 280px"
                  />
                  <p v-else class="text-caption text-grey">Уведомления в Telegram-бот</p>
                </div>
                <v-switch v-model="notifPrefs.telegram" color="green" hide-details density="compact" />
              </div>
            </v-card>

            <div class="d-flex justify-end">
              <v-btn
                color="primary"
                variant="flat"
                rounded="lg"
                @click="saveNotifications"
              >
                Сохранить настройки
              </v-btn>
            </div>
          </div>

          <!-- TAB 4: Security -->
          <div v-show="activeTab === 4" class="settings-section">
            <div class="section-title">Безопасность</div>
            <div class="section-desc">Смена пароля и безопасность аккаунта</div>

            <!-- Account info -->
            <v-card flat rounded="xl" class="pa-6 mb-5">
              <p class="text-subtitle-1 font-weight-bold mb-4">Аккаунт</p>
              <div class="d-flex align-center ga-4">
                <v-avatar color="primary" size="56">
                  <span class="text-h6 text-white font-weight-bold">
                    {{ authStore.userName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?' }}
                  </span>
                </v-avatar>
                <div>
                  <p class="text-subtitle-1 font-weight-bold">{{ authStore.userName || 'Пользователь' }}</p>
                  <p class="text-body-2 text-grey">{{ authStore.user?.email }}</p>
                  <v-chip size="x-small" variant="tonal" color="primary" class="mt-1">
                    {{ authStore.userRole === 'admin' ? 'Администратор' : authStore.userRole === 'manager' ? 'Менеджер' : 'Сотрудник' }}
                  </v-chip>
                </div>
              </div>
            </v-card>

            <!-- Change password -->
            <v-card flat rounded="xl" class="pa-6 mb-5">
              <p class="text-subtitle-1 font-weight-bold mb-4">Смена пароля</p>

              <v-form ref="passwordFormRef" @submit.prevent="changePassword">
                <v-text-field
                  v-model="securityForm.currentPassword"
                  label="Текущий пароль"
                  :rules="passwordRules.current"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  :append-inner-icon="showCurrentPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                  @click:append-inner="showCurrentPassword = !showCurrentPassword"
                  variant="outlined"
                  density="comfortable"
                  class="mb-3"
                  style="max-width: 400px"
                />

                <v-text-field
                  v-model="securityForm.newPassword"
                  label="Новый пароль"
                  :rules="passwordRules.new"
                  :type="showNewPassword ? 'text' : 'password'"
                  :append-inner-icon="showNewPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                  @click:append-inner="showNewPassword = !showNewPassword"
                  variant="outlined"
                  density="comfortable"
                  class="mb-3"
                  style="max-width: 400px"
                />

                <v-text-field
                  v-model="securityForm.confirmPassword"
                  label="Подтверждение пароля"
                  :rules="passwordRules.confirm"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  :append-inner-icon="showConfirmPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                  @click:append-inner="showConfirmPassword = !showConfirmPassword"
                  variant="outlined"
                  density="comfortable"
                  class="mb-1"
                  style="max-width: 400px"
                />

                <div class="text-caption text-grey mb-4">
                  Пароль должен содержать минимум 8 символов, одну заглавную букву и одну цифру
                </div>

                <v-btn
                  type="submit"
                  color="primary"
                  variant="flat"
                  rounded="lg"
                >
                  Сменить пароль
                </v-btn>
              </v-form>
            </v-card>

            <!-- Sessions -->
            <v-card flat rounded="xl" class="pa-6">
              <p class="text-subtitle-1 font-weight-bold mb-4">Активные сессии</p>

              <div class="d-flex align-center ga-3 pa-3 rounded-lg" style="background: #f5f5f5">
                <v-icon icon="mdi-monitor" size="24" color="green" />
                <div style="flex: 1">
                  <p class="text-body-2 font-weight-medium">Текущая сессия</p>
                  <p class="text-caption text-grey">Браузер — {{ new Date().toLocaleDateString('ru-RU') }}</p>
                </div>
                <v-chip color="green" size="x-small" variant="flat">Активна</v-chip>
              </div>

              <v-btn
                variant="tonal"
                color="red"
                rounded="lg"
                size="small"
                class="mt-4"
                prepend-icon="mdi-logout"
                @click="authStore.logout()"
              >
                Завершить все сессии
              </v-btn>
            </v-card>
          </div>
        </div>
      </div>
    </template>

    <v-snackbar v-model="snackbar" :timeout="3000" :color="snackbarColor" rounded="lg">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.settings-page {
  padding: 0 32px 32px;
}

/* ── Header ── */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.settings-header__title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.settings-header__sub {
  font-size: 14px;
  color: #6b7280;
  margin-top: 2px;
}

/* ── Layout ── */
.settings-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

/* ── Sidebar ── */
.settings-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 16px;
  padding: 8px;
  position: sticky;
  top: 100px;
}

.settings-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}

.settings-tab:hover {
  background: #f3f4f6;
  color: #374151;
}

.settings-tab--active {
  background: #EA004B12;
  color: #EA004B;
  font-weight: 600;
}

.settings-tab--active .v-icon {
  color: #EA004B;
}

/* ── Content ── */
.settings-content {
  flex: 1;
  min-width: 0;
}

.settings-section {
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.section-desc {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 20px;
}

/* ── Cover image ── */
.settings-cover {
  flex-shrink: 0;
}

.settings-cover__img {
  border: 2px solid #e5e7eb;
}

.settings-cover__placeholder {
  width: 220px;
  height: 140px;
  border-radius: 12px;
  border: 2px dashed #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}

/* ── Stats ── */
.settings-stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.settings-stat__value {
  font-weight: 700;
  font-size: 16px;
  color: #1a1a2e;
}

.settings-stat__label {
  font-size: 13px;
  color: #9ca3af;
}

/* ── Schedule ── */
.schedule-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.schedule-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #fafafa;
  transition: background 0.15s;
}

.schedule-row--off {
  opacity: 0.6;
}

.schedule-row__switch {
  flex: 0 0 auto;
}

.schedule-row__day {
  width: 120px;
  font-size: 14px;
  font-weight: 500;
}

.schedule-row__time {
  max-width: 120px;
}

/* ── Notification rows ── */
.notif-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
}

.notif-row + .notif-row {
  border-top: 1px solid #f3f4f6;
}

.notif-row__text {
  flex: 1;
  min-width: 0;
}

/* ── Responsive ── */
@media (max-width: 960px) {
  .settings-layout {
    flex-direction: column;
  }

  .settings-sidebar {
    width: 100%;
    display: flex;
    gap: 4px;
    overflow-x: auto;
    position: static;
  }

  .settings-tab {
    white-space: nowrap;
  }

  .settings-cover {
    display: none;
  }
}
</style>
