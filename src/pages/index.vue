<script lang="ts" setup>
import { useOrdersStore } from "@/stores/orders";
import { useMenuStore } from "@/stores/menu";
import { useRestaurantStore } from "@/stores/restaurant";
import { useGroceryStoreStore } from "@/stores/groceryStore";
import { useCatalogStore } from "@/stores/catalog";
import { useAuthStore } from "@/stores/auth";
import { WEEKDAY_LABELS, type WeekDay } from "@/types";

const ordersStore = useOrdersStore();
const menuStore = useMenuStore();
const restaurantStore = useRestaurantStore();
const groceryStoreStore = useGroceryStoreStore();
const catalogStore = useCatalogStore();
const authStore = useAuthStore();
const router = useRouter();

const isGrocery = computed(() => authStore.isGrocery);

onMounted(async () => {
  if (isGrocery.value) {
    await Promise.all([
      groceryStoreStore.loadStore(),
      catalogStore.loadCatalog(),
    ]);
  } else {
    await Promise.all([
      ordersStore.loadOrders(),
      menuStore.loadMenu(),
      restaurantStore.loadRestaurant(),
    ]);
  }
});

// Greeting
const greeting = computed(() => {
  const hour = new Date().getHours();
  const name = authStore.userName?.split(" ")[0] || "Партнёр";
  if (hour < 12) return `Доброе утро, ${name}!`;
  if (hour < 18) return `Добрый день, ${name}!`;
  return `Добрый вечер, ${name}!`;
});

// Establishment data (unified)
const establishment = computed(() => {
  if (isGrocery.value) {
    const s = groceryStoreStore.store;
    return {
      name: s?.name ?? "Магазин",
      address: s?.address,
      imageUrl: s?.imageUrl,
      logo: s?.logo,
      isOpen: s?.isOpen ?? false,
      rating: s?.rating,
      reviewsCount: s?.reviewsCount ?? 0,
      deliveryTime: s?.deliveryTime,
      workingHours: s?.workingHours,
    };
  }
  const r = restaurantStore.restaurant;
  return {
    name: r?.name ?? "Ресторан",
    address: r?.address,
    imageUrl: r?.imageUrl,
    logo: r?.logo,
    isOpen: r?.isOpen ?? false,
    rating: r?.rating,
    reviewsCount: r?.reviewsCount ?? 0,
    deliveryTime: r?.deliveryTime,
    workingHours: r?.workingHours,
  };
});

// Today's working hours
const todaySchedule = computed(() => {
  if (!establishment.value.workingHours) return null;
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
  const schedule = (establishment.value.workingHours as any)[today];
  if (!schedule) return null;
  return {
    day: WEEKDAY_LABELS[today],
    ...schedule,
  };
});

// Catalog/menu item counts
const itemsCount = computed(() => {
  if (isGrocery.value) {
    const available = catalogStore.products.filter((p) => p.available).length;
    return { available, total: catalogStore.products.length };
  }
  const available = menuStore.items.filter((i) => i.available).length;
  return { available, total: menuStore.items.length };
});

// Summary stats
const summaryStats = computed(() => {
  if (isGrocery.value) {
    return [
      {
        label: "Товаров в каталоге",
        value: itemsCount.value.available + " / " + itemsCount.value.total,
        icon: "mdi-package-variant",
        color: "#16a34a",
        bg: "#e8f5e9",
      },
      {
        label: "Категорий",
        value: catalogStore.categories.length,
        icon: "mdi-shape",
        color: "#8b5cf6",
        bg: "#f3e8ff",
      },
      {
        label: "Недоступных товаров",
        value: catalogStore.products.filter((p) => !p.available).length,
        icon: "mdi-cancel",
        color: "#F97316",
        bg: "#fff3e0",
      },
      {
        label: "Рейтинг",
        value: establishment.value.rating ?? "—",
        icon: "mdi-star",
        color: "#eab308",
        bg: "#fef9c3",
      },
    ];
  }
  return [
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
      value: itemsCount.value.available + " / " + itemsCount.value.total,
      icon: "mdi-food",
      color: "#EA004B",
      bg: "#fce4ec",
    },
  ];
});

// Quick actions
const quickActions = computed(() => {
  if (isGrocery.value) {
    return [
      {
        label: "Каталог",
        description: "Управление товарами",
        icon: "mdi-package-variant",
        color: "#16a34a",
        bg: "#e8f5e9",
        to: "/catalog",
        badge: null,
      },
      {
        label: "Стоп-лист",
        description: "Недоступные товары",
        icon: "mdi-cancel",
        color: "#F97316",
        bg: "#fff3e0",
        to: "/catalog",
        badge: computed(() => catalogStore.products.filter((p) => !p.available).length),
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
  }
  return [
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
});

// Navigation sections
const sections = computed(() => {
  if (isGrocery.value) {
    return [
      {
        title: "Дашборд",
        description: "Аналитика, статистика товаров и категорий",
        icon: "mdi-view-dashboard",
        color: "#8b5cf6",
        bg: "#f3e8ff",
        to: "/dashboard",
        stat: "Графики и метрики",
      },
      {
        title: "Заказы",
        description: "Управление заказами магазина",
        icon: "mdi-receipt-text",
        color: "#F97316",
        bg: "#fff3e0",
        to: "/orders",
        stat: "Скоро",
      },
      {
        title: "Каталог",
        description: "Товары, категории, цены и стоп-лист",
        icon: "mdi-package-variant",
        color: "#16a34a",
        bg: "#e8f5e9",
        to: "/catalog",
        stat: `${catalogStore.products.length} товаров`,
      },
      {
        title: "Отзывы",
        description: "Отзывы клиентов, рейтинг магазина",
        icon: "mdi-star",
        color: "#eab308",
        bg: "#fef9c3",
        to: "/reviews",
        stat: `${establishment.value.rating ?? "—"} рейтинг`,
      },
      {
        title: "Уведомления",
        description: "Оповещения о заказах, отзывах и событиях",
        icon: "mdi-bell",
        color: "#1976d2",
        bg: "#e3f2fd",
        to: "/notifications",
        stat: "Все оповещения",
      },
      {
        title: "Настройки",
        description: "Профиль, рабочие часы, доставка, статус",
        icon: "mdi-cog",
        color: "#64748b",
        bg: "#f1f5f9",
        to: "/settings",
        stat: "Профиль магазина",
      },
    ];
  }
  return [
    {
      title: "Дашборд",
      description: "Аналитика, графики выручки, статистика заказов",
      icon: "mdi-view-dashboard",
      color: "#8b5cf6",
      bg: "#f3e8ff",
      to: "/dashboard",
      stat: "Графики и метрики",
    },
    {
      title: "Заказы",
      description: "Управление заказами — приём, отклонение, статусы",
      icon: "mdi-receipt-text",
      color: "#F97316",
      bg: "#fff3e0",
      to: "/orders",
      stat: computed(() => `${ordersStore.orders.length} всего`),
    },
    {
      title: "Меню",
      description: "Позиции, категории, модификаторы, цены",
      icon: "mdi-food",
      color: "#EA004B",
      bg: "#fce4ec",
      to: "/menu",
      stat: computed(() => `${menuStore.items.length} позиций`),
    },
    {
      title: "Отзывы",
      description: "Отзывы клиентов, рейтинг заведения",
      icon: "mdi-star",
      color: "#eab308",
      bg: "#fef9c3",
      to: "/reviews",
      stat: computed(
        () => `${establishment.value.rating ?? "—"} рейтинг`,
      ),
    },
    {
      title: "Уведомления",
      description: "Оповещения о заказах, отзывах и событиях",
      icon: "mdi-bell",
      color: "#1976d2",
      bg: "#e3f2fd",
      to: "/notifications",
      stat: "Все оповещения",
    },
    {
      title: "Настройки",
      description: "Профиль, рабочие часы, доставка, статус",
      icon: "mdi-cog",
      color: "#64748b",
      bg: "#f1f5f9",
      to: "/settings",
      stat: "Профиль заведения",
    },
  ];
});

// Recent activity feed
const recentActivity = computed(() => {
  if (isGrocery.value) return [];

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
  if (isGrocery.value) {
    groceryStoreStore.toggleOpen();
  } else {
    restaurantStore.toggleOpen();
  }
};
</script>

<template>
  <div class="px-8 py-6">
    <!-- Greeting + Establishment Card -->
    <div class="mb-5">
      <h2 class="text-h5 font-weight-bold">{{ greeting }}</h2>
      <p class="text-body-2 text-medium-emphasis mt-1">
        Вот что происходит сегодня в вашем заведении
      </p>
    </div>
    <v-row dense class="mb-6">
      <!-- Establishment status card -->
      <v-col cols="12" md="6">
        <v-card flat rounded="xl" class="h-100 overflow-hidden">
          <!-- Cover -->
          <div class="restaurant-cover">
            <v-img
              v-if="establishment.imageUrl"
              :src="establishment.imageUrl"
              height="120" cover
            />
            <div v-else class="restaurant-cover__placeholder" />
          </div>

          <div class="pa-5 pt-0">
            <!-- Logo + Name -->
            <div class="d-flex align-center ga-3 mb-4" style="margin-top: -28px; position: relative; z-index: 1">
              <v-avatar size="56" color="grey-lighten-3" class="restaurant-logo-avatar">
                <v-img v-if="establishment.logo" :src="establishment.logo" />
                <v-icon v-else icon="mdi-store" size="28" color="grey" />
              </v-avatar>
              <div style="padding-top: 28px">
                <p class="text-subtitle-2 font-weight-bold">
                  {{ establishment.name }}
                </p>
                <p class="text-caption text-medium-emphasis">
                  {{ establishment.address }}
                </p>
              </div>
            </div>

          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-body-2">Статус</span>
            <v-switch
              :model-value="establishment.isOpen"
              :label="establishment.isOpen ? 'Открыто' : 'Закрыто'"
              :color="establishment.isOpen ? 'success' : 'error'"
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
              {{ establishment.rating ?? "—" }}
              <span class="text-caption text-medium-emphasis">
                ({{ establishment.reviewsCount }} отзывов)
              </span>
            </span>
          </div>

          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center ga-2">
              <v-icon icon="mdi-moped" size="16" color="primary" />
              <span class="text-body-2 text-medium-emphasis">Доставка</span>
            </div>
            <span class="text-body-2 font-weight-medium">
              {{ establishment.deliveryTime ?? "—" }} мин
            </span>
          </div>
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
      <v-col v-if="!isGrocery" cols="12" md="6">
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

      <v-col cols="12" :md="isGrocery ? 12 : 6">
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
/* ── Restaurant card ── */
.restaurant-cover { height: 120px; background: #f3f4f6; }
.restaurant-cover__placeholder {
  height: 100%;
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
}
.restaurant-logo-avatar {
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

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
