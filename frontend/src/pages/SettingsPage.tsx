import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { useGame } from '../contexts/GameContext'

export function SettingsPage() {
  const navigate = useNavigate()
  const { setSaveData, saveData } = useGame()

  const handleLogout = () => {
    setSaveData(null)
    localStorage.removeItem('alchemy-save')
    navigate('/')
  }

  return (
    <div className="main-layout">
      <Header />
      <main className="page-content">
        <h1>設定</h1>
        <section>
          {saveData && (
            <p>
              {saveData.userName} / {saveData.workshopName}
            </p>
          )}
          <button type="button" onClick={handleLogout}>
            ログアウト
          </button>
        </section>
      </main>
    </div>
  )
}
