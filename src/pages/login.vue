<route lang="json">
{
  "meta": {
    "layout": "auth"
  }
}
</route>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

// Form data
const formRef = ref();
const valid = ref(false);
const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const showPassword = ref(false);

// Validation rules
const emailRules = [
  (v: string) => !!v || "Email обязателен",
  (v: string) => /.+@.+\..+/.test(v) || "Email должен быть валидным",
];

const passwordRules = [
  (v: string) => !!v || "Пароль обязателен",
  (v: string) => v.length >= 6 || "Пароль должен быть минимум 6 символов",
];

const handleLogin = async () => {
  const { valid } = await formRef.value.validate();

  if (!valid) return;

  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    });

    // После успешного входа перенаправляемся на dashboard
    // Перенаправление обрабатывается в store
  } catch (error) {
    console.error("Ошибка входа:", error);
  }
};

const showForgotPassword = () => {
  // TODO: Реализовать восстановление пароля
  alert("Функция восстановления пароля в разработке");
};

// Демо данные для тестирования
// Удалите это в production!
if (import.meta.env.DEV) {
  email.value = "admin@restaurant.com";
  password.value = "password123";
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Вход в систему</v-toolbar-title>
          </v-toolbar>

          <v-card-text>
            <v-form ref="formRef" v-model="valid" @submit.prevent="handleLogin">
              <v-text-field
                v-model="email"
                :rules="emailRules"
                label="Email"
                prepend-icon="mdi-account"
                type="email"
                required
                :disabled="authStore.isLoading"
              />

              <v-text-field
                v-model="password"
                :rules="passwordRules"
                label="Пароль"
                prepend-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                required
                :disabled="authStore.isLoading"
              />

              <v-checkbox
                v-model="rememberMe"
                label="Запомнить меня"
                :disabled="authStore.isLoading"
              />

              <v-alert
                v-if="authStore.error"
                type="error"
                variant="tonal"
                closable
                class="mb-4"
              >
                {{ authStore.error }}
              </v-alert>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn
              color="primary"
              :loading="authStore.isLoading"
              :disabled="!valid"
              block
              size="large"
              @click="handleLogin"
            >
              Войти
            </v-btn>
          </v-card-actions>

          <v-divider class="my-4" />

          <v-card-text class="text-center">
            <v-btn variant="text" size="small" @click="showForgotPassword">
              Забыли пароль?
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.fill-height {
  /* min-height: 100vh; */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
