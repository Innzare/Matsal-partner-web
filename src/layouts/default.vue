<script lang="ts" setup>
import { useRouter, useRoute } from "vue-router";
import logo from "@/assets/images/logo.svg";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const router = useRouter();
const route = useRoute();

const logoutDialog = ref(false);
const drawer = ref(true);

// Маппинг иконок для каждого роута
const routeIcons: Record<string, string> = {
  "/": "mdi-home",
  "/dashboard": "mdi-view-dashboard",
  "/notifications": "mdi-bell",
  "/menu": "mdi-food",
  "/orders": "mdi-receipt-text",
  "/reviews": "mdi-star",
};

// Маппинг названий для роутов
const routeTitles: Record<string, string> = {
  "/": "Главная",
  "/dashboard": "Дашборд",
  "/notifications": "Уведомления",
  "/menu": "Меню",
  "/orders": "Заказы",
  "/reviews": "Отзывы",
};

// Получаем все роуты и фильтруем их
const navigationRoutes = computed(() => {
  return router
    .getRoutes()
    .filter((route) => {
      // Фильтруем только основные роуты (не дочерние)
      return route.path && !route.path.includes(":") && route.name;
    })
    .map((route) => ({
      name: route.name as string,
      path: route.path,
      title: routeTitles[route.path] || (route.name as string),
      icon: routeIcons[route.path] || "mdi-circle-medium",
    }))
    .sort((a, b) => {
      // Главная первой
      if (a.path === "/") return -1;
      if (b.path === "/") return 1;
      return a.title.localeCompare(b.title);
    });
});

// User initials for avatar
const userInitials = computed(() => {
  if (!authStore.userName) return "?";
  return authStore.userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
});

const goToProfile = () => {
  router.push("/profile");
};

const goToSettings = () => {
  router.push("/settings");
};

const handleLogout = () => {
  logoutDialog.value = true;
};

const confirmLogout = async () => {
  logoutDialog.value = false;
  await authStore.logout();
};
</script>

<template>
  <v-responsive class="overflow-visible">
    <v-app>
      <!-- <v-app-bar title="App bar"></v-app-bar> -->

      <v-navigation-drawer
        v-model="drawer"
        class="py-4 px-2 position-fixed left-0"
      >
        <div class="d-flex justify-center mb-4">
          <v-img :src="logo" max-width="80"></v-img>
        </div>

        <v-list density="compact" nav>
          <v-list-item
            v-for="route in navigationRoutes"
            :key="route.path"
            :to="route.path"
            :prepend-icon="route.icon"
            :title="route.title"
            :value="route.name"
          />
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <div class="h-100" :style="{ backgroundColor: '#f9f4f0' }">
          <div
            class="position-sticky d-flex justify-space-between align-center mb-6 top-0 py-6 px-8 elevation-2"
            :style="{ backgroundColor: '#f9f4f0' }"
          >
            <p class="text-h6">{{ routeTitles[route.path] }}</p>

            <div class="d-flex align-center ga-4">
              <v-text-field
                label="Поиск"
                variant="outlined"
                density="compact"
                append-inner-icon="mdi-magnify"
                rounded="2-xl"
                hide-details
                width="400"
                bg-color="#fff"
              ></v-text-field>

              <v-btn
                density="comfortable"
                flat
                variant="outlined"
                size="small"
                color="#999"
                rounded="md"
                height="40"
              >
                <v-icon icon="mdi-bell" size="large" />
              </v-btn>

              <v-btn
                density="comfortable"
                flat
                variant="outlined"
                size="small"
                color="#999"
                rounded="md"
                height="40"
              >
                <v-icon icon="mdi-cog" size="large" />
              </v-btn>

              <div>
                <p class="font-weight-bold">Orlando Laurentius</p>

                <p class="text-body-2 text-grey-darken-1">Admin</p>
              </div>

              <v-avatar
                color="warning"
                size="large"
                rounded="0"
                class="rounded-lg"
              >
                <v-icon icon="mdi-account-circle" />
              </v-avatar>
            </div>
          </div>

          <v-fade-transition hide-on-leave>
            <router-view />
          </v-fade-transition>
        </div>
      </v-main>
    </v-app>
  </v-responsive>
</template>
