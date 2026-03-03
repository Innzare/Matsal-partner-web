<script setup lang="ts">
import { usePromotionStore, calcPrice } from "@/stores/promotion";
import type { PromoSlot, PromoSlotInfo } from "@/types";
import { PROMO_SLOTS, PROMO_STATUS_LABELS, PROMO_STATUS_COLORS } from "@/types";

const store = usePromotionStore();

// TODO: заменить на реальную проверку подписки
const isPremium = ref(false);

onMounted(() => store.load());

// ── New placement dialog ──
const dialog = ref(false);
const selectedSlot = ref<PromoSlotInfo | null>(null);

type DurationMode = 7 | 14 | "custom";
const durationMode = ref<DurationMode>(7);
const customDays = ref(10);

const snackbar = ref(false);
const snackbarText = ref("");

const actualDays = computed(() =>
  durationMode.value === "custom" ? customDays.value : durationMode.value,
);

const currentPrice = computed(() => {
  if (!selectedSlot.value) return 0;
  return calcPrice(selectedSlot.value.slot, actualDays.value);
});

const pricePerDay = computed(() => {
  if (actualDays.value <= 0) return 0;
  return Math.round(currentPrice.value / actualDays.value);
});

function openDialog(slot: PromoSlotInfo) {
  selectedSlot.value = slot;
  durationMode.value = 7;
  customDays.value = 10;
  dialog.value = true;
}

async function confirmPurchase() {
  if (!selectedSlot.value || actualDays.value < 1) return;
  await store.createPlacement(selectedSlot.value.slot, actualDays.value);
  dialog.value = false;
  snackbarText.value = `Размещение «${selectedSlot.value.title}» на ${actualDays.value} дн. оформлено!`;
  snackbar.value = true;
}

// ── Helpers ──
function slotTitle(slot: PromoSlot) {
  return PROMO_SLOTS.find((s) => s.slot === slot)?.title ?? slot;
}

function slotInfo(slot: PromoSlot) {
  return PROMO_SLOTS.find((s) => s.slot === slot)!;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

function daysLeft(end: string) {
  const d = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  if (d <= 0) return "истекло";
  return `${d} дн.`;
}

function formatNum(n: number) {
  return n.toLocaleString("ru-RU");
}
</script>

<template>
  <div class="pm-page">
    <div v-if="store.isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <!-- ══ KPI Stats ══ -->
      <v-row dense class="mb-6">
        <v-col
          v-for="stat in [
            {
              label: 'Активные',
              value: store.activePlacements.length,
              icon: 'mdi-rocket-launch',
              color: '#ea004b',
              bg: '#ea004b14',
            },
            {
              label: 'Показы',
              value: formatNum(store.totalImpressions),
              icon: 'mdi-eye-outline',
              color: '#3b82f6',
              bg: '#3b82f614',
            },
            {
              label: 'Клики',
              value: formatNum(store.totalClicks),
              icon: 'mdi-cursor-default-click',
              color: '#22c55e',
              bg: '#22c55e14',
            },
            {
              label: 'CTR',
              value: store.avgCtr.toFixed(1) + '%',
              icon: 'mdi-percent',
              color: '#f97316',
              bg: '#f9731614',
            },
          ]"
          :key="stat.label"
          cols="6"
          md="3"
        >
          <v-card flat rounded="xl" class="pa-4 h-100">
            <div class="d-flex align-center justify-space-between mb-2">
              <div
                class="pm-stat-icon"
                :style="{ background: stat.bg, color: stat.color }"
              >
                <v-icon :icon="stat.icon" size="20" />
              </div>
            </div>
            <p class="pm-stat-value">{{ stat.value }}</p>
            <p class="pm-stat-label">{{ stat.label }}</p>
          </v-card>
        </v-col>
      </v-row>

      <!-- ══ Available Slots ══ -->
      <div class="pm-section-header mb-4">
        <div>
          <h2 class="pm-section-title">Доступные слоты</h2>
          <p class="pm-section-sub">
            Выберите секцию для размещения вашего ресторана
          </p>
        </div>
      </div>

      <div class="pm-slots-grid mb-8">
        <div
          v-for="slot in PROMO_SLOTS"
          :key="slot.slot"
          class="pm-slot-card"
          :class="{
            'pm-slot-card--premium': slot.premium,
            'pm-slot-card--locked': slot.premium && !isPremium,
          }"
        >
          <div class="pm-slot-card__head">
            <div
              class="pm-slot-card__icon"
              :style="{ background: slot.color + '14', color: slot.color }"
            >
              <v-icon :icon="slot.icon" size="24" />
            </div>
            <div class="d-flex align-center ga-2">
              <v-chip
                v-if="slot.premium"
                size="x-small"
                color="amber"
                variant="flat"
                prepend-icon="mdi-crown"
              >
                Premium
              </v-chip>
              <div class="pm-slot-card__badge">
                {{ slot.maxImpressions }} показов
              </div>
            </div>
          </div>

          <h3 class="pm-slot-card__title">{{ slot.title }}</h3>
          <p class="pm-slot-card__desc">{{ slot.description }}</p>

          <div class="pm-slot-card__prices">
            <div class="pm-slot-card__price-row">
              <span class="pm-slot-card__dur">7 дней</span>
              <span class="pm-slot-card__price"
                >{{ formatNum(slot.price7) }} ₽</span
              >
            </div>
            <div class="pm-slot-card__price-row">
              <span class="pm-slot-card__dur">14 дней</span>
              <span class="pm-slot-card__price"
                >{{ formatNum(slot.price14) }} ₽</span
              >
            </div>
            <div class="pm-slot-card__price-row pm-slot-card__price-row--muted">
              <span class="pm-slot-card__dur">1 день</span>
              <span class="pm-slot-card__price"
                >{{ formatNum(slot.pricePerDay) }} ₽</span
              >
            </div>
          </div>

          <v-btn
            v-if="!slot.premium || isPremium"
            color="primary"
            variant="flat"
            rounded="lg"
            block
            class="mt-3"
            @click="openDialog(slot)"
          >
            Разместить
          </v-btn>
          <v-btn
            v-else
            color="amber-darken-4"
            rounded="lg"
            block
            class="mt-3"
            prepend-icon="mdi-lock"
            disabled
          >
            Только Premium
          </v-btn>
        </div>
      </div>

      <!-- ══ Active Placements ══ -->
      <div class="pm-section-header mb-4">
        <h2 class="pm-section-title">Мои размещения</h2>
      </div>

      <div v-if="store.placements.length === 0" class="pm-empty">
        <div class="pm-empty__icon">
          <v-icon
            icon="mdi-rocket-launch-outline"
            size="36"
            color="grey-lighten-1"
          />
        </div>
        <p class="pm-empty__title">Нет размещений</p>
        <p class="pm-empty__sub">
          Выберите слот выше, чтобы начать продвижение
        </p>
      </div>

      <v-card v-else flat rounded="xl" class="pm-placements-card">
        <div v-for="p in store.placements" :key="p.id" class="pm-placement">
          <div
            class="pm-placement__icon"
            :style="{
              background: slotInfo(p.slot).color + '14',
              color: slotInfo(p.slot).color,
            }"
          >
            <v-icon :icon="slotInfo(p.slot).icon" size="22" />
          </div>

          <div class="pm-placement__body">
            <div class="d-flex align-center ga-2 mb-1">
              <span class="pm-placement__title">{{ slotTitle(p.slot) }}</span>
              <v-chip
                :color="PROMO_STATUS_COLORS[p.status]"
                size="x-small"
                variant="flat"
              >
                {{ PROMO_STATUS_LABELS[p.status] }}
              </v-chip>
            </div>
            <p class="pm-placement__dates">
              {{ formatDate(p.startDate) }} — {{ formatDate(p.endDate) }}
              <template v-if="p.status === 'active'">
                · <strong>{{ daysLeft(p.endDate) }}</strong> осталось
              </template>
            </p>
          </div>

          <div class="pm-placement__stats">
            <div class="pm-placement__stat">
              <v-icon icon="mdi-eye-outline" size="14" />
              <span>{{ formatNum(p.impressions) }}</span>
            </div>
            <div class="pm-placement__stat">
              <v-icon icon="mdi-cursor-default-click" size="14" />
              <span>{{ formatNum(p.clicks) }}</span>
            </div>
          </div>

          <div class="pm-placement__price">{{ formatNum(p.price) }} ₽</div>

          <v-btn
            v-if="p.status === 'active' || p.status === 'pending'"
            icon
            variant="text"
            size="x-small"
            color="grey"
            @click="store.cancelPlacement(p.id)"
          >
            <v-icon icon="mdi-close" size="18" />
            <v-tooltip activator="parent" location="top">Отменить</v-tooltip>
          </v-btn>
        </div>
      </v-card>
    </template>

    <!-- ══ Purchase Dialog ══ -->
    <v-dialog v-model="dialog" max-width="480">
      <div class="pm-dialog" v-if="selectedSlot">
        <div class="pm-dialog__head">
          <div
            class="pm-dialog__icon"
            :style="{
              background: selectedSlot.color + '14',
              color: selectedSlot.color,
            }"
          >
            <v-icon :icon="selectedSlot.icon" size="28" />
          </div>
          <h3 class="pm-dialog__title">{{ selectedSlot.title }}</h3>
          <p class="pm-dialog__desc">{{ selectedSlot.description }}</p>
        </div>

        <div class="pm-dialog__section">
          <p class="pm-dialog__label">Срок размещения</p>
          <v-btn-toggle
            v-model="durationMode"
            mandatory
            density="compact"
            rounded="lg"
            variant="outlined"
            divided
            class="w-100"
          >
            <v-btn :value="7" class="flex-grow-1" size="small">
              7 дней · {{ formatNum(selectedSlot.price7) }} ₽
            </v-btn>
            <v-btn :value="14" class="flex-grow-1" size="small">
              14 дней · {{ formatNum(selectedSlot.price14) }} ₽
            </v-btn>
            <v-btn value="custom" class="flex-grow-1" size="small">
              Свой срок
            </v-btn>
          </v-btn-toggle>

          <!-- Custom days slider -->
          <div v-if="durationMode === 'custom'" class="pm-custom-days mt-4">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="pm-dialog__label mb-0">Количество дней</span>
              <span class="pm-custom-days__value">
                {{ customDays }} дн.
                <template v-if="customDays >= 30">
                  ({{ Math.floor(customDays / 30) }} мес.<template
                    v-if="customDays % 30 > 0"
                  >
                    {{ customDays % 30 }} дн.</template
                  >)
                </template>
              </span>
            </div>
            <v-slider
              v-model="customDays"
              :min="1"
              :max="365"
              :step="1"
              color="primary"
              thumb-label
              hide-details
            />
            <div class="d-flex justify-space-between text-caption text-grey">
              <span>1 день</span>
              <span>1 год</span>
            </div>
            <div v-if="customDays > 1" class="pm-custom-days__discount mt-1">
              Скидка
              {{
                Math.round(
                  (1 - currentPrice / (selectedSlot.pricePerDay * customDays)) *
                    100,
                )
              }}%
            </div>
          </div>
        </div>

        <div class="pm-dialog__summary">
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2 text-grey">Секция</span>
            <span class="text-body-2 font-weight-medium">{{
              selectedSlot.title
            }}</span>
          </div>
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2 text-grey">Длительность</span>
            <span class="text-body-2 font-weight-medium"
              >{{ actualDays }} дней</span
            >
          </div>
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2 text-grey">Цена за день</span>
            <span class="text-body-2 font-weight-medium"
              >{{ formatNum(pricePerDay) }} ₽/день</span
            >
          </div>
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2 text-grey">Охват</span>
            <span class="text-body-2 font-weight-medium">{{
              selectedSlot.maxImpressions
            }}</span>
          </div>
          <v-divider class="my-3" />
          <div class="d-flex justify-space-between">
            <span class="text-subtitle-1 font-weight-bold">Итого</span>
            <span
              class="text-subtitle-1 font-weight-bold"
              style="color: #ea004b"
            >
              {{ formatNum(currentPrice) }} ₽
            </span>
          </div>
        </div>

        <div class="pm-dialog__actions">
          <v-btn variant="tonal" rounded="lg" @click="dialog = false"
            >Отмена</v-btn
          >
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :loading="store.isSaving"
            @click="confirmPurchase"
          >
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
.pm-page {
  padding: 24px 32px;
}

/* ── Stats ── */
.pm-stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pm-stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 2px;
}

.pm-stat-label {
  font-size: 13px;
  color: #9ca3af;
}

/* ── Section header ── */
.pm-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.pm-section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
}

.pm-section-sub {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 2px;
}

/* ── Slots grid ── */
.pm-slots-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.pm-slot-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  border: 1.5px solid #f0f0f0;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.pm-slot-card:hover {
  border-color: #e5e7eb;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.pm-slot-card--premium {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #fffbeb 0%, #fff 40%);
}

.pm-slot-card--premium:hover {
  border-color: #f59e0b;
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.15);
}

.pm-slot-card--locked {
  opacity: 0.75;
}

.pm-slot-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.pm-slot-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pm-slot-card__badge {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 3px 8px;
  border-radius: 6px;
}

.pm-slot-card__title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 6px;
}

.pm-slot-card__desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 14px;
}

.pm-slot-card__prices {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 10px;
}

.pm-slot-card__price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pm-slot-card__dur {
  font-size: 13px;
  color: #6b7280;
}

.pm-slot-card__price {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
}

.pm-slot-card__price-row--muted .pm-slot-card__dur,
.pm-slot-card__price-row--muted .pm-slot-card__price {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

/* ── Custom days ── */
.pm-custom-days__value {
  font-size: 15px;
  font-weight: 700;
  color: #ea004b;
}

.pm-custom-days__discount {
  font-size: 12px;
  font-weight: 600;
  color: #22c55e;
  text-align: right;
}

/* ── Placements ── */
.pm-placements-card {
  overflow: hidden;
}

.pm-placement {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  transition: background 0.1s;
}

.pm-placement:hover {
  background: #fafafa;
}

.pm-placement + .pm-placement {
  border-top: 1px solid #f0f0f0;
}

.pm-placement__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pm-placement__body {
  flex: 1;
  min-width: 0;
}

.pm-placement__title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.pm-placement__dates {
  font-size: 12px;
  color: #9ca3af;
}

.pm-placement__stats {
  display: flex;
  gap: 14px;
}

.pm-placement__stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.pm-placement__price {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
  white-space: nowrap;
}

/* ── Empty ── */
.pm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  text-align: center;
}

.pm-empty__icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.pm-empty__title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 6px;
}

.pm-empty__sub {
  font-size: 13px;
  color: #9ca3af;
}

/* ── Dialog ── */
.pm-dialog {
  background: #fff;
  border-radius: 20px;
  padding: 28px;
}

.pm-dialog__head {
  text-align: center;
  margin-bottom: 24px;
}

.pm-dialog__icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}

.pm-dialog__title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.pm-dialog__desc {
  font-size: 13px;
  color: #9ca3af;
}

.pm-dialog__section {
  margin-bottom: 20px;
}

.pm-dialog__label {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
}

.pm-dialog__summary {
  padding: 16px;
  background: #fafafa;
  border-radius: 14px;
  margin-bottom: 20px;
}

.pm-dialog__actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* ── Responsive ── */
@media (max-width: 1100px) {
  .pm-slots-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .pm-page {
    padding: 16px;
  }

  .pm-slots-grid {
    grid-template-columns: 1fr;
  }

  .pm-placement {
    flex-wrap: wrap;
    gap: 10px;
    padding: 14px 16px;
  }

  .pm-placement__stats {
    order: 10;
    width: 100%;
    justify-content: flex-start;
  }

  .pm-dialog {
    padding: 20px;
  }

  .pm-dialog__actions {
    flex-direction: column;
  }
}

/* ── Dark mode ── */
.dark .pm-stat-value,
.dark .pm-section-title,
.dark .pm-slot-card__title,
.dark .pm-slot-card__price,
.dark .pm-placement__title,
.dark .pm-placement__price,
.dark .pm-empty__title,
.dark .pm-dialog__title {
  color: #e4e4e7;
}

.dark .pm-stat-label,
.dark .pm-section-sub,
.dark .pm-slot-card__desc,
.dark .pm-slot-card__dur,
.dark .pm-placement__dates,
.dark .pm-placement__stat,
.dark .pm-empty__sub,
.dark .pm-dialog__desc,
.dark .pm-dialog__label {
  color: #71717a;
}

.dark .pm-slot-card {
  background: #1e1e2e;
  border-color: #2e2e42;
}

.dark .pm-slot-card:hover {
  border-color: #3f3f5c;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.dark .pm-slot-card--premium {
  border-color: #92400e;
  background: linear-gradient(135deg, #1e1a10 0%, #1e1e2e 40%);
}

.dark .pm-slot-card--premium:hover {
  border-color: #b45309;
  box-shadow: 0 4px 20px rgba(180, 83, 9, 0.2);
}

.dark .pm-slot-card__badge {
  background: #252538;
  color: #71717a;
}

.dark .pm-slot-card__prices {
  background: #252538;
}

.dark .pm-placement:hover {
  background: #252538;
}

.dark .pm-placement + .pm-placement {
  border-top-color: #2e2e42;
}

.dark .pm-empty__icon {
  background: #252538;
}

.dark .pm-dialog {
  background: #1e1e2e;
}

.dark .pm-dialog__summary {
  background: #252538;
}

.dark .pm-slot-card__price-row--muted .pm-slot-card__dur,
.dark .pm-slot-card__price-row--muted .pm-slot-card__price {
  color: #52525b;
}

.dark .pm-custom-days__value {
  color: #ea004b;
}
</style>
