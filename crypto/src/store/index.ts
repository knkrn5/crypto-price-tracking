import { configureStore } from '@reduxjs/toolkit'
import pricesReducer from './pricesSlice'
import alertsReducer from './alertsSlice'

export const store = configureStore({
  reducer: {
    prices: pricesReducer,
    alerts: alertsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
