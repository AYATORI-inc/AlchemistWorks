import { useNavigate } from 'react-router-dom'

export function StartPage() {
  const navigate = useNavigate()

  return (
    <div className="start-scene">
      <div className="start-page">
        <div className="start-page-wood">
          <div className="start-page-paper">
            <p className="start-kicker">ALCHEMIST GUILD WORKSHOP</p>
            <h1>🧪 魔法工房　ヒミツのお店</h1>
            <p className="subtitle">工房で国いちばんの錬金術師をめざそう</p>
            <div className="start-feature-row" aria-hidden>
              <span>🔥 調合</span>
              <span>🏪 おみせ</span>
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
