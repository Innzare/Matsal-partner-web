// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import { setupLayouts } from "virtual:generated-layouts";
import { routes } from "vue-router/auto-routes";
import { useAuthStore } from "@/stores/auth";
import type { UserRole } from "@/types";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
});

// Публичные маршруты (доступны без авторизации)
const publicRoutes = ["/login", "/forgot-password", "/invite"];

// Карта доступа: какие роли имеют доступ к каким маршрутам
const ROUTE_ACCESS: Record<string, UserRole[]> = {
  "/dashboard": ["OWNER"],
  "/menu": ["OWNER", "MANAGER"],
  "/catalog": ["OWNER", "MANAGER"],
  "/reviews": ["OWNER", "MANAGER"],
  "/promotion": ["OWNER"],
  "/push-campaigns": ["OWNER"],
  "/search-boost": ["OWNER"],
  "/badges": ["OWNER"],
  "/settings": ["OWNER"],
  "/staff": ["OWNER"],
};

// Маршруты для авторизованных пользователей
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Проверяем, является ли маршрут публичным
  const isPublicRoute = publicRoutes.some(r => to.path.startsWith(r));

  // Если пользователь не авторизован
  if (!authStore.isAuthenticated) {
    // Пытаемся восстановить сессию из localStorage
    const isAuthenticated = await authStore.checkAuth();

    if (!isAuthenticated && !isPublicRoute) {
      // Перенаправляем на страницу входа
      return next({
        path: "/login",
        query: { redirect: to.fullPath }, // Сохраняем путь для редиректа после входа
      });
    }
  }

  // Если пользователь авторизован и пытается зайти на страницу входа
  if (authStore.isAuthenticated && to.path === "/login") {
    return next("/orders");
  }

  // Проверка прав доступа по ролям
  const role = authStore.userRole as UserRole | undefined;
  if (role) {
    const allowedRoles = ROUTE_ACCESS[to.path];
    if (allowedRoles && !allowedRoles.includes(role)) {
      return next("/orders"); // Все роли имеют доступ к заказам
    }
  }

  next();
});

// Обработка ошибок динамического импорта
router.onError((err, to) => {
  if (err?.message?.includes?.("Failed to fetch dynamically imported module")) {
    if (localStorage.getItem("vuetify:dynamic-reload")) {
      console.error("Dynamic import error, reloading page did not fix it", err);
    } else {
      console.log("Reloading page to fix dynamic import error");
      localStorage.setItem("vuetify:dynamic-reload", "true");
      location.assign(to.fullPath);
    }
  } else {
    console.error(err);
  }
});

router.isReady().then(() => {
  localStorage.removeItem("vuetify:dynamic-reload");
});

export default router;
