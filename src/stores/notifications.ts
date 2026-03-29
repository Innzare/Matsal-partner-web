import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Notification, NotificationType } from '@/types'
import { api, IS_MOCK } from '@/api'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const isLoading = ref(false)

  // ── Getters ──

  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.isRead).length,
  )

  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.isRead),
  )

  const readNotifications = computed(() =>
    notifications.value.filter(n => n.isRead),
  )

  const byType = (type: NotificationType) =>
    notifications.value.filter(n => n.type === type)

  // ── Actions ──

  /** Загрузить уведомления из API */
  const load = async () => {
    isLoading.value = true
    try {
      if (IS_MOCK) return
      notifications.value = await api.get<Notification[]>('/notifications')
    } finally {
      isLoading.value = false
    }
  }

  /** Добавить уведомление из WebSocket события (real-time) */
  const addNotification = (notification: Notification) => {
    // Не дублировать если уже есть
    if (notifications.value.some(n => n.id === notification.id)) return
    notifications.value.unshift(notification)
  }

  const markAsRead = async (id: string) => {
    const notif = notifications.value.find(n => n.id === id)
    if (notif) notif.isRead = true
    if (!IS_MOCK) {
      await api.patch(`/notifications/${id}/read`)
    }
  }

  const markAllAsRead = async () => {
    notifications.value.forEach(n => (n.isRead = true))
    if (!IS_MOCK) {
      await api.patch('/notifications/read-all')
    }
  }

  const remove = async (id: string) => {
    notifications.value = notifications.value.filter(n => n.id !== id)
    if (!IS_MOCK) {
      await api.delete(`/notifications/${id}`)
    }
  }

  const clearAll = async () => {
    notifications.value = []
    if (!IS_MOCK) {
      await api.delete('/notifications/all')
    }
  }

  const $reset = () => {
    notifications.value = []
    isLoading.value = false
  }

  return {
    notifications,
    isLoading,
    unreadCount,
    unreadNotifications,
    readNotifications,
    byType,
    addNotification,
    load,
    markAsRead,
    markAllAsRead,
    remove,
    clearAll,
    $reset,
  }
})
