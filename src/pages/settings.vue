<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRestaurantStore } from '@/stores/restaurant'
import SettingsProfile from '@/components/settings/SettingsProfile.vue'
import SettingsDelivery from '@/components/settings/SettingsDelivery.vue'
import SettingsSchedule from '@/components/settings/SettingsSchedule.vue'
import SettingsNotifications from '@/components/settings/SettingsNotifications.vue'
import SettingsSecurity from '@/components/settings/SettingsSecurity.vue'

const restaurantStore = useRestaurantStore()

const activeTab = ref(0)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('green')

const tabs = [
  { icon: 'mdi-store', label: 'Профиль' },
  { icon: 'mdi-truck-delivery', label: 'Доставка' },
  { icon: 'mdi-clock-outline', label: 'Расписание' },
  { icon: 'mdi-bell-outline', label: 'Уведомления' },
  { icon: 'mdi-shield-lock-outline', label: 'Безопасность' },
]

onMounted(() => {
  restaurantStore.loadRestaurant()
})

function showSnack(text: string, color = 'green') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

async function toggleOpen() {
  await restaurantStore.toggleOpen()
  showSnack(restaurantStore.restaurant?.isOpen ? 'Заведение открыто' : 'Заведение закрыто')
}
</script>

<template>
  <div class="settings-page">
    <div v-if="restaurantStore.isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else-if="restaurantStore.restaurant">
      <!-- Header -->
      <div class="settings-header">
        <div>
          <h1 class="settings-header__title">Настройки</h1>
          <p class="settings-header__sub">Управление заведением и профилем</p>
        </div>

        <div class="d-flex align-center ga-3">
          <v-chip
            :color="restaurantStore.restaurant.isOpen ? 'green' : 'red'"
            variant="flat" size="small"
          >
            {{ restaurantStore.restaurant.isOpen ? 'Открыто' : 'Закрыто' }}
          </v-chip>
          <v-switch
            :model-value="restaurantStore.restaurant.isOpen"
            color="green" hide-details density="compact"
            @update:model-value="toggleOpen"
          />
        </div>
      </div>

      <!-- Tabs layout -->
      <div class="settings-layout">
        <!-- Sidebar tabs -->
        <div class="settings-sidebar">
          <div
            v-for="(tab, i) in tabs" :key="i"
            class="settings-tab"
            :class="{ 'settings-tab--active': activeTab === i }"
            @click="activeTab = i"
          >
            <v-icon :icon="tab.icon" size="20" />
            <span>{{ tab.label }}</span>
          </div>
        </div>

        <!-- Content area -->
        <div class="settings-content">
          <SettingsProfile v-if="activeTab === 0" @save="showSnack" />
          <SettingsDelivery v-if="activeTab === 1" @save="showSnack" />
          <SettingsSchedule v-if="activeTab === 2" @save="showSnack" />
          <SettingsNotifications v-if="activeTab === 3" @save="showSnack" />
          <SettingsSecurity v-if="activeTab === 4" @save="showSnack" />
        </div>
      </div>
    </template>

    <v-snackbar v-model="snackbar" :timeout="3000" :color="snackbarColor" rounded="lg">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.settings-page { padding: 24px 32px 32px; }

/* ── Header ── */
.settings-header {
  display: flex; align-items: center; gap: 20px; margin-bottom: 24px;
}
.settings-header__title { font-size: 24px; font-weight: 700; color: #1a1a2e; }
.settings-header__sub { font-size: 14px; color: #6b7280; margin-top: 2px; }

/* ── Layout ── */
.settings-layout { display: flex; gap: 24px; align-items: flex-start; }

/* ── Sidebar ── */
.settings-sidebar {
  display: flex; flex-direction: column; gap: 4px;
  width: 200px; flex-shrink: 0; background: #fff;
  border-radius: 16px; padding: 8px; position: sticky; top: 100px;
}
.settings-tab {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 10px; font-size: 14px;
  font-weight: 500; color: #6b7280; cursor: pointer; transition: all 0.15s;
}
.settings-tab:hover { background: #f3f4f6; color: #374151; }
.settings-tab--active { background: #ea004b12; color: #ea004b; font-weight: 600; }
.settings-tab--active .v-icon { color: #ea004b; }

/* ── Content ── */
.settings-content { flex: 1; min-width: 0; }

/* ── Section common (passed to child components via :deep) ── */
:deep(.section-title) { font-size: 18px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
:deep(.section-desc) { font-size: 13px; color: #9ca3af; margin-bottom: 20px; }

/* ── Responsive ── */
@media (max-width: 960px) {
  .settings-layout { flex-direction: column; }
  .settings-sidebar {
    width: 100%; display: flex; gap: 4px;
    overflow-x: auto; position: static;
  }
  .settings-tab { white-space: nowrap; }
}

@media (max-width: 767px) {
  .settings-page { padding: 16px; }
  .settings-header { flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
  .settings-header__title { font-size: 20px; }
}

/* ── Dark mode ── */
.dark .settings-header__title,
.dark :deep(.section-title) { color: #e4e4e7; }

.dark .settings-header__sub,
.dark :deep(.section-desc) { color: #71717a; }

.dark .settings-sidebar { background: #1e1e2e; }
.dark .settings-tab { color: #a1a1aa; }
.dark .settings-tab:hover { background: #252538; color: #e4e4e7; }
.dark .settings-tab--active {
  background: color-mix(in srgb, #ea004b 15%, transparent); color: #ff4081;
}
</style>
