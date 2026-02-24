import { useMemo } from 'react'
import { useGame } from '../contexts/GameContext'
import type { ItemCategory } from '../types'
import { ItemCard } from './ItemCard'
import { getItemCategory, ITEM_CATEGORY_LABELS } from '../constants/items'

const CATEGORY_ORDER: ItemCategory[] = ['food', 'weapon', 'medicine', 'gem']

export function DisplayShelfPanel() {
  const { saveData, setSaveData } = useGame()
  const displayedItems = (saveData?.inventory ?? []).filter((item) => item.isDisplayed)
  const groupedDisplayedItems = useMemo(() => {
    const grouped = new Map<string, { key: string; count: number; firstInstanceId: string; representative: typeof displayedItems[number] }>()
    for (const item of displayedItems) {
      const key = item.name || item.id
      const current = grouped.get(key)
      if (current) {
        current.count += 1
      } else {
        grouped.set(key, {
          key,
          count: 1,
          firstInstanceId: item.instanceId,
          representative: item,
        })
      }
    }
    return Array.from(grouped.values())
  }, [displayedItems])

  const counts = useMemo(() => {
    const initial: Record<ItemCategory, number> = {
      food: 0,
      weapon: 0,
      medicine: 0,
      gem: 0,
    }
    for (const item of displayedItems) {
      const category = item.category ?? getItemCategory(item.id)
      initial[category] += 1
    }
    return initial
  }, [displayedItems])

  const returnToInventory = (instanceId: string) => {
    setSaveData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        inventory: prev.inventory.map((item) =>
          item.instanceId === instanceId ? { ...item, isDisplayed: false } : item
        ),
      }
    })
  }

  return (
    <section className="display-shelf-panel sidebar-section">
      <h2>🛍️ 商品だな</h2>
      <p className="market-hint">お客さんには欲しいものがあって、それがないと帰ってしまいます。</p>

      <div className="shelf-category-stats">
        {CATEGORY_ORDER.map((category) => (
          <span key={category} className={`category-chip category-${category}`}>
            {ITEM_CATEGORY_LABELS[category]}: {counts[category]}個
          </span>
        ))}
      </div>

      {displayedItems.length === 0 ? (
        <p className="empty-message">商品だなは空です。作ったものを並べてみましょう。</p>
      ) : (
        <div className="market-sell-grid">
          {groupedDisplayedItems.map((group) => (
            <div key={group.key} className="market-sell-item">
              <div className="stacked-item-card">
                <ItemCard item={group.representative} value={group.representative.value} />
                {group.count > 1 && <span className="stack-count-badge">×{group.count}</span>}
              </div>
              <button type="button" className="market-sell-btn" onClick={() => returnToInventory(group.firstInstanceId)}>
                もどす
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
