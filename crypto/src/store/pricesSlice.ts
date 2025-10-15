import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './index'
import { api } from '../lib/api'

export interface PriceEntry {
  coinId: string
  priceUsd: number
  change24h?: number
  lastUpdated: string
}

export interface PriceSnapshot {
  items: PriceEntry[]
  timestamp: string
}

interface PricesState {
  snapshot: PriceSnapshot | null
  loading: boolean
  error?: string
}

const initialState: PricesState = {
  snapshot: null,
  loading: false,
}

export const fetchPrices = createAsyncThunk('prices/fetch', async () => {
  const response = await api.get<PriceSnapshot>('/prices')
  return response.data
})

const pricesSlice = createSlice({
  name: 'prices',
  initialState,
  reducers: {
    setSnapshot(state, action: PayloadAction<PriceSnapshot | null>) {
      state.snapshot = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrices.pending, (state) => {
        state.loading = true
        state.error = undefined
      })
      .addCase(fetchPrices.fulfilled, (state, action: PayloadAction<PriceSnapshot>) => {
        state.loading = false
        state.snapshot = action.payload
      })
      .addCase(fetchPrices.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
  },
})

export const { setSnapshot } = pricesSlice.actions
export const selectPrices = (state: RootState) => state.prices

export default pricesSlice.reducer
