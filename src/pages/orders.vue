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

const ORDER_TYPE_ICONS: Record<OrderType, string> = {
  delivery: 'mdi-moped',
  pickup: 'mdi-walk',
  dine_in: 'mdi-silverware-fork-knife',
}

const tableHeaders = [
  { key: 'orderNumber', title: '№ заказа', width: '110px' },
  { key: 'createdAt', title: 'Дата' },
  { key: 'customer.name', title: 'Клиент' },
  { key: 'orderType', title: 'Тип', width: '140px' },
  { key: 'itemsCount', title: 'Позиции', align: 'center' as const, width: '90px' },
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

function formatTimeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'только что'
  if (min < 60) return `${min} мин назад`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours} ч назад`
  return `${Math.floor(hours / 24)} дн назад`
}

const statusFilterCounts = computed(() => ({
  all: ordersStore.orders.length,
  preparing: ordersStore.orders.filter(o => o.status === 'incoming' || o.status === 'preparing' || o.status === 'ready').length,
  completed: ordersStore.completedOrders.length,
  rejected: ordersStore.rejectedOrders.length,
}))
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
    <v-card flat rounded="xl" class="ot-card">
      <div class="ot-toolbar">
        <div class="ot-filters">
          <div
            v-for="f in statusFilters"
            :key="f.value"
            class="ot-filter"
            :class="{ 'ot-filter--active': ordersStore.statusFilter === f.value }"
            @click="ordersStore.statusFilter = f.value"
          >
            {{ f.label }}
            <span class="ot-filter__count">{{ statusFilterCounts[f.value] }}</span>
          </div>
        </div>

        <v-text-field
          v-model="search"
          placeholder="Поиск по ID, клиенту..."
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-magnify"
          rounded="lg"
          hide-details
          class="ot-search"
          bg-color="white"
        />
      </div>

      <v-divider />

      <!-- Empty state -->
      <div v-if="filteredOrders.length === 0" class="ot-empty">
        <v-icon icon="mdi-receipt-text-clock-outline" size="44" color="grey-lighten-2" />
        <p class="text-body-2 text-medium-emphasis mt-3">Нет заказов по выбранному фильтру</p>
      </div>

      <!-- Table -->
      <v-data-table
        v-else
        :items="filteredOrders"
        :headers="tableHeaders"
        hover
        class="ot-table"
        @click:row="(_: any, { item }: any) => openDetails(item)"
      >
        <template #item.orderNumber="{ item }">
          <span class="ot-order-id">#{{ item.orderNumber }}</span>
        </template>

        <template #item.createdAt="{ item }">
          <div>
            <p class="ot-date">{{ formatDate(item.createdAt) }}, {{ formatTime(item.createdAt) }}</p>
            <p class="ot-date-ago">{{ formatTimeAgo(item.createdAt) }}</p>
          </div>
        </template>

        <template #item.customer.name="{ item }">
          <div class="d-flex align-center ga-3">
            <div class="ot-avatar">{{ item.customer.name.charAt(0) }}</div>
            <div>
              <p class="ot-customer-name">{{ item.customer.name }}</p>
              <p class="ot-customer-phone">{{ item.customer.phone }}</p>
            </div>
          </div>
        </template>

        <template #item.orderType="{ item }">
          <div class="ot-type-pill" :style="{ '--type-color': ORDER_TYPE_COLORS[item.orderType] }">
            <v-icon :icon="ORDER_TYPE_ICONS[item.orderType]" size="13" />
            {{ ORDER_TYPE_LABELS[item.orderType] }}
          </div>
        </template>

        <template #item.itemsCount="{ item }">
          <span class="ot-items-count">{{ item.itemsCount }}</span>
        </template>

        <template #item.totalPrice="{ item }">
          <span class="ot-price">{{ item.totalPrice.toLocaleString('ru-RU') }} ₽</span>
        </template>

        <template #item.status="{ item }">
          <div class="ot-status" :class="'ot-status--' + item.status">
            <span class="ot-status__dot" />
            {{ ORDER_STATUS_LABELS[item.status] }}
          </div>
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

<style scoped>
/* ── Card ── */
.ot-card {
  overflow: hidden;
}

/* ── Toolbar ── */
.ot-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  gap: 16px;
}

.ot-filters {
  display: flex;
  gap: 6px;
}

.ot-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.12s;
  user-select: none;
  white-space: nowrap;
}

.ot-filter:hover {
  background: #f3f4f6;
}

.ot-filter--active {
  background: #EA004B;
  color: white;
}

.ot-filter__count {
  font-size: 11px;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.06);
}

.ot-filter--active .ot-filter__count {
  background: rgba(255, 255, 255, 0.25);
}

.ot-search {
  max-width: 280px;
}

/* ── Empty ── */
.ot-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 0;
}

/* ── Table ── */
.ot-table {
  cursor: pointer;
}

.ot-table :deep(th) {
  font-size: 12px !important;
  font-weight: 600 !important;
  color: #9ca3af !important;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  white-space: nowrap;
}

.ot-table :deep(td) {
  padding-top: 14px !important;
  padding-bottom: 14px !important;
  border-bottom: 1px solid #f5f5f5 !important;
}

.ot-table :deep(tr:hover td) {
  background: #fafafa !important;
}

/* ── Order ID ── */
.ot-order-id {
  font-size: 13px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.2px;
}

/* ── Date ── */
.ot-date {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.ot-date-ago {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 1px;
}

/* ── Customer ── */
.ot-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, #EA004B, #ff4081);
  color: white;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ot-customer-name {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
}

.ot-customer-phone {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 1px;
}

/* ── Type pill ── */
.ot-type-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--type-color);
  background: color-mix(in srgb, var(--type-color) 10%, transparent);
}

/* ── Items count ── */
.ot-items-count {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #f3f4f6;
}

/* ── Price ── */
.ot-price {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
  white-space: nowrap;
}

/* ── Status ── */
.ot-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 8px;
  white-space: nowrap;
}

.ot-status__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ot-status--incoming {
  color: #1976d2;
  background: #e3f2fd;
}

.ot-status--incoming .ot-status__dot {
  background: #1976d2;
  animation: pulse 1.5s infinite;
}

.ot-status--preparing {
  color: #e65100;
  background: #fff3e0;
}

.ot-status--preparing .ot-status__dot {
  background: #F97316;
  animation: pulse 1.5s infinite;
}

.ot-status--ready {
  color: #16a34a;
  background: #e8f5e9;
}

.ot-status--ready .ot-status__dot {
  background: #16a34a;
}

.ot-status--completed {
  color: #6b7280;
  background: #f3f4f6;
}

.ot-status--completed .ot-status__dot {
  background: #9ca3af;
}

.ot-status--rejected {
  color: #dc2626;
  background: #fef2f2;
}

.ot-status--rejected .ot-status__dot {
  background: #dc2626;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
