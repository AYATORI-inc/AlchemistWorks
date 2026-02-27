import { useMemo } from 'react'
import { useGame } from '../contexts/GameContext'
import type { ItemCategory } from '../types'
import { ItemCard } from './ItemCard'
import { getItemCategory, ITEM_CATEGORY_LABELS, ITEMS_DB } from '../constants/items'

const CATEGORY_ORDER: ItemCategory[] = ['food', 'weapon', 'medicine', 'gem']

interface DisplayShelfPanelProps {
  embedded?: boolean
}

export function DisplayShelfPanel({ embedded = false }: DisplayShelfPanelProps = {}) {
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

  const handleDropToShelf = (e: React.DragEvent) => {
    e.preventDefault()
    const instanceId = e.dataTransfer.getData('instanceId')
    if (!instanceId) return
    setSaveData((prev) => {
      if (!prev) return prev
      const target = prev.inventory.find((item) => item.instanceId === instanceId)
      if (!target || target.isDisplayed) return prev
      const tier = target.tier ?? ITEMS_DB[target.id]?.tier ?? 0
      if (tier < 1) return prev
      return {
        ...prev,
        inventory: prev.inventory.map((item) =>
          item.instanceId === instanceId ? { ...item, isDisplayed: true } : item
        ),
      }
    })
  }

  return (
    <section className={`display-shelf-panel sidebar-section ${embedded ? 'embedded-shop-block' : ''}`.trim()}>
      <div className="display-shelf-signboard" aria-hidden>
        <span className="display-shelf-signboard-icon">🛍️</span>
        <span className="display-shelf-signboard-text">商品だな</span>
        <span className="display-shelf-signboard-pin left">●</span>
        <span className="display-shelf-signboard-pin right">●</span>
      </div>
      <p className="market-hint">「作ったもの」からここに商品をうごかしてください。<br />お客さんには欲しいものがあって、それがないと帰ってしまいます。</p>
      <div className="display-shelf-rack">
        <div className="display-shelf-rack-post left" aria-hidden />
        <div className="display-shelf-rack-post right" aria-hidden />
        <div className="display-shelf-rack-trim top" aria-hidden />
        <div className="display-shelf-rack-trim middle" aria-hidden />
        <div className="display-shelf-rack-trim bottom" aria-hidden />

        <div
          className="display-shelf-rack-content"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropToShelf}
        >
          <div className="shelf-category-stats">
            {CATEGORY_ORDER.map((category) => (
              <span key={category} className={`category-chip category-${category}`}>
                {ITEM_CATEGORY_LABELS[category]}: {counts[category]}個
              </span>
            ))}
          </div>

          {displayedItems.length === 0 ? (
            <p className="empty-message display-shelf-empty">商品だなは空です。作ったものを並べてみましょう。</p>
          ) : (
            <div className="market-sell-grid display-shelf-grid">
              {groupedDisplayedItems.map((group) => (
                <div key={group.key} className="market-sell-item display-shelf-slot">
                  <div className="display-shelf-price-strip" aria-hidden />
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
        </div>
      </div>
    </section>
  )
}
