import { io, Socket } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL as string
// API_URL = "https://api.matsal.store/api" → base = "https://api.matsal.store"
const WS_URL = API_URL.replace(/\/api$/, '')

let socket: Socket | null = null

export function connectSocket(token: string) {
  if (socket?.connected) return

  socket = io(`${WS_URL}/orders`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 3000,
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected to /orders')
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.log('[Socket] Connection error:', error.message)
  })
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function onSocketEvent(event: string, callback: (data: any) => void) {
  socket?.on(event, callback)
}

export function offSocketEvent(event: string, callback?: (data: any) => void) {
  if (!socket) return
  if (callback) {
    socket.off(event, callback)
  } else {
    socket.off(event)
  }
}
