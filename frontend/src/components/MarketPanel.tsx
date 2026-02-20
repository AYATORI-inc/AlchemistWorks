import { useState } from 'react'
import { useGame } from '../contexts/GameContext'
import { ITEMS_DB, getSellValue } from '../constants/items'
import { ItemCard } from './ItemCard'
import type { InventoryItem } from '../types'

const hasApi = () => !!import.meta.env.VITE_GAS_URL

export function MarketPanel() {
  const { saveData, marketData, addToInventory, addDiscoveredSvgIcon, removeFromInventory, addG, spendG } = useGame()
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [sellTarget, setSellTarget] = useState<string | null>(null)
  const inventory = saveData?.inventory ?? []
  const g = saveData?.g ?? 0

  const handlePurchase = (
    itemId: string,
    priceOverride?: number,
    dailyMeta?: { name: string; icon: string; flavor?: string; svgPath?: string; svgFill?: string }
  ) => {
    const price = priceOverride ?? 1000
    if (g < price || purchasing) return
    setPurchasing(itemId)
    if (spendG(price)) {
      const meta = ITEMS_DB[itemId]
      const name = dailyMeta?.name ?? meta?.name ?? itemId
      const icon = dailyMeta?.icon ?? meta?.icon ?? '📦'
      const description = dailyMeta?.flavor ?? meta?.flavor
      if (dailyMeta?.svgPath) {
        addDiscoveredSvgIcon(itemId, dailyMeta.svgPath, dailyMeta.svgFill)
      }
      const newItem: InventoryItem = {
        instanceId: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        id: itemId,
        name,
        icon,
        tier: (meta?.tier ?? 0) as 0 | 1 | 2 | 3,
        ...(description && { description }),
      }
      addToInventory(newItem)
    }
    setPurchasing(null)
  }

  const handleSell = (instanceId: string) => {
    const item = inventory.find((i) => i.instanceId === instanceId)
    if (!item || sellTarget) return
    setSellTarget(instanceId)
    const value = getSellValue(item)
    removeFromInventory(instanceId)
    addG(value)
    setSellTarget(null)
  }

  const sellableItems = inventory.filter((i) => {
    const tier = i.tier ?? ITEMS_DB[i.id]?.tier ?? 0
    return tier >= 1 // 生成物のみ売却可能（素材は購入品なので売却しない想定）
  })

  return (
    <section id="market" className="market-panel market-stall sidebar-section">
      <h2>🏪 市場</h2>
      <p className="market-hint">基本素材は工房にいつもあるよ。ここでは日替わりの品や、作ったものを売れる。</p>

      <div className="market-section market-section-compact">
        {hasApi() && (!marketData?.daily || marketData.daily.length === 0) ? (
          <p className="market-loading-only">市場準備中……</p>
        ) : (
          <>
            <h3>今日の日替わり（3種）</h3>
            {marketData?.dailySource === 'fallback' && (
              <p className="daily-fallback-notice">AI生成に失敗しました。既定の品を表示しています。GASのOPENAI_API_KEYを確認してください。</p>
            )}
            {hasApi() && marketData?.daily && marketData.daily.length > 0 ? (
              <div className="market-grid">
                {marketData.daily.map((item: { itemId: string; name: string; icon: string; price: number; flavor?: string; svgPath?: string; svgFill?: string }) => (
                  <div key={item.itemId} className="market-item">
                    <ItemCard
                      item={{ id: item.itemId, name: item.name, icon: item.icon, tier: 0, flavor: item.flavor, svgPath: item.svgPath, svgFill: item.svgFill }}
                      price={item.price}
                    />
                    <button
                      type="button"
                      className="market-buy-btn"
                      disabled={g < item.price || purchasing === item.itemId}
                      onClick={() =>
                        handlePurchase(item.itemId, item.price, {
                          name: item.name,
                          icon: item.icon,
                          flavor: item.flavor,
                          svgPath: item.svgPath,
                          svgFill: item.svgFill,
                        })
                      }
                    >
                      かう
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <span className="placeholder-text">APIをつなぐと出るよ</span>
            )}
          </>
        )}
      </div>

      <div className="market-section">
        <h3>作ったものを売る</h3>
        {sellableItems.length === 0 ? (
          <p className="empty-message">売れるものがまだない。まず釜で作ってみよう。</p>
        ) : (
          <div className="market-sell-grid">
            {sellableItems.map((item) => (
              <div key={item.instanceId} className="market-sell-item">
                <ItemCard item={item} value={getSellValue(item)} />
                <button
                  type="button"
                  className="market-sell-btn"
                  disabled={sellTarget === item.instanceId}
                  onClick={() => handleSell(item.instanceId)}
                >
                  うる
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
