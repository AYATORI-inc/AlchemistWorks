import { useState } from 'react'
import type { Mission } from '../types'
import { useGame } from '../contexts/GameContext'
import { api } from '../api/client'
import { ITEMS_DB } from '../constants/items'
import { ItemCard } from './ItemCard'

const hasApi = () => !!import.meta.env.VITE_GAS_URL

// モック（API未連携時用）
const MOCK_MISSIONS: Mission[] = [
  { id: 'm1', title: '癒しの薬', description: '傷を癒す薬を1個納品してほしい', rewardG: 3000, completed: false },
  { id: 'm2', title: '町の祭り用', description: '祭り用の特別な炎を1個納品してほしい', rewardG: 5000, completed: false },
  { id: 'm3', title: '新発見', description: '新しい回復系のアイテムを発見する', rewardG: 2500, completed: false },
]

export function MissionPanel() {
  const { saveData, missions: apiMissions, missionsSource, setMissions, setDeliveringMission, addG, removeFromInventory } = useGame()
  const missions = (apiMissions ?? MOCK_MISSIONS) as Mission[]
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

  return (
    <section id="missions" className="mission-panel sidebar-section">
      <h2>📋 今日のミッション</h2>
      {missionsSource === 'fallback' && (
        <p className="daily-fallback-notice">AI生成に失敗しました。既定のミッションを表示しています。GASのOPENAI_API_KEYを確認してください。</p>
      )}
      <p className="mission-subtitle">1日3つ・1個納品、AI達成度で報酬変動（{completedCount}/{missions.length} 達成）</p>
      <ul className="mission-list">
        {missions.map((m) => (
          <li key={m.id} className={`mission-item ${m.completed ? 'completed' : ''}`}>
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
                <span className="mission-hint">所持アイテムで達成申請：</span>
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
                  ? '所持生成物がありません。錬金で作成しよう。'
                  : '所持アイテムを選択して達成申請（API連携後）'}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
