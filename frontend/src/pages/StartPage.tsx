import { useNavigate } from 'react-router-dom'

export function StartPage() {
  const navigate = useNavigate()

  return (
    <div className="start-scene">
      <div className="start-page">
        <div className="start-page-wood">
          <div className="start-page-paper">
            <p className="start-kicker">ALCHEMIST GUILD WORKSHOP</p>
            <h1 className="start-title">
              <img src="/images/Seal.png" alt="" className="brand-seal-icon start-title-seal" aria-hidden />
              <span>
                <ruby className="brand-title-ruby">
                  錬金工房
                  <rt>れんきんこうぼう</rt>
                </ruby>
                &emsp;ヒミツのお店
              </span>
            </h1>
            <p className="subtitle">工房で伝説の錬金術師をめざそう</p>
            <div className="start-feature-row" aria-hidden>
              <span>🔥 錬金</span>
              <span>🏠 おみせ</span>
              <span>🏅 コレクション</span>
            </div>
            <div className="start-buttons">
              <button
                type="button"
                className="start-btn new-game"
                onClick={() => navigate('/login/new')}
              >
                はじめる
              </button>
              <button
                type="button"
                className="start-btn continue"
                onClick={() => navigate('/login/continue')}
              >
                つづきから
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
