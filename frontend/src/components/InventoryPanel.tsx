import { useGame } from '../contexts/GameContext'
import { ItemCard } from './ItemCard'
import { BASIC_MATERIALS, ITEMS_DB, getSellValue } from '../constants/items'

export function InventoryPanel() {
  const { saveData } = useGame()
  const inventory = saveData?.inventory ?? []
  const generatedItems = inventory.filter((i) => {
    const tier = i.tier ?? ITEMS_DB[i.id]?.tier ?? 0
    return tier >= 1
  })
  // 購入した素材（tier 0）も合成に使えるようストックに表示
  const purchasedMaterials = inventory.filter((i) => {
    const tier = i.tier ?? ITEMS_DB[i.id]?.tier ?? 0
    return tier === 0
  })

  const handleDragStartInventory = (e: React.DragEvent, instanceId: string) => {
    e.dataTransfer.setData('instanceId', instanceId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragStartBasic = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('basicMaterialId', itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <section className="inventory-section inventory-shelf">
      <h2>📦 素材置き場</h2>
      <p className="inventory-hint">ひっぱって釜に入れて使おう。基本素材はいつでも使えるよ。</p>

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
            generatedItems.map((item) => (
              <div
                key={item.instanceId}
                className="inventory-item-wrapper"
                draggable
                onDragStart={(e) => handleDragStartInventory(e, item.instanceId)}
              >
                <ItemCard item={item} value={getSellValue(item)} draggable />
              </div>
            ))
          )}
        </div>
        </div>
      </div>
    </section>
  )
}
