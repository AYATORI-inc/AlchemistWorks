import { useNavigate } from 'react-router-dom'

export function StartPage() {
  const navigate = useNavigate()

  return (
    <div className="start-page">
      <h1>🧪 錬金術シミュレータ</h1>
      <p className="subtitle">工房で国いちばんの錬金術師をめざそう</p>
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
  )
}
