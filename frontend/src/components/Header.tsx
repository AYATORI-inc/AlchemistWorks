import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'
import { ITEM_CATEGORY_LABELS } from '../constants/items'
import { RANK_TITLES } from '../constants/achievements'
import { formatG, formatNumber } from '../utils/format'

export function Header() {
  const navigate = useNavigate()
  const { saveData, setRecipeModalOpen, setAchievementModalOpen, setSaveData } = useGame()
  const rank = saveData?.rank ?? 1
  const [showLedgerModal, setShowLedgerModal] = useState(false)

  const handleRecipeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setRecipeModalOpen(true)
  }

  const handleAchievementClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setAchievementModalOpen(true)
  }

  const handleConfirmLogout = () => {
    setSaveData(null)
    localStorage.removeItem('alchemy-save')
    navigate('/')
  }

  const handleLogout = () => setShowLedgerModal(true)
  const ledger = saveData?.dailySalesLedger
  const entries = ledger?.entries ?? []

  return (
    <>
      <header className="header">
        <Link to="/game" className="logo">
          🧪 魔法工房　ヒミツのお店
        </Link>
        <nav className="header-nav">
          <Link to="/game" onClick={handleRecipeClick}>レシピブック</Link>
          <Link to="/achievements" onClick={handleAchievementClick}>実績</Link>
          <button type="button" className="header-nav-btn" onClick={handleLogout}>
            ログアウト
          </button>
        </nav>
        <div className="header-right">
          {saveData && (
            <>
              <span className="g-display">G: {formatNumber(saveData.g)}</span>
              <span className="rank-badge">{RANK_TITLES[rank] ?? RANK_TITLES[1]}</span>
              {saveData.workshopName && (
                <span className="workshop-name">{saveData.workshopName}</span>
              )}
            </>
          )}
        </div>
      </header>

      {showLedgerModal && (
        <div className="ledger-modal-backdrop" role="dialog" aria-modal="true" aria-label="今日の売り上げ">
          <div className="ledger-modal-content">
            <div className="ledger-modal-header">
              <h3>今日の売り上げ</h3>
              <span className="ledger-date">{ledger?.date ?? new Date().toISOString().slice(0, 10)}</span>
            </div>
            <div className="ledger-total">合計: {formatG(ledger?.totalG ?? 0)}</div>
            <div className="ledger-lines">
              {entries.length === 0 ? (
                <p className="ledger-empty">売上はまだありません。</p>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id} className="ledger-line">
                    <span>{new Date(entry.soldAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>{ITEM_CATEGORY_LABELS[entry.category]}</span>
                    <span>{entry.note}</span>
                    <strong>+{formatG(entry.amountG)}</strong>
                  </div>
                ))
              )}
            </div>
            <div className="ledger-modal-actions">
              <button type="button" className="ledger-cancel-btn" onClick={() => setShowLedgerModal(false)}>閉じる</button>
              <button type="button" className="ledger-logout-btn" onClick={handleConfirmLogout}>ログアウト</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
