import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PushCampaign, PushAudience, PushScheduleMode } from '@/types'
import { IS_MOCK } from '@/api'
import { MOCK_PUSH_CAMPAIGNS } from '@/api/mock-data'

export const usePushCampaignsStore = defineStore('pushCampaigns', () => {
  const campaigns = ref<PushCampaign[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)

  // ── Getters ──

  const sentCampaigns = computed(() =>
    campaigns.value.filter(c => c.status === 'sent'),
  )

  const totalSent = computed(() =>
    campaigns.value.reduce((s, c) => s + c.sent, 0),
  )

  const avgOpenRate = computed(() => {
    const sent = sentCampaigns.value
    if (!sent.length) return 0
    const totalDelivered = sent.reduce((s, c) => s + c.delivered, 0)
    const totalOpened = sent.reduce((s, c) => s + c.opened, 0)
    if (!totalDelivered) return 0
    return (totalOpened / totalDelivered) * 100
  })

  const avgClickRate = computed(() => {
    const sent = sentCampaigns.value
    if (!sent.length) return 0
    const totalOpened = sent.reduce((s, c) => s + c.opened, 0)
    const totalClicked = sent.reduce((s, c) => s + c.clicked, 0)
    if (!totalOpened) return 0
    return (totalClicked / totalOpened) * 100
  })

  // ── Actions ──

  const load = async (force = false) => {
    if (!force && campaigns.value.length > 0) return
    isLoading.value = true
    try {
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 300))
        campaigns.value = structuredClone(MOCK_PUSH_CAMPAIGNS)
        return
      }
      // TODO: GET /push-campaigns
    } finally {
      isLoading.value = false
    }
  }

  const create = async (payload: {
    title: string
    body: string
    imageUrl?: string
    audience: PushAudience
    scheduleMode: PushScheduleMode
    scheduledAt?: string
  }) => {
    isSaving.value = true
    try {
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 500))
        const now = new Date().toISOString()
        const status = payload.scheduleMode === 'scheduled' ? 'scheduled' : 'sent'
        const newCampaign: PushCampaign = {
          id: `push-${Date.now()}`,
          ...payload,
          status,
          createdAt: now,
          sentAt: status === 'sent' ? now : undefined,
          sent: status === 'sent' ? Math.floor(Math.random() * 3000 + 500) : 0,
          delivered: status === 'sent' ? Math.floor(Math.random() * 2800 + 400) : 0,
          opened: status === 'sent' ? Math.floor(Math.random() * 900 + 100) : 0,
          clicked: status === 'sent' ? Math.floor(Math.random() * 300 + 50) : 0,
        }
        campaigns.value.unshift(newCampaign)
        return newCampaign
      }
      // TODO: POST /push-campaigns
    } finally {
      isSaving.value = false
    }
  }

  const cancel = async (id: string) => {
    if (IS_MOCK) {
      const c = campaigns.value.find(c => c.id === id)
      if (c) c.status = 'cancelled'
      return
    }
    // TODO: PATCH /push-campaigns/:id/cancel
  }

  return {
    campaigns, isLoading, isSaving,
    sentCampaigns, totalSent, avgOpenRate, avgClickRate,
    load, create, cancel,
  }
})
