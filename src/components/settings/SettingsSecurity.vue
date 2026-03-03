<script lang="ts" setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const emit = defineEmits<{ save: [text: string] }>()

const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordFormRef = ref()

const passwordRules = {
  current: [(v: string) => !!v || 'Введите текущий пароль'],
  new: [
    (v: string) => !!v || 'Введите новый пароль',
    (v: string) => v.length >= 8 || 'Минимум 8 символов',
    (v: string) => /[A-Z]/.test(v) || 'Нужна хотя бы одна заглавная буква',
    (v: string) => /[0-9]/.test(v) || 'Нужна хотя бы одна цифра',
  ],
  confirm: [
    (v: string) => !!v || 'Подтвердите пароль',
    (v: string) => v === form.value.newPassword || 'Пароли не совпадают',
  ],
}

async function changePassword() {
  const { valid } = await passwordFormRef.value.validate()
  if (!valid) return
  await new Promise((r) => setTimeout(r, 600))
  form.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  passwordFormRef.value.reset()
  emit('save', 'Пароль изменён')
}
</script>

<template>
  <div class="settings-section">
    <div class="section-title">Безопасность</div>
    <div class="section-desc">Смена пароля и безопасность аккаунта</div>

    <!-- Account info -->
    <v-card flat rounded="xl" class="pa-6 mb-5">
      <p class="text-subtitle-1 font-weight-bold mb-4">Аккаунт</p>
      <div class="d-flex align-center ga-4">
        <v-avatar color="primary" size="56">
          <span class="text-h6 text-white font-weight-bold">
            {{ authStore.userName ? authStore.userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?' }}
          </span>
        </v-avatar>
        <div>
          <p class="text-subtitle-1 font-weight-bold">{{ authStore.userName || 'Пользователь' }}</p>
          <p class="text-body-2 text-grey">{{ authStore.user?.email }}</p>
          <v-chip size="x-small" variant="tonal" color="primary" class="mt-1">
            {{ authStore.userRole === 'admin' ? 'Администратор' : authStore.userRole === 'manager' ? 'Менеджер' : 'Сотрудник' }}
          </v-chip>
        </div>
      </div>
    </v-card>

    <!-- Change password -->
    <v-card flat rounded="xl" class="pa-6 mb-5">
      <p class="text-subtitle-1 font-weight-bold mb-4">Смена пароля</p>

      <v-form ref="passwordFormRef" @submit.prevent="changePassword">
        <v-text-field
          v-model="form.currentPassword" label="Текущий пароль"
          :rules="passwordRules.current"
          :type="showCurrentPassword ? 'text' : 'password'"
          :append-inner-icon="showCurrentPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          @click:append-inner="showCurrentPassword = !showCurrentPassword"
          variant="outlined" density="comfortable" class="mb-3" style="max-width: 400px"
        />
        <v-text-field
          v-model="form.newPassword" label="Новый пароль"
          :rules="passwordRules.new"
          :type="showNewPassword ? 'text' : 'password'"
          :append-inner-icon="showNewPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          @click:append-inner="showNewPassword = !showNewPassword"
          variant="outlined" density="comfortable" class="mb-3" style="max-width: 400px"
        />
        <v-text-field
          v-model="form.confirmPassword" label="Подтверждение пароля"
          :rules="passwordRules.confirm"
          :type="showConfirmPassword ? 'text' : 'password'"
          :append-inner-icon="showConfirmPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          @click:append-inner="showConfirmPassword = !showConfirmPassword"
          variant="outlined" density="comfortable" class="mb-1" style="max-width: 400px"
        />

        <div class="text-caption text-grey mb-4">
          Пароль должен содержать минимум 8 символов, одну заглавную букву и одну цифру
        </div>

        <v-btn type="submit" color="primary" variant="flat" rounded="lg">
          Сменить пароль
        </v-btn>
      </v-form>
    </v-card>

    <!-- Sessions -->
    <v-card flat rounded="xl" class="pa-6">
      <p class="text-subtitle-1 font-weight-bold mb-4">Активные сессии</p>

      <div class="d-flex align-center ga-3 pa-3 rounded-lg session-row">
        <v-icon icon="mdi-monitor" size="24" color="green" />
        <div style="flex: 1">
          <p class="text-body-2 font-weight-medium">Текущая сессия</p>
          <p class="text-caption text-grey">Браузер — {{ new Date().toLocaleDateString('ru-RU') }}</p>
        </div>
        <v-chip color="green" size="x-small" variant="flat">Активна</v-chip>
      </div>

      <v-btn
        variant="tonal" color="red" rounded="lg" size="small"
        class="mt-4" prepend-icon="mdi-logout"
        @click="authStore.logout()"
      >
        Завершить все сессии
      </v-btn>
    </v-card>
  </div>
</template>

<style scoped>
.session-row { background: #f5f5f5; }
.dark .session-row { background: #252538; }
</style>
