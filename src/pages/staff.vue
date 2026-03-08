<script setup lang="ts">
import { useStaffStore } from '@/stores/staff'
import { ROLE_LABELS, ROLE_COLORS, type UserRole } from '@/types'

const store = useStaffStore()

onMounted(() => {
  store.loadStaff()
  store.loadInvites()
})

// ── Tabs ──
const activeTab = ref<'staff' | 'invites'>('staff')

// ── Invite dialog ──
const inviteDialog = ref(false)
const inviteEmail = ref('')
const inviteRole = ref<UserRole>('OPERATOR')
const inviteLoading = ref(false)
const inviteError = ref('')

const roleOptions = [
  { title: 'Менеджер', value: 'MANAGER' as UserRole },
  { title: 'Оператор', value: 'OPERATOR' as UserRole },
]

const openInviteDialog = () => {
  inviteEmail.value = ''
  inviteRole.value = 'OPERATOR'
  inviteError.value = ''
  inviteDialog.value = true
}

const submitInvite = async () => {
  if (!inviteEmail.value.trim()) {
    inviteError.value = 'Введите email'
    return
  }
  inviteLoading.value = true
  inviteError.value = ''
  try {
    await store.sendInvite(inviteEmail.value.trim(), inviteRole.value)
    inviteDialog.value = false
  } catch (e: any) {
    inviteError.value = e.message || 'Ошибка отправки'
  } finally {
    inviteLoading.value = false
  }
}

// ── Delete staff dialog ──
const deleteDialog = ref(false)
const deleteTarget = ref<{ id: string; name: string } | null>(null)

const confirmDelete = (id: string, name: string) => {
  deleteTarget.value = { id, name }
  deleteDialog.value = true
}

const doDelete = async () => {
  if (!deleteTarget.value) return
  await store.removeStaff(deleteTarget.value.id)
  deleteDialog.value = false
}

// ── Change role ──
const changeRoleDialog = ref(false)
const changeRoleTarget = ref<{ id: string; name: string; role: UserRole } | null>(null)
const newRole = ref<UserRole>('OPERATOR')

const openChangeRole = (id: string, name: string, currentRole: UserRole) => {
  changeRoleTarget.value = { id, name, role: currentRole }
  newRole.value = currentRole
  changeRoleDialog.value = true
}

const doChangeRole = async () => {
  if (!changeRoleTarget.value) return
  await store.updateRole(changeRoleTarget.value.id, newRole.value)
  changeRoleDialog.value = false
}

// ── Helpers ──
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function inviteStatus(invite: { usedAt: string | null; expiresAt: string }) {
  if (invite.usedAt) return { text: 'Принято', color: 'green' }
  if (new Date(invite.expiresAt) < new Date()) return { text: 'Истекло', color: 'grey' }
  return { text: 'Ожидание', color: 'orange' }
}
</script>

<template>
  <div class="staff-page">
    <!-- Header -->
    <div class="staff-header">
      <div>
        <h1 class="staff-header__title">Работники</h1>
        <p class="staff-header__sub">Управление командой ресторана</p>
      </div>
      <v-btn
        color="primary"
        rounded="lg"
        prepend-icon="mdi-plus"
        @click="openInviteDialog"
      >
        Пригласить
      </v-btn>
    </div>

    <!-- Tabs -->
    <div class="staff-tabs">
      <button
        class="staff-tab"
        :class="{ 'staff-tab--active': activeTab === 'staff' }"
        @click="activeTab = 'staff'"
      >
        Работники
        <span class="staff-tab__count">{{ store.staff.length }}</span>
      </button>
      <button
        class="staff-tab"
        :class="{ 'staff-tab--active': activeTab === 'invites' }"
        @click="activeTab = 'invites'"
      >
        Приглашения
        <span class="staff-tab__count">{{ store.invites.length }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="staff-loading">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- Staff list -->
    <div v-else-if="activeTab === 'staff'" class="staff-list">
      <div v-if="store.staff.length === 0" class="staff-empty">
        <v-icon icon="mdi-account-group-outline" size="48" color="#9ca3af" />
        <p>Пока нет работников</p>
        <p class="staff-empty__sub">Отправьте приглашение, чтобы добавить работника</p>
      </div>

      <div v-else class="staff-card" v-for="member in store.staff" :key="member.id">
        <div class="staff-card__left">
          <div class="staff-card__avatar">
            {{ member.name.charAt(0).toUpperCase() }}
          </div>
          <div class="staff-card__info">
            <div class="staff-card__name">{{ member.name }}</div>
            <div class="staff-card__email">{{ member.email }}</div>
          </div>
        </div>

        <div class="staff-card__right">
          <v-chip
            size="small"
            :color="ROLE_COLORS[member.role]"
            variant="tonal"
          >
            {{ ROLE_LABELS[member.role] }}
          </v-chip>

          <span class="staff-card__date">{{ formatDate(member.createdAt) }}</span>

          <v-menu v-if="member.role !== 'OWNER'">
            <template v-slot:activator="{ props }">
              <v-btn
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
                v-bind="props"
              />
            </template>
            <v-list density="compact" rounded="lg">
              <v-list-item
                prepend-icon="mdi-swap-horizontal"
                title="Сменить роль"
                @click="openChangeRole(member.id, member.name, member.role)"
              />
              <v-list-item
                prepend-icon="mdi-delete-outline"
                title="Удалить"
                base-color="red"
                @click="confirmDelete(member.id, member.name)"
              />
            </v-list>
          </v-menu>
        </div>
      </div>
    </div>

    <!-- Invites list -->
    <div v-else class="staff-list">
      <div v-if="store.invites.length === 0" class="staff-empty">
        <v-icon icon="mdi-email-outline" size="48" color="#9ca3af" />
        <p>Нет приглашений</p>
        <p class="staff-empty__sub">Отправьте приглашение работнику по email</p>
      </div>

      <div v-else class="staff-card" v-for="invite in store.invites" :key="invite.id">
        <div class="staff-card__left">
          <div class="staff-card__avatar staff-card__avatar--invite">
            <v-icon icon="mdi-email-outline" size="20" />
          </div>
          <div class="staff-card__info">
            <div class="staff-card__name">{{ invite.email }}</div>
            <div class="staff-card__email">Истекает: {{ formatDate(invite.expiresAt) }}</div>
          </div>
        </div>

        <div class="staff-card__right">
          <v-chip
            size="small"
            :color="ROLE_COLORS[invite.role]"
            variant="tonal"
          >
            {{ ROLE_LABELS[invite.role] }}
          </v-chip>

          <v-chip
            size="small"
            :color="inviteStatus(invite).color"
            variant="tonal"
          >
            {{ inviteStatus(invite).text }}
          </v-chip>

          <v-btn
            v-if="!invite.usedAt && new Date(invite.expiresAt) > new Date()"
            icon="mdi-close"
            variant="text"
            size="small"
            color="red"
            @click="store.cancelInvite(invite.id)"
          />
        </div>
      </div>
    </div>

    <!-- Invite dialog -->
    <v-dialog v-model="inviteDialog" max-width="440">
      <div class="staff-dialog">
        <h3 class="staff-dialog__title">Пригласить работника</h3>
        <p class="staff-dialog__sub">На указанный email будет отправлена ссылка для регистрации</p>

        <v-text-field
          v-model="inviteEmail"
          label="Email"
          type="email"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          class="mt-4"
          :error-messages="inviteError"
        />

        <v-select
          v-model="inviteRole"
          :items="roleOptions"
          item-title="title"
          item-value="value"
          label="Роль"
          variant="outlined"
          density="comfortable"
          rounded="lg"
        />

        <div class="staff-dialog__actions">
          <v-btn
            variant="tonal"
            rounded="lg"
            @click="inviteDialog = false"
            :disabled="inviteLoading"
          >
            Отмена
          </v-btn>
          <v-btn
            color="primary"
            rounded="lg"
            @click="submitInvite"
            :loading="inviteLoading"
          >
            Отправить
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <!-- Delete dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <div class="staff-dialog">
        <div class="staff-dialog__icon staff-dialog__icon--danger">
          <v-icon icon="mdi-delete-outline" size="24" />
        </div>
        <h3 class="staff-dialog__title">Удалить работника</h3>
        <p class="staff-dialog__sub">
          Вы уверены, что хотите удалить <strong>{{ deleteTarget?.name }}</strong>?
          Он потеряет доступ к админке.
        </p>
        <div class="staff-dialog__actions">
          <v-btn variant="tonal" rounded="lg" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="red" rounded="lg" @click="doDelete">Удалить</v-btn>
        </div>
      </div>
    </v-dialog>

    <!-- Change role dialog -->
    <v-dialog v-model="changeRoleDialog" max-width="400">
      <div class="staff-dialog">
        <h3 class="staff-dialog__title">Сменить роль</h3>
        <p class="staff-dialog__sub">
          Изменить роль для <strong>{{ changeRoleTarget?.name }}</strong>
        </p>

        <v-select
          v-model="newRole"
          :items="roleOptions"
          item-title="title"
          item-value="value"
          label="Новая роль"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          class="mt-4"
        />

        <div class="staff-dialog__actions">
          <v-btn variant="tonal" rounded="lg" @click="changeRoleDialog = false">Отмена</v-btn>
          <v-btn color="primary" rounded="lg" @click="doChangeRole">Сохранить</v-btn>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<style scoped lang="scss">
.staff-page {
  padding: 32px;
  max-width: 900px;
}

.staff-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.staff-header__title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.staff-header__sub {
  font-size: 14px;
  color: #9ca3af;
  margin-top: 2px;
}

.staff-tabs {
  display: flex;
  gap: 4px;
  background: #fff;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
  border: 1px solid #f0f0f0;
  width: fit-content;
}

.staff-tab {
  padding: 8px 20px;
  border-radius: 10px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.staff-tab:hover {
  background: #f9f4f0;
}

.staff-tab--active {
  background: #ea004b;
  color: #fff;
  font-weight: 600;
}

.staff-tab--active:hover {
  background: #d00043;
}

.grocery .staff-tab--active {
  background: #16a34a;
}

.grocery .staff-tab--active:hover {
  background: #15803d;
}

.staff-tab__count {
  font-size: 12px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  padding: 1px 6px;
}

.staff-tab--active .staff-tab__count {
  background: rgba(255, 255, 255, 0.25);
}

.staff-loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.staff-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.staff-empty {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #f0f0f0;

  p {
    margin-top: 12px;
    font-size: 16px;
    font-weight: 600;
    color: #374151;
  }
}

.staff-empty__sub {
  font-size: 14px !important;
  font-weight: 400 !important;
  color: #9ca3af !important;
  margin-top: 4px !important;
}

.staff-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #f0f0f0;
  transition: all 0.15s ease;
}

.staff-card:hover {
  border-color: #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.staff-card__left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.staff-card__avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ea004b, #ff4081);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.grocery .staff-card__avatar {
  background: linear-gradient(135deg, #16a34a, #22c55e);
}

.staff-card__avatar--invite {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
}

.staff-card__name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

.staff-card__email {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 1px;
}

.staff-card__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.staff-card__date {
  font-size: 13px;
  color: #9ca3af;
}

/* Dialog */
.staff-dialog {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
}

.staff-dialog__icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.staff-dialog__icon--danger {
  background: #fef2f2;
  color: #ef4444;
}

.staff-dialog__title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 6px;
}

.staff-dialog__sub {
  font-size: 14px;
  color: #9ca3af;
}

.staff-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* Dark mode */
:global(.dark) .staff-header__title {
  color: #e4e4e7;
}

:global(.dark) .staff-header__sub {
  color: #71717a;
}

:global(.dark) .staff-tabs {
  background: #1e1e2e;
  border-color: #2e2e42;
}

:global(.dark) .staff-tab {
  color: #a1a1aa;
}

:global(.dark) .staff-tab:hover {
  background: #252538;
}

:global(.dark) .staff-card {
  background: #1e1e2e;
  border-color: #2e2e42;
}

:global(.dark) .staff-card:hover {
  border-color: #3f3f5c;
}

:global(.dark) .staff-card__name {
  color: #e4e4e7;
}

:global(.dark) .staff-card__email,
:global(.dark) .staff-card__date {
  color: #71717a;
}

:global(.dark) .staff-empty {
  background: #1e1e2e;
  border-color: #2e2e42;

  p {
    color: #e4e4e7;
  }
}

:global(.dark) .staff-dialog {
  background: #1e1e2e;
}

:global(.dark) .staff-dialog__title {
  color: #e4e4e7;
}

:global(.dark) .staff-dialog__sub {
  color: #a1a1aa;
}

:global(.dark) .staff-dialog__icon--danger {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
}

@media (max-width: 767px) {
  .staff-page {
    padding: 16px;
  }

  .staff-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .staff-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .staff-card__right {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
