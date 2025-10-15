import { useEffect, useState, type FormEvent } from 'react'

type Direction = 'above' | 'below'

interface AlertFormProps {
  coins: string[]
  onSubmit: (payload: { coinId: string; targetPrice: number; direction: Direction }) => Promise<void> | void
}

export const AlertForm = ({ coins, onSubmit }: AlertFormProps) => {
  const [coinId, setCoinId] = useState(coins[0] ?? '')
  const [targetPrice, setTargetPrice] = useState('')
  const [direction, setDirection] = useState<Direction>('above')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!coins.length) {
      setCoinId('')
      return
    }
    if (!coinId || !coins.includes(coinId)) {
      setCoinId(coins[0])
    }
  }, [coins, coinId])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!coinId || !targetPrice) {
      setError('Please choose a coin and target price.')
      return
    }
    const parsed = Number(targetPrice)
    if (Number.isNaN(parsed) || parsed <= 0) {
      setError('Target price must be a positive number.')
      return
    }
    try {
      setSubmitting(true)
      await onSubmit({ coinId, targetPrice: parsed, direction })
      setTargetPrice('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create alert.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">Create Alert</h2>
      <p className="mt-1 text-sm text-slate-500">Receive a notification when price crosses your threshold.</p>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col text-sm font-medium text-slate-600">
            Cryptocurrency
            <select
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-slate-700 focus:border-slate-500 focus:outline-none"
              value={coinId}
              onChange={(event) => setCoinId(event.target.value)}
            >
              {coins.map((coin) => (
                <option key={coin} value={coin}>
                  {coin.replace('-', ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-600">
            Target price (USD)
            <input
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-slate-700 focus:border-slate-500 focus:outline-none"
              type="number"
              min="0"
              step="0.01"
              value={targetPrice}
              onChange={(event) => setTargetPrice(event.target.value)}
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-600">
            Direction
            <select
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-slate-700 focus:border-slate-500 focus:outline-none"
              value={direction}
              onChange={(event) => setDirection(event.target.value as Direction)}
            >
              <option value="above">Price rises above</option>
              <option value="below">Price falls below</option>
            </select>
          </label>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
          type="submit"
          disabled={submitting || !coins.length}
        >
          {submitting ? 'Saving…' : 'Add alert'}
        </button>
      </form>
    </div>
  )
}
