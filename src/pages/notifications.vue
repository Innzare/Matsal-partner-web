<script setup lang="ts">
import { useNotificationsStore } from '@/stores/notifications'
import type { NotificationType } from '@/types'
import { NOTIFICATION_TYPE_ICONS, NOTIFICATION_TYPE_COLORS } from '@/types'

const store = useNotificationsStore()

onMounted(() => store.load())

// ── Filters ──
type Filter = 'all' | NotificationType

const activeFilter = ref<Filter>('all')

const filterTabs: { value: Filter; label: string }[] = [
  { value: 'all',            label: 'Все' },
  { value: 'new_order',      label: 'Заказы' },
  { value: 'new_review',     label: 'Отзывы' },
  { value: 'order_status',   label: 'Статусы' },
  { value: 'order_rejected', label: 'Отклонённые' },
  { value: 'system',         label: 'Система' },
]

const filtered = computed(() => {
  const list = activeFilter.value === 'all'
    ? store.notifications
    : store.notifications.filter(n => n.type === activeFilter.value)
  return list.slice().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
})

const filterCount = (f: Filter) =>
  f === 'all'
    ? store.notifications.length
    : store.notifications.filter(n => n.type === f).length

// ── Time formatting ──
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'только что'
  if (m < 60) return `${m} мин. назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч. назад`
  const d = Math.floor(h / 24)
  if (d === 1) return 'вчера'
  return `${d} дн. назад`
}

// ── Actions ──
async function handleClick(id: string) {
  await store.markAsRead(id)
}
</script>

<template>
  <div class="notif-page">

    <!-- Header -->
    <div class="notif-header">
      <div>
        <h1 class="notif-header__title">Уведомления</h1>
        <p class="notif-header__sub">
          {{ store.unreadCount > 0 ? `${store.unreadCount} непрочитанных` : 'Все прочитаны' }}
        </p>
      </div>

      <div class="d-flex align-center ga-2" v-if="store.notifications.length > 0">
        <v-btn
          v-if="store.unreadCount > 0"
          variant="tonal"
          size="small"
          rounded="lg"
          prepend-icon="mdi-check-all"
          @click="store.markAllAsRead"
        >
          Прочитать все
        </v-btn>
        <v-btn
          variant="tonal"
          color="red"
          size="small"
          rounded="lg"
          prepend-icon="mdi-delete-outline"
          @click="store.clearAll"
        >
          Очистить
        </v-btn>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <!-- Filter tabs -->
      <div class="notif-filters">
        <div
          v-for="tab in filterTabs"
          :key="tab.value"
          class="notif-filter"
          :class="{ 'notif-filter--active': activeFilter === tab.value }"
          @click="activeFilter = tab.value"
        >
          {{ tab.label }}
          <span class="notif-filter__count">{{ filterCount(tab.value) }}</span>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filtered.length === 0" class="notif-empty">
        <div class="notif-empty__icon">
          <v-icon icon="mdi-bell-off-outline" size="36" color="grey-lighten-1" />
        </div>
        <p class="notif-empty__title">Нет уведомлений</p>
        <p class="notif-empty__sub">Здесь будут появляться события по заказам и отзывам</p>
      </div>

      <!-- List -->
      <div v-else class="notif-list">
        <!-- Unread section -->
        <template v-if="activeFilter === 'all' && store.unreadCount > 0">
          <p class="notif-section-label">Новые</p>
          <div
            v-for="n in filtered.filter(n => !n.isRead)"
            :key="n.id"
            class="notif-item notif-item--unread"
            @click="handleClick(n.id)"
          >
            <div
              class="notif-item__icon"
              :style="{ background: NOTIFICATION_TYPE_COLORS[n.type] + '1a', color: NOTIFICATION_TYPE_COLORS[n.type] }"
            >
              <v-icon :icon="NOTIFICATION_TYPE_ICONS[n.type]" size="20" />
            </div>
            <div class="notif-item__body">
              <p class="notif-item__title">{{ n.title }}</p>
              <p class="notif-item__msg">{{ n.message }}</p>
              <p class="notif-item__time">{{ timeAgo(n.createdAt) }}</p>
            </div>
            <div class="notif-item__dot" />
            <button class="notif-item__del" @click.stop="store.remove(n.id)">
              <v-icon icon="mdi-close" size="16" />
            </button>
          </div>

          <p class="notif-section-label mt-4" v-if="store.readNotifications.length > 0">Ранее</p>
          <div
            v-for="n in filtered.filter(n => n.isRead)"
            :key="n.id"
            class="notif-item"
            @click="handleClick(n.id)"
          >
            <div
              class="notif-item__icon"
              :style="{ background: NOTIFICATION_TYPE_COLORS[n.type] + '12', color: NOTIFICATION_TYPE_COLORS[n.type] + 'aa' }"
            >
              <v-icon :icon="NOTIFICATION_TYPE_ICONS[n.type]" size="20" />
            </div>
            <div class="notif-item__body">
              <p class="notif-item__title">{{ n.title }}</p>
              <p class="notif-item__msg">{{ n.message }}</p>
              <p class="notif-item__time">{{ timeAgo(n.createdAt) }}</p>
            </div>
            <button class="notif-item__del" @click.stop="store.remove(n.id)">
              <v-icon icon="mdi-close" size="16" />
            </button>
          </div>
        </template>

        <!-- Flat list (when filtered by type) -->
        <template v-else>
          <div
            v-for="n in filtered"
            :key="n.id"
            class="notif-item"
            :class="{ 'notif-item--unread': !n.isRead }"
            @click="handleClick(n.id)"
          >
            <div
              class="notif-item__icon"
              :style="{
                background: NOTIFICATION_TYPE_COLORS[n.type] + (n.isRead ? '12' : '1a'),
                color: n.isRead ? NOTIFICATION_TYPE_COLORS[n.type] + 'aa' : NOTIFICATION_TYPE_COLORS[n.type],
              }"
            >
              <v-icon :icon="NOTIFICATION_TYPE_ICONS[n.type]" size="20" />
            </div>
            <div class="notif-item__body">
              <p class="notif-item__title">{{ n.title }}</p>
              <p class="notif-item__msg">{{ n.message }}</p>
              <p class="notif-item__time">{{ timeAgo(n.createdAt) }}</p>
            </div>
            <div v-if="!n.isRead" class="notif-item__dot" />
            <button class="notif-item__del" @click.stop="store.remove(n.id)">
              <v-icon icon="mdi-close" size="16" />
            </button>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ── Page ── */
.notif-page {
  padding: 24px 32px;
}

/* ── Header ── */
.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.notif-header__title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.notif-header__sub {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 2px;
}

/* ── Filters ── */
.notif-filters {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.notif-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.12s;
  user-select: none;
  white-space: nowrap;
  background: #fff;
  border: 1.5px solid #e5e7eb;
}

.notif-filter:hover {
  border-color: #d1d5db;
  color: #374151;
}

.notif-filter--active {
  background: #ea004b;
  border-color: #ea004b;
  color: #fff;
}

.notif-filter__count {
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.07);
  padding: 0 4px;
}

.notif-filter--active .notif-filter__count {
  background: rgba(255, 255, 255, 0.25);
}

/* ── Section label ── */
.notif-section-label {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 8px;
  padding: 0 4px;
}

/* ── List ── */
.notif-list {
  display: flex;
  flex-direction: column;
}

/* ── Item ── */
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  cursor: pointer;
  transition: box-shadow 0.15s, background 0.12s;
  position: relative;
  margin-bottom: 6px;
  background: #fff;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.notif-item:hover {
  background: #fafafa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
}

.notif-item--unread {
  border-left: 3px solid #ea004b;
  padding-left: 14px;
  background: #fff9fb;
}

.notif-item--unread:hover {
  background: #fff4f7;
  box-shadow: 0 2px 10px rgba(234, 0, 75, 0.08);
}

.notif-item__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notif-item__body {
  flex: 1;
  min-width: 0;
}

.notif-item__title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 2px;
}

.notif-item__msg {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-item__time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}

.notif-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ea004b;
  flex-shrink: 0;
  margin-top: 6px;
}

.notif-item__del {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: none;
  background: none;
  color: #d1d5db;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
  flex-shrink: 0;
  opacity: 0;
}

.notif-item:hover .notif-item__del {
  opacity: 1;
}

.notif-item__del:hover {
  background: #fef2f2;
  color: #ef4444;
}

/* ── Empty ── */
.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0;
  text-align: center;
}

.notif-empty__icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.notif-empty__title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 6px;
}

.notif-empty__sub {
  font-size: 13px;
  color: #9ca3af;
  max-width: 300px;
}

/* ── Responsive ── */
@media (max-width: 767px) {
  .notif-page {
    padding: 16px;
  }

  .notif-item__msg {
    white-space: normal;
  }

  .notif-item__del {
    opacity: 1;
  }
}

/* ── Dark mode ── */
.dark .notif-header__title,
.dark .notif-item__title,
.dark .notif-empty__title {
  color: #e4e4e7;
}

.dark .notif-header__sub,
.dark .notif-item__time,
.dark .notif-empty__sub,
.dark .notif-section-label {
  color: #71717a;
}

.dark .notif-item__msg {
  color: #a1a1aa;
}

.dark .notif-filter {
  background: #1e1e2e;
  border-color: #2e2e42;
  color: #a1a1aa;
}

.dark .notif-filter:hover {
  border-color: #3f3f5c;
  color: #e4e4e7;
}

.dark .notif-filter--active {
  background: #ea004b;
  border-color: #ea004b;
  color: #fff;
}

.dark .notif-item {
  background: #1e1e2e;
  border-color: #2e2e42;
  box-shadow: none;
}

.dark .notif-item:hover {
  background: #252538;
  box-shadow: none;
}

.dark .notif-item--unread {
  background: #1a1a2a;
  border-left-color: #ea004b;
}

.dark .notif-item--unread:hover {
  background: #22223a;
  box-shadow: 0 2px 10px rgba(234, 0, 75, 0.1);
}

.dark .notif-item__del:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
}

.dark .notif-item__del {
  color: #3f3f5c;
}

.dark .notif-empty__icon {
  background: #252538;
}
</style>