// src/stores/auth.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "manager" | "staff";
}

interface LoginCredentials {
  email: string;
  password: string;
}

export const useAuthStore = defineStore("auth", () => {
  const router = useRouter();

  // State
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem("token"));
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const userRole = computed(() => user.value?.role);
  const userName = computed(() => user.value?.name);

  // Actions
  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true;
    error.value = null;

    try {
      // MOCK AUTH - для тестирования без бэкенда
      if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
        // Имитация задержки сети
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Проверка тестовых учетных данных
        if (
          credentials.email === "admin@restaurant.com" &&
          credentials.password === "password123"
        ) {
          const mockData = {
            token: "mock-jwt-token-" + Date.now(),
            user: {
              id: 1,
              email: "admin@restaurant.com",
              name: "Администратор",
              role: "admin" as const,
            },
          };

          token.value = mockData.token;
          user.value = mockData.user;
          localStorage.setItem("token", mockData.token);
          localStorage.setItem("user", JSON.stringify(mockData.user));

          router.push("/dashboard");
          return;
        } else {
          throw new Error("Неверный email или пароль");
        }
      }

      // Реальный API запрос
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        },
      );

      if (!response.ok) {
        throw new Error("Неверный email или пароль");
      }

      const data = await response.json();

      // Сохраняем токен и данные пользователя
      token.value = data.token;
      user.value = data.user;
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Перенаправляем на dashboard
      router.push("/dashboard");
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Ошибка авторизации";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    try {
      // Опционально: уведомить сервер о выходе
      if (token.value) {
        await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        });
      }
    } catch (err) {
      console.error("Ошибка при выходе:", err);
    } finally {
      // Очищаем данные
      user.value = null;
      token.value = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Перенаправляем на страницу входа
      router.push("/login");
    }
  };

  const checkAuth = async () => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!savedToken || !savedUser) {
      return false;
    }

    try {
      // MOCK AUTH - для тестирования без бэкенда
      if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
        token.value = savedToken;
        user.value = JSON.parse(savedUser);
        return true;
      }

      // Проверяем токен на сервере
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Токен недействителен");
      }

      const data = await response.json();
      token.value = savedToken;
      user.value = data.user;
      return true;
    } catch (err) {
      // Токен недействителен - очищаем
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return false;
    }
  };

  const refreshToken = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Не удалось обновить токен");
      }

      const data = await response.json();
      token.value = data.token;
      localStorage.setItem("token", data.token);
    } catch (err) {
      await logout();
    }
  };

  return {
    // State
    user,
    token,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    userRole,
    userName,
    // Actions
    login,
    logout,
    checkAuth,
    refreshToken,
  };
});
