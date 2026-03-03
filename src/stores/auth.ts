import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: string
  phone: string
  email: string
  name: string
  restaurantId: string
  role: string
  position: string | null
  restaurant: {
    id: string
    name: string
  }
}

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
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const userRole = computed(() => user.value?.role)
  const userName = computed(() => user.value?.name)
  const restaurantName = computed(() => user.value?.restaurant?.name)

  // Actions
  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_URL}/auth/restaurant/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || 'Неверный email или пароль')
      }

      const data = await response.json()

      accessToken.value = data.accessToken
      refreshToken.value = data.refreshToken
      user.value = data.user
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))

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
        await fetch(`${API_URL}/auth/restaurant/logout`, {
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

      const { default: router } = await import('@/router')
      router.push('/login')
    }
  }

  const checkAuth = async () => {
    const savedToken = localStorage.getItem('accessToken')
    const savedRefresh = localStorage.getItem('refreshToken')
    const savedUser = localStorage.getItem('user')

    if (!savedToken || !savedUser) {
      return false
    }

    try {
      const response = await fetch(`${API_URL}/auth/restaurant/profile`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })

      if (!response.ok) {
        // Токен истёк — пробуем обновить
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
      return false
    }
  }

  const doRefreshTokens = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/restaurant/refresh`, {
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

  return {
    user,
    token: accessToken,
    accessToken,
    refreshToken,
    isLoading,
    error,
    isAuthenticated,
    userRole,
    userName,
    restaurantName,
    login,
    logout,
    checkAuth,
    refreshTokens,
  }
})
