<route lang="json">
{
  "meta": {
    "layout": "auth"
  }
}
</route>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROLE_LABELS, type UserRole } from '@/types'
import logo from '@/assets/images/logo.svg'

const route = useRoute()
const router = useRouter()

const API_URL = import.meta.env.VITE_API_URL as string

// States
const status = ref<'loading' | 'valid' | 'error' | 'success'>('loading')
const errorMessage = ref('')

// Invite info
const inviteEmail = ref('')
const inviteRole = ref<UserRole>('OPERATOR')
const establishmentName = ref('')
const inviteType = ref<'restaurant' | 'grocery'>('restaurant')

// Form
const name = ref('')
const phone = ref('')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const formError = ref('')

const token = computed(() => route.query.token as string || '')

const invitePrefix = computed(() =>
  inviteType.value === 'grocery' ? '/auth/grocery-store' : '/auth/restaurant',
)

const establishmentLabel = computed(() =>
  inviteType.value === 'grocery' ? 'Магазин' : 'Ресторан',
)

const accentColor = computed(() =>
  inviteType.value === 'grocery' ? '#16a34a' : '#ea004b',
)

onMounted(async () => {
  if (!token.value) {
    status.value = 'error'
    errorMessage.value = 'Ссылка приглашения некорректна'
    return
  }

  try {
    // Пробуем как ресторан
    let res = await fetch(`${API_URL}/auth/restaurant/invite/${token.value}`)
    let type: 'restaurant' | 'grocery' = 'restaurant'

    if (!res.ok) {
      // Пробуем как магазин
      res = await fetch(`${API_URL}/auth/grocery-store/invite/${token.value}`)
      type = 'grocery'

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Приглашение недействительно')
      }
    }

    const data = await res.json()
    inviteEmail.value = data.email
    inviteRole.value = data.role
    establishmentName.value = data.restaurantName || data.storeName || ''
    inviteType.value = type
    status.value = 'valid'
  } catch (e: any) {
    status.value = 'error'
    errorMessage.value = e.message || 'Приглашение недействительно'
  }
})

const submit = async () => {
  formError.value = ''

  if (!name.value.trim()) {
    formError.value = 'Введите имя'
    return
  }
  if (!phone.value.trim()) {
    formError.value = 'Введите телефон'
    return
  }
  if (password.value.length < 6) {
    formError.value = 'Пароль должен быть не менее 6 символов'
    return
  }
  if (password.value !== passwordConfirm.value) {
    formError.value = 'Пароли не совпадают'
    return
  }

  submitting.value = true
  try {
    const res = await fetch(`${API_URL}${invitePrefix.value}/invite/${token.value}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.value.trim(),
        phone: phone.value.trim(),
        password: password.value,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Ошибка регистрации')
    }

    const data = await res.json()

    // Сохраняем токены и пользователя
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    localStorage.setItem('establishmentType', inviteType.value)

    status.value = 'success'

    // Редирект через 2 секунды
    setTimeout(() => {
      window.location.href = inviteType.value === 'grocery' ? '/catalog' : '/orders'
    }, 2000)
  } catch (e: any) {
    formError.value = e.message || 'Ошибка регистрации'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="invite-page" :class="{ 'invite-page--grocery': inviteType === 'grocery' }">
    <div class="invite-card">
      <!-- Logo -->
      <div class="invite-logo">
        <img :src="logo" alt="Matsal" width="44" height="44" />
        <div class="invite-logo__text">
          <span class="invite-logo__name">Matsal</span>
          <span class="invite-logo__label">Partner</span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="status === 'loading'" class="invite-center">
        <v-progress-circular indeterminate :color="accentColor" size="48" />
        <p class="invite-center__text">Проверяем приглашение...</p>
      </div>

      <!-- Error -->
      <div v-else-if="status === 'error'" class="invite-center">
        <div class="invite-icon invite-icon--error">
          <v-icon icon="mdi-close" size="32" />
        </div>
        <h2 class="invite-center__title">Приглашение недействительно</h2>
        <p class="invite-center__text">{{ errorMessage }}</p>
        <v-btn
          :color="accentColor"
          rounded="lg"
          class="mt-4"
          @click="router.push('/login')"
        >
          Перейти к входу
        </v-btn>
      </div>

      <!-- Success -->
      <div v-else-if="status === 'success'" class="invite-center">
        <div class="invite-icon invite-icon--success">
          <v-icon icon="mdi-check" size="32" />
        </div>
        <h2 class="invite-center__title">Регистрация завершена!</h2>
        <p class="invite-center__text">Вы успешно присоединились к команде. Перенаправляем...</p>
      </div>

      <!-- Registration form -->
      <div v-else>
        <h2 class="invite-title">Приглашение в команду</h2>

        <div class="invite-info">
          <div class="invite-info__row">
            <span class="invite-info__label">{{ establishmentLabel }}</span>
            <span class="invite-info__value">{{ establishmentName }}</span>
          </div>
          <div class="invite-info__row">
            <span class="invite-info__label">Роль</span>
            <v-chip size="small" :color="accentColor" variant="tonal">
              {{ ROLE_LABELS[inviteRole] }}
            </v-chip>
          </div>
          <div class="invite-info__row">
            <span class="invite-info__label">Email</span>
            <span class="invite-info__value">{{ inviteEmail }}</span>
          </div>
        </div>

        <p class="invite-subtitle">Заполните данные для регистрации</p>

        <v-text-field
          v-model="name"
          label="Имя"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          prepend-inner-icon="mdi-account-outline"
          class="mb-1"
        />

        <v-text-field
          v-model="phone"
          label="Телефон"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          prepend-inner-icon="mdi-phone-outline"
          placeholder="+7 (___) ___-__-__"
          class="mb-1"
        />

        <v-text-field
          v-model="password"
          label="Пароль"
          :type="showPassword ? 'text' : 'password'"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword"
          class="mb-1"
        />

        <v-text-field
          v-model="passwordConfirm"
          label="Подтвердите пароль"
          :type="showPassword ? 'text' : 'password'"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          prepend-inner-icon="mdi-lock-check-outline"
          class="mb-1"
        />

        <v-alert
          v-if="formError"
          type="error"
          variant="tonal"
          density="compact"
          rounded="lg"
          class="mb-3"
        >
          {{ formError }}
        </v-alert>

        <v-btn
          block
          :color="accentColor"
          size="large"
          rounded="lg"
          :loading="submitting"
          @click="submit"
        >
          Зарегистрироваться
        </v-btn>

        <p class="invite-login-link">
          Уже есть аккаунт?
          <router-link to="/login">Войти</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.invite-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f4f0;
  padding: 20px;
}

.invite-card {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 20px;
  padding: 36px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.invite-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.invite-logo__text {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.invite-logo__name {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
}

.invite-logo__label {
  font-size: 11px;
  font-weight: 600;
  color: #ea004b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.invite-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 16px;
}

.invite-subtitle {
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 20px;
}

.invite-info {
  background: #f9f4f0;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 20px;
}

.invite-info__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
}

.invite-info__label {
  font-size: 13px;
  color: #9ca3af;
}

.invite-info__value {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.invite-center {
  text-align: center;
  padding: 20px 0;
}

.invite-center__title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.invite-center__text {
  font-size: 14px;
  color: #9ca3af;
  margin-top: 12px;
}

.invite-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.invite-icon--error {
  background: #fef2f2;
  color: #ef4444;
}

.invite-icon--success {
  background: #f0fdf4;
  color: #22c55e;
}

.invite-login-link {
  text-align: center;
  font-size: 14px;
  color: #9ca3af;
  margin-top: 16px;

  a {
    color: #ea004b;
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

// Grocery green overrides
.invite-page--grocery {
  .invite-logo__label {
    color: #16a34a;
  }
  .invite-login-link a {
    color: #16a34a;
  }
}
</style>
