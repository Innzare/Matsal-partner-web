<script lang="ts" setup>
import type { PartnerOrder } from '@/types'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_TYPE_LABELS,
} from '@/types'

const props = defineProps<{
  modelValue: boolean
  order: PartnerOrder | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  accept: [id: string]
  reject: [id: string]
  ready: [id: string]
  pickedUp: [id: string]
}>()

function close() {
  emit('update:modelValue', false)
}

function formatTime(date?: string): string {
  if (!date) return '—'
  return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const orderTypeIcon = computed(() => {
  if (!props.order) return ''
  const map = { delivery: 'mdi-moped', pickup: 'mdi-walk', dine_in: 'mdi-silverware-fork-knife' }
  return map[props.order.orderType]
})

const subtotal = computed(() => {
  if (!props.order) return 0
  return props.order.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
})

const grandTotal = computed(() => {
  if (!props.order) return 0
  return props.order.totalPrice + props.order.deliveryFee
})

// Timeline steps
const steps = computed(() => {
  if (!props.order) return []
  const o = props.order
  const list: { label: string; time: string; done: boolean; icon: string; color: string }[] = []

  list.push({
    label: 'Создан',
    time: formatTime(o.createdAt),
    done: true,
    icon: 'mdi-file-document-outline',
    color: '#3b82f6',
  })

  if (o.rejectedAt) {
    list.push({
      label: 'Отклонён',
      time: formatTime(o.rejectedAt),
      done: true,
      icon: 'mdi-close-circle-outline',
      color: '#dc2626',
    })
    return list
  }

  const accepted = !!o.acceptedAt || !['incoming'].includes(o.status)
  list.push({
    label: 'Принят',
    time: o.acceptedAt ? formatTime(o.acceptedAt) : '',
    done: accepted,
    icon: 'mdi-check-circle-outline',
    color: '#16a34a',
  })

  const ready = !!o.readyAt || ['ready', 'completed'].includes(o.status)
  list.push({
    label: 'Готов',
    time: o.readyAt ? formatTime(o.readyAt) : '',
    done: ready,
    icon: 'mdi-food-outline',
    color: '#F97316',
  })

  const completed = !!o.completedAt || o.status === 'completed'
  list.push({
    label: 'Завершён',
    time: o.completedAt ? formatTime(o.completedAt) : '',
    done: completed,
    icon: 'mdi-flag-checkered',
    color: '#6b7280',
  })

  return list
})
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="620"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card v-if="order" rounded="xl" class="od">
      <!-- Header -->
      <div class="od-header">
        <div class="od-header__left">
          <div class="od-header__number">ORD{{ order.orderNumber }}</div>
          <v-chip
            :color="ORDER_STATUS_COLORS[order.status]"
            size="small"
            variant="flat"
            class="font-weight-bold"
          >
            {{ ORDER_STATUS_LABELS[order.status] }}
          </v-chip>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" density="compact" @click="close" />
      </div>

      <!-- Info bar -->
      <div class="od-info-bar">
        <div class="od-info-tag">
          <v-icon icon="mdi-calendar-outline" size="14" />
          {{ formatDate(order.createdAt) }}, {{ formatTime(order.createdAt) }}
        </div>
        <div class="od-info-tag">
          <v-icon :icon="orderTypeIcon" size="14" />
          {{ ORDER_TYPE_LABELS[order.orderType] }}
        </div>
        <div class="od-info-tag">
          <v-icon icon="mdi-food" size="14" />
          {{ order.itemsCount }} позиций
        </div>
      </div>

      <v-divider />

      <!-- Body -->
      <v-card-text class="od-body">
        <!-- Customer -->
        <div class="od-section">
          <p class="od-section__title">
            <v-icon icon="mdi-account-outline" size="16" class="mr-1" />
            Клиент
          </p>
          <div class="od-customer">
            <div class="od-customer__avatar">
              {{ order.customer.name.charAt(0) }}
            </div>
            <div class="od-customer__info">
              <p class="od-customer__name">{{ order.customer.name }}</p>
              <a :href="'tel:' + order.customer.phone" class="od-customer__phone">
                <v-icon icon="mdi-phone-outline" size="13" />
                {{ order.customer.phone }}
              </a>
            </div>
          </div>

          <div v-if="order.orderType !== 'dine_in'" class="od-address">
            <v-icon icon="mdi-map-marker-outline" size="15" color="grey" />
            <div>
              <p class="od-address__text">{{ order.customer.address }}</p>
              <p v-if="order.customer.floor" class="od-address__detail">
                Этаж {{ order.customer.floor }}<template v-if="order.customer.apartment">, кв. {{ order.customer.apartment }}</template>
              </p>
            </div>
          </div>

          <div v-if="order.customer.comment" class="od-comment">
            <v-icon icon="mdi-message-text-outline" size="14" />
            <span>{{ order.customer.comment }}</span>
          </div>
        </div>

        <!-- Items -->
        <div class="od-section">
          <p class="od-section__title">
            <v-icon icon="mdi-receipt-text-outline" size="16" class="mr-1" />
            Состав заказа
          </p>
          <div class="od-items">
            <div v-for="(item, i) in order.items" :key="i" class="od-item">
              <div class="od-item__qty">{{ item.quantity }}x</div>
              <span class="od-item__name">{{ item.name }}</span>
              <span class="od-item__price">{{ (item.price * item.quantity).toLocaleString('ru-RU') }} ₽</span>
            </div>
          </div>

          <div class="od-totals">
            <div class="od-totals__row">
              <span>Позиции</span>
              <span>{{ subtotal.toLocaleString('ru-RU') }} ₽</span>
            </div>
            <div class="od-totals__row">
              <span>Доставка</span>
              <span :class="{ 'od-totals__free': !order.deliveryFee }">
                {{ order.deliveryFee ? order.deliveryFee.toLocaleString('ru-RU') + ' ₽' : 'Бесплатно' }}
              </span>
            </div>
            <div class="od-totals__row od-totals__row--total">
              <span>Итого</span>
              <span>{{ grandTotal.toLocaleString('ru-RU') }} ₽</span>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="od-section od-section--last">
          <p class="od-section__title">
            <v-icon icon="mdi-timeline-clock-outline" size="16" class="mr-1" />
            Хронология
          </p>
          <div class="od-timeline">
            <div
              v-for="(step, i) in steps"
              :key="i"
              class="od-step"
              :class="{ 'od-step--done': step.done, 'od-step--last': i === steps.length - 1 }"
            >
              <div class="od-step__dot" :style="step.done ? { background: step.color } : {}">
                <v-icon v-if="step.done" :icon="step.icon" size="12" color="white" />
              </div>
              <div v-if="i < steps.length - 1" class="od-step__line" :class="{ 'od-step__line--done': steps[i + 1]?.done }" />
              <div class="od-step__content">
                <p class="od-step__label">{{ step.label }}</p>
                <p class="od-step__time">{{ step.time || '—' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Reject reason -->
        <div v-if="order.rejectReason" class="od-reject">
          <v-icon icon="mdi-alert-circle-outline" size="16" />
          <div>
            <p class="od-reject__title">Причина отклонения</p>
            <p class="od-reject__text">{{ order.rejectReason }}</p>
          </div>
        </div>
      </v-card-text>

      <!-- Footer actions -->
      <div v-if="order.status !== 'completed' && order.status !== 'rejected'" class="od-footer">
        <!-- Incoming: Accept / Reject -->
        <template v-if="order.status === 'incoming'">
          <button class="od-btn od-btn--reject" @click="emit('reject', order.id)">
            <v-icon icon="mdi-close" size="16" />
            Отклонить
          </button>
          <button class="od-btn od-btn--accept" @click="emit('accept', order.id)">
            <v-icon icon="mdi-check" size="16" />
            Принять заказ
          </button>
        </template>

        <!-- Preparing: Mark ready -->
        <template v-if="order.status === 'preparing'">
          <button class="od-btn od-btn--ready" @click="emit('ready', order.id)">
            <v-icon icon="mdi-food-outline" size="16" />
            Заказ готов
          </button>
        </template>

        <!-- Ready: Picked up -->
        <template v-if="order.status === 'ready'">
          <button class="od-btn od-btn--pickup" @click="emit('pickedUp', order.id)">
            <v-icon icon="mdi-check-all" size="16" />
            Курьер забрал
          </button>
        </template>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.od {
  overflow: hidden;
}

/* ── Header ── */
.od-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.od-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.od-header__number {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.3px;
}

/* ── Info bar ── */
.od-info-bar {
  display: flex;
  gap: 8px;
  padding: 14px 24px 16px;
  flex-wrap: wrap;
}

.od-info-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 8px;
  background: #f3f4f6;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

/* ── Body ── */
.od-body {
  padding: 0 !important;
}

/* ── Sections ── */
.od-section {
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.od-section--last {
  border-bottom: none;
}

.od-section__title {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 14px;
}

/* ── Customer ── */
.od-customer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.od-customer__avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #EA004B, #ff4081);
  color: white;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.od-customer__name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

.od-customer__phone {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6b7280;
  text-decoration: none;
  transition: color 0.1s;
}

.od-customer__phone:hover {
  color: #EA004B;
}

.od-address {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 10px;
  margin-bottom: 8px;
}

.od-address__text {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.od-address__detail {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.od-comment {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: #fffbeb;
  border-radius: 10px;
  border: 1px solid #fef3c7;
  font-size: 13px;
  color: #92400e;
}

/* ── Items ── */
.od-items {
  margin-bottom: 14px;
}

.od-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f9fafb;
}

.od-item:last-child {
  border-bottom: none;
}

.od-item__qty {
  font-size: 12px;
  font-weight: 700;
  color: #EA004B;
  background: #fef2f5;
  padding: 2px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}

.od-item__name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
}

.od-item__price {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

/* ── Totals ── */
.od-totals {
  padding: 12px 14px;
  background: #f9fafb;
  border-radius: 12px;
}

.od-totals__row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6b7280;
  padding: 3px 0;
}

.od-totals__row--total {
  padding-top: 10px;
  margin-top: 8px;
  border-top: 1px solid #e5e7eb;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
}

.od-totals__free {
  color: #16a34a;
  font-weight: 500;
}

/* ── Timeline ── */
.od-timeline {
  display: flex;
  gap: 0;
}

.od-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
  min-width: 0;
}

.od-step__dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  transition: all 0.2s;
  flex-shrink: 0;
}

.od-step__line {
  position: absolute;
  top: 14px;
  left: calc(50% + 14px);
  right: calc(-50% + 14px);
  height: 2px;
  background: #e5e7eb;
  transition: background 0.2s;
}

.od-step__line--done {
  background: #16a34a;
}

.od-step__content {
  text-align: center;
  margin-top: 8px;
}

.od-step__label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.od-step--done .od-step__label {
  color: #374151;
}

.od-step__time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 1px;
}

/* ── Reject reason ── */
.od-reject {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0 24px 20px;
  padding: 14px 16px;
  background: #fef2f2;
  border-radius: 12px;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.od-reject__title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 2px;
}

.od-reject__text {
  font-size: 13px;
  color: #991b1b;
}

/* ── Footer ── */
.od-footer {
  display: flex;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
}

.od-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.od-btn--accept {
  background: #16a34a;
  color: white;
}

.od-btn--accept:hover {
  background: #15803d;
}

.od-btn--reject {
  background: #fef2f2;
  color: #dc2626;
}

.od-btn--reject:hover {
  background: #fee2e2;
}

.od-btn--ready {
  background: #F97316;
  color: white;
}

.od-btn--ready:hover {
  background: #ea580c;
}

.od-btn--pickup {
  background: #EA004B;
  color: white;
}

.od-btn--pickup:hover {
  background: #c00040;
}
</style>
