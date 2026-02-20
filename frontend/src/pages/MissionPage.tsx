import { Header } from '../components/Header'

export function MissionPage() {
  return (
    <div className="main-layout">
      <Header />
      <main className="page-content">
        <h1>📋 今日のミッション</h1>
        <p className="placeholder-text">1日3つ、AI生成ミッション（API連携後）</p>
      </main>
    </div>
  )
}
