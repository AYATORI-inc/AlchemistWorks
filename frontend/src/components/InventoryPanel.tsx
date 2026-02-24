import { useMemo } from 'react'
import { useGame } from '../contexts/GameContext'
import { ItemCard } from './ItemCard'
import { BASIC_MATERIALS, ITEMS_DB, getSellValue, getItemCategory, ITEM_CATEGORY_LABELS } from '../constants/items'

export function InventoryPanel() {
  const { saveData, setSaveData } = useGame()
  const inventory = saveData?.inventory ?? []
  const generatedItems = inventory.filter((i) => {
    const tier = i.tier ?? ITEMS_DB[i.id]?.tier ?? 0
    return tier >= 1 && !i.isDisplayed
  })
  const groupedGeneratedItems = useMemo(() => {
    const grouped = new Map<string, { key: string; count: number; firstInstanceId: string; representative: typeof generatedItems[number] }>()
    for (const item of generatedItems) {
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
  }, [generatedItems])
  const purchasedMaterials = inventory.filter((i) => {
    const tier = i.tier ?? ITEMS_DB[i.id]?.tier ?? 0
    return tier === 0 && !i.isDisplayed
  })

  const handleDragStartInventory = (e: React.DragEvent, instanceId: string) => {
    e.dataTransfer.setData('instanceId', instanceId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragStartBasic = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('basicMaterialId', itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const stockOnShelf = (instanceId: string) => {
    setSaveData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        inventory: prev.inventory.map((item) =>
          item.instanceId === instanceId ? { ...item, isDisplayed: true } : item
        ),
      }
    })
  }

  return (
    <section className="inventory-section inventory-shelf">
      <h2>📦 素材置き場</h2>
      <p className="inventory-hint">ひっぱって釜に入れて使おう。作ったものは「陳列」で販売棚へ移せる。</p>

      <div className="inventory-basic-section inventory-shelf-row">
        <h3 className="inventory-subtitle">基本素材</h3>
        <div className="inventory-shelf-surface">
          <div className="inventory-grid">
            {BASIC_MATERIALS.map((id) => {
              const meta = ITEMS_DB[id]
              return (
                <div
                  key={id}
                  className="inventory-item-wrapper"
                  draggable
                  onDragStart={(e) => handleDragStartBasic(e, id)}
                >
                  <ItemCard item={{ id, name: meta?.name ?? id, icon: meta?.icon ?? '📦', tier: 0, flavor: meta?.flavor }} draggable />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {purchasedMaterials.length > 0 && (
        <div className="inventory-purchased-section inventory-shelf-row">
          <h3 className="inventory-subtitle">購入した素材</h3>
          <div className="inventory-shelf-surface">
            <div className="inventory-grid">
              {purchasedMaterials.map((item) => (
                <div
                  key={item.instanceId}
                  className="inventory-item-wrapper"
                  draggable
                  onDragStart={(e) => handleDragStartInventory(e, item.instanceId)}
                >
                  <ItemCard item={item} draggable />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="inventory-generated-section inventory-shelf-row">
        <h3 className="inventory-subtitle">作ったもの</h3>
        <div className="inventory-shelf-surface">
          <div className="inventory-grid">
            {generatedItems.length === 0 ? (
              <p className="empty-message">まだ何も作っていない。釜で2つの素材を合わせて作ってみよう。</p>
            ) : (
              groupedGeneratedItems.map((group) => {
                const item = group.representative
                const category = item.category ?? getItemCategory(item.id)
                return (
                  <div
                    key={group.key}
                    className="inventory-item-wrapper inventory-generated-card"
                    draggable
                    onDragStart={(e) => handleDragStartInventory(e, group.firstInstanceId)}
                  >
                    <div className="stacked-item-card">
                      <ItemCard item={item} value={getSellValue(item)} draggable />
                      {group.count > 1 && <span className="stack-count-badge">×{group.count}</span>}
                    </div>
                    <button type="button" className="stock-btn" onClick={() => stockOnShelf(group.firstInstanceId)}>
                      陳列 ({ITEM_CATEGORY_LABELS[category]})
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
