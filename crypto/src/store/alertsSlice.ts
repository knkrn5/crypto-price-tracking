import { createSlice, createAsyncThunk, nanoid, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './index'
import { api } from '../lib/api'

export interface Alert {
  _id: string
  userId: string
  coinId: string
  targetPrice: number
  direction: 'above' | 'below'
  isTriggered: boolean
  triggeredAt?: string
  createdAt: string
  updatedAt: string
}

export interface AlertNotification {
  id: string
  alertId: string
  coinId: string
  targetPrice: number
  direction: 'above' | 'below'
  currentPrice: number
  triggeredAt: string
}

export type AlertSocketPayload = Omit<AlertNotification, 'id'>

interface AlertsState {
  items: Alert[]
  loading: boolean
  error?: string
  notifications: AlertNotification[]
}

const initialState: AlertsState = {
  items: [],
  loading: false,
  notifications: [],
}

export const fetchAlerts = createAsyncThunk(
  'alerts/fetch',
  async ({ userId }: { userId: string }) => {
    const response = await api.get<{ alerts: Alert[] }>('/alerts', {
      params: { userId },
    })
    return response.data.alerts
  }
)

export const createAlert = createAsyncThunk(
  'alerts/create',
  async (payload: { userId: string; coinId: string; targetPrice: number; direction: 'above' | 'below' }) => {
    const response = await api.post<{ alert: Alert }>('/alerts', payload)
    return response.data.alert
  }
)

export const deleteAlert = createAsyncThunk(
  'alerts/delete',
  async ({ alertId, userId }: { alertId: string; userId: string }) => {
    await api.delete(`/alerts/${alertId}`, {
      params: { userId },
    })
    return alertId
  }
)

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    receiveAlert(state, action: PayloadAction<AlertSocketPayload>) {
      state.notifications.unshift({ id: nanoid(), ...action.payload })
    },
    dismissNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter((notification) => notification.id !== action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true
        state.error = undefined
      })
      .addCase(fetchAlerts.fulfilled, (state, action: PayloadAction<Alert[]>) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(createAlert.fulfilled, (state, action: PayloadAction<Alert>) => {
        state.items.unshift(action.payload)
      })
      .addCase(deleteAlert.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((alert) => alert._id !== action.payload)
      })
  },
})

export const { receiveAlert, dismissNotification } = alertsSlice.actions
export const selectAlerts = (state: RootState) => state.alerts

export default alertsSlice.reducer
