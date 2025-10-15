import type { AlertNotification } from '../store/alertsSlice'

interface NotificationPanelProps {
  notifications: AlertNotification[]
  onDismiss: (id: string) => void
}

export const NotificationPanel = ({ notifications, onDismiss }: NotificationPanelProps) => {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="pointer-events-auto w-80 rounded-lg border border-emerald-200 bg-white p-4 shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Price alert triggered</p>
              <p className="mt-1 text-sm text-slate-600">
                {notification.coinId.replace('-', ' ')} is now ${notification.currentPrice.toLocaleString()} ({
                  notification.direction === 'above' ? 'above' : 'below'
                } ${notification.targetPrice.toLocaleString()}).
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {new Date(notification.triggeredAt).toLocaleString()}
              </p>
            </div>
            <button
              className="text-slate-400 transition hover:text-slate-600"
              onClick={() => onDismiss(notification.id)}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
