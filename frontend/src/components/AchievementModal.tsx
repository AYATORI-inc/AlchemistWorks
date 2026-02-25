import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useGame } from '../contexts/GameContext'
import { formatTierTextForUi, getAchievementProgressList, getRankProgress, RANK_TITLES } from '../constants/achievements'

interface AchievementModalProps {
  onClose: () => void
}

export function AchievementModal({ onClose }: AchievementModalProps) {
  const { saveData } = useGame()
  const userName = saveData?.userName?.trim() || 'あなた'
  const progressItems = saveData ? getAchievementProgressList(saveData) : []
  const unlockedItems = progressItems.filter((item) => item.unlocked)
  const lockedItems = progressItems.filter((item) => !item.unlocked)
  const unlockedCount = unlockedItems.length
  const rankProgress = getRankProgress(unlockedCount)
  const rank = saveData?.rank ?? rankProgress.rank

  const formatCount = (value: number) => value.toLocaleString('ja-JP')

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const content = (
    <div
      className="recipe-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievement-modal-title"
    >
      <div className="recipe-modal-content achievement-modal-content">
        <div className="recipe-modal-header achievement-modal-header">
          <div>
            <p className="achievement-modal-kicker">ALCHEMIST WORKSHOP CERTIFICATE</p>
            <h2 id="achievement-modal-title">🏅 {userName}さんの実績とランク</h2>
          </div>
          <button type="button" className="recipe-modal-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>
        <div className="achievement-certificate-seal" aria-hidden>工房</div>

        <section className="achievement-section">
          <h3>いまのランク</h3>
          <p className="achievement-rank-name">{RANK_TITLES[rank] ?? RANK_TITLES[1]}</p>
          <div className="achievement-rank-progress-card">
            <p className="achievement-rank-progress-summary">
              解放実績: <strong>{formatCount(unlockedCount)}</strong> / {formatCount(progressItems.length)}
            </p>
            {rankProgress.nextTitle ? (
              <>
                <p className="achievement-next-rank-text">
                  次の称号「{rankProgress.nextTitle}」まであと {rankProgress.remainingToNext} 個
                </p>
                <div className="achievement-progress-bar" aria-label="称号進捗">
                  <div
                    className="achievement-progress-bar-fill"
                    style={{ width: `${(rankProgress.currentStepCount / rankProgress.requiredForNext) * 100}%` }}
                  />
                </div>
                <p className="achievement-progress-footnote">
                  5個解放ごとに称号アップ（{rankProgress.currentStepCount}/{rankProgress.requiredForNext}）
                </p>
              </>
            ) : (
              <p className="achievement-next-rank-text">最高称号を獲得済みです。</p>
            )}
          </div>
        </section>

        <section className="achievement-section">
          <h3>未達成実績</h3>
          {lockedItems.length === 0 ? (
            <p className="placeholder-text">すべての実績を達成しました！</p>
          ) : (
            <ul className="achievement-list achievement-list-locked">
              {lockedItems.map((achievement) => (
                <li key={achievement.id} className="achievement-list-item">
                  <div className="achievement-item-title-row">
                    <strong>{formatTierTextForUi(achievement.name)}</strong>
                    <span className="achievement-item-progress-text">
                      {formatCount(Math.min(achievement.current, achievement.target))}/{formatCount(achievement.target)}
                    </span>
                  </div>
                  <p>{formatTierTextForUi(achievement.description)}</p>
                  <p className="achievement-item-meta">条件: {formatTierTextForUi(achievement.conditionLabel)}</p>
                  <div className="achievement-progress-bar" aria-label={`${achievement.name}の進捗`}>
                    <div
                      className="achievement-progress-bar-fill"
                      style={{ width: `${achievement.progressRate * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="achievement-section">
          <h3>達成済み実績</h3>
          {unlockedItems.length === 0 ? (
            <p className="placeholder-text">実績はこれからふえていくよ</p>
          ) : (
            <ul className="achievement-list achievement-list-unlocked">
              {unlockedItems.map((achievement) => (
                <li key={achievement.id} className="achievement-list-item is-unlocked">
                  <div className="achievement-item-title-row">
                    <strong>{formatTierTextForUi(achievement.name)}</strong>
                    <span className="achievement-item-badge">達成</span>
                  </div>
                  <p>{formatTierTextForUi(achievement.description)}</p>
                  <p className="achievement-item-meta">
                    条件: {formatTierTextForUi(achievement.conditionLabel)}
                    {achievement.unlockedAt && ` / 達成日: ${new Date(achievement.unlockedAt).toLocaleDateString('ja-JP')}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
