import { useEffect, useRef, useState } from 'react'
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
  const [goldGainToast, setGoldGainToast] = useState<{ id: string; amountG: number } | null>(null)
  const [goldValueSpark, setGoldValueSpark] = useState<{ key: number; dir: 'up' | 'down' } | null>(null)
  const lastSeenSalesEntryIdRef = useRef<string | null>(null)
  const prevGoldRef = useRef<number | null>(null)

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
  const latestEntry = entries[0]

  useEffect(() => {
    lastSeenSalesEntryIdRef.current = null
    prevGoldRef.current = null
    setGoldValueSpark(null)
    setGoldGainToast(null)
  }, [saveData?.userId])

  useEffect(() => {
    const currentGold = saveData?.g
    if (typeof currentGold !== 'number') return
    if (prevGoldRef.current == null) {
      prevGoldRef.current = currentGold
      return
    }
    if (prevGoldRef.current === currentGold) return
    const dir: 'up' | 'down' = currentGold > prevGoldRef.current ? 'up' : 'down'
    prevGoldRef.current = currentGold
    setGoldValueSpark((prev) => ({ key: (prev?.key ?? 0) + 1, dir }))
  }, [saveData?.g])

  useEffect(() => {
    if (!latestEntry) return
    if (!lastSeenSalesEntryIdRef.current) {
      lastSeenSalesEntryIdRef.current = latestEntry.id
      return
    }
    if (lastSeenSalesEntryIdRef.current === latestEntry.id) return
    lastSeenSalesEntryIdRef.current = latestEntry.id
    const nextToast = {
      id: `gold-${latestEntry.id}`,
      amountG: Math.max(0, latestEntry.amountG ?? 0),
    }
    setGoldGainToast(nextToast)
  }, [latestEntry?.id, latestEntry?.amountG])

  useEffect(() => {
    if (!goldGainToast) return
    const timer = window.setTimeout(() => {
      setGoldGainToast((prev) => (prev?.id === goldGainToast.id ? null : prev))
    }, 2400)
    return () => window.clearTimeout(timer)
  }, [goldGainToast])

  return (
    <>
      <header className="header">
        <Link to="/game" className="logo">
          <img src="/images/Seal.png" alt="" className="brand-seal-icon header-logo-seal" aria-hidden />
          <span className="logo-text">
            <ruby className="brand-title-ruby">
              錬金工房
              <rt>れんきんこうぼう</rt>
            </ruby>
            &emsp;ヒミツのお店
          </span>
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
              <span className="g-display-wrap">
                <span className="g-display" aria-label={`所持ゴールド ${formatNumber(saveData.g)}G`}>
                  <span className="g-display-coin" aria-hidden>◎</span>
                  <span className="g-display-label">G</span>
                  <span className="g-display-separator" aria-hidden>:</span>
                  <span
                    key={goldValueSpark?.key ?? 0}
                    className={`g-display-value ${goldValueSpark ? `spark-${goldValueSpark.dir}` : ''}`.trim()}
                  >
                    {formatNumber(saveData.g)}
                  </span>
                </span>
                {goldGainToast && (
                  <span key={goldGainToast.id} className="gold-gain-toast" role="status" aria-live="polite">
                    売上 +{formatG(goldGainToast.amountG)}
                  </span>
                )}
              </span>
              <span className="rank-badge">
                <strong>{`${RANK_TITLES[rank] ?? RANK_TITLES[1]}:`}</strong>
                {saveData.userName || saveData.workshopName || ''}
              </span>
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
