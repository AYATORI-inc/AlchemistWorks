import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useGame } from '../contexts/GameContext'
import { api } from '../api/client'
import { BASIC_MATERIALS, ITEM_CATEGORY_LABELS, ITEMS_DB, resolveItemCategory } from '../constants/items'
import { ItemCard } from './ItemCard'
import { PipetCharacter } from './PipetCharacter'
import type { InventoryItem, ItemCategory, Recipe } from '../types'
import { PACE_LABELS } from '../types'

function getItemDisplay(id: string) {
  const item = ITEMS_DB[id]
  return item ? { name: item.name, icon: item.icon, flavor: item.flavor } : { name: id, icon: '❓', flavor: undefined }
}

const hasApi = () => !!import.meta.env.VITE_GAS_URL

type RecipeFilter = 'all' | ItemCategory

interface RecipeCraftAvailability {
  canCraft: boolean
  missingText?: string
}

function RecipeCard({
  recipe,
  canQuickCraft,
  quickCraftHint,
  onQuickCraft,
  isCrafting,
}: {
  recipe: Recipe
  canQuickCraft: boolean
  quickCraftHint?: string
  onQuickCraft: () => void
  isCrafting: boolean
}) {
  const resultName = recipe.resultName ?? getItemDisplay(recipe.result).name
  const resultIcon = recipe.resultIcon ?? getItemDisplay(recipe.result).icon
  const resultFlavor = recipe.resultFlavor ?? getItemDisplay(recipe.result).flavor
  const resultCategory =
    recipe.resultCategory ??
    resolveItemCategory({
      id: recipe.result,
      name: recipe.resultName,
      description: recipe.resultFlavor,
      ingredientIds: recipe.ingredients,
    })
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
        <div className="recipe-result-card-wrap">
          <ItemCard
            item={{
              id: recipe.result,
              name: resultName,
              icon: resultIcon,
              tier: recipe.resultTier ?? ITEMS_DB[recipe.result]?.tier ?? 0,
              flavor: resultFlavor,
              category: resultCategory,
            }}
          />
        </div>
        <div className="recipe-result-side">
          <button
            type="button"
            className="recipe-quick-craft-btn"
            disabled={!canQuickCraft || isCrafting}
            onClick={onQuickCraft}
            title={canQuickCraft ? 'パッと錬金する' : (quickCraftHint ?? '素材不足')}
          >
            {isCrafting ? '錬金中…' : 'パッと錬金する'}
          </button>
          {!canQuickCraft && quickCraftHint && (
            <p className="recipe-quick-craft-hint">{quickCraftHint}</p>
          )}
        </div>
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
          <span className="recipe-use-count">累計制作数: {recipe.useCount}個</span>
        )}
      </div>
    </div>
  )
}

interface RecipeBookModalProps {
  onClose: () => void
}

const PER_PAGE = 6 // 1ページ6件

export function RecipeBookModal({ onClose }: RecipeBookModalProps) {
  const { saveData, addToInventory, removeFromInventory, addRecipe, addDiscoveredSvgIcon } = useGame()
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState<RecipeFilter>('all')
  const [onlyQuickCraftable, setOnlyQuickCraftable] = useState(false)
  const [quickCraftingRecipeId, setQuickCraftingRecipeId] = useState<string | null>(null)
  const [quickCraftMessage, setQuickCraftMessage] = useState<string>('')
  const recipes = saveData?.recipes ?? []
  const sortedRecipes = [...recipes].sort((a, b) => {
    const dateA = a.discoveredAt ? new Date(a.discoveredAt).getTime() : 0
    const dateB = b.discoveredAt ? new Date(b.discoveredAt).getTime() : 0
    return dateB - dateA
  })
  const filteredRecipes = useMemo(
    () =>
      sortedRecipes.filter((recipe) => {
        if (categoryFilter === 'all') return true
        const category =
          recipe.resultCategory ??
          resolveItemCategory({
            id: recipe.result,
            name: recipe.resultName,
            description: recipe.resultFlavor,
            ingredientIds: recipe.ingredients,
          })
        return category === categoryFilter
      }),
    [sortedRecipes, categoryFilter]
  )

  useEffect(() => {
    setPage(1)
  }, [categoryFilter, onlyQuickCraftable])

  const inventory = saveData?.inventory ?? []

  const recipeAvailability = useMemo(() => {
    const available = inventory.filter((item) => !item.isDisplayed)
    const counts = new Map<string, number>()
    for (const item of available) {
      counts.set(item.id, (counts.get(item.id) ?? 0) + 1)
    }

    const result = new Map<string, RecipeCraftAvailability>()
    for (const recipe of recipes) {
      const needCounts = new Map<string, number>()
      for (const ingredientId of recipe.ingredients) {
        if (BASIC_MATERIALS.includes(ingredientId as (typeof BASIC_MATERIALS)[number])) continue
        needCounts.set(ingredientId, (needCounts.get(ingredientId) ?? 0) + 1)
      }
      const missing: string[] = []
      for (const [ingredientId, need] of needCounts.entries()) {
        const have = counts.get(ingredientId) ?? 0
        if (have < need) {
          const display = recipe.ingredientNames?.[recipe.ingredients.indexOf(ingredientId)] ?? getItemDisplay(ingredientId).name
          missing.push(`${display}×${need - have}`)
        }
      }
      result.set(recipe.id, missing.length === 0
        ? { canCraft: true }
        : { canCraft: false, missingText: `不足: ${missing.join(' / ')}` })
    }
    return result
  }, [inventory, recipes])

  const visibleRecipes = useMemo(
    () =>
      filteredRecipes.filter((recipe) => {
        if (!onlyQuickCraftable) return true
        return recipeAvailability.get(recipe.id)?.canCraft ?? false
      }),
    [filteredRecipes, onlyQuickCraftable, recipeAvailability]
  )

  const totalPages = Math.max(1, Math.ceil(visibleRecipes.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedRecipes = visibleRecipes.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  )

  const produceItems = (base: Omit<InventoryItem, 'instanceId'>, count: number) => {
    for (let i = 0; i < count; i += 1) {
      addToInventory({
        ...base,
        instanceId: `inst-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      })
    }
  }

  const consumeRecipeIngredients = (recipe: Recipe) => {
    const instanceIdsToConsume: string[] = []
    const working = inventory.filter((i) => !i.isDisplayed)
    for (const ingredientId of recipe.ingredients) {
      if (BASIC_MATERIALS.includes(ingredientId as (typeof BASIC_MATERIALS)[number])) continue
      const idx = working.findIndex((i) => i.id === ingredientId)
      if (idx < 0) return null
      const [picked] = working.splice(idx, 1)
      instanceIdsToConsume.push(picked.instanceId)
    }
    return instanceIdsToConsume
  }

  const handleQuickCraft = async (recipe: Recipe) => {
    if (!saveData?.userId || quickCraftingRecipeId) return
    const availability = recipeAvailability.get(recipe.id)
    if (!availability?.canCraft) return

    setQuickCraftMessage('')
    setQuickCraftingRecipeId(recipe.id)
    try {
      const instanceIdsToConsume = consumeRecipeIngredients(recipe)
      if (!instanceIdsToConsume) {
        setQuickCraftMessage('素材が足りません')
        return
      }
      instanceIdsToConsume.forEach((instanceId) => removeFromInventory(instanceId))

      const ingAName = recipe.ingredientNames?.[0] ?? getItemDisplay(recipe.ingredients[0]).name
      const ingBName = recipe.ingredientNames?.[1] ?? getItemDisplay(recipe.ingredients[1]).name

      if (hasApi()) {
        const knownRecipes = (saveData.recipes ?? []).map((r) => ({
          resultCategory: r.resultCategory ?? resolveItemCategory({
            id: r.result,
            name: r.resultName,
            description: r.resultFlavor,
            ingredientIds: r.ingredients,
          }),
          id: r.id,
          ingredients: r.ingredients,
          result: r.result,
          pace: r.pace,
          resultName: r.resultName,
          resultIcon: r.resultIcon,
          resultFlavor: r.resultFlavor,
          resultValue: r.resultValue,
          resultTier: r.resultTier,
          resultQuality: r.resultQuality,
        }))

        const res = await api.alchemy.execute(
          saveData.userId,
          [
            { id: recipe.ingredients[0], name: ingAName },
            { id: recipe.ingredients[1], name: ingBName },
          ],
          recipe.pace ?? 'normal',
          knownRecipes
        ) as {
          success?: boolean
          result?: {
            id: string
            name: string
            icon: string
            description?: string
            quality?: string
            value?: number
            tier?: number
            category?: InventoryItem['category']
            isNewRecipe?: boolean
            svgPath?: string
            svgFill?: string
          }
          error?: string
        }

        const r = res.result
        if (res.error) {
          setQuickCraftMessage(res.error)
          return
        }
        if (!res.success || !r) {
          setQuickCraftMessage('錬金がうまくいかなかった')
          return
        }

        const resolvedCategory = resolveItemCategory({
          id: r.id,
          name: r.name,
          description: r.description,
          category: r.category,
          ingredientIds: recipe.ingredients,
        })
        produceItems({
          id: r.id,
          name: r.name,
          icon: r.icon,
          tier: (r.tier ?? 1) as 0 | 1 | 2 | 3,
          quality: (r.quality as InventoryItem['quality']) ?? 'normal',
          value: r.value ?? 1000,
          description: r.description,
          category: resolvedCategory,
        }, 1)
        if (r.svgPath) addDiscoveredSvgIcon(r.id, r.svgPath, r.svgFill)
        addRecipe({
          ...recipe,
          discovered: true,
          discoveredAt: recipe.discoveredAt ?? new Date().toISOString(),
          useCount: 1,
          result: r.id,
          resultName: r.name,
          resultIcon: r.icon,
          resultFlavor: r.description,
          resultValue: r.value,
          resultTier: r.tier,
          resultQuality: r.quality,
          resultCategory: resolvedCategory,
          ingredientNames: [ingAName, ingBName],
        })
        setQuickCraftMessage(`レシピから錬金したよ！ ${r.name} を1個作成`)
      } else {
        const resultId = recipe.result
        const meta = ITEMS_DB[resultId]
        const resultName = recipe.resultName ?? meta?.name ?? resultId
        const resultIcon = recipe.resultIcon ?? meta?.icon ?? '❓'
        const resultFlavor = recipe.resultFlavor ?? meta?.flavor
        const resultTier = (recipe.resultTier ?? meta?.tier ?? 1) as 0 | 1 | 2 | 3
        const resultCategory = recipe.resultCategory ?? resolveItemCategory({
          id: resultId,
          name: resultName,
          description: resultFlavor,
          ingredientIds: recipe.ingredients,
        })

        produceItems({
          id: resultId,
          name: resultName,
          icon: resultIcon,
          tier: resultTier,
          quality: (recipe.resultQuality as InventoryItem['quality']) ?? 'normal',
          value: recipe.resultValue ?? 1000,
          description: resultFlavor,
          category: resultCategory,
        }, 1)
        addRecipe({ ...recipe, useCount: 1, resultCategory })
        setQuickCraftMessage(`レシピから錬金したよ！ ${resultName} を1個作成`)
      }
    } catch {
      setQuickCraftMessage('レシピ錬金に失敗しました')
    } finally {
      setQuickCraftingRecipeId(null)
    }
  }

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
      <div className="recipe-modal-content recipe-book-modal-content">
        <div className="recipe-modal-header">
          <h2 id="recipe-modal-title">📖 レシピブック</h2>
          <button type="button" className="recipe-modal-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>
        <PipetCharacter
          className="recipe-book-pipet-card"
          imageClassName="recipe-book-pipet-image"
          bubbleClassName="recipe-book-pipet-bubble"
          message="ここには、この工房で見つけたレシピを記録していくよ♪"
          subMessage="新しい組み合わせを見つけたら、あとで見返してみてね"
        />
        <div className="recipe-filter-bar" role="group" aria-label="レシピカテゴリ絞り込み">
          <button
            type="button"
            className={`recipe-filter-chip ${categoryFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            すべて
          </button>
          {(['food', 'weapon', 'medicine', 'gem'] as const).map((category) => (
            <button
              key={category}
              type="button"
              className={`recipe-filter-chip category-${category} ${categoryFilter === category ? 'is-active' : ''}`}
              onClick={() => setCategoryFilter(category)}
            >
              {ITEM_CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
        <label className="recipe-toggle-filter">
          <input
            type="checkbox"
            checked={onlyQuickCraftable}
            onChange={(e) => setOnlyQuickCraftable(e.target.checked)}
          />
          <span>パッと作れるレシピだけ表示</span>
        </label>
        {quickCraftMessage && <p className="recipe-quick-craft-global-message">{quickCraftMessage}</p>}

        {recipes.length === 0 ? (
          <div className="recipe-empty-state">
            <p>まだレシピを1つも見つけていない</p>
            <p className="recipe-empty-hint">
              釜に素材を2つ入れて錬金すると、新しいレシピが見つかるよ
            </p>
            <button type="button" className="recipe-empty-link-btn" onClick={onClose}>
              閉じる
            </button>
          </div>
        ) : (
          <>
            <div className="recipe-list recipe-list-grid3">
              {paginatedRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  canQuickCraft={recipeAvailability.get(recipe.id)?.canCraft ?? false}
                  quickCraftHint={recipeAvailability.get(recipe.id)?.missingText}
                  onQuickCraft={() => void handleQuickCraft(recipe)}
                  isCrafting={quickCraftingRecipeId === recipe.id}
                />
              ))}
            </div>
            {visibleRecipes.length === 0 && (
              <div className="recipe-empty-state recipe-filter-empty-state">
                <p>{onlyQuickCraftable ? '今パッと作れるレシピはまだないみたい' : 'このカテゴリのレシピはまだないみたい'}</p>
              </div>
            )}
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
