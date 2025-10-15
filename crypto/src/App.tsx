import { useEffect, useMemo, useState } from 'react'
import { io, type Socket, type ManagerOptions, type SocketOptions } from 'socket.io-client'
import { PriceTable } from './components/PriceTable'
import { AlertForm } from './components/AlertForm'
import { AlertsTable } from './components/AlertsTable'
import { NotificationPanel } from './components/NotificationPanel'
import { useAppDispatch, useAppSelector } from './store/hooks'
import {
  fetchPrices,
  selectPrices,
  setSnapshot,
} from './store/pricesSlice'
import {
  fetchAlerts,
  selectAlerts,
  createAlert as createAlertThunk,
  deleteAlert as deleteAlertThunk,
  receiveAlert,
  dismissNotification,
} from './store/alertsSlice'
import type { PriceSnapshot } from './store/pricesSlice'
import type { AlertSocketPayload } from './store/alertsSlice'

const defaultCoins = ['bitcoin', 'ethereum', 'solana']

const resolveSocketUrl = () => {
  const socketOverride = import.meta.env.VITE_SOCKET_URL
  if (socketOverride && socketOverride.trim().length) {
    return socketOverride
  }
  const apiUrl = import.meta.env.VITE_API_URL
  if (apiUrl && apiUrl.trim().length) {
    try {
      const parsed = new URL(apiUrl)
      return `${parsed.protocol}//${parsed.host}`
    } catch (error) {
      console.warn('Failed to derive socket URL from VITE_API_URL', error)
    }
  }
  return undefined
}

const getUserId = () => {
  if (typeof window === 'undefined') {
    return 'server'
  }
  const stored = window.localStorage.getItem('crypto-alert-user')
  if (stored) {
    return stored
  }
  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `user-${Date.now()}`
  window.localStorage.setItem('crypto-alert-user', generated)
  return generated
}

function App() {
  const dispatch = useAppDispatch()
  const pricesState = useAppSelector(selectPrices)
  const alertsState = useAppSelector(selectAlerts)
  const [userId] = useState(getUserId)
  const [socketState, setSocketState] = useState<'connecting' | 'connected' | 'disconnected'>(
    'connecting'
  )

  useEffect(() => {
    dispatch(fetchPrices())
    dispatch(fetchAlerts({ userId }))
  }, [dispatch, userId])

  useEffect(() => {
    setSocketState('connecting')
    const socketUrl = resolveSocketUrl()
    const socketOptions: Partial<ManagerOptions & SocketOptions> = {
      transports: ['websocket'],
      autoConnect: true,
    }
    let socket: Socket | null = socketUrl ? io(socketUrl, socketOptions) : io(socketOptions)

    socket.on('connect', () => {
      setSocketState('connected')
      socket?.emit('client:register', { userId })
    })

    socket.on('disconnect', () => {
      setSocketState('disconnected')
    })

    socket.on('connect_error', () => {
      setSocketState('disconnected')
    })

    socket.on('reconnect_attempt', () => {
      setSocketState('connecting')
    })

    socket.on('price:update', (snapshot: PriceSnapshot) => {
      dispatch(setSnapshot(snapshot))
    })

    socket.on('alert:trigger', (payload: AlertSocketPayload) => {
      dispatch(receiveAlert(payload))
    })

    return () => {
      socket?.disconnect()
      socket = null
    }
  }, [dispatch, userId])

  const coinOptions = useMemo<string[]>(() => {
    const items = pricesState.snapshot?.items ?? []
    if (items.length) {
      const coins = items.map((item) => item.coinId)
      return Array.from(new Set(coins))
    }
    return defaultCoins
  }, [pricesState.snapshot])

  const handleCreateAlert = async (payload: {
    coinId: string
    targetPrice: number
    direction: 'above' | 'below'
  }) => {
    await dispatch(createAlertThunk({ ...payload, userId })).unwrap()
  }

  const handleDeleteAlert = (alertId: string) => {
    dispatch(deleteAlertThunk({ alertId, userId }))
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <NotificationPanel
        notifications={alertsState.notifications}
        onDismiss={(id) => dispatch(dismissNotification(id))}
      />
      <header className="bg-slate-900 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Crypto Watch</h1>
            <p className="text-sm text-slate-300">
              Real-time prices and alerting powered by CoinGecko
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-200">
            <span className="rounded-full bg-slate-800 px-3 py-1">User ID: {userId}</span>
            <span
              className={`flex items-center gap-2 rounded-full px-3 py-1 ${
                socketState === 'connected'
                  ? 'bg-emerald-600 text-white'
                  : socketState === 'connecting'
                    ? 'bg-amber-500 text-white'
                    : 'bg-rose-600 text-white'
              }`}
            >
              <span className="inline-flex h-2 w-2 rounded-full bg-current" />
              {socketState === 'connected'
                ? 'Live updates on'
                : socketState === 'connecting'
                  ? 'Connecting…'
                  : 'Realtime offline'}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-6xl space-y-8 px-4">
        <PriceTable
          snapshot={pricesState.snapshot}
          loading={pricesState.loading}
          onRefresh={() => dispatch(fetchPrices())}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <AlertForm coins={coinOptions} onSubmit={handleCreateAlert} />
          <AlertsTable
            alerts={alertsState.items}
            loading={alertsState.loading}
            onDelete={handleDeleteAlert}
          />
        </div>
      </main>
    </div>
  )
}

export default App
