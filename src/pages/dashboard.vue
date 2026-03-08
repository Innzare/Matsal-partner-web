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
import { useAuthStore } from "@/stores/auth";
import { useReviewsStore } from "@/stores/reviews";
import { useEstablishment } from "@/composables/useEstablishment";
import { useCatalogStore } from "@/stores/catalog";
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
const catalogStore = useCatalogStore();
const authStore = useAuthStore();
const reviewsStore = useReviewsStore();
const est = useEstablishment();

const isGrocery = computed(() => authStore.isGrocery);
const accent = computed(() => isGrocery.value ? '#16a34a' : '#EA004B');
const accentLight = computed(() => isGrocery.value ? '#22c55e' : '#ff4081');
const accentBg = computed(() => isGrocery.value ? '#e8f5e9' : '#fce4ec');
const accentRgba = (alpha: number) => isGrocery.value ? `rgba(22,163,74,${alpha})` : `rgba(234,0,75,${alpha})`;

// ─── Period helpers ───
const getDateRange = (period: 'today' | 'week' | 'month') => {
  const now = new Date();
  let start: Date, end: Date;
  if (period === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(start.getTime() + 86400000 - 1);
  } else if (period === 'week') {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    end = new Date(start.getTime() + 7 * 86400000 - 1);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  return { start, end };
};

const periodOrders = computed(() => {
  const { start, end } = getDateRange(analyticsPeriod.value);
  return ordersStore.orders.filter(o => {
    const d = new Date(o.createdAt);
    return d >= start && d <= end;
  });
});

const prevPeriodOrders = computed(() => {
  const { start, end } = getDateRange(analyticsPeriod.value);
  const duration = end.getTime() - start.getTime() + 1;
  const prevStart = new Date(start.getTime() - duration);
  const prevEnd = new Date(start.getTime() - 1);
  return ordersStore.orders.filter(o => {
    const d = new Date(o.createdAt);
    return d >= prevStart && d <= prevEnd;
  });
});

function calcTrend(current: number, previous: number): { text: string; up: boolean } {
  if (previous === 0 && current === 0) return { text: '—', up: true };
  if (previous === 0) return { text: 'Новое', up: true };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { text: (pct >= 0 ? '+' : '') + pct + '%', up: pct >= 0 };
}

const periodLabel = computed(() => {
  if (analyticsPeriod.value === 'today') return 'сегодня';
  if (analyticsPeriod.value === 'week') return 'за неделю';
  return 'за месяц';
});

onMounted(async () => {
  const loads: Promise<any>[] = [est.load(), reviewsStore.loadReviews()];
  if (isGrocery.value) {
    loads.push(catalogStore.loadCatalog());
  } else {
    loads.push(ordersStore.loadOrders(), menuStore.loadMenu());
  }
  await Promise.all(loads);
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
  const orders = periodOrders.value;
  const prev = prevPeriodOrders.value;
  const completed = orders.filter((o) => o.status === "completed");
  const prevCompleted = prev.filter((o) => o.status === "completed");
  const rejected = orders.filter((o) => o.status === "rejected");

  const totalRevenue = completed.reduce((s, o) => s + o.totalPrice, 0);
  const prevRevenue = prevCompleted.reduce((s, o) => s + o.totalPrice, 0);
  const avgCheck = completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0;
  const prevAvgCheck = prevCompleted.length > 0 ? Math.round(prevRevenue / prevCompleted.length) : 0;
  const completionRate = orders.length > 0 ? Math.round((completed.length / orders.length) * 100) : 0;
  const prevCompletionRate = prev.length > 0 ? Math.round((prevCompleted.length / prev.length) * 100) : 0;
  const rejectionRate = orders.length > 0 ? Math.round((rejected.length / orders.length) * 100) : 0;

  // Среднее время приготовления
  const withPrepTime = completed.filter((o) => o.acceptedAt && o.readyAt);
  const avgPrepMin = withPrepTime.length > 0
    ? Math.round(withPrepTime.reduce((s, o) => s + (new Date(o.readyAt!).getTime() - new Date(o.acceptedAt!).getTime()), 0) / withPrepTime.length / 60000)
    : 0;
  const prevWithPrep = prevCompleted.filter((o) => o.acceptedAt && o.readyAt);
  const prevAvgPrep = prevWithPrep.length > 0
    ? Math.round(prevWithPrep.reduce((s, o) => s + (new Date(o.readyAt!).getTime() - new Date(o.acceptedAt!).getTime()), 0) / prevWithPrep.length / 60000)
    : 0;

  const revTrend = calcTrend(totalRevenue, prevRevenue);
  const ordTrend = calcTrend(orders.length, prev.length);
  const avgTrend = calcTrend(avgCheck, prevAvgCheck);
  const prepDiff = avgPrepMin - prevAvgPrep;
  const compTrend = calcTrend(completionRate, prevCompletionRate);

  return [
    {
      label: "Выручка",
      value: totalRevenue.toLocaleString("ru-RU") + " ₽",
      icon: "mdi-cash-multiple",
      color: "#16a34a",
      bg: "#e8f5e9",
      trend: revTrend.text,
      trendUp: revTrend.up,
      subtitle: `vs пред. период`,
    },
    {
      label: "Заказов",
      value: orders.length,
      icon: "mdi-receipt-text-outline",
      color: "#F97316",
      bg: "#fff3e0",
      trend: ordTrend.text,
      trendUp: ordTrend.up,
      subtitle: periodLabel.value,
    },
    {
      label: "Средний чек",
      value: avgCheck.toLocaleString("ru-RU") + " ₽",
      icon: "mdi-chart-line",
      color: accent.value,
      bg: accentBg.value,
      trend: avgTrend.text,
      trendUp: avgTrend.up,
      subtitle: "по завершённым",
    },
    {
      label: "Время готовки",
      value: avgPrepMin + " мин",
      icon: "mdi-timer-outline",
      color: "#8b5cf6",
      bg: "#f3e8ff",
      trend: prevAvgPrep > 0 ? (prepDiff <= 0 ? prepDiff : '+' + prepDiff) + ' мин' : '—',
      trendUp: prepDiff <= 0,
      subtitle: "среднее",
    },
    {
      label: "Выполнение",
      value: completionRate + "%",
      icon: "mdi-check-circle-outline",
      color: "#1976d2",
      bg: "#e3f2fd",
      trend: compTrend.text,
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

// ─── Revenue chart (dynamic by period) ───
const revenueChartData = computed(() => {
  const completed = periodOrders.value.filter(o => o.status === 'completed');
  const now = new Date();

  if (analyticsPeriod.value === 'today') {
    // Hourly revenue
    const hourly = new Array(24).fill(0);
    completed.forEach(o => {
      hourly[new Date(o.createdAt).getHours()] += o.totalPrice;
    });
    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
      datasets: [{
        label: 'Выручка',
        data: hourly,
        borderColor: accent.value,
        backgroundColor: accentRgba(0.06),
        tension: 0.4,
        fill: true,
        pointBackgroundColor: accent.value,
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2.5,
      }],
    };
  }

  if (analyticsPeriod.value === 'week') {
    // Daily revenue for current week (Mon-Sun)
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const daily = new Array(7).fill(0);
    completed.forEach(o => {
      const d = new Date(o.createdAt).getDay();
      daily[d === 0 ? 6 : d - 1] += o.totalPrice;
    });
    return {
      labels: days,
      datasets: [{
        label: 'Выручка',
        data: daily,
        borderColor: accent.value,
        backgroundColor: accentRgba(0.06),
        tension: 0.4,
        fill: true,
        pointBackgroundColor: accent.value,
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2.5,
      }],
    };
  }

  // Month — daily revenue
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daily = new Array(daysInMonth).fill(0);
  completed.forEach(o => {
    daily[new Date(o.createdAt).getDate() - 1] += o.totalPrice;
  });
  return {
    labels: daily.map((_, i) => `${i + 1}`),
    datasets: [{
      label: 'Выручка',
      data: daily,
      borderColor: accent.value,
      backgroundColor: accentRgba(0.06),
      tension: 0.4,
      fill: true,
      pointBackgroundColor: accent.value,
      pointRadius: 2,
      pointHoverRadius: 5,
      borderWidth: 2.5,
    }],
  };
});

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

// Revenue summary numbers (real data)
const revenueSummary = computed(() => {
  const completed = periodOrders.value.filter(o => o.status === 'completed');
  const totalRevenue = completed.reduce((s, o) => s + o.totalPrice, 0);
  const avgCheck = completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0;
  return {
    revenue: totalRevenue,
    ordersCount: periodOrders.value.length,
    avgCheck,
  };
});

// ─── Hourly orders heatmap (peak hours) ───
const hourlyData = computed(() => {
  const hours = new Array(24).fill(0);
  periodOrders.value.forEach(o => {
    hours[new Date(o.createdAt).getHours()]++;
  });
  return hours;
});
const peakHour = computed(() => {
  const data = hourlyData.value;
  const max = Math.max(...data);
  return max > 0 ? data.indexOf(max) : -1;
});
const hourlyChartData = computed(() => ({
  labels: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`),
  datasets: [
    {
      label: "Заказы",
      data: hourlyData.value,
      backgroundColor: hourlyData.value.map((v, i) => {
        const max = Math.max(...hourlyData.value);
        if (max === 0) return accentRgba(0.08);
        if (i === peakHour.value) return accent.value;
        const ratio = v / max;
        if (ratio > 0.7) return accentRgba(0.6);
        if (ratio > 0.4) return accentRgba(0.35);
        if (ratio > 0.15) return accentRgba(0.2);
        return accentRgba(0.08);
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
  periodOrders.value
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
  periodOrders.value
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
const todayIdx = computed(() => {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
});
const weeklyOrderCounts = computed(() => {
  const counts = new Array(7).fill(0);
  periodOrders.value.forEach(o => {
    const d = new Date(o.createdAt).getDay();
    counts[d === 0 ? 6 : d - 1]++;
  });
  return counts;
});

const ordersBarData = computed(() => ({
  labels: weekDays,
  datasets: [
    {
      label: "Заказы",
      data: weeklyOrderCounts.value,
      backgroundColor: weekDays.map((_, i) =>
        i === todayIdx.value ? accent.value : accentRgba(0.12),
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
  const orders = periodOrders.value;
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
      color: accent.value,
      pct: total > 0 ? Math.round((rejected / total) * 100) : 0,
    },
  ];
});

// ─── Categories performance ───
const categoryPerformance = computed(() => {
  if (isGrocery.value) return [];

  const catRevenue: Record<
    number,
    { name: string; revenue: number; orders: number; items: number }
  > = {};

  menuStore.categories.forEach((c) => {
    catRevenue[c.id] = { name: c.name, revenue: 0, orders: 0, items: 0 };
  });

  periodOrders.value
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
  periodOrders.value
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

const catColors = computed(() => isGrocery.value
  ? ["#16a34a", "#F97316", "#3b82f6", "#8b5cf6", "#eab308"]
  : ["#EA004B", "#F97316", "#3b82f6", "#16a34a", "#8b5cf6"],
);

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
function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getRatingColor(rating: number): string {
  if (rating >= 4) return '#16a34a';
  if (rating === 3) return '#F97316';
  return '#dc2626';
}

function reviewTimeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн. назад`;
  return `${Math.floor(days / 7)} нед. назад`;
}
</script>

<template>
  <div class="db-page">
    <!-- ═══ Header ═══ -->
    <div class="db-page-header mb-6">
      <div>
        <h2 class="text-h5 font-weight-bold db-page-title">
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
      <v-col v-for="kpi in kpiCards" :key="kpi.label" cols="6" md="4" lg="4">
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
                {{ analyticsPeriod === 'today' ? 'Сегодня по часам' : analyticsPeriod === 'week' ? 'Текущая неделя' : 'Текущий месяц' }}
              </p>
            </div>
            <div class="d-flex align-center ga-1">
              <div
                class="rounded-circle"
                :style="{ width: '8px', height: '8px', background: accent }"
              />
              <span class="text-caption text-medium-emphasis">Выручка</span>
            </div>
          </div>

          <!-- Summary row -->
          <v-row dense class="mb-4">
            <v-col cols="4">
              <p class="text-caption text-medium-emphasis">Выручка</p>
              <p
                class="text-subtitle-2 font-weight-bold"
                :style="{ color: accent }"
              >
                {{ revenueSummary.revenue.toLocaleString("ru-RU") }} ₽
              </p>
            </v-col>
            <v-col cols="4">
              <p class="text-caption text-medium-emphasis">Заказов</p>
              <p
                class="text-subtitle-2 font-weight-bold"
                style="color: #F97316"
              >
                {{ revenueSummary.ordersCount }}
              </p>
            </v-col>
            <v-col cols="4">
              <p class="text-caption text-medium-emphasis">Средний чек</p>
              <p
                class="text-subtitle-2 font-weight-bold"
                style="color: #8b5cf6"
              >
                {{ revenueSummary.avgCheck.toLocaleString("ru-RU") }} ₽
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
                Пиковые часы нагрузки · {{ periodLabel }}
              </p>
            </div>
            <v-chip v-if="peakHour >= 0" size="small" color="primary" variant="tonal" label>
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
          <p class="text-caption text-medium-emphasis mb-3">Распределение {{ periodLabel }}</p>

          <div style="height: 200px">
            <Bar :data="ordersBarData" :options="barChartOptions" />
          </div>

          <div class="d-flex align-center justify-space-between mt-3">
            <div>
              <p class="text-caption text-medium-emphasis">Всего {{ periodLabel }}</p>
              <p class="text-subtitle-2 font-weight-bold">
                {{ weeklyOrderCounts.reduce((a, b) => a + b, 0) }} заказов
              </p>
            </div>
            <div class="text-right">
              <p class="text-caption text-medium-emphasis">Среднее / день</p>
              <p class="text-subtitle-2 font-weight-bold">
                {{ Math.round(weeklyOrderCounts.reduce((a, b) => a + b, 0) / 7) }}
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
                    backgroundColor: idx < 3 ? accent : '#e2e8f0',
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
              :color="accent"
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
      <div class="db-reviews-header">
        <div>
          <p class="db-reviews-title">Отзывы клиентов</p>
          <p class="db-reviews-subtitle">
            Рейтинг {{ est.data.value?.rating ?? "—" }} / 5.0 ·
            {{ reviewsStore.reviews.length }} отзывов
          </p>
        </div>
        <router-link to="/reviews" class="text-decoration-none">
          <button class="db-orders-link">
            Все отзывы
            <v-icon icon="mdi-arrow-right" size="14" />
          </button>
        </router-link>
      </div>

      <v-row dense>
        <v-col v-for="r in reviewsStore.recentReviews" :key="r.id" cols="12" md="4">
          <v-card flat rounded="xl" class="db-review-card h-100">
            <div class="db-review-card__top">
              <div class="db-review-card__author">
                <div class="db-review-card__avatar">{{ getInitials(r.customerName) }}</div>
                <div>
                  <p class="db-review-card__name">{{ r.customerName }}</p>
                  <p class="db-review-card__date">{{ reviewTimeAgo(r.createdAt) }}</p>
                </div>
              </div>
              <div class="db-review-card__badge" :style="{ background: getRatingColor(r.rating) }">
                <v-icon icon="mdi-star" size="12" color="white" />
                {{ r.rating }}.0
              </div>
            </div>

            <p class="db-review-card__text">"{{ r.text }}"</p>

            <div v-if="r.reply" class="db-review-card__reply">
              <v-icon icon="mdi-reply" size="12" color="#EA004B" />
              <span>Ответ отправлен</span>
            </div>
            <div v-else class="db-review-card__no-reply">
              <v-icon icon="mdi-message-alert-outline" size="12" />
              <span>Без ответа</span>
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

/* ── Reviews Section ── */
.db-reviews-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.db-reviews-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
}

.db-reviews-subtitle {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

/* Review card */
.db-review-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s ease;
}

.db-review-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.db-review-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.db-review-card__author {
  display: flex;
  align-items: center;
  gap: 10px;
}

.db-review-card__avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ea004b, #ff4081);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.db-review-card__name {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
}

.db-review-card__date {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 1px;
}

.db-review-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.db-review-card__text {
  font-size: 13px;
  line-height: 1.65;
  color: #374151;
  font-style: italic;
  margin-bottom: 12px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.db-review-card__items {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 12px;
}

.db-review-card__tag {
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 5px;
}

.db-review-card__reply {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #EA004B;
}

.db-review-card__no-reply {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
  color: #F97316;
}

/* ── Dark Theme ── */
.dark .db-orders-title {
  color: #e4e4e7;
}

.dark .db-orders-link {
  background: #252538;
  border-color: #2e2e42;
}

.dark .db-orders-link:hover {
  background: color-mix(in srgb, #EA004B 10%, #252538);
  border-color: color-mix(in srgb, #EA004B 25%, #2e2e42);
}

.dark .db-table :deep(th) {
  border-bottom-color: #2e2e42 !important;
}

.dark .db-table :deep(td) {
  border-bottom-color: #2e2e42 !important;
}

.dark .db-table :deep(tr:hover td) {
  background: #252538 !important;
}

.dark .db-table :deep(tr:last-child td) {
  border-bottom: none !important;
}

.dark .db-order-id {
  color: #e4e4e7;
}

.dark .db-date {
  color: #a1a1aa;
}

.dark .db-customer-name {
  color: #e4e4e7;
}

.dark .db-items-count {
  color: #a1a1aa;
  background: #252538;
}

.dark .db-price {
  color: #e4e4e7;
}

.dark .db-status--incoming {
  color: #60a5fa;
  background: rgba(25, 118, 210, 0.15);
}

.dark .db-status--preparing {
  color: #fb923c;
  background: rgba(249, 115, 22, 0.15);
}

.dark .db-status--ready {
  color: #4ade80;
  background: rgba(22, 163, 74, 0.15);
}

.dark .db-status--completed {
  color: #71717a;
  background: #252538;
}

.dark .db-status--rejected {
  color: #f87171;
  background: rgba(220, 38, 38, 0.15);
}

.dark .db-reviews-title {
  color: #e4e4e7;
}

.dark .db-review-card__name {
  color: #e4e4e7;
}

.dark .db-review-card__text {
  color: #a1a1aa;
}

.dark .db-review-card__tag {
  color: #a1a1aa;
  background: #252538;
}

/* ── Responsive ── */
.db-page {
  padding: 24px 32px;
}

.db-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.db-page-title {
  font-size: 18px;
}

@media (max-width: 767px) {
  .db-page {
    padding: 16px;
  }

  .db-page-title {
    font-size: 15px;
  }

  .db-orders-header {
    padding: 14px 16px 10px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .db-table :deep(th),
  .db-table :deep(td) {
    padding-left: 8px !important;
    padding-right: 8px !important;
    font-size: 12px !important;
  }

  .db-review-card {
    min-width: 240px;
  }
}
</style>
