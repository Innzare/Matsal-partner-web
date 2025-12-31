// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import { setupLayouts } from "virtual:generated-layouts";
import { routes } from "vue-router/auto-routes";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
});

// Публичные маршруты (доступны без авторизации)
const publicRoutes = ["/login", "/forgot-password"];

// Маршруты для авторизованных пользователей
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Проверяем, является ли маршрут публичным
  const isPublicRoute = publicRoutes.includes(to.path);

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
    return next("/dashboard");
  }

  // Проверка прав доступа по ролям (опционально)
  if (to.meta.requiresRole) {
    const requiredRole = to.meta.requiresRole as string;
    if (authStore.userRole !== requiredRole && authStore.userRole !== "admin") {
      return next("/dashboard"); // Перенаправляем если нет прав
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
