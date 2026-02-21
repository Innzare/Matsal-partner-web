import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Notification, NotificationType } from '@/types'
import { IS_MOCK } from '@/api'
import { MOCK_NOTIFICATIONS } from '@/api/mock-data'

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

  const load = async (force = false) => {
    if (!force && notifications.value.length > 0) return
    isLoading.value = true
    try {
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 250))
        notifications.value = structuredClone(MOCK_NOTIFICATIONS)
        return
      }
      // TODO: real API — GET /notifications
    } finally {
      isLoading.value = false
    }
  }

  const markAsRead = async (id: string) => {
    const notif = notifications.value.find(n => n.id === id)
    if (!notif || notif.isRead) return
    if (IS_MOCK) {
      notif.isRead = true
      return
    }
    // TODO: real API — PATCH /notifications/:id
  }

  const markAllAsRead = async () => {
    if (IS_MOCK) {
      notifications.value.forEach(n => (n.isRead = true))
      return
    }
    // TODO: real API — POST /notifications/read-all
  }

  const remove = async (id: string) => {
    if (IS_MOCK) {
      notifications.value = notifications.value.filter(n => n.id !== id)
      return
    }
    // TODO: real API — DELETE /notifications/:id
  }

  const clearAll = async () => {
    if (IS_MOCK) {
      notifications.value = []
      return
    }
    // TODO: real API — DELETE /notifications
  }

  return {
    notifications,
    isLoading,
    unreadCount,
    unreadNotifications,
    readNotifications,
    byType,
    load,
    markAsRead,
    markAllAsRead,
    remove,
    clearAll,
  }
})