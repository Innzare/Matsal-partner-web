<script setup lang="ts">
import { useSearchBoostStore, calcBoostPrice } from '@/stores/searchBoost'
import type { BoostLevel, BoostLevelInfo } from '@/types'
import { BOOST_LEVELS, BOOST_STATUS_LABELS, BOOST_STATUS_COLORS } from '@/types'

const store = useSearchBoostStore()

onMounted(() => store.load())

// ── Dialog ──
const dialog = ref(false)
const selectedLevel = ref<BoostLevelInfo | null>(null)

type DurationMode = 7 | 14 | 'custom'
const durationMode = ref<DurationMode>(7)
const customDays = ref(10)

const snackbar = ref(false)
const snackbarText = ref('')

const actualDays = computed(() =>
  durationMode.value === 'custom' ? customDays.value : durationMode.value,
)

const currentPrice = computed(() => {
  if (!selectedLevel.value) return 0
  return calcBoostPrice(selectedLevel.value.level, actualDays.value)
})

const pricePerDay = computed(() => {
  if (actualDays.value <= 0) return 0
  return Math.round(currentPrice.value / actualDays.value)
})

function openDialog(level: BoostLevelInfo) {
  selectedLevel.value = level
  durationMode.value = 7
  customDays.value = 10
  dialog.value = true
}

async function confirmPurchase() {
  if (!selectedLevel.value || actualDays.value < 1) return
  await store.purchase(selectedLevel.value.level, actualDays.value)
  dialog.value = false
  snackbarText.value = `Буст «${selectedLevel.value.title}» на ${actualDays.value} дн. активирован!`
  snackbar.value = true
}

// ── Helpers ──
function levelInfo(level: BoostLevel) {
  return BOOST_LEVELS.find(b => b.level === level)!
}

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
  <div class="sb-page">
    <div v-if="store.isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <!-- ══ KPI Stats ══ -->
      <v-row dense class="mb-6">
        <v-col v-for="stat in [
          { label: 'Активные', value: store.subscriptions.filter(s => s.status === 'active').length, icon: 'mdi-trending-up', color: '#ea004b', bg: '#ea004b14' },
          { label: 'Показов', value: formatNum(store.totalViewsGained), icon: 'mdi-eye-outline', color: '#3b82f6', bg: '#3b82f614' },
          { label: 'Заказов', value: formatNum(store.totalOrdersGained), icon: 'mdi-cart-outline', color: '#22c55e', bg: '#22c55e14' },
          { label: 'Позиция', value: store.activeSubscription ? '#' + store.activeSubscription.positionAfter : '—', icon: 'mdi-map-marker-radius', color: '#f97316', bg: '#f9731614' },
        ]" :key="stat.label" cols="6" md="3">
          <v-card flat rounded="xl" class="pa-4 h-100">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="sb-stat-icon" :style="{ background: stat.bg, color: stat.color }">
                <v-icon :icon="stat.icon" size="20" />
              </div>
            </div>
            <p class="sb-stat-value">{{ stat.value }}</p>
            <p class="sb-stat-label">{{ stat.label }}</p>
          </v-card>
        </v-col>
      </v-row>

      <!-- ══ Boost Levels ══ -->
      <div class="sb-section-header mb-4">
        <div>
          <h2 class="sb-section-title">Уровни буста</h2>
          <p class="sb-section-sub">Выберите уровень повышения позиции в поиске</p>
        </div>
      </div>

      <div class="sb-levels-grid mb-8">
        <div v-for="level in BOOST_LEVELS" :key="level.level" class="sb-level-card">
          <div class="sb-level-card__head">
            <div class="sb-level-card__icon" :style="{ background: level.color + '14', color: level.color }">
              <v-icon :icon="level.icon" size="24" />
            </div>
            <div class="sb-level-card__badge">
              {{ level.positionBoost === 999 ? 'Топ-3' : '+' + level.positionBoost + ' мест' }}
            </div>
          </div>

          <h3 class="sb-level-card__title">{{ level.title }}</h3>
          <p class="sb-level-card__desc">{{ level.description }}</p>

          <div class="sb-level-card__prices">
            <div class="sb-level-card__price-row">
              <span class="sb-level-card__dur">7 дней</span>
              <span class="sb-level-card__price">{{ formatNum(calcBoostPrice(level.level, 7)) }} ₽</span>
            </div>
            <div class="sb-level-card__price-row">
              <span class="sb-level-card__dur">14 дней</span>
              <span class="sb-level-card__price">{{ formatNum(calcBoostPrice(level.level, 14)) }} ₽</span>
            </div>
            <div class="sb-level-card__price-row sb-level-card__price-row--muted">
              <span class="sb-level-card__dur">1 день</span>
              <span class="sb-level-card__price">{{ formatNum(level.pricePerDay) }} ₽</span>
            </div>
          </div>

          <v-btn color="primary" variant="flat" rounded="lg" block class="mt-3" @click="openDialog(level)">
            Активировать
          </v-btn>
        </div>
      </div>

      <!-- ══ Subscriptions ══ -->
      <div class="sb-section-header mb-4">
        <h2 class="sb-section-title">Мои бусты</h2>
      </div>

      <div v-if="store.subscriptions.length === 0" class="sb-empty">
        <div class="sb-empty__icon">
          <v-icon icon="mdi-trending-up" size="36" color="grey-lighten-1" />
        </div>
        <p class="sb-empty__title">Нет бустов</p>
        <p class="sb-empty__sub">Выберите уровень выше, чтобы поднять свой ресторан в поиске</p>
      </div>

      <v-card v-else flat rounded="xl" class="sb-subs-card">
        <div v-for="s in store.subscriptions" :key="s.id" class="sb-sub">
          <div class="sb-sub__icon" :style="{ background: levelInfo(s.level).color + '14', color: levelInfo(s.level).color }">
            <v-icon :icon="levelInfo(s.level).icon" size="22" />
          </div>

          <div class="sb-sub__body">
            <div class="d-flex align-center ga-2 mb-1">
              <span class="sb-sub__title">{{ levelInfo(s.level).title }}</span>
              <v-chip :color="BOOST_STATUS_COLORS[s.status]" size="x-small" variant="flat">
                {{ BOOST_STATUS_LABELS[s.status] }}
              </v-chip>
            </div>
            <p class="sb-sub__dates">
              {{ formatDate(s.startDate) }} — {{ formatDate(s.endDate) }}
              <template v-if="s.status === 'active'"> · <strong>{{ daysLeft(s.endDate) }}</strong> осталось</template>
            </p>
          </div>

          <div class="sb-sub__position">
            <span class="sb-sub__pos-before">{{ s.positionBefore }}</span>
            <v-icon icon="mdi-arrow-right" size="14" color="green" />
            <span class="sb-sub__pos-after">{{ s.positionAfter }}</span>
          </div>

          <div class="sb-sub__stats">
            <div class="sb-sub__stat">
              <v-icon icon="mdi-eye-outline" size="14" />
              <span>{{ formatNum(s.viewsGained) }}</span>
            </div>
            <div class="sb-sub__stat">
              <v-icon icon="mdi-cart-outline" size="14" />
              <span>{{ formatNum(s.ordersGained) }}</span>
            </div>
          </div>

          <div class="sb-sub__price">{{ formatNum(s.price) }} ₽</div>

          <v-btn
            v-if="s.status === 'active' || s.status === 'pending'"
            icon variant="text" size="x-small" color="grey"
            @click="store.cancel(s.id)"
          >
            <v-icon icon="mdi-close" size="18" />
            <v-tooltip activator="parent" location="top">Отменить</v-tooltip>
          </v-btn>
        </div>
      </v-card>
    </template>

    <!-- ══ Purchase Dialog ══ -->
    <v-dialog v-model="dialog" max-width="480">
      <div class="sb-dialog" v-if="selectedLevel">
        <div class="sb-dialog__head">
          <div class="sb-dialog__icon" :style="{ background: selectedLevel.color + '14', color: selectedLevel.color }">
            <v-icon :icon="selectedLevel.icon" size="28" />
          </div>
          <h3 class="sb-dialog__title">{{ selectedLevel.title }}</h3>
          <p class="sb-dialog__desc">{{ selectedLevel.description }}</p>
        </div>

        <div class="sb-dialog__section">
          <p class="sb-dialog__label">Срок действия</p>
          <v-btn-toggle v-model="durationMode" mandatory density="compact" rounded="lg" variant="outlined" divided class="w-100">
            <v-btn :value="7" class="flex-grow-1" size="small">7 дней</v-btn>
            <v-btn :value="14" class="flex-grow-1" size="small">14 дней</v-btn>
            <v-btn value="custom" class="flex-grow-1" size="small">Свой срок</v-btn>
          </v-btn-toggle>

          <div v-if="durationMode === 'custom'" class="sb-custom-days mt-4">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="sb-dialog__label mb-0">Количество дней</span>
              <span class="sb-custom-days__value">{{ customDays }} дн.</span>
            </div>
            <v-slider v-model="customDays" :min="1" :max="365" :step="1" color="primary" thumb-label hide-details />
            <div class="d-flex justify-space-between text-caption text-grey">
              <span>1 день</span>
              <span>1 год</span>
            </div>
          </div>
        </div>

        <div class="sb-dialog__summary">
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2 text-grey">Уровень</span>
            <span class="text-body-2 font-weight-medium">{{ selectedLevel.title }}</span>
          </div>
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

        <div class="sb-dialog__actions">
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
.sb-page { padding: 24px 32px; }

/* ── Stats ── */
.sb-stat-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.sb-stat-value { font-size: 24px; font-weight: 700; color: #1a1a2e; margin-bottom: 2px; }
.sb-stat-label { font-size: 13px; color: #9ca3af; }

/* ── Section header ── */
.sb-section-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.sb-section-title { font-size: 18px; font-weight: 700; color: #1a1a2e; }
.sb-section-sub { font-size: 13px; color: #9ca3af; margin-top: 2px; }

/* ── Levels grid ── */
.sb-levels-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

.sb-level-card {
  background: #fff; border-radius: 16px; padding: 20px;
  border: 1.5px solid #f0f0f0; transition: border-color 0.15s, box-shadow 0.15s;
}
.sb-level-card:hover { border-color: #e5e7eb; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); }

.sb-level-card__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.sb-level-card__icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.sb-level-card__badge { font-size: 11px; font-weight: 600; color: #9ca3af; background: #f3f4f6; padding: 3px 8px; border-radius: 6px; }
.sb-level-card__title { font-size: 16px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
.sb-level-card__desc { font-size: 13px; color: #6b7280; line-height: 1.5; margin-bottom: 14px; }

.sb-level-card__prices { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; background: #fafafa; border-radius: 10px; }
.sb-level-card__price-row { display: flex; justify-content: space-between; align-items: center; }
.sb-level-card__dur { font-size: 13px; color: #6b7280; }
.sb-level-card__price { font-size: 14px; font-weight: 700; color: #1a1a2e; }
.sb-level-card__price-row--muted .sb-level-card__dur,
.sb-level-card__price-row--muted .sb-level-card__price { font-size: 12px; color: #9ca3af; font-weight: 500; }

/* ── Subscriptions ── */
.sb-subs-card { overflow: hidden; }

.sb-sub {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 20px; transition: background 0.1s;
}
.sb-sub:hover { background: #fafafa; }
.sb-sub + .sb-sub { border-top: 1px solid #f0f0f0; }

.sb-sub__icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sb-sub__body { flex: 1; min-width: 0; }
.sb-sub__title { font-size: 14px; font-weight: 600; color: #1a1a2e; }
.sb-sub__dates { font-size: 12px; color: #9ca3af; }

.sb-sub__position { display: flex; align-items: center; gap: 6px; font-weight: 700; }
.sb-sub__pos-before { font-size: 14px; color: #9ca3af; }
.sb-sub__pos-after { font-size: 14px; color: #22c55e; }

.sb-sub__stats { display: flex; gap: 14px; }
.sb-sub__stat { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 500; color: #6b7280; }
.sb-sub__price { font-size: 14px; font-weight: 700; color: #1a1a2e; white-space: nowrap; }

/* ── Empty ── */
.sb-empty { display: flex; flex-direction: column; align-items: center; padding: 60px 0; text-align: center; }
.sb-empty__icon { width: 72px; height: 72px; border-radius: 20px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.sb-empty__title { font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 6px; }
.sb-empty__sub { font-size: 13px; color: #9ca3af; }

/* ── Dialog ── */
.sb-dialog { background: #fff; border-radius: 20px; padding: 28px; }
.sb-dialog__head { text-align: center; margin-bottom: 24px; }
.sb-dialog__icon { width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; }
.sb-dialog__title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
.sb-dialog__desc { font-size: 13px; color: #9ca3af; }
.sb-dialog__section { margin-bottom: 20px; }
.sb-dialog__label { font-size: 13px; font-weight: 600; color: #6b7280; margin-bottom: 8px; }
.sb-dialog__summary { padding: 16px; background: #fafafa; border-radius: 14px; margin-bottom: 20px; }
.sb-dialog__actions { display: flex; gap: 12px; justify-content: flex-end; }

.sb-custom-days__value { font-size: 15px; font-weight: 700; color: #ea004b; }

/* ── Responsive ── */
@media (max-width: 1100px) {
  .sb-levels-grid { grid-template-columns: 1fr; }
}
@media (max-width: 767px) {
  .sb-page { padding: 16px; }
  .sb-sub { flex-wrap: wrap; gap: 10px; padding: 14px 16px; }
  .sb-sub__stats { order: 10; width: 100%; justify-content: flex-start; }
  .sb-dialog { padding: 20px; }
  .sb-dialog__actions { flex-direction: column; }
}

/* ── Dark mode ── */
.dark .sb-stat-value,
.dark .sb-section-title,
.dark .sb-level-card__title,
.dark .sb-level-card__price,
.dark .sb-sub__title,
.dark .sb-sub__price,
.dark .sb-empty__title,
.dark .sb-dialog__title { color: #e4e4e7; }

.dark .sb-stat-label,
.dark .sb-section-sub,
.dark .sb-level-card__desc,
.dark .sb-level-card__dur,
.dark .sb-sub__dates,
.dark .sb-sub__stat,
.dark .sb-empty__sub,
.dark .sb-dialog__desc,
.dark .sb-dialog__label { color: #71717a; }

.dark .sb-level-card { background: #1e1e2e; border-color: #2e2e42; }
.dark .sb-level-card:hover { border-color: #3f3f5c; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2); }
.dark .sb-level-card__badge { background: #252538; color: #71717a; }
.dark .sb-level-card__prices { background: #252538; }
.dark .sb-level-card__price-row--muted .sb-level-card__dur,
.dark .sb-level-card__price-row--muted .sb-level-card__price { color: #52525b; }
.dark .sb-sub:hover { background: #252538; }
.dark .sb-sub + .sb-sub { border-top-color: #2e2e42; }
.dark .sb-empty__icon { background: #252538; }
.dark .sb-dialog { background: #1e1e2e; }
.dark .sb-dialog__summary { background: #252538; }
</style>
