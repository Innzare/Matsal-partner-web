<script lang="ts" setup>
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'
import type { PartnerOrderStatus } from '@/types'

defineProps<{
  status: PartnerOrderStatus
}>()
</script>

<template>
  <v-chip
    :color="ORDER_STATUS_COLORS[status]"
    :text="ORDER_STATUS_LABELS[status]"
    size="small"
    label
    class="font-weight-bold"
  />
</template>
