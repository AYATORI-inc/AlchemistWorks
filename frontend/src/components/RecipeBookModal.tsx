import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useGame } from '../contexts/GameContext'
import { ITEMS_DB } from '../constants/items'
import { ItemCard } from './ItemCard'
import type { Recipe } from '../types'
import { PACE_LABELS } from '../types'

function getItemDisplay(id: string) {
  const item = ITEMS_DB[id]
  return item ? { name: item.name, icon: item.icon, flavor: item.flavor } : { name: id, icon: '❓', flavor: undefined }
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const resultName = recipe.resultName ?? getItemDisplay(recipe.result).name
  const resultIcon = recipe.resultIcon ?? getItemDisplay(recipe.result).icon
  const resultFlavor = recipe.resultFlavor ?? getItemDisplay(recipe.result).flavor
  const ing1 = recipe.ingredientNames?.[0] ?? getItemDisplay(recipe.ingredients[0]).name
  const ing2 = recipe.ingredientNames?.[1] ?? getItemDisplay(recipe.ingredients[1]).name
  const flavor1 = recipe.ingredientFlavors?.[0] ?? getItemDisplay(recipe.ingredients[0]).flavor
  const flavor2 = recipe.ingredientFlavors?.[1] ?? getItemDisplay(recipe.ingredients[1]).flavor

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
            flavor: resultFlavor,
          }}
        />
      </div>
        {resultFlavor && <p className="recipe-flavor">{resultFlavor}</p>}
      <div className="recipe-ingredients">
        <span className="recipe-ingredient" title={flavor1 ?? undefined}>
          {ing1}
        </span>
        {' と '}
        <span className="recipe-ingredient" title={flavor2 ?? undefined}>
          {ing2}
        </span>
        {' を '}
        {paceLabel}
        {' で '}
      </div>
      <div className="recipe-meta">
        {discoveredAt && <span className="recipe-date">見つけた日: {discoveredAt}</span>}
        {recipe.useCount != null && recipe.useCount > 0 && (
          <span className="recipe-use-count">使った回数: {recipe.useCount}</span>
        )}
      </div>
    </div>
  )
}

interface RecipeBookModalProps {
  onClose: () => void
}

const PER_PAGE = 9 // 3列×3行

export function RecipeBookModal({ onClose }: RecipeBookModalProps) {
  const { saveData } = useGame()
  const [page, setPage] = useState(1)
  const recipes = saveData?.recipes ?? []
  const sortedRecipes = [...recipes].sort((a, b) => {
    const dateA = a.discoveredAt ? new Date(a.discoveredAt).getTime() : 0
    const dateB = b.discoveredAt ? new Date(b.discoveredAt).getTime() : 0
    return dateB - dateA
  })

  const totalPages = Math.max(1, Math.ceil(sortedRecipes.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedRecipes = sortedRecipes.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  )

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const content = (
    <div
      className="recipe-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-modal-title"
    >
      <div className="recipe-modal-content">
        <div className="recipe-modal-header">
          <h2 id="recipe-modal-title">📖 レシピブック</h2>
          <button type="button" className="recipe-modal-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>
        <p className="recipe-book-desc">
          この工房で見つけたレシピを書いておく本だよ
        </p>

        {recipes.length === 0 ? (
          <div className="recipe-empty-state">
            <p>まだレシピを1つも見つけていない</p>
            <p className="recipe-empty-hint">
              釜に素材を2つ入れて調合すると、新しいレシピが見つかるよ
            </p>
            <button type="button" className="recipe-empty-link-btn" onClick={onClose}>
              閉じる
            </button>
          </div>
        ) : (
          <>
            <div className="recipe-list recipe-list-grid3">
              {paginatedRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
            {totalPages > 1 && (
              <nav className="recipe-pagination" aria-label="レシピページネーション">
                <button
                  type="button"
                  className="recipe-pagination-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="前のページ"
                >
                  ← 前へ
                </button>
                <span className="recipe-pagination-info">
                  {currentPage} / {totalPages} ページ
                </span>
                <button
                  type="button"
                  className="recipe-pagination-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="次のページ"
                >
                  次へ →
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
