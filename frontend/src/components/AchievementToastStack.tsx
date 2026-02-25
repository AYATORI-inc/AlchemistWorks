import { useEffect } from 'react'
import { useGame } from '../contexts/GameContext'

function AchievementToastItem({
  id,
  kind,
  title,
  message,
  onClose,
}: {
  id: string
  kind: 'achievement' | 'rank'
  title: string
  message: string
  onClose: (id: string) => void
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onClose(id), kind === 'rank' ? 4200 : 3200)
    return () => window.clearTimeout(timer)
  }, [id, kind, onClose])

  return (
    <div className={`achievement-toast ${kind}`} role="status" aria-live="polite">
      <div className="achievement-toast-icon" aria-hidden>{kind === 'rank' ? '👑' : '🏅'}</div>
      <div className="achievement-toast-body">
        <p className="achievement-toast-title">{title}</p>
        <p className="achievement-toast-message">{message}</p>
      </div>
      <button type="button" className="achievement-toast-close" onClick={() => onClose(id)} aria-label="閉じる">
        ×
      </button>
    </div>
  )
}

export function AchievementToastStack() {
  const { achievementToasts, dismissAchievementToast } = useGame()
  if (achievementToasts.length === 0) return null

  return (
    <div className="achievement-toast-stack" aria-live="polite" aria-atomic="false">
      {achievementToasts.map((toast) => (
        <AchievementToastItem
          key={toast.id}
          id={toast.id}
          kind={toast.kind}
          title={toast.title}
          message={toast.message}
          onClose={dismissAchievementToast}
        />
      ))}
    </div>
  )
}
