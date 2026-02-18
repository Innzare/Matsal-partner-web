<script lang="ts" setup>
import { useRouter, useRoute } from "vue-router";
import { useTheme } from "vuetify";
import logo from "@/assets/images/logo.svg";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const theme = useTheme();

const router = useRouter();
const route = useRoute();

const logoutDialog = ref(false);
const drawer = ref(true);
const collapsed = ref(false);

const sidebarWidth = computed(() => (collapsed.value ? 72 : 260));

// Dark mode
const isDark = ref(localStorage.getItem("theme") === "dark");

// Apply saved theme on mount
if (isDark.value) {
  theme.global.name.value = "dark";
}

const toggleTheme = () => {
  isDark.value = !isDark.value;
  theme.global.name.value = isDark.value ? "dark" : "light";
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
};

const mainNavRoutes = [
  { path: "/", title: "Главная", icon: "mdi-home-outline" },
  { path: "/dashboard", title: "Дашборд", icon: "mdi-view-dashboard-outline" },
  { path: "/orders", title: "Заказы", icon: "mdi-receipt-text-outline" },
  { path: "/menu", title: "Меню", icon: "mdi-food-outline" },
  { path: "/reviews", title: "Отзывы", icon: "mdi-star-outline" },
];

const secondaryNavRoutes = [
  {
    path: "/notifications",
    title: "Уведомления",
    icon: "mdi-bell-outline",
  },
  { path: "/settings", title: "Настройки", icon: "mdi-cog-outline" },
];

// Маппинг названий для роутов (для header)
const routeTitles: Record<string, string> = {
  "/": "Главная",
  "/dashboard": "Дашборд",
  "/notifications": "Уведомления",
  "/menu": "Меню",
  "/orders": "Заказы",
  "/reviews": "Отзывы",
  "/settings": "Настройки",
};

const routeSubtitles: Record<string, string> = {
  "/dashboard": "Обзор показателей ресторана",
  "/orders": "Управление заказами",
  "/menu": "Управление позициями и категориями",
  "/reviews": "Отзывы клиентов",
  "/notifications": "Центр уведомлений",
  "/settings": "Настройки ресторана",
};

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

const isActive = (path: string) => {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
};

const goToSettings = () => {
  router.push("/settings");
};

const goToNotifications = () => {
  router.push("/notifications");
};

const confirmLogout = async () => {
  logoutDialog.value = false;
  await authStore.logout();
};
</script>

<template>
  <v-responsive class="overflow-visible" :class="{ dark: isDark }">
    <v-app>
      <!-- Sidebar -->
      <v-navigation-drawer
        v-model="drawer"
        class="lyt-sidebar"
        :class="{ 'lyt-sidebar--collapsed': collapsed }"
        :width="sidebarWidth"
      >
        <!-- Logo -->
        <div class="lyt-sidebar-logo">
          <div
            :style="{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? '0' : '12px',
            }"
          >
            <v-img
              :src="logo"
              :width="36"
              :height="36"
              class="lyt-sidebar-logo-img"
            />
            <div class="lyt-sidebar-brand">
              <span class="lyt-sidebar-brand-name">Matsal</span>
              <span class="lyt-sidebar-brand-label">Partner</span>
            </div>
          </div>
        </div>

        <!-- Collapse toggle (under logo) -->
        <button class="lyt-collapse-btn" @click="collapsed = !collapsed">
          <div :style="{ display: 'flex', gap: collapsed ? '0' : '12px' }">
            <v-icon
              :icon="collapsed ? 'mdi-chevron-right' : 'mdi-chevron-left'"
              size="18"
            />
            <span class="lyt-nav-text">Свернуть</span>
          </div>
        </button>

        <!-- Main nav -->
        <div class="lyt-nav-section">
          <p class="lyt-nav-label">Основное</p>
          <nav class="lyt-nav">
            <v-tooltip
              v-for="item in mainNavRoutes"
              :key="item.path"
              :text="item.title"
              location="end"
              :disabled="!collapsed"
            >
              <template #activator="{ props: tip }">
                <router-link
                  :to="item.path"
                  class="lyt-nav-item"
                  :class="{ 'lyt-nav-item--active': isActive(item.path) }"
                  v-bind="tip"
                >
                  <div
                    :style="{ display: 'flex', gap: collapsed ? '0' : '12px' }"
                  >
                    <v-icon :icon="item.icon" size="20" />
                    <span class="lyt-nav-text">{{ item.title }}</span>
                  </div>
                </router-link>
              </template>
            </v-tooltip>
          </nav>
        </div>

        <!-- Secondary nav -->
        <div class="lyt-nav-section">
          <p class="lyt-nav-label">Прочее</p>
          <nav class="lyt-nav">
            <v-tooltip
              v-for="item in secondaryNavRoutes"
              :key="item.path"
              :text="item.title"
              location="end"
              :disabled="!collapsed"
            >
              <template #activator="{ props: tip }">
                <router-link
                  :to="item.path"
                  class="lyt-nav-item"
                  :class="{ 'lyt-nav-item--active': isActive(item.path) }"
                  v-bind="tip"
                >
                  <div
                    :style="{ display: 'flex', gap: collapsed ? '0' : '12px' }"
                  >
                    <v-icon :icon="item.icon" size="20" />
                    <span class="lyt-nav-text">{{ item.title }}</span>
                  </div>
                </router-link>
              </template>
            </v-tooltip>
          </nav>
        </div>

        <div class="lyt-sidebar-spacer" />

        <!-- Theme toggle -->
        <button class="lyt-theme-btn" @click="toggleTheme">
          <div :style="{ display: 'flex', gap: collapsed ? '0' : '12px' }">
            <v-icon
              :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
              size="18"
            />
            <span class="lyt-nav-text">{{
              isDark ? "Светлая тема" : "Тёмная тема"
            }}</span>
          </div>
        </button>

        <!-- User card in sidebar -->
        <div class="lyt-sidebar-user">
          <div :style="{ display: 'flex', gap: collapsed ? '0' : '12px' }">
            <v-tooltip text="Профиль" location="end" :disabled="!collapsed">
              <template #activator="{ props: tip }">
                <div
                  class="lyt-sidebar-user-avatar"
                  v-bind="collapsed ? tip : {}"
                >
                  {{ userInitials }}
                </div>
              </template>
            </v-tooltip>
            <div class="lyt-sidebar-user-info">
              <span class="lyt-sidebar-user-name">{{
                authStore.userName || "Пользователь"
              }}</span>
              <span class="lyt-sidebar-user-role">{{
                authStore.userRole === "admin"
                  ? "Администратор"
                  : authStore.userRole || ""
              }}</span>
            </div>
            <v-tooltip text="Выйти" location="end" :disabled="!collapsed">
              <template #activator="{ props: tip }">
                <button
                  class="lyt-sidebar-logout"
                  @click="logoutDialog = true"
                  title="Выйти"
                  v-bind="tip"
                >
                  <v-icon icon="mdi-logout" size="18" />
                </button>
              </template>
            </v-tooltip>
          </div>
        </div>
      </v-navigation-drawer>

      <!-- Main content -->
      <v-main>
        <div class="lyt-content">
          <!-- Header -->
          <header class="lyt-header">
            <div class="lyt-header-left">
              <div>
                <h1 class="lyt-header-title">
                  {{ routeTitles[route.path] || "Страница" }}
                </h1>
                <p class="lyt-header-subtitle">
                  {{ routeSubtitles[route.path] || "" }}
                </p>
              </div>
            </div>

            <div class="lyt-header-right">
              <div class="lyt-header-search">
                <v-icon
                  icon="mdi-magnify"
                  size="18"
                  class="lyt-header-search-icon"
                />
                <input
                  type="text"
                  placeholder="Поиск..."
                  class="lyt-header-search-input"
                />
              </div>

              <button class="lyt-header-icon-btn" @click="goToNotifications">
                <v-icon icon="mdi-bell-outline" size="20" />
                <span class="lyt-header-badge">3</span>
              </button>

              <button class="lyt-header-icon-btn" @click="goToSettings">
                <v-icon icon="mdi-cog-outline" size="20" />
              </button>

              <div class="lyt-header-divider" />

              <v-menu offset="8">
                <template v-slot:activator="{ props }">
                  <button class="lyt-header-user" v-bind="props">
                    <div class="lyt-header-user-avatar">
                      {{ userInitials }}
                    </div>
                    <v-icon
                      icon="mdi-chevron-down"
                      size="16"
                      class="lyt-header-user-chevron"
                    />
                  </button>
                </template>

                <div class="lyt-dropdown">
                  <div class="lyt-dropdown-header">
                    <div class="lyt-dropdown-avatar">
                      {{ userInitials }}
                    </div>
                    <div>
                      <p class="lyt-dropdown-name">
                        {{ authStore.userName || "Пользователь" }}
                      </p>
                      <p class="lyt-dropdown-email">
                        {{ authStore.user?.email }}
                      </p>
                    </div>
                  </div>
                  <div class="lyt-dropdown-divider" />
                  <button class="lyt-dropdown-item" @click="goToSettings">
                    <v-icon icon="mdi-cog-outline" size="18" />
                    <span>Настройки</span>
                  </button>
                  <button class="lyt-dropdown-item" @click="goToNotifications">
                    <v-icon icon="mdi-bell-outline" size="18" />
                    <span>Уведомления</span>
                  </button>
                  <div class="lyt-dropdown-divider" />
                  <button
                    class="lyt-dropdown-item lyt-dropdown-item--danger"
                    @click="logoutDialog = true"
                  >
                    <v-icon icon="mdi-logout" size="18" />
                    <span>Выйти</span>
                  </button>
                </div>
              </v-menu>
            </div>
          </header>

          <!-- Page content -->
          <router-view v-slot="{ Component }">
            <component :is="Component" />
          </router-view>
        </div>
      </v-main>

      <!-- Logout confirm -->
      <v-dialog v-model="logoutDialog" max-width="400">
        <div class="lyt-logout-dialog">
          <div class="lyt-logout-dialog-icon">
            <v-icon icon="mdi-logout" size="24" />
          </div>
          <h3 class="lyt-logout-dialog-title">Выход из аккаунта</h3>
          <p class="lyt-logout-dialog-text">Вы уверены, что хотите выйти?</p>
          <div class="lyt-logout-dialog-actions">
            <button
              class="lyt-logout-dialog-btn lyt-logout-dialog-btn--cancel"
              @click="logoutDialog = false"
            >
              Отмена
            </button>
            <button
              class="lyt-logout-dialog-btn lyt-logout-dialog-btn--confirm"
              @click="confirmLogout"
            >
              Выйти
            </button>
          </div>
        </div>
      </v-dialog>
    </v-app>
  </v-responsive>
</template>

<style scoped>
/* ===== SIDEBAR ===== */
.lyt-sidebar {
  background: #fff !important;
  border-right: 1px solid #f0f0f0 !important;
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  overflow: hidden;
}

/* Collapsed overrides */
.lyt-sidebar--collapsed {
  padding: 20px 10px;
}

.lyt-sidebar--collapsed .lyt-sidebar-logo {
  padding: 0 0 24px;
  justify-content: center;
}

.lyt-sidebar--collapsed .lyt-sidebar-brand {
  width: 0;
  opacity: 0;
  overflow: hidden;
}

.lyt-sidebar--collapsed .lyt-nav-label {
  width: 0;
  height: 0;
  opacity: 0;
  margin: 0;
  overflow: hidden;
}

.lyt-sidebar--collapsed .lyt-nav-item {
  justify-content: center;
  padding: 10px;
}

.lyt-sidebar--collapsed .lyt-nav-text {
  width: 0;
  opacity: 0;
  overflow: hidden;
  white-space: nowrap;
}

.lyt-sidebar--collapsed .lyt-sidebar-user {
  justify-content: center;
  padding: 12px 0;
}

.lyt-sidebar--collapsed .lyt-sidebar-user-info {
  width: 0;
  opacity: 0;
  overflow: hidden;
}

.lyt-sidebar--collapsed .lyt-sidebar-logout {
  position: absolute;
  width: 0;
  opacity: 0;
  overflow: hidden;
}

.lyt-sidebar--collapsed .lyt-collapse-btn,
.lyt-sidebar--collapsed .lyt-theme-btn {
  justify-content: center;
  padding: 8px;
}

/* Logo */
.lyt-sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px 22px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
  min-height: 36px;
}

.lyt-sidebar-logo-img {
  flex-shrink: 0;
}

.lyt-sidebar-brand {
  display: flex;
  align-items: baseline;
  gap: 6px;
  transition:
    opacity 0.2s ease,
    width 0.25s ease;
  white-space: nowrap;
}

.lyt-sidebar-brand-name {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.3px;
}

.lyt-sidebar-brand-label {
  font-size: 11px;
  font-weight: 600;
  color: #ea004b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Nav sections */
.lyt-nav-section {
  margin-bottom: 24px;
}

.lyt-nav-label {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 0 12px;
  margin-bottom: 8px;
  transition:
    opacity 0.2s ease,
    height 0.25s ease,
    margin 0.25s ease;
  white-space: nowrap;
  overflow: hidden;
}

.lyt-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lyt-nav-item {
  display: flex;
  align-items: center;
  /* gap: 12px; */
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  transition: all 0.15s ease;
}

.lyt-nav-item:hover {
  background: #f9f4f0;
  color: #1a1a2e;
}

.lyt-nav-item--active {
  background: color-mix(in srgb, #ea004b 8%, transparent);
  color: #ea004b;
  font-weight: 600;
}

.lyt-nav-item--active:hover {
  background: color-mix(in srgb, #ea004b 12%, transparent);
  color: #ea004b;
}

.lyt-nav-text {
  transition:
    opacity 0.2s ease,
    width 0.25s ease;
  white-space: nowrap;
  overflow: hidden;
}

.lyt-sidebar-spacer {
  flex: 1;
}

/* Theme toggle */
.lyt-theme-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 10px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
}

.lyt-theme-btn:hover {
  background: #f3f4f6;
  color: #6b7280;
}

/* Collapse toggle */
.lyt-collapse-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 10px;
  width: 100%;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: 16px;
  white-space: nowrap;
  overflow: hidden;
}

.lyt-collapse-btn:hover {
  background: #f3f4f6;
  color: #6b7280;
}

/* User card at bottom */
.lyt-sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
  position: relative;
  transition:
    padding 0.25s ease,
    justify-content 0.25s ease;
}

.lyt-sidebar-user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ea004b, #ff4081);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.lyt-sidebar-user-info {
  flex: 1;
  min-width: 0;
  transition:
    opacity 0.2s ease,
    width 0.25s ease;
  overflow: hidden;
  white-space: nowrap;
}

.lyt-sidebar-user-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lyt-sidebar-user-role {
  display: block;
  font-size: 11px;
  color: #9ca3af;
}

.lyt-sidebar-logout {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.lyt-sidebar-logout:hover {
  background: #fef2f2;
  color: #ef4444;
}

/* ===== CONTENT ===== */
.lyt-content {
  min-height: 100vh;
  background: #f9f4f0;
}

/* ===== HEADER ===== */
.lyt-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.lyt-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.lyt-header-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.lyt-header-subtitle {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 2px;
}

.lyt-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Search */
.lyt-header-search {
  position: relative;
  margin-right: 8px;
}

.lyt-header-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

.lyt-header-search-input {
  width: 240px;
  height: 40px;
  padding: 0 16px 0 38px;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  background: #f9fafb;
  font-size: 13px;
  color: #1a1a2e;
  outline: none;
  transition: all 0.15s ease;
}

.lyt-header-search-input::placeholder {
  color: #9ca3af;
}

.lyt-header-search-input:focus {
  border-color: #ea004b;
  background: #fff;
  box-shadow: 0 0 0 3px color-mix(in srgb, #ea004b 8%, transparent);
}

/* Icon buttons */
.lyt-header-icon-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.lyt-header-icon-btn:hover {
  background: #f9f4f0;
  color: #1a1a2e;
  border-color: #e5e7eb;
}

.lyt-header-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ea004b;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.lyt-header-divider {
  width: 1px;
  height: 24px;
  background: #f0f0f0;
  margin: 0 8px;
}

/* User button in header */
.lyt-header-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border-radius: 10px;
  border: none;
  background: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.lyt-header-user:hover {
  background: #f9f4f0;
}

.lyt-header-user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ea004b, #ff4081);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lyt-header-user-chevron {
  color: #9ca3af;
}

/* ===== DROPDOWN MENU ===== */
.lyt-dropdown {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  min-width: 220px;
  padding: 4px;
  overflow: hidden;
}

.lyt-dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
}

.lyt-dropdown-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ea004b, #ff4081);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.lyt-dropdown-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.lyt-dropdown-email {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 1px;
}

.lyt-dropdown-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 4px 0;
}

.lyt-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.12s ease;
  text-align: left;
}

.lyt-dropdown-item:hover {
  background: #f9f4f0;
}

.lyt-dropdown-item--danger {
  color: #ef4444;
}

.lyt-dropdown-item--danger:hover {
  background: #fef2f2;
}

/* ===== LOGOUT DIALOG ===== */
.lyt-logout-dialog {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
}

.lyt-logout-dialog-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #fef2f2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.lyt-logout-dialog-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.lyt-logout-dialog-text {
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 24px;
}

.lyt-logout-dialog-actions {
  display: flex;
  gap: 12px;
}

.lyt-logout-dialog-btn {
  flex: 1;
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.lyt-logout-dialog-btn--cancel {
  background: #f3f4f6;
  color: #374151;
}

.lyt-logout-dialog-btn--cancel:hover {
  background: #e5e7eb;
}

.lyt-logout-dialog-btn--confirm {
  background: #ef4444;
  color: #fff;
}

.lyt-logout-dialog-btn--confirm:hover {
  background: #dc2626;
}

/* ============================= */
/* ===== DARK MODE OVERRIDES === */
/* ============================= */

/* Sidebar */
.dark .lyt-sidebar {
  background: #1e1e2e !important;
  border-right-color: #2e2e42 !important;
}

.dark .lyt-sidebar-logo {
  border-bottom-color: #2e2e42;
}

.dark .lyt-sidebar-brand-name {
  color: #e4e4e7;
}

.dark .lyt-nav-label {
  color: #71717a;
}

.dark .lyt-nav-item {
  color: #a1a1aa;
}

.dark .lyt-nav-item:hover {
  background: #252538;
  color: #e4e4e7;
}

.dark .lyt-nav-item--active {
  background: color-mix(in srgb, #ea004b 15%, transparent);
  color: #ff4081;
}

.dark .lyt-nav-item--active:hover {
  background: color-mix(in srgb, #ea004b 20%, transparent);
  color: #ff4081;
}

.dark .lyt-theme-btn,
.dark .lyt-collapse-btn {
  color: #71717a;
}

.dark .lyt-theme-btn:hover,
.dark .lyt-collapse-btn:hover {
  background: #252538;
  color: #a1a1aa;
}

.dark .lyt-sidebar-user {
  border-top-color: #2e2e42;
}

.dark .lyt-sidebar-user-name {
  color: #e4e4e7;
}

.dark .lyt-sidebar-user-role {
  color: #71717a;
}

.dark .lyt-sidebar-logout {
  color: #71717a;
}

.dark .lyt-sidebar-logout:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
}

/* Content */
.dark .lyt-content {
  background: #121220;
}

/* Header */
.dark .lyt-header {
  background: #1e1e2e;
  border-bottom-color: #2e2e42;
}

.dark .lyt-header-title {
  color: #e4e4e7;
}

.dark .lyt-header-subtitle {
  color: #71717a;
}

.dark .lyt-header-search-input {
  background: #252538;
  border-color: #2e2e42;
  color: #e4e4e7;
}

.dark .lyt-header-search-input::placeholder {
  color: #71717a;
}

.dark .lyt-header-search-input:focus {
  border-color: #ea004b;
  background: #1e1e2e;
  box-shadow: 0 0 0 3px color-mix(in srgb, #ea004b 15%, transparent);
}

.dark .lyt-header-icon-btn {
  background: #252538;
  border-color: #2e2e42;
  color: #a1a1aa;
}

.dark .lyt-header-icon-btn:hover {
  background: #2e2e42;
  color: #e4e4e7;
  border-color: #3f3f5c;
}

.dark .lyt-header-divider {
  background: #2e2e42;
}

.dark .lyt-header-user:hover {
  background: #252538;
}

.dark .lyt-header-user-chevron {
  color: #71717a;
}

/* Dropdown */
.dark .lyt-dropdown {
  background: #1e1e2e;
  border-color: #2e2e42;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.dark .lyt-dropdown-name {
  color: #e4e4e7;
}

.dark .lyt-dropdown-email {
  color: #71717a;
}

.dark .lyt-dropdown-divider {
  background: #2e2e42;
}

.dark .lyt-dropdown-item {
  color: #a1a1aa;
}

.dark .lyt-dropdown-item:hover {
  background: #252538;
}

.dark .lyt-dropdown-item--danger {
  color: #f87171;
}

.dark .lyt-dropdown-item--danger:hover {
  background: rgba(239, 68, 68, 0.12);
}

/* Logout dialog */
.dark .lyt-logout-dialog {
  background: #1e1e2e;
}

.dark .lyt-logout-dialog-icon {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
}

.dark .lyt-logout-dialog-title {
  color: #e4e4e7;
}

.dark .lyt-logout-dialog-text {
  color: #a1a1aa;
}

.dark .lyt-logout-dialog-btn--cancel {
  background: #252538;
  color: #a1a1aa;
}

.dark .lyt-logout-dialog-btn--cancel:hover {
  background: #2e2e42;
}
</style>
