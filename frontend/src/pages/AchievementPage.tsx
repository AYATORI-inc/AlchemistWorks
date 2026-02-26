import { Header } from '../components/Header'
import { useGame } from '../contexts/GameContext'

const RANK_NAMES: Record<number, string> = {
  1: 'みならい錬金術師',
  2: 'かけだし錬金術師',
  3: 'アマチュア錬金術師',
  4: 'ウワサの錬金術師',
  5: 'スゴウデ錬金術師',
  6: '宮廷錬金術師',
  7: '伝説の錬金術師',
}

export function AchievementPage() {
  const { saveData } = useGame()

  return (
    <div className="main-layout">
      <Header />
      <main className="page-content">
        <h1>実績とランク</h1>
        <section>
          <h2>いまのランク</h2>
          <p>{RANK_NAMES[saveData?.rank ?? 1]}</p>
        </section>
        <section>
          <h2>獲得した実績</h2>
          <p className="placeholder-text">実績はこれからふえていくよ</p>
        </section>
      </main>
    </div>
  )
}
