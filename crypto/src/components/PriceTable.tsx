import type { PriceSnapshot } from '../store/pricesSlice'

interface PriceTableProps {
  snapshot: PriceSnapshot | null
  loading: boolean
  onRefresh: () => void
}

const formatChange = (value?: number) => {
  if (value === undefined || value === null) {
    return '—'
  }
  const formatted = value.toFixed(2)
  return `${formatted}%`
}

export const PriceTable = ({ snapshot, loading, onRefresh }: PriceTableProps) => {
  const items = snapshot?.items ?? []

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Market Overview</h2>
          <p className="text-sm text-slate-500">
            Last update: {snapshot ? new Date(snapshot.timestamp).toLocaleTimeString() : '—'}
          </p>
        </div>
        <button
          className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Coin</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Price (USD)</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">24h Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const up = (item.change24h ?? 0) >= 0
              return (
                <tr key={item.coinId}>
                  <td className="px-4 py-3 capitalize text-slate-700">{item.coinId.replace('-', ' ')}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {item.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td
                    className={`px-4 py-3 font-medium ${up ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {formatChange(item.change24h)}
                  </td>
                </tr>
              )
            })}
            {!items.length && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={3}>
                  {loading ? 'Loading prices…' : 'No data available yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
