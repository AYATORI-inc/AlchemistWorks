import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { useGame } from '../contexts/GameContext'
import { ITEMS_DB } from '../constants/items'
import { ItemCard } from '../components/ItemCard'
import type { Recipe } from '../types'
import { PACE_LABELS } from '../types'

function getItemDisplay(id: string) {
  const item = ITEMS_DB[id]
  return item ? { name: item.name, icon: item.icon } : { name: id, icon: '❓' }
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const resultName = recipe.resultName ?? getItemDisplay(recipe.result).name
  const resultIcon = recipe.resultIcon ?? getItemDisplay(recipe.result).icon
  const ing1 = recipe.ingredientNames?.[0] ?? getItemDisplay(recipe.ingredients[0]).name
  const ing2 = recipe.ingredientNames?.[1] ?? getItemDisplay(recipe.ingredients[1]).name

  const paceLabel = recipe.pace ? PACE_LABELS[recipe.pace] : '普通'
  const discoveredAt = recipe.discoveredAt
    ? new Date(recipe.discoveredAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <div className="recipe-card" data-recipe>
      <div className="recipe-result">
        <ItemCard
          item={{
            id: recipe.result,
            name: resultName,
            icon: resultIcon,
            tier: ITEMS_DB[recipe.result]?.tier ?? 0,
          }}
        />
      </div>
      <div className="recipe-ingredients">
        {ing1} × {ing2} ＋ {paceLabel}
      </div>
      <div className="recipe-meta">
        {discoveredAt && <span className="recipe-date">発見: {discoveredAt}</span>}
        {recipe.useCount != null && recipe.useCount > 0 && (
          <span className="recipe-use-count">使用回数: {recipe.useCount}</span>
        )}
      </div>
    </div>
  )
}

export function RecipeBookPage() {
  const navigate = useNavigate()
  const { saveData } = useGame()

  useEffect(() => {
    if (!saveData?.userId) {
      navigate('/')
    }
  }, [navigate, saveData])

  const recipes = saveData?.recipes ?? []
  const sortedRecipes = [...recipes].sort((a, b) => {
    const dateA = a.discoveredAt ? new Date(a.discoveredAt).getTime() : 0
    const dateB = b.discoveredAt ? new Date(b.discoveredAt).getTime() : 0
    return dateB - dateA
  })

  return (
    <div className="main-layout">
      <Header />
      <main className="page-content">
        <h1>📖 あなただけのレシピ帳</h1>
        <p className="recipe-book-desc">
          この工房で発見したレシピを記録している
        </p>

        {recipes.length === 0 ? (
          <div className="recipe-empty-state">
            <p>まだレシピを発見していない</p>
            <p className="recipe-empty-hint">
              錬金釜で素材を2つ調合すると、新レシピが発見される
            </p>
            <Link to="/game" className="recipe-empty-link">
              工房に戻って調合する →
            </Link>
          </div>
        ) : (
          <div className="recipe-list">
            {sortedRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
