import type { Alert } from '../store/alertsSlice'

interface AlertsTableProps {
  alerts: Alert[]
  loading: boolean
  onDelete: (alertId: string) => void
}

const formatDirection = (direction: 'above' | 'below') =>
  direction === 'above' ? 'Price rises above' : 'Price falls below'

export const AlertsTable = ({ alerts, loading, onDelete }: AlertsTableProps) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Active Alerts</h2>
          <p className="text-sm text-slate-500">Manage your alert criteria.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Coin</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Condition</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Target price</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alerts.map((alert) => (
              <tr key={alert._id}>
                <td className="px-4 py-3 capitalize text-slate-700">{alert.coinId.replace('-', ' ')}</td>
                <td className="px-4 py-3 text-slate-600">{formatDirection(alert.direction)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">${alert.targetPrice.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {alert.isTriggered ? `Triggered ${alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString() : ''}` : 'Active'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed"
                    onClick={() => onDelete(alert._id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!alerts.length && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                  {loading ? 'Loading alerts…' : 'No alerts configured yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
