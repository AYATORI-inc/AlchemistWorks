import { Header } from '../components/Header'

export function MarketPage() {
  return (
    <div className="main-layout">
      <Header />
      <main className="page-content">
        <h1>🏪 市場</h1>
        <section>
          <h2>購入（基本素材＋日替わり3種）</h2>
          <p className="placeholder-text">市場アイテム一覧（API連携後）</p>
        </section>
        <section>
          <h2>売却（所持アイテムから選択）</h2>
          <p className="placeholder-text">アイテム棚から選択→G獲得（API連携後）</p>
        </section>
      </main>
    </div>
  )
}
