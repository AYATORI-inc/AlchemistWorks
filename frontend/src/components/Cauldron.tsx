import { useState } from 'react'
import { useGame } from '../contexts/GameContext'
import { ItemCard } from './ItemCard'
import { TipsDisplay } from './TipsDisplay'
import { api } from '../api/client'
import type { InventoryItem, AlchemyPace } from '../types'
import { TIPS } from '../constants/tips'
import { ITEMS_DB, BASIC_MATERIALS, resolveItemCategory } from '../constants/items'

const hasApi = () => !!import.meta.env.VITE_GAS_URL

const PACE_OPTIONS: { value: AlchemyPace; label: string }[] = [
  { value: 'fast', label: '素早く' },
  { value: 'normal', label: '普通' },
  { value: 'slow', label: 'ゆっくり' },
]

const TIPS_DURATION: Record<AlchemyPace, number> = {
  fast: 1500,
  normal: 2500,
  slow: 4000,
}

const MIN_PRODUCTION_COUNT = 1
const MAX_PRODUCTION_COUNT = 20

const isGeneratedProduct = (item: InventoryItem) => {
  const tier = item.tier ?? ITEMS_DB[item.id]?.tier ?? 0
  return tier >= 1
}

export function Cauldron() {
  const { saveData, addToInventory, removeFromInventory, addRecipe, addDiscoveredSvgIcon } = useGame()
  const [cauldronItems, setCauldronItems] = useState<InventoryItem[]>([])
  const [pace, setPace] = useState<AlchemyPace>('normal')
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [showTips, setShowTips] = useState(false)
  const [productionCount, setProductionCount] = useState(1)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (cauldronItems.length >= 2) return
    const instanceId = e.dataTransfer.getData('instanceId')
    const basicMaterialId = e.dataTransfer.getData('basicMaterialId')
    if (basicMaterialId && BASIC_MATERIALS.includes(basicMaterialId as typeof BASIC_MATERIALS[number])) {
      const meta = ITEMS_DB[basicMaterialId]
      const virtualItem: InventoryItem = {
        instanceId: `basic_${basicMaterialId}`,
        id: basicMaterialId,
        name: meta?.name ?? basicMaterialId,
        icon: meta?.icon ?? '📦',
        tier: 0,
      }
      setCauldronItems((prev) => [...prev, virtualItem])
    } else if (instanceId) {
      const item = saveData?.inventory.find((i) => i.instanceId === instanceId)
      if (item && !item.isDisplayed) setCauldronItems((prev) => [...prev, item])
    }
  }

  const produceItems = (base: Omit<InventoryItem, 'instanceId'>, count: number) => {
    for (let i = 0; i < count; i += 1) {
      addToInventory({
        ...base,
        instanceId: `inst-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      })
    }
  }

  const handleMix = async () => {
    if (cauldronItems.length !== 2 || !saveData?.userId) {
      setMessage('釜に材料を2つ入れてから、調合しようね')
      return
    }
    setIsProcessing(true)
    setShowTips(true)
    setMessage('')

    try {
      const [a, b] = [cauldronItems[0].id, cauldronItems[1].id].sort()
      const recipeId = `${a}_${b}`
      const ingA = cauldronItems.find((i) => i.id === a)
      const ingB = cauldronItems.find((i) => i.id === b)
      const hadRecipeBefore = (saveData?.recipes ?? []).some((r) => r.id === recipeId)
      const inventory = saveData.inventory ?? []
      const requiredByItemId: Record<string, number> = {}
      cauldronItems.forEach((item) => {
        if (item.instanceId.startsWith('basic_')) return
        const required = isGeneratedProduct(item) ? productionCount : 1
        requiredByItemId[item.id] = (requiredByItemId[item.id] ?? 0) + required
      })

      const instanceIdsToConsume: string[] = []
      for (const [itemId, requiredCount] of Object.entries(requiredByItemId)) {
        const available = inventory.filter((i) => i.id === itemId && !i.isDisplayed)
        if (available.length < requiredCount) {
          const itemName =
            cauldronItems.find((i) => i.id === itemId)?.name ??
            ITEMS_DB[itemId]?.name ??
            itemId
          window.alert(`素材が不足しています: ${itemName} が ${requiredCount} 個必要です（所持 ${available.length} 個）`)
          setMessage('素材が足りません')
          setShowTips(false)
          setIsProcessing(false)
          return
        }
        instanceIdsToConsume.push(...available.slice(0, requiredCount).map((i) => i.instanceId))
      }

      instanceIdsToConsume.forEach((instanceId) => {
        removeFromInventory(instanceId)
      })

      if (hasApi()) {
        const knownRecipes = (saveData?.recipes ?? []).map((r) => ({
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
            { id: cauldronItems[0].id, name: cauldronItems[0].name },
            { id: cauldronItems[1].id, name: cauldronItems[1].name },
          ],
          pace,
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
        if ('error' in res && res.error) {
          setMessage(res.error)
        } else if (res.success && r) {
          const resolvedCategory = resolveItemCategory({
            id: r.id,
            name: r.name,
            description: r.description,
            category: r.category,
            ingredientIds: [cauldronItems[0].id, cauldronItems[1].id],
          })
          produceItems(
            {
              id: r.id,
              name: r.name,
              icon: r.icon,
              tier: (r.tier ?? 1) as 0 | 1 | 2 | 3,
              quality: (r.quality as InventoryItem['quality']) ?? 'normal',
              value: r.value ?? 1000,
              description: r.description,
              category: resolvedCategory,
            },
            productionCount
          )
          if (r.svgPath) {
            addDiscoveredSvgIcon(r.id, r.svgPath, r.svgFill)
          }
          addRecipe({
            id: recipeId,
            ingredients: [a, b],
            result: r.id,
            discovered: true,
            discoveredAt: new Date().toISOString(),
            useCount: productionCount,
            resultName: r.name,
            resultIcon: r.icon,
            resultFlavor: r.description,
            ingredientNames: [ingA?.name ?? a, ingB?.name ?? b],
            ingredientFlavors: [
              ingA?.description ?? ITEMS_DB[a]?.flavor,
              ingB?.description ?? ITEMS_DB[b]?.flavor,
            ],
            pace,
            resultValue: r.value,
            resultTier: r.tier,
            resultQuality: r.quality,
            resultCategory: resolvedCategory,
          })
          const isNewRecipe = !hadRecipeBefore && !!r.isNewRecipe
          setMessage(
            isNewRecipe
              ? `できた！${r.name}を${productionCount}個作成。新しいレシピを見つけた！`
              : `できた！${r.name}を${productionCount}個作成。`
          )
        } else {
          setMessage('調合がうまくいかなかった')
        }
      } else {
        const duration = TIPS_DURATION[pace]
        await new Promise((r) => setTimeout(r, duration))
        produceItems(
          {
            id: 'potion',
            name: '回復薬',
            icon: '🍷',
            tier: 1,
            quality: 'normal',
            value: 1500,
          },
          productionCount
        )
        addRecipe({
          id: recipeId,
          ingredients: [a, b],
          result: 'potion',
          discovered: true,
          discoveredAt: new Date().toISOString(),
          useCount: productionCount,
          resultName: '回復薬',
          resultIcon: '🍷',
          resultFlavor: ITEMS_DB.potion?.flavor,
          ingredientNames: [ingA?.name ?? a, ingB?.name ?? b],
          ingredientFlavors: [ITEMS_DB[a]?.flavor, ITEMS_DB[b]?.flavor],
          pace,
        })
        setMessage(
          hadRecipeBefore
            ? `できた！回復薬を${productionCount}個作成。`
            : `できた！回復薬を${productionCount}個作成。新しいレシピを見つけた！`
        )
      }
    } catch {
      setMessage('調合がうまくいかなかった')
    }
    setCauldronItems([])
    setShowTips(false)
    setIsProcessing(false)
  }

  const clearCauldron = () => setCauldronItems([])

  return (
    <section className="cauldron-section">
      <h2>🔥 調合の釜</h2>
      <div
        className={`cauldron-dropzone ${cauldronItems.length > 0 ? 'has-items' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {isProcessing && showTips ? (
          <TipsDisplay duration={TIPS_DURATION[pace]} tips={TIPS} />
        ) : cauldronItems.length > 0 ? (
          <div className="cauldron-items">
            {cauldronItems.map((item) => (
              <ItemCard key={item.instanceId} item={item} />
            ))}
            <button className="clear-btn" onClick={clearCauldron} type="button">
              取り出す
            </button>
          </div>
        ) : (
          <span className="placeholder">素材置き場からひっぱって、ここに入れてね</span>
        )}
      </div>

      <div className="production-controls">
        <span>生産個数</span>
        <button
          type="button"
          onClick={() => setProductionCount((prev) => Math.max(MIN_PRODUCTION_COUNT, prev - 1))}
          disabled={isProcessing || productionCount <= MIN_PRODUCTION_COUNT}
        >
          -
        </button>
        <strong>{productionCount}</strong>
        <button
          type="button"
          onClick={() => setProductionCount((prev) => Math.min(MAX_PRODUCTION_COUNT, prev + 1))}
          disabled={isProcessing || productionCount >= MAX_PRODUCTION_COUNT}
        >
          +
        </button>
        <button
          type="button"
          className="bulk-btn"
          onClick={() => setProductionCount(10)}
          disabled={isProcessing}
        >
          大量生産(10)
        </button>
      </div>

      <div className="pace-selector">
        {PACE_OPTIONS.map((opt) => (
          <label key={opt.value}>
            <input
              type="radio"
              name="pace"
              value={opt.value}
              checked={pace === opt.value}
              onChange={() => setPace(opt.value)}
              disabled={isProcessing}
            />
            {opt.label}
          </label>
        ))}
      </div>

      <button
        className="mix-btn"
        onClick={handleMix}
        disabled={isProcessing || cauldronItems.length !== 2}
      >
        調合する
      </button>
      {message && <p className="message-area">{message}</p>}
    </section>
  )
}
