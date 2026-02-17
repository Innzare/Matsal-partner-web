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

const formRef = ref();
const valid = ref(false);
const email = ref("");
const password = ref("");
const showPassword = ref(false);

const emailRules = [
  (v: string) => !!v || "Email обязателен",
  (v: string) => /.+@.+\..+/.test(v) || "Email должен быть валидным",
];

const passwordRules = [
  (v: string) => !!v || "Пароль обязателен",
  (v: string) => v.length >= 6 || "Минимум 6 символов",
];

const handleLogin = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  try {
    await authStore.login({ email: email.value, password: password.value });
  } catch (error) {
    console.error("Ошибка входа:", error);
  }
};

const features = [
  { icon: "mdi-chart-line", text: "Аналитика и отчёты в реальном времени" },
  { icon: "mdi-receipt-text", text: "Управление заказами и кухней" },
  { icon: "mdi-food", text: "Редактор меню и категорий" },
  { icon: "mdi-star-outline", text: "Отзывы и рейтинг заведения" },
];
</script>

<template>
  <div class="auth-page">
    <!-- Left panel — branding -->
    <div class="auth-left">
      <div class="auth-left__inner">
        <div class="auth-logo">
          <v-icon size="36" color="white">mdi-silverware-fork-knife</v-icon>
          <span class="auth-logo__text">Matsal</span>
        </div>

        <div class="auth-left__content">
          <h1 class="auth-left__title">Управляйте рестораном легко</h1>
          <p class="auth-left__subtitle">
            Единая панель для заказов, меню, аналитики и команды
          </p>

          <div class="auth-features">
            <div class="auth-feature" v-for="f in features" :key="f.icon">
              <div class="auth-feature__icon">
                <v-icon size="20" color="white">{{ f.icon }}</v-icon>
              </div>
              <span>{{ f.text }}</span>
            </div>
          </div>
        </div>

        <div class="auth-left__footer">
          © {{ new Date().getFullYear() }} Matsal. Все права защищены.
        </div>
      </div>
    </div>

    <!-- Right panel — form -->
    <div class="auth-right">
      <div class="auth-form-wrap">
        <div class="auth-form-header">
          <h2 class="auth-form-header__title">Добро пожаловать</h2>
          <p class="auth-form-header__sub">Войдите в свой аккаунт</p>
        </div>

        <v-form ref="formRef" v-model="valid" @submit.prevent="handleLogin" class="auth-form">
          <div class="auth-field-label">Email</div>
          <v-text-field
            v-model="email"
            :rules="emailRules"
            placeholder="admin@restaurant.com"
            type="email"
            variant="outlined"
            density="comfortable"
            class="auth-field"
            hide-details="auto"
            :disabled="authStore.isLoading"
          />

          <div class="auth-field-label mt-4">Пароль</div>
          <v-text-field
            v-model="password"
            :rules="passwordRules"
            placeholder="••••••••"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            @click:append-inner="showPassword = !showPassword"
            variant="outlined"
            density="comfortable"
            class="auth-field"
            hide-details="auto"
            :disabled="authStore.isLoading"
          />

          <v-slide-y-transition>
            <v-alert
              v-if="authStore.error"
              type="error"
              variant="tonal"
              class="mt-4"
              density="compact"
              rounded="lg"
            >
              {{ authStore.error }}
            </v-alert>
          </v-slide-y-transition>

          <v-btn
            type="submit"
            color="primary"
            :loading="authStore.isLoading"
            :disabled="!valid"
            block
            size="large"
            rounded="lg"
            class="auth-submit mt-6"
            elevation="0"
          >
            Войти
          </v-btn>
        </v-form>

        <div class="auth-hint">
          <v-icon size="14" color="grey-darken-1">mdi-information-outline</v-icon>
          <span>Тестовый вход: <code>admin@restaurant.com</code> / <code>password123</code></span>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.auth-page {
  display: flex;
  min-height: 100vh;
  background: #f9f4f0;
}

/* ── Left ── */
.auth-left {
  flex: 0 0 440px;
  background: linear-gradient(160deg, #EA004B 0%, #c0003d 100%);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.auth-left::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 20%, rgba(255,255,255,.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255,255,255,.05) 0%, transparent 50%);
}

.auth-left__inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 40px 44px;
  position: relative;
  z-index: 1;
}

.auth-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.auth-logo__text {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.3px;
}

.auth-left__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-bottom: 40px;
}

.auth-left__title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
  margin-bottom: 12px;
}

.auth-left__subtitle {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
  margin-bottom: 36px;
}

.auth-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-feature {
  display: flex;
  align-items: center;
  gap: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.auth-feature__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.auth-left__footer {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}

/* ── Right ── */
.auth-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}

.auth-form-wrap {
  width: 100%;
  max-width: 400px;
}

.auth-form-header {
  margin-bottom: 32px;
}

.auth-form-header__title {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 6px;
}

.auth-form-header__sub {
  font-size: 15px;
  color: #6b7280;
}

.auth-field-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.auth-field :deep(.v-field__outline) {
  --v-field-border-opacity: 1;
}

.auth-field :deep(.v-field--focused .v-field__outline) {
  color: #EA004B;
}

.auth-submit {
  height: 48px !important;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0;
  background-color: #EA004B !important;
}

.auth-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  font-size: 12px;
  color: #9ca3af;
}

.auth-hint code {
  background: #f3f4f6;
  border-radius: 4px;
  padding: 1px 5px;
  font-family: monospace;
  color: #EA004B;
}

/* Responsive */
@media (max-width: 768px) {
  .auth-page {
    flex-direction: column;
  }

  .auth-left {
    flex: 0 0 auto;
    padding: 32px 24px;
  }

  .auth-left__inner {
    padding: 0;
  }

  .auth-left__content {
    padding-bottom: 0;
    padding-top: 24px;
  }

  .auth-left__title {
    font-size: 22px;
  }

  .auth-left__footer {
    display: none;
  }

  .auth-features {
    display: none;
  }

  .auth-right {
    padding: 32px 20px;
  }
}
</style>
