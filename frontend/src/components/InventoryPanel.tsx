import { useMemo, useRef, type ReactNode } from 'react'
import { useGame } from '../contexts/GameContext'
import { ItemCard } from './ItemCard'
import { BASIC_MATERIALS, ITEMS_DB, getSellValue, getItemCategory, ITEM_CATEGORY_LABELS } from '../constants/items'

interface InventoryPanelProps {
  mobileCauldron?: ReactNode
}

export function InventoryPanel({ mobileCauldron }: InventoryPanelProps = {}) {
  const { saveData, setSaveData } = useGame()
  const lastTapRef = useRef<{ key: string; time: number } | null>(null)
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

  const dispatchQuickAddToCauldron = (payload: { instanceId?: string; basicMaterialId?: string }) => {
    window.dispatchEvent(new CustomEvent('alchemy:add-to-cauldron', { detail: payload }))
  }

  const handleDoubleTap = (
    e: React.TouchEvent,
    key: string,
    action: () => void
  ) => {
    const now = Date.now()
    const prev = lastTapRef.current
    if (prev && prev.key === key && now - prev.time < 320) {
      e.preventDefault()
      lastTapRef.current = null
      action()
      return
    }
    lastTapRef.current = { key, time: now }
  }

  return (
    <section className="inventory-section inventory-shelf">
      <h2>📦 素材置き場</h2>
      <p className="inventory-hint">
        <span className="inventory-hint-desktop">ひっぱるかダブルクリックで釜に入ります。</span>
        <span className="inventory-hint-mobile">ひっぱるかダブルタップで釜に入ります。</span>
        <br />
        作ったものは「店に出す」で商品だなへ移せます。
      </p>

      <div className="inventory-basic-section inventory-shelf-row">
        <h3 className="inventory-subtitle">ざいりょうバッグ</h3>
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
                  onDoubleClick={() => dispatchQuickAddToCauldron({ basicMaterialId: id })}
                  onTouchEnd={(e) => handleDoubleTap(e, `basic:${id}`, () => dispatchQuickAddToCauldron({ basicMaterialId: id }))}
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
                  onDoubleClick={() => dispatchQuickAddToCauldron({ instanceId: item.instanceId })}
                  onTouchEnd={(e) => handleDoubleTap(e, `inv:${item.instanceId}`, () => dispatchQuickAddToCauldron({ instanceId: item.instanceId }))}
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
              <p className="empty-message">まだ何も作っていない。<br />釜で2つの素材を錬金してみよう。</p>
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
                      <div
                        onDoubleClick={() => dispatchQuickAddToCauldron({ instanceId: group.firstInstanceId })}
                        onTouchEnd={(e) => handleDoubleTap(e, `group:${group.key}`, () => dispatchQuickAddToCauldron({ instanceId: group.firstInstanceId }))}
                      >
                        <ItemCard item={item} value={getSellValue(item)} draggable />
                      </div>
                      {group.count > 1 && <span className="stack-count-badge">×{group.count}</span>}
                    </div>
                    <button type="button" className="stock-btn" onClick={() => stockOnShelf(group.firstInstanceId)}>
                      店に出す ({ITEM_CATEGORY_LABELS[category]})
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {mobileCauldron && (
        <div className="inventory-mobile-cauldron-slot inventory-shelf-row">
          <div className="inventory-shelf-surface">
            {mobileCauldron}
          </div>
        </div>
      )}
    </section>
  )
}
