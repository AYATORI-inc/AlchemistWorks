import { Header } from '../components/Header'
import { useGame } from '../contexts/GameContext'

const RANK_NAMES: Record<number, string> = {
  1: 'みならい錬金術師',
  2: '見習い錬金術師',
  3: '錬金術師',
  4: '熟練錬金術師',
  5: '名人錬金術師',
  6: '国一番の錬金術師',
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
          <h2>とくした実績</h2>
          <p className="placeholder-text">実績はこれからふえていくよ</p>
        </section>
      </main>
    </div>
  )
}
