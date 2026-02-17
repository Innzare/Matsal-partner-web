<script lang="ts" setup>
import type { PartnerOrder } from '@/types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'

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

function formatTime(date?: string): string {
  if (!date) return '—'
  return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const timeline = computed(() => {
  if (!props.order) return []
  const items = [
    { title: 'Заказ создан', time: formatTime(props.order.createdAt), active: true },
  ]
  if (props.order.acceptedAt || props.order.status !== 'incoming') {
    items.push({ title: 'Принят', time: formatTime(props.order.acceptedAt), active: !!props.order.acceptedAt })
  }
  if (props.order.readyAt || ['ready', 'completed'].includes(props.order.status)) {
    items.push({ title: 'Готов', time: formatTime(props.order.readyAt), active: !!props.order.readyAt })
  }
  if (props.order.completedAt || props.order.status === 'completed') {
    items.push({ title: 'Завершён', time: formatTime(props.order.completedAt), active: !!props.order.completedAt })
  }
  if (props.order.rejectedAt) {
    items.push({ title: 'Отклонён', time: formatTime(props.order.rejectedAt), active: true })
  }
  return items
})
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="600"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card v-if="order" rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between pt-5 px-6">
        <div>
          <span class="text-h6">Заказ #{{ order.orderNumber }}</span>
          <v-chip
            :color="ORDER_STATUS_COLORS[order.status]"
            :text="ORDER_STATUS_LABELS[order.status]"
            size="small"
            label
            class="ml-3 font-weight-bold"
          />
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" @click="emit('update:modelValue', false)" />
      </v-card-title>

      <v-card-text class="px-6">
        <!-- Клиент -->
        <div class="mb-4">
          <p class="text-caption text-grey-darken-1 mb-1">Клиент</p>
          <p class="font-weight-medium">{{ order.customer.name }}</p>
          <p class="text-body-2">{{ order.customer.address }}</p>
          <p v-if="order.customer.floor" class="text-body-2 text-grey">
            Этаж {{ order.customer.floor }}, кв. {{ order.customer.apartment }}
          </p>
          <p class="text-body-2">{{ order.customer.phone }}</p>
          <p v-if="order.customer.comment" class="text-body-2 text-orange mt-1">
            <v-icon icon="mdi-message-text" size="14" class="mr-1" />
            {{ order.customer.comment }}
          </p>
        </div>

        <v-divider class="mb-4" />

        <!-- Позиции -->
        <div class="mb-4">
          <p class="text-caption text-grey-darken-1 mb-2">Позиции</p>
          <div
            v-for="(item, i) in order.items"
            :key="i"
            class="d-flex justify-space-between align-center py-1"
          >
            <div>
              <span class="text-body-2">{{ item.name }}</span>
              <span class="text-caption text-grey ml-2">x{{ item.quantity }}</span>
            </div>
            <span class="text-body-2 font-weight-medium">{{ item.price * item.quantity }} ₽</span>
          </div>

          <v-divider class="my-2" />
          <div class="d-flex justify-space-between">
            <span class="text-body-2 text-grey">Доставка</span>
            <span class="text-body-2">{{ order.deliveryFee ? order.deliveryFee + ' ₽' : 'Бесплатно' }}</span>
          </div>
          <div class="d-flex justify-space-between mt-1">
            <span class="font-weight-bold">Итого</span>
            <span class="font-weight-bold text-h6">{{ order.totalPrice + order.deliveryFee }} ₽</span>
          </div>
        </div>

        <v-divider class="mb-4" />

        <!-- Таймлайн -->
        <div class="mb-2">
          <p class="text-caption text-grey-darken-1 mb-2">Хронология</p>
          <v-timeline density="compact" side="end" truncate-line="both">
            <v-timeline-item
              v-for="(item, i) in timeline"
              :key="i"
              :dot-color="item.active ? 'green' : 'grey-lighten-2'"
              size="x-small"
            >
              <div class="d-flex align-center ga-2">
                <span class="text-body-2">{{ item.title }}</span>
                <span class="text-caption text-grey">{{ item.time }}</span>
              </div>
            </v-timeline-item>
          </v-timeline>
        </div>

        <!-- Причина отклонения -->
        <v-alert
          v-if="order.rejectReason"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-3"
        >
          Причина: {{ order.rejectReason }}
        </v-alert>

        <p class="text-caption text-grey mt-2">
          Создан: {{ formatDateTime(order.createdAt) }}
        </p>
      </v-card-text>

      <v-card-actions class="px-6 pb-5">
        <v-btn
          v-if="order.status === 'incoming'"
          color="red"
          variant="outlined"
          @click="emit('reject', order.id)"
        >
          Отклонить
        </v-btn>
        <v-spacer />
        <v-btn
          v-if="order.status === 'incoming'"
          color="green"
          variant="flat"
          @click="emit('accept', order.id)"
        >
          Принять заказ
        </v-btn>
        <v-btn
          v-if="order.status === 'preparing'"
          color="green"
          variant="flat"
          @click="emit('ready', order.id)"
        >
          Готов к выдаче
        </v-btn>
        <v-btn
          v-if="order.status === 'ready'"
          color="primary"
          variant="flat"
          @click="emit('pickedUp', order.id)"
        >
          Курьер забрал
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
