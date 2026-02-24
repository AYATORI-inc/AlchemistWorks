import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'
import { ITEM_CATEGORY_LABELS } from '../constants/items'

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
  const { saveData, setRecipeModalOpen, setSaveData } = useGame()
  const rank = saveData?.rank ?? 1
  const [showLedgerModal, setShowLedgerModal] = useState(false)

  const handleRecipeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setRecipeModalOpen(true)
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
          🧪 錬金術シミュレータ
        </Link>
        <nav className="header-nav">
          <Link to="/game" onClick={handleRecipeClick}>レシピブック</Link>
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

      {showLedgerModal && (
        <div className="ledger-modal-backdrop" role="dialog" aria-modal="true" aria-label="今日の売り上げ">
          <div className="ledger-modal-content">
            <div className="ledger-modal-header">
              <h3>今日の売り上げ</h3>
              <span className="ledger-date">{ledger?.date ?? new Date().toISOString().slice(0, 10)}</span>
            </div>
            <div className="ledger-total">合計: {ledger?.totalG ?? 0}G</div>
            <div className="ledger-lines">
              {entries.length === 0 ? (
                <p className="ledger-empty">売上はまだありません。</p>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id} className="ledger-line">
                    <span>{new Date(entry.soldAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>{ITEM_CATEGORY_LABELS[entry.category]}</span>
                    <span>{entry.note}</span>
                    <strong>+{entry.amountG}G</strong>
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
