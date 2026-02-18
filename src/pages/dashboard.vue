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
} from "chart.js";
import { Line, Bar, Doughnut } from "vue-chartjs";
import { useOrdersStore } from "@/stores/orders";
import { useMenuStore } from "@/stores/menu";
import { useRestaurantStore } from "@/stores/restaurant";
import { useAuthStore } from "@/stores/auth";
import {
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  ORDER_TYPE_COLORS,
} from "@/types";
import type { OrderType, PartnerOrderStatus } from "@/types";

const ORDER_TYPE_ICONS: Record<OrderType, string> = {
  delivery: "mdi-moped",
  pickup: "mdi-walk",
  dine_in: "mdi-silverware-fork-knife",
};

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
);

const ordersStore = useOrdersStore();
const menuStore = useMenuStore();
const restaurantStore = useRestaurantStore();
const authStore = useAuthStore();

onMounted(async () => {
  await Promise.all([
    ordersStore.loadOrders(),
    menuStore.loadMenu(),
    restaurantStore.loadRestaurant(),
  ]);
});

// ─── Период аналитики ───
const analyticsPeriod = ref<"today" | "week" | "month">("week");

// ─── Greeting ───
const greeting = computed(() => {
  const hour = new Date().getHours();
  const name = authStore.userName?.split(" ")[0] || "Партнёр";
  if (hour < 12) return `Доброе утро, ${name}`;
  if (hour < 18) return `Добрый день, ${name}`;
  return `Добрый вечер, ${name}`;
});

const todayDate = computed(() =>
  new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
);

// ─── KPI карточки (6 штук) ───
const kpiCards = computed(() => {
  const orders = ordersStore.orders;
  const completed = orders.filter((o) => o.status === "completed");
  const rejected = orders.filter((o) => o.status === "rejected");

  const totalRevenue = completed.reduce((s, o) => s + o.totalPrice, 0);
  const avgCheck =
    completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0;
  const completionRate =
    orders.length > 0
      ? Math.round((completed.length / orders.length) * 100)
      : 0;
  const rejectionRate =
    orders.length > 0 ? Math.round((rejected.length / orders.length) * 100) : 0;

  // Среднее время приготовления (для completed заказов с acceptedAt и readyAt)
  const withPrepTime = completed.filter((o) => o.acceptedAt && o.readyAt);
  const avgPrepMin =
    withPrepTime.length > 0
      ? Math.round(
          withPrepTime.reduce((s, o) => {
            return (
              s +
              (new Date(o.readyAt!).getTime() -
                new Date(o.acceptedAt!).getTime())
            );
          }, 0) /
            withPrepTime.length /
            60000,
        )
      : 0;

  return [
    {
      label: "Выручка",
      value: totalRevenue.toLocaleString("ru-RU") + " ₽",
      icon: "mdi-cash-multiple",
      color: "#16a34a",
      bg: "#e8f5e9",
      trend: "+12.5%",
      trendUp: true,
      subtitle: "vs прошлый период",
    },
    {
      label: "Заказов",
      value: orders.length,
      icon: "mdi-receipt-text-outline",
      color: "#F97316",
      bg: "#fff3e0",
      trend: "+8%",
      trendUp: true,
      subtitle: "всего за период",
    },
    {
      label: "Средний чек",
      value: avgCheck.toLocaleString("ru-RU") + " ₽",
      icon: "mdi-chart-line",
      color: "#EA004B",
      bg: "#fce4ec",
      trend: "+3.2%",
      trendUp: true,
      subtitle: "по завершённым",
    },
    {
      label: "Время готовки",
      value: avgPrepMin + " мин",
      icon: "mdi-timer-outline",
      color: "#8b5cf6",
      bg: "#f3e8ff",
      trend: "-2 мин",
      trendUp: true,
      subtitle: "среднее",
    },
    {
      label: "Выполнение",
      value: completionRate + "%",
      icon: "mdi-check-circle-outline",
      color: "#1976d2",
      bg: "#e3f2fd",
      trend: completionRate >= 90 ? "Отлично" : "Норма",
      trendUp: completionRate >= 80,
      subtitle: "заказов завершено",
    },
    {
      label: "Отклонения",
      value: rejectionRate + "%",
      icon: "mdi-close-circle-outline",
      color: rejectionRate > 15 ? "#dc2626" : "#64748b",
      bg: rejectionRate > 15 ? "#fef2f2" : "#f1f5f9",
      trend: rejectionRate > 15 ? "Высокий" : "Норма",
      trendUp: rejectionRate <= 15,
      subtitle: `${rejected.length} из ${orders.length}`,
    },
  ];
});

// ─── Revenue chart (12 недель) ───
const revenueLabels = [
  "Нед 1",
  "Нед 2",
  "Нед 3",
  "Нед 4",
  "Нед 5",
  "Нед 6",
  "Нед 7",
  "Нед 8",
  "Нед 9",
  "Нед 10",
  "Нед 11",
  "Нед 12",
];
const revenueChartData = computed(() => ({
  labels: revenueLabels,
  datasets: [
    {
      label: "Доход",
      data: [
        62000, 78000, 95000, 88000, 110000, 98000, 125000, 115000, 145000,
        132000, 155000, 168000,
      ],
      borderColor: "#EA004B",
      backgroundColor: "rgba(234,0,75,0.06)",
      tension: 0.4,
      fill: true,
      pointBackgroundColor: "#EA004B",
      pointRadius: 3,
      pointHoverRadius: 6,
      borderWidth: 2.5,
    },
    {
      label: "Расход",
      data: [
        35000, 42000, 48000, 45000, 55000, 52000, 62000, 58000, 72000, 68000,
        78000, 82000,
      ],
      borderColor: "#94a3b8",
      backgroundColor: "rgba(148,163,184,0.04)",
      tension: 0.4,
      fill: true,
      pointBackgroundColor: "#94a3b8",
      pointRadius: 3,
      pointHoverRadius: 6,
      borderWidth: 2,
      borderDash: [6, 4],
    },
  ],
}));

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index" as const, intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: "index" as const,
      intersect: false,
      callbacks: {
        label: (ctx: TooltipItem<"line">) =>
          `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString("ru-RU")} ₽`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: {
      grid: { color: "rgba(0,0,0,0.04)" },
      ticks: {
        font: { size: 11 },
        callback: (v: string | number) => {
          const num = typeof v === "number" ? v : parseFloat(v);
          return num >= 1000 ? (num / 1000).toFixed(0) + "k" : String(v);
        },
      },
    },
  },
};

// Revenue summary numbers
const revenueSummary = computed(() => {
  const income = [
    62000, 78000, 95000, 88000, 110000, 98000, 125000, 115000, 145000, 132000,
    155000, 168000,
  ];
  const expense = [
    35000, 42000, 48000, 45000, 55000, 52000, 62000, 58000, 72000, 68000, 78000,
    82000,
  ];
  const totalIncome = income.reduce((a, b) => a + b, 0);
  const totalExpense = expense.reduce((a, b) => a + b, 0);
  return {
    income: totalIncome,
    expense: totalExpense,
    profit: totalIncome - totalExpense,
    margin: Math.round(((totalIncome - totalExpense) / totalIncome) * 100),
  };
});

// ─── Hourly orders heatmap (peak hours) ───
const hourlyData = [
  0, 0, 0, 0, 0, 0, 2, 5, 12, 18, 25, 38, 45, 42, 35, 28, 22, 30, 48, 55, 42,
  28, 15, 5,
];
const peakHour = hourlyData.indexOf(Math.max(...hourlyData));
const hourlyChartData = computed(() => ({
  labels: Array.from(
    { length: 24 },
    (_, i) => `${i.toString().padStart(2, "0")}:00`,
  ),
  datasets: [
    {
      label: "Заказы",
      data: hourlyData,
      backgroundColor: hourlyData.map((v, i) => {
        if (i === peakHour) return "#EA004B";
        if (v > 40) return "rgba(234,0,75,0.6)";
        if (v > 20) return "rgba(234,0,75,0.35)";
        if (v > 10) return "rgba(234,0,75,0.2)";
        return "rgba(234,0,75,0.08)";
      }),
      borderRadius: 4,
      borderSkipped: false,
    },
  ],
}));

const hourlyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: TooltipItem<"bar">) => `${ctx.parsed.y} заказов`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        font: { size: 10 },
        maxRotation: 0,
        callback: (_: string | number, index: number) =>
          index % 3 === 0 ? `${index.toString().padStart(2, "0")}:00` : "",
      },
    },
    y: {
      grid: { color: "rgba(0,0,0,0.04)" },
      beginAtZero: true,
      ticks: { font: { size: 10 } },
    },
  },
};

// ─── Doughnut: Revenue by order type ───
const orderTypeRevenue = computed(() => {
  const rev: Record<OrderType, number> = { delivery: 0, pickup: 0, dine_in: 0 };
  ordersStore.orders
    .filter((o) => o.status === "completed")
    .forEach((o) => {
      rev[o.orderType] += o.totalPrice;
    });
  return rev;
});

const totalTypeRevenue = computed(() =>
  Object.values(orderTypeRevenue.value).reduce((a, b) => a + b, 0),
);

const revenueByTypeDoughnut = computed(() => ({
  labels: Object.keys(ORDER_TYPE_LABELS).map(
    (k) => ORDER_TYPE_LABELS[k as OrderType],
  ),
  datasets: [
    {
      data: [
        orderTypeRevenue.value.delivery,
        orderTypeRevenue.value.pickup,
        orderTypeRevenue.value.dine_in,
      ],
      backgroundColor: [
        ORDER_TYPE_COLORS.delivery,
        ORDER_TYPE_COLORS.pickup,
        ORDER_TYPE_COLORS.dine_in,
      ],
      borderWidth: 0,
      hoverOffset: 6,
    },
  ],
}));

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "70%",
  plugins: { legend: { display: false } },
};

// ─── Top selling items ───
const topItems = computed(() => {
  const itemCounts: Record<
    string,
    { name: string; count: number; revenue: number }
  > = {};
  ordersStore.orders
    .filter((o) => o.status !== "rejected")
    .forEach((o) => {
      o.items.forEach((item) => {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { name: item.name, count: 0, revenue: 0 };
        }
        itemCounts[item.name]!.count += item.quantity;
        itemCounts[item.name]!.revenue += item.price * item.quantity;
      });
    });
  return Object.values(itemCounts)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);
});

const maxItemRevenue = computed(() => topItems.value[0]?.revenue ?? 1);

// ─── Orders by weekday (bar chart) ───
const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const currentWeekday = new Date().getDay();
const todayIdx = currentWeekday === 0 ? 6 : currentWeekday - 1;
const weeklyOrderCounts = [32, 45, 58, 72, 65, 88, 41];

const ordersBarData = computed(() => ({
  labels: weekDays,
  datasets: [
    {
      label: "Заказы",
      data: weeklyOrderCounts,
      backgroundColor: weekDays.map((_, i) =>
        i === todayIdx ? "#EA004B" : "rgba(234,0,75,0.12)",
      ),
      borderRadius: 6,
      borderSkipped: false,
      barPercentage: 0.6,
    },
  ],
}));

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: TooltipItem<"bar">) => `${ctx.parsed.y} заказов`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: {
      grid: { color: "rgba(0,0,0,0.04)" },
      beginAtZero: true,
      ticks: { font: { size: 10 } },
    },
  },
};

// ─── Order funnel (conversion pipeline) ───
const orderFunnel = computed(() => {
  const orders = ordersStore.orders;
  const total = orders.length;
  const accepted = orders.filter(
    (o) => o.status !== "incoming" && o.status !== "rejected",
  ).length;
  const ready = orders.filter(
    (o) => o.status === "ready" || o.status === "completed",
  ).length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const rejected = orders.filter((o) => o.status === "rejected").length;

  return [
    { label: "Получено", value: total, color: "#1976d2", pct: 100 },
    {
      label: "Принято",
      value: accepted,
      color: "#F97316",
      pct: total > 0 ? Math.round((accepted / total) * 100) : 0,
    },
    {
      label: "Готово",
      value: ready,
      color: "#8b5cf6",
      pct: total > 0 ? Math.round((ready / total) * 100) : 0,
    },
    {
      label: "Завершено",
      value: completed,
      color: "#16a34a",
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    },
    {
      label: "Отклонено",
      value: rejected,
      color: "#EA004B",
      pct: total > 0 ? Math.round((rejected / total) * 100) : 0,
    },
  ];
});

// ─── Categories performance ───
const categoryPerformance = computed(() => {
  const catRevenue: Record<
    number,
    { name: string; revenue: number; orders: number; items: number }
  > = {};

  menuStore.categories.forEach((c) => {
    catRevenue[c.id] = { name: c.name, revenue: 0, orders: 0, items: 0 };
  });

  ordersStore.orders
    .filter((o) => o.status !== "rejected")
    .forEach((o) => {
      o.items.forEach((item) => {
        // Пытаемся сопоставить позицию заказа с позицией меню
        const menuItem = menuStore.items.find((mi) => mi.name === item.name);
        if (menuItem && catRevenue[menuItem.category]) {
          catRevenue[menuItem.category]!.revenue += item.price * item.quantity;
          catRevenue[menuItem.category]!.items += item.quantity;
        }
      });
    });

  // Считаем уникальные заказы на категорию
  ordersStore.orders
    .filter((o) => o.status !== "rejected")
    .forEach((o) => {
      const cats = new Set<number>();
      o.items.forEach((item) => {
        const mi = menuStore.items.find((m) => m.name === item.name);
        if (mi) cats.add(mi.category);
      });
      cats.forEach((catId) => {
        if (catRevenue[catId]) catRevenue[catId]!.orders++;
      });
    });

  return Object.values(catRevenue)
    .filter((c) => c.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);
});

const maxCatRevenue = computed(
  () => categoryPerformance.value[0]?.revenue ?? 1,
);

const catColors = ["#EA004B", "#F97316", "#3b82f6", "#16a34a", "#8b5cf6"];

// ─── Recent orders ───
const recentOrders = computed(() =>
  ordersStore.orders
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6),
);

const tableHeaders = [
  { key: "orderNumber", title: "№", width: "70px" },
  { key: "createdAt", title: "Время" },
  { key: "customer.name", title: "Клиент" },
  { key: "orderType", title: "Тип" },
  { key: "itemsCount", title: "Поз.", align: "center" as const, width: "70px" },
  { key: "totalPrice", title: "Сумма", align: "end" as const },
  { key: "status", title: "Статус", width: "130px" },
];

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min} мин назад`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.floor(hours / 24)} дн назад`;
}

// ─── Customer reviews ───
const reviews = [
  {
    id: 1,
    author: "Мария С.",
    date: "12 фев",
    rating: 5,
    text: "Очень вкусная еда! Хычины просто объедение — хрустящие, с ароматной начинкой.",
  },
  {
    id: 2,
    author: "Алексей Р.",
    date: "10 фев",
    rating: 4,
    text: "Отличная кухня, быстрая доставка. Лобиани был горячим, как будто только из печи.",
  },
  {
    id: 3,
    author: "Диана К.",
    date: "8 фев",
    rating: 5,
    text: "Заказывала харчо и хинкали — всё на высшем уровне. Порции большие, цена адекватная.",
  },
];
</script>

<template>
  <div class="px-8 py-6">
    <!-- ═══ Header ═══ -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <!-- <h2 class="text-h5 font-weight-bold">{{ greeting }}</h2> -->
        <h2 class="text-h5 font-weight-bold">
          Аналитика вашего заведения за выбранный период
        </h2>
        <p
          class="text-body-2 text-medium-emphasis mt-1"
          style="text-transform: capitalize"
        >
          {{ todayDate }}
        </p>
      </div>

      <v-btn-toggle
        v-model="analyticsPeriod"
        mandatory
        density="compact"
        rounded="lg"
        variant="outlined"
        divided
      >
        <v-btn value="today" size="small">Сегодня</v-btn>
        <v-btn value="week" size="small">Неделя</v-btn>
        <v-btn value="month" size="small">Месяц</v-btn>
      </v-btn-toggle>
    </div>

    <!-- ═══ 6 KPI Cards ═══ -->
    <v-row dense class="mb-6">
      <v-col v-for="kpi in kpiCards" :key="kpi.label" cols="12" md="4" lg="4">
        <v-card flat rounded="xl" class="pa-4 h-100">
          <div class="d-flex align-center justify-space-between mb-3">
            <div
              class="d-flex align-center justify-center rounded-lg"
              :style="{
                width: '40px',
                height: '40px',
                backgroundColor: kpi.bg,
              }"
            >
              <v-icon :icon="kpi.icon" :color="kpi.color" size="20" />
            </div>
            <v-chip
              :color="kpi.trendUp ? 'success' : 'error'"
              size="x-small"
              label
              class="font-weight-bold"
            >
              <v-icon
                start
                :icon="kpi.trendUp ? 'mdi-trending-up' : 'mdi-trending-down'"
                size="10"
              />
              {{ kpi.trend }}
            </v-chip>
          </div>
          <p class="text-h5 font-weight-bold mb-1" style="line-height: 1.2">
            {{ kpi.value }}
          </p>
          <p class="text-caption text-medium-emphasis">{{ kpi.label }}</p>
          <p class="text-caption text-disabled" style="font-size: 10px">
            {{ kpi.subtitle }}
          </p>
        </v-card>
      </v-col>
    </v-row>

    <!-- ═══ Revenue chart + Revenue by type ═══ -->
    <v-row dense class="mb-6">
      <v-col cols="12" md="8">
        <v-card flat rounded="xl" class="pa-5 h-100">
          <div class="d-flex align-center justify-space-between mb-2">
            <div>
              <p class="text-subtitle-1 font-weight-bold">Динамика выручки</p>
              <p class="text-caption text-medium-emphasis">
                Последние 12 недель
              </p>
            </div>
            <div class="d-flex ga-4">
              <div class="d-flex align-center ga-1">
                <div
                  class="rounded-circle"
                  style="width: 8px; height: 8px; background: #ea004b"
                />
                <span class="text-caption text-medium-emphasis">Доход</span>
              </div>
              <div class="d-flex align-center ga-1">
                <div
                  class="rounded-circle"
                  style="width: 8px; height: 8px; background: #94a3b8"
                />
                <span class="text-caption text-medium-emphasis">Расход</span>
              </div>
            </div>
          </div>

          <!-- Summary row -->
          <v-row dense class="mb-4">
            <v-col cols="4">
              <p class="text-caption text-medium-emphasis">Доход</p>
              <p
                class="text-subtitle-2 font-weight-bold"
                style="color: #ea004b"
              >
                {{ revenueSummary.income.toLocaleString("ru-RU") }} ₽
              </p>
            </v-col>
            <v-col cols="4">
              <p class="text-caption text-medium-emphasis">Расход</p>
              <p
                class="text-subtitle-2 font-weight-bold"
                style="color: #94a3b8"
              >
                {{ revenueSummary.expense.toLocaleString("ru-RU") }} ₽
              </p>
            </v-col>
            <v-col cols="4">
              <p class="text-caption text-medium-emphasis">
                Прибыль ({{ revenueSummary.margin }}%)
              </p>
              <p
                class="text-subtitle-2 font-weight-bold"
                style="color: #16a34a"
              >
                {{ revenueSummary.profit.toLocaleString("ru-RU") }} ₽
              </p>
            </v-col>
          </v-row>

          <div style="height: 240px">
            <Line :data="revenueChartData" :options="lineChartOptions" />
          </div>
        </v-card>
      </v-col>

      <!-- Revenue by order type -->
      <v-col cols="12" md="4">
        <v-card flat rounded="xl" class="pa-5 h-100 d-flex flex-column">
          <p class="text-subtitle-1 font-weight-bold mb-1">Выручка по типам</p>
          <p class="text-caption text-medium-emphasis mb-4">
            Завершённые заказы
          </p>

          <div class="d-flex justify-center mb-4" style="position: relative">
            <div style="width: 160px; height: 160px; position: relative">
              <Doughnut
                :data="revenueByTypeDoughnut"
                :options="doughnutOptions"
              />
              <div
                class="d-flex flex-column align-center justify-center"
                style="position: absolute; inset: 0; pointer-events: none"
              >
                <span class="text-caption text-medium-emphasis">Итого</span>
                <span class="text-subtitle-2 font-weight-bold">
                  {{
                    totalTypeRevenue > 0
                      ? (totalTypeRevenue / 1000).toFixed(1) + "k"
                      : "0"
                  }}
                  ₽
                </span>
              </div>
            </div>
          </div>

          <div class="mt-auto">
            <div
              v-for="(type, key) in ORDER_TYPE_LABELS"
              :key="key"
              class="d-flex align-center justify-space-between py-2"
              :class="{ 'border-t': key !== 'delivery' }"
            >
              <div class="d-flex align-center ga-2">
                <div
                  class="rounded-circle"
                  :style="{
                    width: '10px',
                    height: '10px',
                    backgroundColor: ORDER_TYPE_COLORS[key as OrderType],
                  }"
                />
                <span class="text-body-2">{{ type }}</span>
              </div>
              <div class="text-right">
                <span class="text-body-2 font-weight-bold">
                  {{
                    orderTypeRevenue[key as OrderType].toLocaleString("ru-RU")
                  }}
                  ₽
                </span>
                <span class="text-caption text-medium-emphasis ml-2">
                  {{
                    totalTypeRevenue > 0
                      ? Math.round(
                          (orderTypeRevenue[key as OrderType] /
                            totalTypeRevenue) *
                            100,
                        )
                      : 0
                  }}%
                </span>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ═══ Peak hours + Orders by weekday ═══ -->
    <v-row dense class="mb-6">
      <!-- Peak hours -->
      <v-col cols="12" md="8">
        <v-card flat rounded="xl" class="pa-5 h-100">
          <div class="d-flex align-center justify-space-between mb-1">
            <div>
              <p class="text-subtitle-1 font-weight-bold">
                Распределение по часам
              </p>
              <p class="text-caption text-medium-emphasis">
                Пиковые часы нагрузки
              </p>
            </div>
            <v-chip size="small" color="primary" variant="tonal" label>
              <v-icon start icon="mdi-fire" size="14" />
              Пик: {{ peakHour.toString().padStart(2, "0") }}:00
            </v-chip>
          </div>
          <div style="height: 200px">
            <Bar :data="hourlyChartData" :options="hourlyChartOptions" />
          </div>
        </v-card>
      </v-col>

      <!-- Orders by weekday -->
      <v-col cols="12" md="4">
        <v-card flat rounded="xl" class="pa-5 h-100">
          <p class="text-subtitle-1 font-weight-bold mb-1">Заказы по дням</p>
          <p class="text-caption text-medium-emphasis mb-3">Текущая неделя</p>

          <div style="height: 200px">
            <Bar :data="ordersBarData" :options="barChartOptions" />
          </div>

          <div class="d-flex align-center justify-space-between mt-3">
            <div>
              <p class="text-caption text-medium-emphasis">Всего за неделю</p>
              <p class="text-subtitle-2 font-weight-bold">
                {{ weeklyOrderCounts.reduce((a, b) => a + b, 0) }} заказов
              </p>
            </div>
            <div class="text-right">
              <p class="text-caption text-medium-emphasis">Среднее / день</p>
              <p class="text-subtitle-2 font-weight-bold">
                {{
                  Math.round(weeklyOrderCounts.reduce((a, b) => a + b, 0) / 7)
                }}
              </p>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ═══ Order funnel + Top items + Categories ═══ -->
    <v-row dense class="mb-6">
      <!-- Order funnel -->
      <v-col cols="12" md="4">
        <v-card flat rounded="xl" class="pa-5 h-100">
          <p class="text-subtitle-1 font-weight-bold mb-1">Воронка заказов</p>
          <p class="text-caption text-medium-emphasis mb-5">
            Конверсия по этапам
          </p>

          <div
            v-for="(step, idx) in orderFunnel"
            :key="step.label"
            class="mb-4"
          >
            <div class="d-flex align-center justify-space-between mb-1">
              <div class="d-flex align-center ga-2">
                <div
                  class="rounded-circle"
                  :style="{
                    width: '8px',
                    height: '8px',
                    backgroundColor: step.color,
                  }"
                />
                <span class="text-body-2">{{ step.label }}</span>
              </div>
              <div class="d-flex align-center ga-2">
                <span class="text-body-2 font-weight-bold">{{
                  step.value
                }}</span>
                <span class="text-caption text-medium-emphasis"
                  >({{ step.pct }}%)</span
                >
              </div>
            </div>
            <v-progress-linear
              :model-value="step.pct"
              :color="step.color"
              rounded
              height="6"
              bg-color="rgba(0,0,0,0.04)"
            />
            <div
              v-if="idx < orderFunnel.length - 2 && idx < 3"
              class="d-flex justify-center my-1"
            >
              <v-icon
                icon="mdi-chevron-down"
                size="14"
                color="grey-lighten-1"
              />
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Top selling items -->
      <v-col cols="12" md="4">
        <v-card flat rounded="xl" class="pa-5 h-100">
          <p class="text-subtitle-1 font-weight-bold mb-1">Топ позиций</p>
          <p class="text-caption text-medium-emphasis mb-4">По выручке</p>

          <div v-for="(item, idx) in topItems" :key="item.name" class="mb-3">
            <div class="d-flex align-center justify-space-between mb-1">
              <div class="d-flex align-center ga-2">
                <div
                  class="d-flex align-center justify-center rounded text-caption font-weight-bold"
                  :style="{
                    width: '22px',
                    height: '22px',
                    backgroundColor: idx < 3 ? '#EA004B' : '#e2e8f0',
                    color: idx < 3 ? '#fff' : '#64748b',
                    fontSize: '11px',
                  }"
                >
                  {{ idx + 1 }}
                </div>
                <span
                  class="text-body-2 text-truncate"
                  style="max-width: 140px"
                  >{{ item.name }}</span
                >
              </div>
              <span
                class="text-body-2 font-weight-bold"
                style="white-space: nowrap"
              >
                {{ item.revenue.toLocaleString("ru-RU") }} ₽
              </span>
            </div>
            <v-progress-linear
              :model-value="(item.revenue / maxItemRevenue) * 100"
              color="#EA004B"
              rounded
              height="4"
              bg-color="rgba(0,0,0,0.04)"
            />
            <p
              class="text-caption text-medium-emphasis"
              style="font-size: 10px"
            >
              {{ item.count }} шт. продано
            </p>
          </div>
        </v-card>
      </v-col>

      <!-- Category performance -->
      <v-col cols="12" md="4">
        <v-card flat rounded="xl" class="pa-5 h-100">
          <p class="text-subtitle-1 font-weight-bold mb-1">Категории</p>
          <p class="text-caption text-medium-emphasis mb-4">
            Эффективность по выручке
          </p>

          <div
            v-for="(cat, idx) in categoryPerformance"
            :key="cat.name"
            class="mb-4"
          >
            <div class="d-flex align-center justify-space-between mb-1">
              <div class="d-flex align-center ga-2">
                <div
                  class="rounded-circle"
                  :style="{
                    width: '10px',
                    height: '10px',
                    backgroundColor: catColors[idx % catColors.length],
                  }"
                />
                <span class="text-body-2 font-weight-medium">{{
                  cat.name
                }}</span>
              </div>
              <span class="text-body-2 font-weight-bold">
                {{ cat.revenue.toLocaleString("ru-RU") }} ₽
              </span>
            </div>
            <v-progress-linear
              :model-value="(cat.revenue / maxCatRevenue) * 100"
              :color="catColors[idx % catColors.length]!"
              rounded
              height="6"
              bg-color="rgba(0,0,0,0.04)"
            />
            <div class="d-flex ga-3 mt-1">
              <span class="text-caption text-medium-emphasis"
                >{{ cat.orders }} заказов</span
              >
              <span class="text-caption text-medium-emphasis"
                >{{ cat.items }} позиций</span
              >
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ═══ Recent Orders ═══ -->
    <v-card flat rounded="xl" class="db-orders-card mb-6">
      <div class="db-orders-header">
        <div>
          <p class="db-orders-title">Последние заказы</p>
          <p class="db-orders-subtitle">Обновляется в реальном времени</p>
        </div>
        <router-link to="/orders" class="text-decoration-none">
          <button class="db-orders-link">
            Все заказы
            <v-icon icon="mdi-arrow-right" size="14" />
          </button>
        </router-link>
      </div>

      <v-data-table
        :items="recentOrders"
        :headers="tableHeaders"
        :items-per-page="6"
        hide-default-footer
        class="db-table"
      >
        <template #item.orderNumber="{ item }">
          <span class="db-order-id">#{{ item.orderNumber }}</span>
        </template>

        <template #item.createdAt="{ item }">
          <div>
            <p class="db-date">{{ formatTime(item.createdAt) }}</p>
            <p class="db-date-ago">{{ formatTimeAgo(item.createdAt) }}</p>
          </div>
        </template>

        <template #item.customer.name="{ item }">
          <div class="d-flex align-center ga-3">
            <div class="db-avatar">{{ item.customer.name.charAt(0) }}</div>
            <div>
              <p class="db-customer-name">{{ item.customer.name }}</p>
              <p class="db-customer-phone">{{ item.customer.phone }}</p>
            </div>
          </div>
        </template>

        <template #item.orderType="{ item }">
          <div class="db-type-pill" :style="{ '--type-color': ORDER_TYPE_COLORS[item.orderType] }">
            <v-icon :icon="ORDER_TYPE_ICONS[item.orderType]" size="13" />
            {{ ORDER_TYPE_LABELS[item.orderType] }}
          </div>
        </template>

        <template #item.itemsCount="{ item }">
          <span class="db-items-count">{{ item.items.length }}</span>
        </template>

        <template #item.totalPrice="{ item }">
          <span class="db-price">{{ item.totalPrice.toLocaleString("ru-RU") }} ₽</span>
        </template>

        <template #item.status="{ item }">
          <div class="db-status" :class="'db-status--' + item.status">
            <span class="db-status__dot" />
            {{ ORDER_STATUS_LABELS[item.status] }}
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- ═══ Reviews ═══ -->
    <div class="mb-2">
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <p class="text-subtitle-1 font-weight-bold">Отзывы клиентов</p>
          <p class="text-caption text-medium-emphasis">
            Рейтинг {{ restaurantStore.restaurant?.rating ?? "—" }} / 5.0 ({{
              restaurantStore.restaurant?.reviewsCount ?? 0
            }}
            отзывов)
          </p>
        </div>
        <router-link to="/reviews" class="text-decoration-none">
          <v-btn variant="text" size="small" color="primary">
            Все отзывы
            <v-icon icon="mdi-arrow-right" size="14" class="ml-1" />
          </v-btn>
        </router-link>
      </div>

      <v-row dense>
        <v-col v-for="r in reviews" :key="r.id" cols="12" md="4">
          <v-card flat rounded="xl" class="pa-5 h-100">
            <div class="d-flex align-center justify-space-between mb-3">
              <v-rating
                :model-value="r.rating"
                color="warning"
                size="16"
                readonly
                density="compact"
              />
              <span class="text-caption text-medium-emphasis">{{
                r.date
              }}</span>
            </div>
            <p
              class="text-body-2 text-medium-emphasis mb-4"
              style="line-height: 1.6"
            >
              "{{ r.text }}"
            </p>
            <div class="d-flex align-center ga-2">
              <v-avatar color="primary" size="28">
                <span
                  class="text-caption text-white font-weight-bold"
                  style="font-size: 10px"
                >
                  {{
                    r.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  }}
                </span>
              </v-avatar>
              <span class="text-body-2 font-weight-medium">{{ r.author }}</span>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<style scoped>
/* ── Recent Orders Card ── */
.db-orders-card {
  overflow: hidden;
}

.db-orders-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
}

.db-orders-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
}

.db-orders-subtitle {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.db-orders-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #EA004B;
  cursor: pointer;
  transition: all 0.15s ease;
}

.db-orders-link:hover {
  background: color-mix(in srgb, #EA004B 5%, transparent);
  border-color: color-mix(in srgb, #EA004B 20%, transparent);
}

/* ── Table ── */
.db-table :deep(th) {
  font-size: 11px !important;
  font-weight: 600 !important;
  color: #9ca3af !important;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  white-space: nowrap;
  border-bottom: 1px solid #f0f0f0 !important;
}

.db-table :deep(td) {
  padding-top: 12px !important;
  padding-bottom: 12px !important;
  border-bottom: 1px solid #f5f5f5 !important;
}

.db-table :deep(tr:hover td) {
  background: #fafafa !important;
}

.db-table :deep(tr:last-child td) {
  border-bottom: none !important;
}

/* Order ID */
.db-order-id {
  font-size: 13px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.2px;
}

/* Date */
.db-date {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.db-date-ago {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 1px;
}

/* Customer */
.db-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #EA004B, #ff4081);
  color: white;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.db-customer-name {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
}

.db-customer-phone {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 1px;
}

/* Type pill */
.db-type-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--type-color);
  background: color-mix(in srgb, var(--type-color) 10%, transparent);
  white-space: nowrap;
}

/* Items count */
.db-items-count {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: #f3f4f6;
}

/* Price */
.db-price {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
  white-space: nowrap;
}

/* Status */
.db-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 8px;
  white-space: nowrap;
}

.db-status__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.db-status--incoming {
  color: #1976d2;
  background: #e3f2fd;
}
.db-status--incoming .db-status__dot {
  background: #1976d2;
  animation: db-pulse 1.5s infinite;
}

.db-status--preparing {
  color: #e65100;
  background: #fff3e0;
}
.db-status--preparing .db-status__dot {
  background: #F97316;
  animation: db-pulse 1.5s infinite;
}

.db-status--ready {
  color: #16a34a;
  background: #e8f5e9;
}
.db-status--ready .db-status__dot {
  background: #16a34a;
}

.db-status--completed {
  color: #6b7280;
  background: #f3f4f6;
}
.db-status--completed .db-status__dot {
  background: #9ca3af;
}

.db-status--rejected {
  color: #dc2626;
  background: #fef2f2;
}
.db-status--rejected .db-status__dot {
  background: #dc2626;
}

@keyframes db-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
