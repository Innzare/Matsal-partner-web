<script lang="ts" setup>
import { useOrdersStore } from "@/stores/orders";
import { useMenuStore } from "@/stores/menu";
import { useRestaurantStore } from "@/stores/restaurant";
import { useAuthStore } from "@/stores/auth";
import { WEEKDAY_LABELS, type WeekDay } from "@/types";

const ordersStore = useOrdersStore();
const menuStore = useMenuStore();
const restaurantStore = useRestaurantStore();
const authStore = useAuthStore();
const router = useRouter();

onMounted(async () => {
  await Promise.all([
    ordersStore.loadOrders(),
    menuStore.loadMenu(),
    restaurantStore.loadRestaurant(),
  ]);
});

// Greeting
const greeting = computed(() => {
  const hour = new Date().getHours();
  const name = authStore.userName?.split(" ")[0] || "Партнёр";
  if (hour < 12) return `Доброе утро, ${name}!`;
  if (hour < 18) return `Добрый день, ${name}!`;
  return `Добрый вечер, ${name}!`;
});

// Today's working hours
const todaySchedule = computed(() => {
  if (!restaurantStore.restaurant) return null;
  const days: WeekDay[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const today = days[new Date().getDay()]!;
  const schedule = restaurantStore.restaurant.workingHours[today];
  return {
    day: WEEKDAY_LABELS[today],
    ...schedule,
  };
});

// Summary stats
const summaryStats = computed(() => [
  {
    label: "Заказов сегодня",
    value: ordersStore.todayOrdersCount,
    icon: "mdi-receipt-text-outline",
    color: "#F97316",
    bg: "#fff3e0",
  },
  {
    label: "Выручка",
    value: ordersStore.todayRevenue.toLocaleString("ru-RU") + " ₽",
    icon: "mdi-cash-multiple",
    color: "#16a34a",
    bg: "#e8f5e9",
  },
  {
    label: "Активных заказов",
    value:
      ordersStore.incomingOrders.length +
      ordersStore.preparingOrders.length +
      ordersStore.readyOrders.length,
    icon: "mdi-progress-clock",
    color: "#1976d2",
    bg: "#e3f2fd",
  },
  {
    label: "Позиций в меню",
    value:
      menuStore.items.filter((i) => i.available).length +
      " / " +
      menuStore.items.length,
    icon: "mdi-food",
    color: "#EA004B",
    bg: "#fce4ec",
  },
]);

// Quick actions
const quickActions = [
  {
    label: "Новые заказы",
    description: "Просмотреть и принять",
    icon: "mdi-bell-ring-outline",
    color: "#F97316",
    bg: "#fff3e0",
    to: "/orders",
    badge: computed(() => ordersStore.incomingCount),
  },
  {
    label: "Добавить позицию",
    description: "Новое блюдо в меню",
    icon: "mdi-plus-circle-outline",
    color: "#16a34a",
    bg: "#e8f5e9",
    to: "/menu",
    badge: null,
  },
  {
    label: "Стоп-лист",
    description: "Выключить позиции",
    icon: "mdi-cancel",
    color: "#EA004B",
    bg: "#fce4ec",
    to: "/menu",
    badge: computed(() => menuStore.items.filter((i) => !i.available).length),
  },
  {
    label: "Настройки",
    description: "Часы, доставка, профиль",
    icon: "mdi-cog-outline",
    color: "#64748b",
    bg: "#f1f5f9",
    to: "/settings",
    badge: null,
  },
];

// Navigation sections
const sections = [
  {
    title: "Дашборд",
    description:
      "Аналитика, графики выручки, статистика заказов и обзор категорий",
    icon: "mdi-view-dashboard",
    color: "#8b5cf6",
    bg: "#f3e8ff",
    to: "/dashboard",
    stat: "Графики и метрики",
  },
  {
    title: "Заказы",
    description:
      "Управление заказами — приём, отклонение, отслеживание статусов",
    icon: "mdi-receipt-text",
    color: "#F97316",
    bg: "#fff3e0",
    to: "/orders",
    stat: computed(() => `${ordersStore.orders.length} всего`),
  },
  {
    title: "Меню",
    description: "Позиции, категории, модификаторы, цены и стоп-лист",
    icon: "mdi-food",
    color: "#EA004B",
    bg: "#fce4ec",
    to: "/menu",
    stat: computed(() => `${menuStore.items.length} позиций`),
  },
  {
    title: "Отзывы",
    description: "Отзывы клиентов, рейтинг заведения и обратная связь",
    icon: "mdi-star",
    color: "#eab308",
    bg: "#fef9c3",
    to: "/reviews",
    stat: computed(
      () => `${restaurantStore.restaurant?.rating ?? "—"} рейтинг`,
    ),
  },
  {
    title: "Уведомления",
    description: "Оповещения о заказах, отзывах и системных событиях",
    icon: "mdi-bell",
    color: "#1976d2",
    bg: "#e3f2fd",
    to: "/notifications",
    stat: "Все оповещения",
  },
  {
    title: "Настройки",
    description: "Профиль, рабочие часы, доставка, статус заведения",
    icon: "mdi-cog",
    color: "#64748b",
    bg: "#f1f5f9",
    to: "/settings",
    stat: "Профиль заведения",
  },
];

// Recent activity feed (mock)
const recentActivity = computed(() => {
  const activities: {
    icon: string;
    color: string;
    text: string;
    time: string;
  }[] = [];

  ordersStore.orders
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5)
    .forEach((order) => {
      const time = new Date(order.createdAt).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
      if (order.status === "incoming") {
        activities.push({
          icon: "mdi-bell-ring",
          color: "#F97316",
          text: `Новый заказ #${order.orderNumber} от ${order.customer.name}`,
          time,
        });
      } else if (order.status === "preparing") {
        activities.push({
          icon: "mdi-pot-steam",
          color: "#1976d2",
          text: `Заказ #${order.orderNumber} принят, готовится`,
          time,
        });
      } else if (order.status === "ready") {
        activities.push({
          icon: "mdi-check-circle",
          color: "#16a34a",
          text: `Заказ #${order.orderNumber} готов к выдаче`,
          time,
        });
      } else if (order.status === "completed") {
        activities.push({
          icon: "mdi-check-all",
          color: "#64748b",
          text: `Заказ #${order.orderNumber} завершён — ${order.totalPrice} ₽`,
          time,
        });
      } else if (order.status === "rejected") {
        activities.push({
          icon: "mdi-close-circle",
          color: "#EA004B",
          text: `Заказ #${order.orderNumber} отклонён`,
          time,
        });
      }
    });

  return activities;
});

const toggleOpen = () => {
  restaurantStore.toggleOpen();
};
</script>

<template>
  <div class="px-8 py-6">
    <!-- Greeting + Restaurant Card -->
    <div class="mb-5">
      <h2 class="text-h5 font-weight-bold">{{ greeting }}</h2>
      <p class="text-body-2 text-medium-emphasis mt-1">
        Вот что происходит сегодня в вашем заведении
      </p>
    </div>
    <v-row dense class="mb-6">
      <!-- Restaurant status card -->
      <v-col cols="12" md="6">
        <v-card flat rounded="xl" class="pa-5 h-100">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="d-flex align-center ga-3">
              <div
                class="d-flex align-center justify-center rounded-lg"
                :style="{
                  width: '44px',
                  height: '44px',
                  backgroundColor: restaurantStore.restaurant?.isOpen
                    ? '#e8f5e9'
                    : '#fce4ec',
                }"
              >
                <v-icon
                  :icon="
                    restaurantStore.restaurant?.isOpen
                      ? 'mdi-store-check'
                      : 'mdi-store-remove'
                  "
                  :color="
                    restaurantStore.restaurant?.isOpen ? '#16a34a' : '#EA004B'
                  "
                  size="24"
                />
              </div>
              <div>
                <p class="text-subtitle-2 font-weight-bold">
                  {{ restaurantStore.restaurant?.name ?? "Ресторан" }}
                </p>
                <p class="text-caption text-medium-emphasis">
                  {{ restaurantStore.restaurant?.address }}
                </p>
              </div>
            </div>
          </div>

          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-body-2">Статус</span>
            <v-switch
              :model-value="restaurantStore.restaurant?.isOpen ?? false"
              :label="
                restaurantStore.restaurant?.isOpen ? 'Открыто' : 'Закрыто'
              "
              :color="restaurantStore.restaurant?.isOpen ? 'success' : 'error'"
              density="compact"
              hide-details
              inset
              @update:model-value="toggleOpen"
            />
          </div>

          <v-divider class="mb-3" />

          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center ga-2">
              <v-icon icon="mdi-clock-outline" size="16" color="grey" />
              <span class="text-body-2 text-medium-emphasis">Сегодня</span>
            </div>
            <span v-if="todaySchedule" class="text-body-2 font-weight-medium">
              {{
                todaySchedule.isOpen
                  ? `${todaySchedule.open} — ${todaySchedule.close}`
                  : "Выходной"
              }}
            </span>
          </div>

          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center ga-2">
              <v-icon icon="mdi-star" size="16" color="warning" />
              <span class="text-body-2 text-medium-emphasis">Рейтинг</span>
            </div>
            <span class="text-body-2 font-weight-medium">
              {{ restaurantStore.restaurant?.rating ?? "—" }}
              <span class="text-caption text-medium-emphasis">
                ({{ restaurantStore.restaurant?.reviewsCount ?? 0 }} отзывов)
              </span>
            </span>
          </div>

          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center ga-2">
              <v-icon icon="mdi-moped" size="16" color="primary" />
              <span class="text-body-2 text-medium-emphasis">Доставка</span>
            </div>
            <span class="text-body-2 font-weight-medium">
              {{ restaurantStore.restaurant?.deliveryTime ?? "—" }} мин
            </span>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <!-- Summary stats -->
        <v-row dense>
          <v-col v-for="s in summaryStats" :key="s.label" cols="12" md="12">
            <v-card flat rounded="xl" class="pa-4 h-100">
              <div class="d-flex align-center ga-3">
                <div
                  class="d-flex align-center justify-center rounded-lg"
                  :style="{
                    width: '40px',
                    height: '40px',
                    backgroundColor: s.bg,
                  }"
                >
                  <v-icon :icon="s.icon" :color="s.color" size="20" />
                </div>
                <div>
                  <p
                    class="text-subtitle-1 font-weight-bold"
                    style="line-height: 1.2"
                  >
                    {{ s.value }}
                  </p>
                  <p class="text-caption text-medium-emphasis">{{ s.label }}</p>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Navigation + Activity -->
    <v-row dense class="mb-6">
      <!-- Navigation sections -->
      <v-col cols="12" md="12">
        <p class="text-subtitle-1 font-weight-bold mb-3">Разделы админки</p>
        <v-row dense>
          <v-col v-for="s in sections" :key="s.title" cols="12" md="6">
            <v-card
              flat
              rounded="xl"
              class="pa-5 cursor-pointer h-100 nav-section-card"
              @click="router.push(s.to)"
            >
              <div class="d-flex align-start ga-4">
                <div
                  class="d-flex align-center justify-center rounded-xl flex-shrink-0"
                  :style="{
                    width: '48px',
                    height: '48px',
                    backgroundColor: s.bg,
                  }"
                >
                  <v-icon :icon="s.icon" :color="s.color" size="24" />
                </div>
                <div class="flex-grow-1">
                  <div class="d-flex align-center justify-space-between mb-1">
                    <p class="text-body-1 font-weight-bold">{{ s.title }}</p>
                    <v-icon icon="mdi-arrow-top-right" size="16" color="grey" />
                  </div>
                  <p
                    class="text-caption text-medium-emphasis mb-2"
                    style="line-height: 1.5"
                  >
                    {{ s.description }}
                  </p>
                  <v-chip size="x-small" variant="tonal" :color="s.color">
                    {{
                      typeof s.stat === "string"
                        ? s.stat
                        : (s.stat as any).value
                    }}
                  </v-chip>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row dense class="mb-6" align="start">
      <!-- Recent activity -->
      <v-col cols="12" md="6">
        <p class="text-subtitle-1 font-weight-bold mb-3">Последние события</p>
        <v-card flat rounded="xl" class="pa-4">
          <div v-if="recentActivity.length === 0" class="text-center py-8">
            <v-icon
              icon="mdi-check-circle-outline"
              color="grey"
              size="40"
              class="mb-2"
            />
            <p class="text-body-2 text-medium-emphasis">Нет событий</p>
          </div>

          <div
            v-for="(event, idx) in recentActivity"
            :key="idx"
            class="d-flex align-start ga-3"
            :class="{ 'mb-4': idx < recentActivity.length - 1 }"
          >
            <div
              class="d-flex align-center justify-center rounded-lg flex-shrink-0 mt-1"
              :style="{
                width: '32px',
                height: '32px',
                backgroundColor: event.color + '18',
              }"
            >
              <v-icon :icon="event.icon" :color="event.color" size="16" />
            </div>
            <div class="flex-grow-1">
              <p class="text-body-2" style="line-height: 1.4">
                {{ event.text }}
              </p>
              <p class="text-caption text-medium-emphasis">{{ event.time }}</p>
            </div>
          </div>

          <v-divider v-if="recentActivity.length > 0" class="my-3" />
          <v-btn variant="text" size="small" color="primary" block to="/orders">
            Все заказы
            <v-icon icon="mdi-arrow-right" size="16" class="ml-1" />
          </v-btn>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <p class="text-subtitle-1 font-weight-bold mb-3">Быстрые действия</p>
        <v-card
          v-for="a in quickActions"
          :key="a.label"
          flat
          rounded="xl"
          class="pa-4 cursor-pointer h-100 quick-action-card mb-3"
          @click="router.push(a.to)"
        >
          <div class="d-flex align-center ga-3">
            <div
              class="d-flex align-center justify-center rounded-lg position-relative"
              :style="{ width: '44px', height: '44px', backgroundColor: a.bg }"
            >
              <v-icon :icon="a.icon" :color="a.color" size="22" />
              <v-badge
                v-if="a.badge && (a.badge as any).value > 0"
                :content="(a.badge as any).value"
                color="error"
                floating
                offset-x="-2"
                offset-y="-2"
              />
            </div>
            <div>
              <p class="text-body-2 font-weight-bold">{{ a.label }}</p>
              <p class="text-caption text-medium-emphasis">
                {{ a.description }}
              </p>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.quick-action-card {
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.quick-action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}
.nav-section-card {
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.nav-section-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
}
</style>
