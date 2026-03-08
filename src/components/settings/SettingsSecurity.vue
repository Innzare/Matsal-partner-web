<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const emit = defineEmits<{ save: [text: string] }>()

// Profile editing
const editingProfile = ref(false)
const savingProfile = ref(false)
const profileForm = ref({
  name: authStore.user?.name || '',
  email: authStore.user?.email || '',
  phone: authStore.user?.phone || '',
})

watch(() => authStore.user, (u) => {
  if (u && !editingProfile.value) {
    profileForm.value = { name: u.name, email: u.email, phone: u.phone }
  }
}, { immediate: true })

function startEditing() {
  profileForm.value = {
    name: authStore.user?.name || '',
    email: authStore.user?.email || '',
    phone: authStore.user?.phone || '',
  }
  editingProfile.value = true
}

function cancelEditing() {
  editingProfile.value = false
  profileForm.value = {
    name: authStore.user?.name || '',
    email: authStore.user?.email || '',
    phone: authStore.user?.phone || '',
  }
}

async function saveProfile() {
  if (!profileForm.value.name.trim()) return
  try {
    savingProfile.value = true
    await authStore.updateProfile({
      name: profileForm.value.name.trim(),
      email: profileForm.value.email.trim(),
      phone: profileForm.value.phone.trim(),
    })
    editingProfile.value = false
    emit('save', 'Профиль обновлён')
  } catch (e: any) {
    emit('save', e.message || 'Ошибка при сохранении')
  } finally {
    savingProfile.value = false
  }
}

// Password change
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordFormRef = ref()
const savingPassword = ref(false)

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
    (v: string) => v === passwordForm.value.newPassword || 'Пароли не совпадают',
  ],
}

async function changePassword() {
  const { valid } = await passwordFormRef.value.validate()
  if (!valid) return
  try {
    savingPassword.value = true
    await authStore.changePassword(passwordForm.value.currentPassword, passwordForm.value.newPassword)
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    passwordFormRef.value.reset()
    emit('save', 'Пароль изменён')
  } catch (e: any) {
    emit('save', e.message || 'Ошибка при смене пароля')
  } finally {
    savingPassword.value = false
  }
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Владелец',
  MANAGER: 'Менеджер',
  OPERATOR: 'Оператор',
}
</script>

<template>
  <div class="settings-section">
    <div class="section-title">Учетная запись</div>
    <div class="section-desc">Личные данные и безопасность аккаунта</div>

    <!-- Profile info / edit -->
    <v-card flat rounded="xl" class="pa-6 mb-5">
      <div class="d-flex align-center justify-space-between mb-4">
        <p class="text-subtitle-1 font-weight-bold">Личные данные</p>
        <v-btn
          v-if="!editingProfile"
          variant="text" color="primary" size="small"
          @click="startEditing"
        >
          Изменить
        </v-btn>
      </div>

      <template v-if="editingProfile">
        <v-text-field
          v-model="profileForm.name" label="Имя"
          variant="outlined" density="comfortable" class="mb-3"
          style="max-width: 400px"
        />
        <v-text-field
          v-model="profileForm.email" label="Email" type="email"
          variant="outlined" density="comfortable" class="mb-3"
          style="max-width: 400px"
        />
        <v-text-field
          v-model="profileForm.phone" label="Телефон"
          variant="outlined" density="comfortable" class="mb-4"
          style="max-width: 400px"
        />
        <div class="d-flex ga-3">
          <v-btn variant="tonal" color="grey" rounded="lg" @click="cancelEditing">
            Отмена
          </v-btn>
          <v-btn
            variant="flat" color="primary" rounded="lg"
            :loading="savingProfile" @click="saveProfile"
          >
            Сохранить
          </v-btn>
        </div>
      </template>

      <template v-else>
        <div class="d-flex align-center ga-4 mb-5">
          <v-avatar color="primary" size="56">
            <span class="text-h6 text-white font-weight-bold">
              {{ authStore.userName ? authStore.userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?' }}
            </span>
          </v-avatar>
          <div>
            <p class="text-subtitle-1 font-weight-bold">{{ authStore.userName || 'Пользователь' }}</p>
            <p class="text-body-2 text-grey">{{ authStore.user?.email }}</p>
            <v-chip size="x-small" variant="tonal" color="primary" class="mt-1">
              {{ ROLE_LABELS[authStore.userRole as string] || authStore.userRole }}
            </v-chip>
          </div>
        </div>

        <div class="profile-fields">
          <div
            v-for="(item, i) in [
              { icon: 'mdi-account-outline', label: 'Имя', value: authStore.user?.name },
              { icon: 'mdi-email-outline', label: 'Email', value: authStore.user?.email },
              { icon: 'mdi-phone-outline', label: 'Телефон', value: authStore.user?.phone || '—' },
              { icon: 'mdi-shield-outline', label: 'Роль', value: ROLE_LABELS[authStore.userRole as string] || authStore.userRole },
            ]"
            :key="i" class="profile-field"
          >
            <v-icon :icon="item.icon" size="18" color="grey" />
            <span class="text-body-2 text-grey field-label">{{ item.label }}</span>
            <span class="text-body-2 font-weight-medium">{{ item.value }}</span>
          </div>
        </div>
      </template>
    </v-card>

    <!-- Change password -->
    <v-card flat rounded="xl" class="pa-6 mb-5">
      <p class="text-subtitle-1 font-weight-bold mb-4">Смена пароля</p>

      <v-form ref="passwordFormRef" @submit.prevent="changePassword">
        <v-text-field
          v-model="passwordForm.currentPassword" label="Текущий пароль"
          :rules="passwordRules.current"
          :type="showCurrentPassword ? 'text' : 'password'"
          :append-inner-icon="showCurrentPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          @click:append-inner="showCurrentPassword = !showCurrentPassword"
          variant="outlined" density="comfortable" class="mb-3" style="max-width: 400px"
        />
        <v-text-field
          v-model="passwordForm.newPassword" label="Новый пароль"
          :rules="passwordRules.new"
          :type="showNewPassword ? 'text' : 'password'"
          :append-inner-icon="showNewPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          @click:append-inner="showNewPassword = !showNewPassword"
          variant="outlined" density="comfortable" class="mb-3" style="max-width: 400px"
        />
        <v-text-field
          v-model="passwordForm.confirmPassword" label="Подтверждение пароля"
          :rules="passwordRules.confirm"
          :type="showConfirmPassword ? 'text' : 'password'"
          :append-inner-icon="showConfirmPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          @click:append-inner="showConfirmPassword = !showConfirmPassword"
          variant="outlined" density="comfortable" class="mb-1" style="max-width: 400px"
        />

        <div class="text-caption text-grey mb-4">
          Пароль должен содержать минимум 8 символов, одну заглавную букву и одну цифру
        </div>

        <v-btn
          type="submit" color="primary" variant="flat" rounded="lg"
          :loading="savingPassword"
        >
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

.profile-fields { display: flex; flex-direction: column; gap: 12px; }
.profile-field {
  display: flex; align-items: center; gap: 10px;
}
.field-label { width: 70px; }
</style>
