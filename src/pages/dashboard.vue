<script lang="ts" setup>
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type TooltipItem,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'
import { useOrdersStore } from '@/stores/orders'
import { useMenuStore } from '@/stores/menu'
import { useRestaurantStore } from '@/stores/restaurant'
import { useAuthStore } from '@/stores/auth'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const ordersStore = useOrdersStore()
const menuStore = useMenuStore()
const restaurantStore = useRestaurantStore()
const authStore = useAuthStore()

onMounted(async () => {
  await Promise.all([
    ordersStore.loadOrders(),
    menuStore.loadMenu(),
    restaurantStore.loadRestaurant(),
  ])
})

// Greeting
const greeting = computed(() => {
  const name = authStore.userName?.split(' ')[0] || 'Партнёр'
  return `Привет, ${name}! Добро пожаловать.`
})

const todayDate = computed(() => {
  return new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

// Stat cards
const stats = computed(() => [
  {
    label: 'Заказов сегодня',
    value: ordersStore.todayOrdersCount,
    icon: 'mdi-receipt-text-outline',
    iconBg: '#fff3e0',
    iconColor: '#F97316',
    trend: '+12%',
    trendUp: true,
  },
  {
    label: 'Клиентов',
    value: 1248,
    icon: 'mdi-account-group-outline',
    iconBg: '#e8f5e9',
    iconColor: '#16a34a',
    trend: '+5%',
    trendUp: true,
  },
  {
    label: 'Выручка сегодня',
    value: ordersStore.todayRevenue.toLocaleString('ru-RU') + ' ₽',
    icon: 'mdi-cash-multiple',
    iconBg: '#fce4ec',
    iconColor: '#EA004B',
    trend: '+8%',
    trendUp: true,
  },
])

// Revenue line chart
const revenueLabels = ['Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт']
const revenueChartData = computed(() => ({
  labels: revenueLabels,
  datasets: [
    {
      label: 'Доход',
      data: [82000, 95000, 110000, 98000, 145000, 132000, 119000, 155000],
      borderColor: '#EA004B',
      backgroundColor: 'rgba(234,0,75,0.08)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#EA004B',
      pointRadius: 4,
    },
    {
      label: 'Расход',
      data: [45000, 52000, 60000, 55000, 72000, 68000, 63000, 78000],
      borderColor: '#94a3b8',
      backgroundColor: 'rgba(148,163,184,0.05)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#94a3b8',
      pointRadius: 4,
    },
  ],
}))

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'top' as const },
    tooltip: { mode: 'index' as const, intersect: false },
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: {
        callback: (v: string | number) => {
          const num = typeof v === 'number' ? v : parseFloat(v)
          return num >= 1000 ? (num / 1000).toFixed(0) + 'k' : String(v)
        },
      },
    },
  },
}

// Doughnut chart (categories)
const categoryChartData = computed(() => {
  const catCounts: Record<string, number> = {}
  menuStore.items.forEach(item => {
    const cat = menuStore.categories.find(c => c.id === item.category)
    const name = cat?.name ?? 'Другое'
    catCounts[name] = (catCounts[name] ?? 0) + 1
  })

  const labels = Object.keys(catCounts)
  const data = Object.values(catCounts)
  const total = data.reduce((s, v) => s + v, 0)

  return {
    labels: labels.map((l, i) => {
      const pct = total > 0 ? Math.round((data[i]! / total) * 100) : 0
      return `${l} ${pct}%`
    }),
    datasets: [
      {
        data,
        backgroundColor: ['#EA004B', '#F97316', '#3b82f6', '#16a34a', '#8b5cf6'],
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: { display: true, position: 'bottom' as const },
  },
}

// Bar chart (orders by weekday)
const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const currentWeekday = new Date().getDay() // 0=Sun
const todayIdx = currentWeekday === 0 ? 6 : currentWeekday - 1

const ordersBarData = computed(() => ({
  labels: weekDays,
  datasets: [
    {
      label: 'Заказы',
      data: [45, 72, 88, 120, 98, 135, 62],
      backgroundColor: weekDays.map((_, i) =>
        i === todayIdx ? '#EA004B' : 'rgba(234,0,75,0.15)',
      ),
      borderRadius: 8,
      borderSkipped: false,
    },
  ],
}))

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: TooltipItem<'bar'>) => `${ctx.parsed.y ?? 0} заказов`,
      },
    },
  },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true },
  },
}

// Order types
const orderTypes = [
  { label: 'Доставка', icon: 'mdi-moped', count: 520, total: 1000, color: '#EA004B' },
  { label: 'Самовывоз', icon: 'mdi-bag-personal-outline', count: 310, total: 1000, color: '#F97316' },
  { label: 'В зале', icon: 'mdi-silverware-fork-knife', count: 170, total: 1000, color: '#3b82f6' },
]

// Recent orders
const recentOrders = computed(() =>
  ordersStore.orders
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8),
)

const tableHeaders = [
  { key: 'orderNumber', title: '№', width: '70px' },
  { key: 'items', title: 'Позиция' },
  { key: 'itemsCount', title: 'Кол-во', align: 'center' as const, width: '80px' },
  { key: 'totalPrice', title: 'Сумма', align: 'end' as const },
  { key: 'customer.name', title: 'Клиент' },
  { key: 'status', title: 'Статус' },
]

// Reviews mock
const reviews = [
  {
    id: 1,
    author: 'Мария С.',
    date: '12 фев, 2026',
    rating: 5,
    text: 'Очень вкусная еда! Хычины просто объедение — хрустящие, с ароматной начинкой. Очень рекомендую.',
  },
  {
    id: 2,
    author: 'Алексей Р.',
    date: '10 фев, 2026',
    rating: 4,
    text: 'Отличная кухня, быстрая доставка. Лобиани был горячим, как будто только из печи. Супы наваристые.',
  },
  {
    id: 3,
    author: 'Диана К.',
    date: '8 фев, 2026',
    rating: 5,
    text: 'Заказывала харчо и хинкали — всё на высшем уровне. Порции большие, цена адекватная.',
  },
]
</script>

<template>
  <div class="px-8 py-6">
    <!-- Greeting -->
    <div class="mb-6">
      <h2 class="text-h5 font-weight-bold">{{ greeting }}</h2>
      <p class="text-body-2 text-medium-emphasis mt-1" style="text-transform: capitalize">
        {{ todayDate }}
      </p>
    </div>

    <!-- Stat Cards -->
    <v-row class="mb-6" dense>
      <v-col v-for="s in stats" :key="s.label" cols="12" md="4">
        <v-card flat rounded="xl" class="pa-5">
          <div class="d-flex align-center justify-space-between">
            <div>
              <p class="text-caption text-medium-emphasis mb-1">{{ s.label }}</p>
              <p class="text-h4 font-weight-bold">{{ s.value }}</p>
              <v-chip
                :color="s.trendUp ? 'success' : 'error'"
                size="x-small"
                class="mt-2 font-weight-bold"
                label
              >
                <v-icon start :icon="s.trendUp ? 'mdi-trending-up' : 'mdi-trending-down'" size="12" />
                {{ s.trend }}
              </v-chip>
            </div>
            <div
              class="d-flex align-center justify-center rounded-xl"
              :style="{ width: '56px', height: '56px', backgroundColor: s.iconBg }"
            >
              <v-icon :icon="s.icon" :color="s.iconColor" size="28" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Revenue + Categories -->
    <v-row class="mb-6" dense>
      <!-- Line chart -->
      <v-col cols="12" md="8">
        <v-card flat rounded="xl" class="pa-5 h-100">
          <div class="d-flex align-center justify-space-between mb-4">
            <div>
              <p class="text-subtitle-1 font-weight-bold">Общая выручка</p>
              <p class="text-caption text-medium-emphasis">Последние 8 месяцев</p>
            </div>
          </div>
          <div style="height: 220px">
            <Line :data="revenueChartData" :options="lineChartOptions" />
          </div>
        </v-card>
      </v-col>

      <!-- Doughnut chart -->
      <v-col cols="12" md="4">
        <v-card flat rounded="xl" class="pa-5 h-100">
          <p class="text-subtitle-1 font-weight-bold mb-1">Топ категорий</p>
          <p class="text-caption text-medium-emphasis mb-3">За этот месяц</p>
          <div style="height: 220px">
            <Doughnut :data="categoryChartData" :options="doughnutOptions" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Orders bar + Order types -->
    <v-row class="mb-6" dense>
      <!-- Bar chart -->
      <v-col cols="12" md="8">
        <v-card flat rounded="xl" class="pa-5 h-100">
          <div class="d-flex align-center justify-space-between mb-4">
            <div>
              <p class="text-subtitle-1 font-weight-bold">Обзор заказов</p>
              <p class="text-caption text-medium-emphasis">Текущая неделя</p>
            </div>
          </div>
          <div style="height: 200px">
            <Bar :data="ordersBarData" :options="barChartOptions" />
          </div>
        </v-card>
      </v-col>

      <!-- Order types -->
      <v-col cols="12" md="4">
        <v-card flat rounded="xl" class="pa-5 h-100">
          <p class="text-subtitle-1 font-weight-bold mb-1">Типы заказов</p>
          <p class="text-caption text-medium-emphasis mb-5">За этот месяц</p>

          <div v-for="ot in orderTypes" :key="ot.label" class="mb-5">
            <div class="d-flex align-center justify-space-between mb-1">
              <div class="d-flex align-center ga-2">
                <div
                  class="d-flex align-center justify-center rounded-lg"
                  :style="{ width: '32px', height: '32px', backgroundColor: ot.color + '18' }"
                >
                  <v-icon :icon="ot.icon" :color="ot.color" size="18" />
                </div>
                <span class="text-body-2 font-weight-medium">{{ ot.label }}</span>
              </div>
              <span class="text-body-2 font-weight-bold">{{ ot.count }}</span>
            </div>
            <v-progress-linear
              :model-value="(ot.count / ot.total) * 100"
              :color="ot.color"
              rounded
              height="6"
              bg-color="rgba(0,0,0,0.06)"
            />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Orders table -->
    <v-card flat rounded="xl" class="mb-6">
      <v-card-title class="d-flex align-center justify-space-between py-4 px-5">
        <div>
          <p class="text-subtitle-1 font-weight-bold">Недавние заказы</p>
          <p class="text-caption text-medium-emphasis">Последние 8 заказов</p>
        </div>
        <router-link to="/orders" class="text-decoration-none">
          <v-btn flat variant="outlined" rounded="lg" size="small">
            Все заказы
            <v-icon icon="mdi-arrow-top-right" size="16" class="ml-1" />
          </v-btn>
        </router-link>
      </v-card-title>

      <v-divider />

      <v-data-table
        :items="recentOrders"
        :headers="tableHeaders"
        :items-per-page="8"
        hide-default-footer
      >
        <template #item.orderNumber="{ item }">
          <span class="font-weight-bold text-medium-emphasis">#{{ item.orderNumber }}</span>
        </template>

        <template #item.items="{ item }">
          <div class="d-flex align-center ga-3 py-2">
            <div
              class="d-flex align-center justify-center rounded-lg"
              style="width: 40px; height: 40px; background: #f9f4f0; flex-shrink: 0"
            >
              <v-icon icon="mdi-food" color="warning" size="20" />
            </div>
            <div>
              <p class="text-body-2 font-weight-medium">
                {{ item.items[0]?.name ?? '—' }}
              </p>
              <p class="text-caption text-medium-emphasis">
                {{ item.items.length > 1 ? `+${item.items.length - 1} ещё` : '' }}
              </p>
            </div>
          </div>
        </template>

        <template #item.itemsCount="{ item }">
          <span class="text-medium-emphasis">{{ item.items.length }}</span>
        </template>

        <template #item.totalPrice="{ item }">
          <span class="font-weight-bold" style="color: #EA004B">
            {{ item.totalPrice.toLocaleString('ru-RU') }} ₽
          </span>
        </template>

        <template #item.customer.name="{ item }">
          <span class="text-body-2">{{ item.customer.name }}</span>
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

    <!-- Customer Reviews -->
    <div>
      <div class="d-flex align-center justify-space-between mb-4">
        <p class="text-subtitle-1 font-weight-bold">Отзывы клиентов</p>
        <router-link to="/reviews" class="text-decoration-none">
          <v-btn flat variant="text" size="small" color="primary">
            Смотреть все
            <v-icon icon="mdi-arrow-right" size="16" class="ml-1" />
          </v-btn>
        </router-link>
      </div>

      <v-row dense>
        <v-col v-for="r in reviews" :key="r.id" cols="12" md="4">
          <v-card flat rounded="xl" class="pa-5 h-100">
            <p class="text-body-2 text-medium-emphasis mb-4" style="line-height: 1.6">
              "{{ r.text }}"
            </p>
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center ga-2">
                <v-avatar color="primary" size="32">
                  <span class="text-caption text-white font-weight-bold">
                    {{ r.author.split(' ').map(n => n[0]).join('') }}
                  </span>
                </v-avatar>
                <div>
                  <p class="text-body-2 font-weight-medium">{{ r.author }}</p>
                  <p class="text-caption text-medium-emphasis">{{ r.date }}</p>
                </div>
              </div>
              <v-rating
                :model-value="r.rating"
                color="warning"
                size="14"
                readonly
                density="compact"
              />
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>
