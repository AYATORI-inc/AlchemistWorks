import { useGame } from '../contexts/GameContext'
import { RecipeBookModal } from './RecipeBookModal'
import { MissionModal } from './MissionModal'
import { AchievementModal } from './AchievementModal'
import { AchievementToastStack } from './AchievementToastStack'

/** ゲーム中に表示するモーダル（ナビから開く） */
export function GameModals() {
  const {
    saveData,
    isDeliveringMission,
    recipeModalOpen,
    setRecipeModalOpen,
    missionModalOpen,
    setMissionModalOpen,
    achievementModalOpen,
    setAchievementModalOpen,
    setSaveData,
  } = useGame()
  if (!saveData?.userId) return null
  const handleCloseRecipeBook = () => {
    setRecipeModalOpen(false)
    setSaveData((prev) => {
      if (!prev) return prev
      return { ...prev, recipeBookLastSeenAt: new Date().toISOString() }
    })
  }
  return (
    <>
      {recipeModalOpen && <RecipeBookModal onClose={handleCloseRecipeBook} />}
      {missionModalOpen && <MissionModal onClose={() => setMissionModalOpen(false)} />}
      {achievementModalOpen && <AchievementModal onClose={() => setAchievementModalOpen(false)} />}
      <AchievementToastStack />
      {isDeliveringMission && (
        <div className="loading-overlay delivery-overlay" role="status" aria-live="polite">
          <span>依頼納品中……</span>
        </div>
      )}
    </>
  )
}
