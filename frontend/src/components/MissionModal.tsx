import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Mission } from '../types'
import { useGame } from '../contexts/GameContext'
import { api } from '../api/client'
import { ITEMS_DB } from '../constants/items'
import { ItemCard } from './ItemCard'

const hasApi = () => !!import.meta.env.VITE_GAS_URL

// モック（API未連携時用）
const MOCK_MISSIONS: Mission[] = [
  { id: 'm1', title: '癒しの薬', description: '傷を癒す薬を1個届けてほしい', rewardG: 3000, completed: false },
  { id: 'm2', title: '町の祭り用', description: '祭り用の特別な炎を1個届けてほしい', rewardG: 5000, completed: false },
  { id: 'm3', title: '新発見', description: '新しい回復系のアイテムを見つける', rewardG: 2500, completed: false },
]

interface MissionModalProps {
  onClose: () => void
}

export function MissionModal({ onClose }: MissionModalProps) {
  const { saveData, missions: apiMissions, missionsSource, setMissions, setDeliveringMission, addG, removeFromInventory } = useGame()
  const missions = (apiMissions ?? (!hasApi() ? MOCK_MISSIONS : [])) as Mission[]
  const isPreparing = hasApi() && apiMissions === null
  const [completingId, setCompletingId] = useState<string | null>(null)

  const inventory = saveData?.inventory ?? []
  const sellableItems = inventory.filter((i) => {
    const tier = i.tier ?? ITEMS_DB[i.id]?.tier ?? 0
    return tier >= 1
  })
  const completedCount = missions.filter((m) => m.completed).length

  const handleComplete = async (mission: Mission, instanceId: string, itemName: string, itemId: string) => {
    if (!saveData?.userId || !hasApi()) return
    setCompletingId(mission.id)
    setDeliveringMission(true)
    try {
      const res = await api.missions.complete(saveData.userId, mission.id, instanceId, {
        itemId,
        itemName,
        missionTitle: mission.title,
        missionDescription: mission.description,
        baseRewardG: mission.rewardG,
      })
      setMissions(
        missions.map((m) =>
          m.id === mission.id
            ? { ...m, completed: true, description: res.feedback ?? m.description, actualRewardG: res.rewardG }
            : m
        )
      )
      addG(res.rewardG ?? mission.rewardG)
      removeFromInventory(instanceId)
    } catch {
      // エラー時は何もしない
    } finally {
      setCompletingId(null)
      setDeliveringMission(false)
    }
  }

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
      className="recipe-modal-backdrop mission-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-modal-title"
    >
      <div className="quest-board-frame">
        <div className="quest-board-wood">
          <div className="quest-board-nail quest-board-nail-tl" aria-hidden />
          <div className="quest-board-nail quest-board-nail-tr" aria-hidden />
          <div className="quest-board-nail quest-board-nail-bl" aria-hidden />
          <div className="quest-board-nail quest-board-nail-br" aria-hidden />
          <div className="recipe-modal-content mission-modal-content quest-board-content">
            <header className="quest-board-header">
              <div className="quest-board-emblem" aria-hidden>
                <span className="quest-board-emblem-icon">✦</span>
              </div>
              <h2 id="mission-modal-title" className="quest-board-title">今日の依頼</h2>
              {!isPreparing && (
                <p className="mission-modal-subtitle quest-board-subtitle">
                  1日3つ・1個届けると達成 <span className="quest-board-progress">（{completedCount}/{missions.length} 達成）</span>
                </p>
              )}
              <button type="button" className="recipe-modal-close quest-board-close" onClick={onClose} aria-label="閉じる">
                ×
              </button>
            </header>
            {isPreparing ? (
              <p className="mission-loading-only">準備中……</p>
            ) : (
              <>
            {missionsSource === 'fallback' && (
              <p className="daily-fallback-notice quest-board-fallback">AIで作れませんでした。いつもの依頼を出しています。</p>
            )}
            <ul className="mission-list mission-modal-list quest-board-list">
              {missions.map((m) => (
                <li key={m.id} className={`mission-item quest-notice ${m.completed ? 'completed' : ''}`}>
                  <div className="mission-header">
                    <span className="mission-title">{m.title}</span>
                    <span className="mission-reward">
                      +{m.actualRewardG ?? m.rewardG}G
                      {m.completed && m.actualRewardG != null && m.actualRewardG !== m.rewardG && (
                        <span className={`mission-reward-diff ${m.actualRewardG > m.rewardG ? 'diff-up' : 'diff-down'}`}>
                          {m.actualRewardG > m.rewardG ? ` (+${m.actualRewardG - m.rewardG}G)` : ` (${m.actualRewardG - m.rewardG}G)`}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="mission-desc">{m.description}</p>
                  {m.completed ? (
                    <span className="mission-status">✓ 達成済み</span>
                  ) : hasApi() && sellableItems.length > 0 ? (
                    <div className="mission-claim">
                      <span className="mission-hint">持っているもので届ける：</span>
                      <div className="mission-item-buttons">
                        {sellableItems.slice(0, 5).map((item) => (
                          <button
                            key={item.instanceId}
                            type="button"
                            className="mission-claim-btn mission-claim-btn-icon"
                            disabled={completingId === m.id}
                            onClick={() => handleComplete(m, item.instanceId, item.name, item.id)}
                            title={`${item.name}で達成`}
                          >
                            <ItemCard item={item} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mission-hint">
                      {hasApi()
                        ? '作ったものがありません。まず釜で調合しよう。'
                        : '持っているものを選んで届ける（APIをつなぐと使えます）'}
                    </p>
                  )}
                </li>
              ))}
            </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
