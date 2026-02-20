import { Link, useNavigate } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'

const RANK_NAMES: Record<number, string> = {
  1: 'みならい錬金術師',
  2: '見習い錬金術師',
  3: '錬金術師',
  4: '熟練錬金術師',
  5: '名人錬金術師',
  6: '国一番の錬金術師',
}

export function Header() {
  const navigate = useNavigate()
  const { saveData, missions, setRecipeModalOpen, setMissionModalOpen, setSaveData } = useGame()
  const rank = saveData?.rank ?? 1
  const incompleteCount = missions?.filter((m) => !m.completed).length ?? 0
  const hasIncomplete = incompleteCount > 0

  const handleRecipeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setRecipeModalOpen(true)
  }

  const handleMissionClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setMissionModalOpen(true)
  }

  const handleLogout = () => {
    setSaveData(null)
    localStorage.removeItem('alchemy-save')
    navigate('/')
  }

  return (
    <header className="header">
      <Link to="/game" className="logo">
        🧪 錬金術シミュレータ
      </Link>
      <nav className="header-nav">
        <Link to="/game" onClick={handleRecipeClick}>レシピブック</Link>
        <Link
          to="/game"
          onClick={handleMissionClick}
          className={hasIncomplete ? 'header-nav-link mission-pending' : ''}
        >
          今日の依頼
          {hasIncomplete && (
            <span className="mission-pending-badge" aria-label={`未達成が${incompleteCount}件`}>
              {incompleteCount}
            </span>
          )}
        </Link>
        <Link to="/achievements">実績</Link>
        <button type="button" className="header-nav-btn" onClick={handleLogout}>
          ログアウト
        </button>
      </nav>
      <div className="header-right">
        {saveData && (
          <>
            <span className="g-display">G: {saveData.g}</span>
            <span className="rank-badge">{RANK_NAMES[rank]}</span>
            {saveData.workshopName && (
              <span className="workshop-name">{saveData.workshopName}</span>
            )}
          </>
        )}
      </div>
    </header>
  )
}
