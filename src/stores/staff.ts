import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { StaffMember, StaffInvite, UserRole } from '@/types'
import { api, IS_MOCK } from '@/api'

export const useStaffStore = defineStore('staff', () => {
  const staff = ref<StaffMember[]>([])
  const invites = ref<StaffInvite[]>([])
  const isLoading = ref(false)

  const loadStaff = async () => {
    isLoading.value = true
    try {
      if (IS_MOCK) {
        await new Promise(r => setTimeout(r, 300))
        staff.value = []
        return
      }
      staff.value = await api.get<StaffMember[]>('/restaurant/staff')
    } finally {
      isLoading.value = false
    }
  }

  const removeStaff = async (id: string) => {
    if (IS_MOCK) return
    await api.delete(`/restaurant/staff/${id}`)
    staff.value = staff.value.filter(s => s.id !== id)
  }

  const updateRole = async (id: string, role: UserRole) => {
    if (IS_MOCK) return
    const updated = await api.patch<StaffMember>(`/restaurant/staff/${id}/role`, { role })
    const idx = staff.value.findIndex(s => s.id === id)
    if (idx !== -1) staff.value[idx] = updated
  }

  const loadInvites = async () => {
    if (IS_MOCK) {
      invites.value = []
      return
    }
    invites.value = await api.get<StaffInvite[]>('/restaurant/staff/invites')
  }

  const sendInvite = async (email: string, role: UserRole) => {
    if (IS_MOCK) return
    const invite = await api.post<StaffInvite>('/restaurant/staff/invite', { email, role })
    invites.value.unshift(invite)
  }

  const cancelInvite = async (id: string) => {
    if (IS_MOCK) return
    await api.delete(`/restaurant/staff/invites/${id}`)
    invites.value = invites.value.filter(i => i.id !== id)
  }

  return {
    staff,
    invites,
    isLoading,
    loadStaff,
    removeStaff,
    updateRole,
    loadInvites,
    sendInvite,
    cancelInvite,
  }
})
