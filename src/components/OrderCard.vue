<script lang="ts" setup>
import type { PartnerOrder } from '@/types'

defineProps<{
  order: PartnerOrder
}>()

const emit = defineEmits<{
  click: [order: PartnerOrder]
  accept: [id: string]
  reject: [id: string]
  ready: [id: string]
  pickedUp: [id: string]
}>()

function timeAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (diff < 1) return 'только что'
  if (diff < 60) return `${diff} мин. назад`
  const hours = Math.floor(diff / 60)
  if (hours < 24) return `${hours} ч. назад`
  return `${Math.floor(hours / 24)} дн. назад`
}
</script>

<template>
  <v-card
    class="mb-3 cursor-pointer"
    rounded="lg"
    elevation="1"
    @click="emit('click', order)"
  >
    <v-card-text class="pb-2">
      <div class="d-flex justify-space-between align-center mb-2">
        <span class="font-weight-bold">#{{ order.orderNumber }}</span>
        <span class="text-caption text-grey">{{ timeAgo(order.createdAt) }}</span>
      </div>

      <p class="text-body-2 font-weight-medium">{{ order.customer.name }}</p>
      <p class="text-caption text-grey-darken-1 mb-2">{{ order.customer.address }}</p>

      <div class="d-flex justify-space-between align-center">
        <span class="text-caption text-grey">{{ order.itemsCount }} позиций</span>
        <span class="font-weight-bold">{{ order.totalPrice }} ₽</span>
      </div>
    </v-card-text>

    <v-card-actions v-if="order.status === 'incoming'" class="pt-0 px-4 pb-3">
      <v-btn
        color="red"
        variant="outlined"
        size="small"
        rounded="lg"
        @click.stop="emit('reject', order.id)"
      >
        Отклонить
      </v-btn>
      <v-spacer />
      <v-btn
        color="green"
        variant="flat"
        size="small"
        rounded="lg"
        @click.stop="emit('accept', order.id)"
      >
        Принять
      </v-btn>
    </v-card-actions>

    <v-card-actions v-else-if="order.status === 'preparing'" class="pt-0 px-4 pb-3">
      <v-btn
        color="green"
        variant="flat"
        size="small"
        rounded="lg"
        block
        @click.stop="emit('ready', order.id)"
      >
        Готов к выдаче
      </v-btn>
    </v-card-actions>

    <v-card-actions v-else-if="order.status === 'ready'" class="pt-0 px-4 pb-3">
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        rounded="lg"
        block
        @click.stop="emit('pickedUp', order.id)"
      >
        Курьер забрал
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
