import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: string
  phone: string
  email: string
  name: string
  restaurantId?: string
  groceryStoreId?: string
  role: string
  position: string | null
  restaurant?: {
    id: string
    name: string
  }
  groceryStore?: {
    id: string
    name: string
  }
}

export type EstablishmentType = 'restaurant' | 'grocery'

interface LoginCredentials {
  email: string
  password: string
}

const API_URL = import.meta.env.VITE_API_URL as string

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const establishmentType = ref<EstablishmentType>(
    (localStorage.getItem('establishmentType') as EstablishmentType) || 'restaurant'
  )
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const userRole = computed(() => user.value?.role)
  const userName = computed(() => user.value?.name)
  const isGrocery = computed(() => establishmentType.value === 'grocery')
  const restaurantName = computed(() =>
    establishmentType.value === 'grocery'
      ? user.value?.groceryStore?.name
      : user.value?.restaurant?.name
  )

  // Auth prefix по типу заведения
  const authPrefix = computed(() =>
    establishmentType.value === 'grocery' ? '/auth/grocery-store' : '/auth/restaurant'
  )

  // Actions
  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      // Сначала пробуем как ресторан
      let response = await fetch(`${API_URL}/auth/restaurant/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })

      let type: EstablishmentType = 'restaurant'

      if (!response.ok) {
        // Если ресторан не подошёл — пробуем как магазин
        response = await fetch(`${API_URL}/auth/grocery-store/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.message || 'Неверный email или пароль')
        }

        type = 'grocery'
      }

      const data = await response.json()

      accessToken.value = data.accessToken
      refreshToken.value = data.refreshToken
      user.value = data.user
      establishmentType.value = type
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('establishmentType', type)

      const { default: router } = await import('@/router')
      router.push('/dashboard')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ошибка авторизации'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      if (refreshToken.value) {
        await fetch(`${API_URL}${authPrefix.value}/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refreshToken.value }),
        })
      }
    } catch (err) {
      console.error('Ошибка при выходе:', err)
    } finally {
      user.value = null
      accessToken.value = null
      refreshToken.value = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('establishmentType')

      const { default: router } = await import('@/router')
      router.push('/login')
    }
  }

  const checkAuth = async () => {
    const savedToken = localStorage.getItem('accessToken')
    const savedRefresh = localStorage.getItem('refreshToken')
    const savedUser = localStorage.getItem('user')
    const savedType = localStorage.getItem('establishmentType') as EstablishmentType | null

    if (!savedToken || !savedUser) {
      return false
    }

    if (savedType) {
      establishmentType.value = savedType
    }

    try {
      const response = await fetch(`${API_URL}${authPrefix.value}/profile`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })

      if (!response.ok) {
        if (savedRefresh) {
          const refreshed = await doRefreshTokens(savedRefresh)
          if (refreshed) {
            user.value = JSON.parse(savedUser)
            return true
          }
        }
        throw new Error('Токен недействителен')
      }

      const data = await response.json()
      accessToken.value = savedToken
      refreshToken.value = savedRefresh
      user.value = data
      return true
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('establishmentType')
      return false
    }
  }

  const doRefreshTokens = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}${authPrefix.value}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      })

      if (!response.ok) return false

      const data = await response.json()
      accessToken.value = data.accessToken
      refreshToken.value = data.refreshToken
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      return true
    } catch {
      return false
    }
  }

  const refreshTokens = async () => {
    if (!refreshToken.value) {
      await logout()
      return
    }

    const success = await doRefreshTokens(refreshToken.value)
    if (!success) {
      await logout()
    }
  }

  const updateProfile = async (data: { name?: string; email?: string; phone?: string }) => {
    const response = await fetch(`${API_URL}${authPrefix.value}/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken.value}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Не удалось обновить профиль')
    }

    const updated = await response.json()
    user.value = { ...user.value!, ...updated }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  const changePassword = async (oldPassword: string, newPassword: string) => {
    const response = await fetch(`${API_URL}${authPrefix.value}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken.value}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Не удалось сменить пароль')
    }
  }

  return {
    user,
    token: accessToken,
    accessToken,
    refreshToken,
    establishmentType,
    isLoading,
    error,
    isAuthenticated,
    userRole,
    userName,
    isGrocery,
    restaurantName,
    authPrefix,
    login,
    logout,
    checkAuth,
    refreshTokens,
    updateProfile,
    changePassword,
  }
})
