<script lang="ts" setup>
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Doughnut } from 'vue-chartjs'
import { useOrdersStore } from '@/stores/orders'
import type { PartnerOrder, PartnerOrderStatus } from '@/types'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_TYPE_LABELS,
  ORDER_TYPE_COLORS,
} from '@/types'
import type { OrderType } from '@/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const ordersStore = useOrdersStore()

const detailsDialog = ref(false)
const rejectDialog = ref(false)
const rejectOrderId = ref<string | null>(null)
const rejectReason = ref('')
const search = ref('')

onMounted(() => {
  ordersStore.loadOrders()
})

// Stat cards
const statCards = computed(() => [
  {
    label: 'Всего заказов',
    value: ordersStore.orders.length,
    icon: 'mdi-receipt-text-outline',
    iconBg: '#fff3e0',
    iconColor: '#F97316',
  },
  {
    label: 'В обработке',
    value: ordersStore.incomingOrders.length + ordersStore.preparingOrders.length,
    icon: 'mdi-progress-clock',
    iconBg: '#e3f2fd',
    iconColor: '#1976d2',
  },
  {
    label: 'Завершённых',
    value: ordersStore.completedOrders.length,
    icon: 'mdi-check-circle-outline',
    iconBg: '#e8f5e9',
    iconColor: '#16a34a',
  },
  {
    label: 'Отклонённых',
    value: ordersStore.rejectedOrders.length,
    icon: 'mdi-close-circle-outline',
    iconBg: '#fce4ec',
    iconColor: '#EA004B',
  },
])

// Line chart — orders overview by day of week
const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const lineChartData = computed(() => ({
  labels: weekDays,
  datasets: [
    {
      label: 'Заказы',
      data: [25, 48, 62, 55, 85, 72, 40],
      borderColor: '#F97316',
      backgroundColor: 'rgba(249,115,22,0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#F97316',
      pointRadius: 4,
    },
  ],
}))

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true },
  },
}

// Doughnut — order types
const orderTypeCounts = computed(() => {
  const counts: Record<OrderType, number> = { delivery: 0, pickup: 0, dine_in: 0 }
  ordersStore.orders.forEach(o => {
    counts[o.orderType] = (counts[o.orderType] ?? 0) + 1
  })
  return counts
})

const doughnutData = computed(() => ({
  labels: [ORDER_TYPE_LABELS.delivery, ORDER_TYPE_LABELS.pickup, ORDER_TYPE_LABELS.dine_in],
  datasets: [
    {
      data: [orderTypeCounts.value.delivery, orderTypeCounts.value.pickup, orderTypeCounts.value.dine_in],
      backgroundColor: [ORDER_TYPE_COLORS.delivery, ORDER_TYPE_COLORS.pickup, ORDER_TYPE_COLORS.dine_in],
      borderWidth: 0,
      hoverOffset: 6,
    },
  ],
}))

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: { display: false },
  },
}

// Status filter
const statusFilters: { value: PartnerOrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'preparing', label: 'В обработке' },
  { value: 'completed', label: 'Завершённые' },
  { value: 'rejected', label: 'Отклонённые' },
]

// Filtered + sorted orders
const filteredOrders = computed(() => {
  let result = ordersStore.orders.slice()

  if (ordersStore.statusFilter !== 'all') {
    if (ordersStore.statusFilter === 'preparing') {
      result = result.filter(o => o.status === 'incoming' || o.status === 'preparing' || o.status === 'ready')
    } else {
      result = result.filter(o => o.status === ordersStore.statusFilter)
    }
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(o =>
      o.orderNumber.toString().includes(q) ||
      o.customer.name.toLowerCase().includes(q),
    )
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const tableHeaders = [
  { key: 'orderNumber', title: 'Order ID', width: '100px' },
  { key: 'createdAt', title: 'Дата' },
  { key: 'customer.name', title: 'Клиент' },
  { key: 'orderType', title: 'Тип заказа' },
  { key: 'customer.address', title: 'Адрес' },
  { key: 'itemsCount', title: 'Кол-во', align: 'center' as const, width: '80px' },
  { key: 'totalPrice', title: 'Сумма', align: 'end' as const },
  { key: 'status', title: 'Статус', width: '140px' },
]

// Actions
const openDetails = (order: PartnerOrder) => {
  ordersStore.selectedOrder = order
  detailsDialog.value = true
}

const acceptOrder = (id: string) => {
  ordersStore.acceptOrder(id)
  detailsDialog.value = false
}

const openRejectDialog = (id: string) => {
  rejectOrderId.value = id
  rejectReason.value = ''
  rejectDialog.value = true
}

const confirmReject = () => {
  if (rejectOrderId.value && rejectReason.value.trim()) {
    ordersStore.rejectOrder(rejectOrderId.value, rejectReason.value)
    rejectDialog.value = false
    detailsDialog.value = false
    rejectOrderId.value = null
  }
}

const markReady = (id: string) => {
  ordersStore.markReady(id)
  detailsDialog.value = false
}

const markPickedUp = (id: string) => {
  ordersStore.markPickedUp(id)
  detailsDialog.value = false
}

function formatDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="px-8 py-6">
    <!-- Top section: Stats + Charts -->
    <v-row dense class="mb-6">
      <!-- Stat cards 2x2 grid -->
      <v-col cols="12" md="4">
        <v-row dense class="h-100">
          <v-col v-for="s in statCards" :key="s.label" cols="6">
            <v-card flat rounded="xl" class="pa-4 h-100">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <p class="text-h5 font-weight-bold">{{ s.value }}</p>
                  <p class="text-caption text-medium-emphasis">{{ s.label }}</p>
                </div>
                <div
                  class="d-flex align-center justify-center rounded-xl"
                  :style="{ width: '44px', height: '44px', backgroundColor: s.iconBg }"
                >
                  <v-icon :icon="s.icon" :color="s.iconColor" size="22" />
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <!-- Orders Overview line chart -->
      <v-col cols="12" md="5">
        <v-card flat rounded="xl" class="pa-5 h-100">
          <div class="d-flex align-center justify-space-between mb-3">
            <p class="text-subtitle-1 font-weight-bold">Обзор заказов</p>
            <v-chip size="small" variant="outlined" color="grey">На этой неделе</v-chip>
          </div>
          <div style="height: 140px">
            <Line :data="lineChartData" :options="lineChartOptions" />
          </div>
        </v-card>
      </v-col>

      <!-- Order Types doughnut -->
      <v-col cols="12" md="3">
        <v-card flat rounded="xl" class="pa-5 h-100">
          <div class="d-flex align-center justify-space-between mb-3">
            <p class="text-subtitle-1 font-weight-bold">Типы заказов</p>
          </div>
          <div class="d-flex align-center ga-4">
            <div style="width: 120px; height: 120px; position: relative">
              <Doughnut :data="doughnutData" :options="doughnutOptions" />
              <div class="d-flex flex-column align-center justify-center" style="position: absolute; inset: 0; pointer-events: none">
                <span class="text-caption text-medium-emphasis">Всего</span>
                <span class="text-h6 font-weight-bold">{{ ordersStore.orders.length }}</span>
              </div>
            </div>
            <div class="d-flex flex-column ga-3">
              <div v-for="(type, key) in ORDER_TYPE_LABELS" :key="key" class="d-flex align-center ga-2">
                <div
                  class="rounded-circle"
                  :style="{ width: '10px', height: '10px', backgroundColor: ORDER_TYPE_COLORS[key as OrderType] }"
                />
                <div>
                  <p class="text-body-2">{{ type }}</p>
                  <p class="text-subtitle-2 font-weight-bold">{{ orderTypeCounts[key as OrderType] }}</p>
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filter + Search bar -->
    <v-card flat rounded="xl">
      <div class="d-flex align-center justify-space-between pa-4">
        <v-chip-group v-model="ordersStore.statusFilter" mandatory>
          <v-chip
            v-for="f in statusFilters"
            :key="f.value"
            :value="f.value"
            :color="ordersStore.statusFilter === f.value ? 'primary' : undefined"
            :variant="ordersStore.statusFilter === f.value ? 'flat' : 'outlined'"
            size="small"
          >
            {{ f.label }}
          </v-chip>
        </v-chip-group>

        <div class="d-flex align-center ga-3">
          <v-text-field
            v-model="search"
            placeholder="Поиск по ID, клиенту..."
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-magnify"
            rounded="lg"
            hide-details
            style="min-width: 280px"
            bg-color="white"
          />
        </div>
      </div>

      <v-divider />

      <!-- Table -->
      <v-data-table
        :items="filteredOrders"
        :headers="tableHeaders"
        hover
        class="cursor-pointer"
        @click:row="(_: any, { item }: any) => openDetails(item)"
      >
        <template #item.orderNumber="{ item }">
          <span class="font-weight-bold text-body-2">ORD{{ item.orderNumber }}</span>
        </template>

        <template #item.createdAt="{ item }">
          <div>
            <p class="text-body-2">{{ formatDate(item.createdAt) }}</p>
            <p class="text-caption text-medium-emphasis">{{ formatTime(item.createdAt) }}</p>
          </div>
        </template>

        <template #item.customer.name="{ item }">
          <span class="text-body-2">{{ item.customer.name }}</span>
        </template>

        <template #item.orderType="{ item }">
          <div class="d-flex align-center ga-2">
            <div
              class="rounded-circle"
              :style="{ width: '8px', height: '8px', backgroundColor: ORDER_TYPE_COLORS[item.orderType] }"
            />
            <span class="text-body-2">{{ ORDER_TYPE_LABELS[item.orderType] }}</span>
          </div>
        </template>

        <template #item.customer.address="{ item }">
          <span class="text-body-2 text-medium-emphasis">
            {{ item.orderType === 'dine_in' ? '—' : item.customer.address }}
          </span>
        </template>

        <template #item.itemsCount="{ item }">
          <span class="text-body-2">{{ item.itemsCount }}</span>
        </template>

        <template #item.totalPrice="{ item }">
          <span class="font-weight-bold" style="color: #EA004B">
            {{ item.totalPrice.toLocaleString('ru-RU') }} ₽
          </span>
        </template>

        <template #item.status="{ item }">
          <v-chip
            :color="ORDER_STATUS_COLORS[item.status]"
            :text="ORDER_STATUS_LABELS[item.status]"
            size="small"
            label
            class="font-weight-medium"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Details Dialog -->
    <OrderDetailsDialog
      v-model="detailsDialog"
      :order="ordersStore.selectedOrder"
      @accept="acceptOrder"
      @reject="openRejectDialog"
      @ready="markReady"
      @picked-up="markPickedUp"
    />

    <!-- Reject Dialog -->
    <ConfirmDialog
      v-model="rejectDialog"
      title="Отклонить заказ"
      text="Укажите причину отклонения заказа"
      confirm-text="Отклонить"
      confirm-color="red"
      show-input
      input-label="Причина отклонения"
      @confirm="(reason?: string) => { rejectReason = reason || ''; confirmReject() }"
    />
  </div>
</template>
