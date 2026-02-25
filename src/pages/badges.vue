<script setup lang="ts">
import { useBadgesStore, calcBadgePrice } from '@/stores/badges'
import { BADGE_PRICE_7, BADGE_PRICE_14, BADGE_PRICE_PER_DAY, BADGE_STATUS_LABELS, BADGE_STATUS_COLORS } from '@/types'

const store = useBadgesStore()

onMounted(() => store.load())

// ── Dialog ──
const dialog = ref(false)

type DurationMode = 7 | 14 | 'custom'
const durationMode = ref<DurationMode>(7)
const customDays = ref(10)

const snackbar = ref(false)
const snackbarText = ref('')

const actualDays = computed(() =>
  durationMode.value === 'custom' ? customDays.value : durationMode.value,
)

const currentPrice = computed(() => calcBadgePrice(actualDays.value))

const pricePerDay = computed(() => {
  if (actualDays.value <= 0) return 0
  return Math.round(currentPrice.value / actualDays.value)
})

function openDialog() {
  durationMode.value = 7
  customDays.value = 10
  dialog.value = true
}

async function confirmPurchase() {
  if (actualDays.value < 1) return
  await store.purchase(actualDays.value)
  dialog.value = false
  snackbarText.value = `Бейдж «Рекомендуемое» на ${actualDays.value} дн. оформлен!`
  snackbar.value = true
}

// ── Helpers ──
function formatNum(n: number) {
  return n.toLocaleString('ru-RU')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function daysLeft(end: string) {
  const d = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000)
  if (d <= 0) return 'истёк'
  return `${d} дн.`
}
</script>

<template>
  <div class="bg-page">
    <div v-if="store.isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <!-- ══ KPI Stats ══ -->
      <v-row dense class="mb-6">
        <v-col v-for="stat in [
          { label: 'Показов бейджа', value: formatNum(store.totalImpressions), icon: 'mdi-eye-outline', color: '#ea004b', bg: '#ea004b14' },
          { label: 'Доп. кликов', value: formatNum(store.totalExtraClicks), icon: 'mdi-cursor-default-click', color: '#3b82f6', bg: '#3b82f614' },
          { label: 'Прирост конверсии', value: store.avgConversionLift.toFixed(1) + '%', icon: 'mdi-trending-up', color: '#22c55e', bg: '#22c55e14' },
          { label: 'Покупок', value: store.purchases.length, icon: 'mdi-shield-star-outline', color: '#f97316', bg: '#f9731614' },
        ]" :key="stat.label" cols="6" md="3">
          <v-card flat rounded="xl" class="pa-4 h-100">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="bg-stat-icon" :style="{ background: stat.bg, color: stat.color }">
                <v-icon :icon="stat.icon" size="20" />
              </div>
            </div>
            <p class="bg-stat-value">{{ stat.value }}</p>
            <p class="bg-stat-label">{{ stat.label }}</p>
          </v-card>
        </v-col>
      </v-row>

      <!-- ══ Badge Status Hero ══ -->
      <v-card flat rounded="xl" class="bg-status-card mb-8">
        <div class="bg-status-card__icon-wrap" :class="{ 'bg-status-card__icon-wrap--active': store.hasBadge }">
          <v-icon icon="mdi-shield-star" :size="store.hasBadge ? 48 : 40" :color="store.hasBadge ? '#ea004b' : '#9ca3af'" />
        </div>

        <div class="bg-status-card__body">
          <h2 class="bg-status-card__title">Бейдж «Рекомендуемое»</h2>
          <p v-if="store.hasBadge && store.activeBadge" class="bg-status-card__info">
            Активен до <strong>{{ formatDate(store.activeBadge.endDate) }}</strong>
            · <strong>{{ daysLeft(store.activeBadge.endDate) }}</strong> осталось
          </p>
          <p v-else class="bg-status-card__info">
            Ваш ресторан появится с бейджем на карточках в приложении
          </p>
        </div>

        <div class="bg-status-card__actions">
          <v-btn color="primary" variant="flat" rounded="lg" @click="openDialog">
            {{ store.hasBadge ? 'Продлить' : 'Получить бейдж' }}
          </v-btn>
          <v-btn
            v-if="store.activeBadge"
            variant="tonal" rounded="lg" color="grey" size="small"
            @click="store.cancel(store.activeBadge.id)"
          >
            Отменить
          </v-btn>
        </div>
      </v-card>

      <!-- ══ Pricing ══ -->
      <div class="sb-section-header mb-4">
        <div>
          <h2 class="bg-section-title">Тарифы</h2>
          <p class="bg-section-sub">Чем дольше срок — тем выгоднее</p>
        </div>
      </div>

      <v-row dense class="mb-8">
        <v-col v-for="preset in [
          { label: '7 дней', price: BADGE_PRICE_7, perDay: Math.round(BADGE_PRICE_7 / 7) },
          { label: '14 дней', price: BADGE_PRICE_14, perDay: Math.round(BADGE_PRICE_14 / 14) },
          { label: '1 день', price: BADGE_PRICE_PER_DAY, perDay: BADGE_PRICE_PER_DAY },
        ]" :key="preset.label" cols="12" sm="4">
          <v-card flat rounded="xl" class="bg-pricing-card">
            <p class="bg-pricing-card__label">{{ preset.label }}</p>
            <p class="bg-pricing-card__price">{{ formatNum(preset.price) }} ₽</p>
            <p class="bg-pricing-card__per-day">{{ formatNum(preset.perDay) }} ₽/день</p>
          </v-card>
        </v-col>
      </v-row>

      <!-- ══ Purchase History ══ -->
      <div class="sb-section-header mb-4">
        <h2 class="bg-section-title">История покупок</h2>
      </div>

      <div v-if="store.purchases.length === 0" class="bg-empty">
        <div class="bg-empty__icon">
          <v-icon icon="mdi-shield-star-outline" size="36" color="grey-lighten-1" />
        </div>
        <p class="bg-empty__title">Нет покупок</p>
        <p class="bg-empty__sub">Оформите бейдж, чтобы выделить ваш ресторан</p>
      </div>

      <v-card v-else flat rounded="xl" class="bg-history-card">
        <div v-for="p in store.purchases" :key="p.id" class="bg-purchase">
          <div class="bg-purchase__icon" :style="{ background: p.status === 'active' ? '#ea004b14' : '#f3f4f6', color: p.status === 'active' ? '#ea004b' : '#9ca3af' }">
            <v-icon icon="mdi-shield-star" size="22" />
          </div>

          <div class="bg-purchase__body">
            <div class="d-flex align-center ga-2 mb-1">
              <span class="bg-purchase__title">Рекомендуемое · {{ p.duration }} дн.</span>
              <v-chip :color="BADGE_STATUS_COLORS[p.status]" size="x-small" variant="flat">
                {{ BADGE_STATUS_LABELS[p.status] }}
              </v-chip>
            </div>
            <p class="bg-purchase__dates">
              {{ formatDate(p.startDate) }} — {{ formatDate(p.endDate) }}
              <template v-if="p.status === 'active'"> · <strong>{{ daysLeft(p.endDate) }}</strong> осталось</template>
            </p>
          </div>

          <div class="bg-purchase__stats">
            <div class="bg-purchase__stat">
              <v-icon icon="mdi-eye-outline" size="14" />
              <span>{{ formatNum(p.impressions) }}</span>
            </div>
            <div class="bg-purchase__stat">
              <v-icon icon="mdi-cursor-default-click" size="14" />
              <span>+{{ formatNum(p.extraClicks) }}</span>
            </div>
            <div class="bg-purchase__stat">
              <v-icon icon="mdi-trending-up" size="14" />
              <span>+{{ p.conversionLift.toFixed(1) }}%</span>
            </div>
          </div>

          <div class="bg-purchase__price">{{ formatNum(p.price) }} ₽</div>
        </div>
      </v-card>
    </template>

    <!-- ══ Purchase Dialog ══ -->
    <v-dialog v-model="dialog" max-width="480">
      <div class="bg-dialog">
        <div class="bg-dialog__head">
          <div class="bg-dialog__icon" style="background: #ea004b14; color: #ea004b">
            <v-icon icon="mdi-shield-star" size="28" />
          </div>
          <h3 class="bg-dialog__title">Бейдж «Рекомендуемое»</h3>
          <p class="bg-dialog__desc">Ваш ресторан появится с бейджем на карточках в приложении</p>
        </div>

        <div class="bg-dialog__section">
          <p class="bg-dialog__label">Срок действия</p>
          <v-btn-toggle v-model="durationMode" mandatory density="compact" rounded="lg" variant="outlined" divided class="w-100">
            <v-btn :value="7" class="flex-grow-1" size="small">7 дней · {{ formatNum(BADGE_PRICE_7) }} ₽</v-btn>
            <v-btn :value="14" class="flex-grow-1" size="small">14 дней · {{ formatNum(BADGE_PRICE_14) }} ₽</v-btn>
            <v-btn value="custom" class="flex-grow-1" size="small">Свой срок</v-btn>
          </v-btn-toggle>

          <div v-if="durationMode === 'custom'" class="bg-custom-days mt-4">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="bg-dialog__label mb-0">Количество дней</span>
              <span class="bg-custom-days__value">{{ customDays }} дн.</span>
            </div>
            <v-slider v-model="customDays" :min="1" :max="365" :step="1" color="primary" thumb-label hide-details />
            <div class="d-flex justify-space-between text-caption text-grey">
              <span>1 день</span>
              <span>1 год</span>
            </div>
          </div>
        </div>

        <div class="bg-dialog__summary">
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2 text-grey">Длительность</span>
            <span class="text-body-2 font-weight-medium">{{ actualDays }} дней</span>
          </div>
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2 text-grey">Цена за день</span>
            <span class="text-body-2 font-weight-medium">{{ formatNum(pricePerDay) }} ₽/день</span>
          </div>
          <v-divider class="my-3" />
          <div class="d-flex justify-space-between">
            <span class="text-subtitle-1 font-weight-bold">Итого</span>
            <span class="text-subtitle-1 font-weight-bold" style="color: #ea004b">{{ formatNum(currentPrice) }} ₽</span>
          </div>
        </div>

        <div class="bg-dialog__actions">
          <v-btn variant="tonal" rounded="lg" @click="dialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" :loading="store.isSaving" @click="confirmPurchase">
            Оплатить {{ formatNum(currentPrice) }} ₽
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <v-snackbar v-model="snackbar" :timeout="3000" color="green" rounded="lg">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<style scoped>
/* ── Page ── */
.bg-page { padding: 24px 32px; }

/* ── Stats ── */
.bg-stat-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.bg-stat-value { font-size: 24px; font-weight: 700; color: #1a1a2e; margin-bottom: 2px; }
.bg-stat-label { font-size: 13px; color: #9ca3af; }

/* ── Section ── */
.bg-section-title { font-size: 18px; font-weight: 700; color: #1a1a2e; }
.bg-section-sub { font-size: 13px; color: #9ca3af; margin-top: 2px; }

/* ── Status hero card ── */
.bg-status-card {
  display: flex; align-items: center; gap: 20px;
  padding: 28px 32px; flex-wrap: wrap;
}

.bg-status-card__icon-wrap {
  width: 80px; height: 80px; border-radius: 20px;
  background: #f3f4f6; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.bg-status-card__icon-wrap--active {
  background: #ea004b14;
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

.bg-status-card__body { flex: 1; min-width: 200px; }
.bg-status-card__title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
.bg-status-card__info { font-size: 14px; color: #6b7280; }
.bg-status-card__actions { display: flex; gap: 10px; flex-wrap: wrap; }

/* ── Pricing cards ── */
.bg-pricing-card { padding: 20px; text-align: center; }
.bg-pricing-card__label { font-size: 13px; font-weight: 600; color: #9ca3af; margin-bottom: 6px; }
.bg-pricing-card__price { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 2px; }
.bg-pricing-card__per-day { font-size: 12px; color: #9ca3af; }

/* ── History ── */
.bg-history-card { overflow: hidden; }

.bg-purchase {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 20px; transition: background 0.1s;
}
.bg-purchase:hover { background: #fafafa; }
.bg-purchase + .bg-purchase { border-top: 1px solid #f0f0f0; }

.bg-purchase__icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.bg-purchase__body { flex: 1; min-width: 0; }
.bg-purchase__title { font-size: 14px; font-weight: 600; color: #1a1a2e; }
.bg-purchase__dates { font-size: 12px; color: #9ca3af; }
.bg-purchase__stats { display: flex; gap: 14px; }
.bg-purchase__stat { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 500; color: #6b7280; }
.bg-purchase__price { font-size: 14px; font-weight: 700; color: #1a1a2e; white-space: nowrap; }

/* ── Empty ── */
.bg-empty { display: flex; flex-direction: column; align-items: center; padding: 60px 0; text-align: center; }
.bg-empty__icon { width: 72px; height: 72px; border-radius: 20px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.bg-empty__title { font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 6px; }
.bg-empty__sub { font-size: 13px; color: #9ca3af; }

/* ── Dialog ── */
.bg-dialog { background: #fff; border-radius: 20px; padding: 28px; }
.bg-dialog__head { text-align: center; margin-bottom: 24px; }
.bg-dialog__icon { width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; }
.bg-dialog__title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
.bg-dialog__desc { font-size: 13px; color: #9ca3af; }
.bg-dialog__section { margin-bottom: 20px; }
.bg-dialog__label { font-size: 13px; font-weight: 600; color: #6b7280; margin-bottom: 8px; }
.bg-dialog__summary { padding: 16px; background: #fafafa; border-radius: 14px; margin-bottom: 20px; }
.bg-dialog__actions { display: flex; gap: 12px; justify-content: flex-end; }

.bg-custom-days__value { font-size: 15px; font-weight: 700; color: #ea004b; }

/* ── Responsive ── */
@media (max-width: 767px) {
  .bg-page { padding: 16px; }
  .bg-status-card { padding: 20px; gap: 14px; }
  .bg-purchase { flex-wrap: wrap; gap: 10px; padding: 14px 16px; }
  .bg-purchase__stats { order: 10; width: 100%; justify-content: flex-start; }
  .bg-dialog { padding: 20px; }
  .bg-dialog__actions { flex-direction: column; }
}

/* ── Dark mode ── */
.dark .bg-stat-value,
.dark .bg-section-title,
.dark .bg-status-card__title,
.dark .bg-pricing-card__price,
.dark .bg-purchase__title,
.dark .bg-purchase__price,
.dark .bg-empty__title,
.dark .bg-dialog__title { color: #e4e4e7; }

.dark .bg-stat-label,
.dark .bg-section-sub,
.dark .bg-status-card__info,
.dark .bg-pricing-card__label,
.dark .bg-pricing-card__per-day,
.dark .bg-purchase__dates,
.dark .bg-purchase__stat,
.dark .bg-empty__sub,
.dark .bg-dialog__desc,
.dark .bg-dialog__label { color: #71717a; }

.dark .bg-status-card__icon-wrap { background: #252538; }
.dark .bg-purchase:hover { background: #252538; }
.dark .bg-purchase + .bg-purchase { border-top-color: #2e2e42; }
.dark .bg-empty__icon { background: #252538; }
.dark .bg-dialog { background: #1e1e2e; }
.dark .bg-dialog__summary { background: #252538; }
</style>
