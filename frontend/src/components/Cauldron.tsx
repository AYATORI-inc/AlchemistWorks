import { useEffect, useRef, useState } from 'react'
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

type CauldronQuickAddDetail = {
  instanceId?: string
  basicMaterialId?: string
}

export function Cauldron() {
  const { saveData, addToInventory, removeFromInventory, addRecipe, addDiscoveredSvgIcon } = useGame()
  const [cauldronItems, setCauldronItems] = useState<InventoryItem[]>([])
  const [pace, setPace] = useState<AlchemyPace>('normal')
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [showTips, setShowTips] = useState(false)
  const [productionCount, setProductionCount] = useState(1)
  const sectionRef = useRef<HTMLElement | null>(null)
  const prevCauldronItemCountRef = useRef(0)

  const addItemToCauldron = (payload: CauldronQuickAddDetail) => {
    if (isProcessing) return
    if (cauldronItems.length >= 2) return

    const { instanceId, basicMaterialId } = payload
    if (basicMaterialId && BASIC_MATERIALS.includes(basicMaterialId as typeof BASIC_MATERIALS[number])) {
      const meta = ITEMS_DB[basicMaterialId]
      const virtualItem: InventoryItem = {
        instanceId: `basic_${basicMaterialId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        id: basicMaterialId,
        name: meta?.name ?? basicMaterialId,
        icon: meta?.icon ?? '📦',
        tier: 0,
      }
      setCauldronItems((prev) => (prev.length >= 2 ? prev : [...prev, virtualItem]))
      return
    }

    if (instanceId) {
      const item = saveData?.inventory.find((i) => i.instanceId === instanceId)
      if (item && !item.isDisplayed) {
        setCauldronItems((prev) => (prev.length >= 2 ? prev : [...prev, item]))
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    addItemToCauldron({
      instanceId: e.dataTransfer.getData('instanceId') || undefined,
      basicMaterialId: e.dataTransfer.getData('basicMaterialId') || undefined,
    })
  }

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<CauldronQuickAddDetail>
      if (!customEvent?.detail) return
      addItemToCauldron(customEvent.detail)
    }
    window.addEventListener('alchemy:add-to-cauldron', handler as EventListener)
    return () => window.removeEventListener('alchemy:add-to-cauldron', handler as EventListener)
  }, [addItemToCauldron])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const prevCount = prevCauldronItemCountRef.current
    prevCauldronItemCountRef.current = cauldronItems.length

    if (cauldronItems.length !== 2 || prevCount >= 2) return
    if (!window.matchMedia('(max-width: 900px)').matches) return

    const targetEl = sectionRef.current
    if (!targetEl) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const headerHeight = document.querySelector<HTMLElement>('.header')?.offsetHeight ?? 0
    const top = Math.max(0, window.scrollY + targetEl.getBoundingClientRect().top - headerHeight - 12)

    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }, [cauldronItems.length])

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
      setMessage('釜に材料を2つ入れてから、錬金しようね')
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
              ? `できた！${r.name}を${productionCount}個作成。\n新しいレシピを見つけた！`
              : `できた！${r.name}を${productionCount}個作成。`
          )
        } else {
          setMessage('錬金がうまくいかなかった')
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
            : `できた！回復薬を${productionCount}個作成。\n新しいレシピを見つけた！`
        )
      }
    } catch {
      setMessage('錬金がうまくいかなかった')
    }
    setCauldronItems([])
    setShowTips(false)
    setIsProcessing(false)
  }

  const clearCauldron = () => setCauldronItems([])

  return (
    <section ref={sectionRef} className="cauldron-section">
      <h2>🔥 錬金の釜</h2>
      <div className="cauldron-workbench">
        <div
          className={`cauldron-illustration-wrap cauldron-drop-target ${cauldronItems.length > 0 ? 'has-items' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          aria-label="錬金釜ドロップエリア"
        >
          <img src="/images/Flask.png" alt="" className="cauldron-illustration" />
          <span className="cauldron-drop-target-label">釜に入れる</span>
        </div>
        <div className="cauldron-contents-panel">
          <div className="cauldron-contents-header">
            <p className="cauldron-contents-title">釜の中身</p>
            <button
              className="cauldron-secondary-btn cauldron-empty-btn"
              onClick={clearCauldron}
              type="button"
              disabled={isProcessing || cauldronItems.length === 0}
            >
              取り出す
            </button>
          </div>
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
              </div>
            ) : (
              <span className="placeholder">素材置き場から、素材をひっぱって釜に入れてね</span>
            )}
          </div>
        </div>
      </div>

      <div className="production-controls">
        <span className="production-controls-label">生産個数</span>
        <button
          type="button"
          className="cauldron-step-btn"
          onClick={() => setProductionCount((prev) => Math.max(MIN_PRODUCTION_COUNT, prev - 1))}
          disabled={isProcessing || productionCount <= MIN_PRODUCTION_COUNT}
        >
          -
        </button>
        <strong className="production-count-value">{productionCount}</strong>
        <button
          type="button"
          className="cauldron-step-btn"
          onClick={() => setProductionCount((prev) => Math.min(MAX_PRODUCTION_COUNT, prev + 1))}
          disabled={isProcessing || productionCount >= MAX_PRODUCTION_COUNT}
        >
          +
        </button>
        <button
          type="button"
          className="cauldron-secondary-btn bulk-btn"
          onClick={() => setProductionCount((prev) => Math.max(MIN_PRODUCTION_COUNT, prev - 5))}
          disabled={isProcessing || productionCount <= MIN_PRODUCTION_COUNT}
        >
          -5
        </button>
        <button
          type="button"
          className="cauldron-secondary-btn bulk-btn"
          onClick={() => setProductionCount((prev) => Math.min(MAX_PRODUCTION_COUNT, prev + 5))}
          disabled={isProcessing || productionCount >= MAX_PRODUCTION_COUNT}
        >
          +5
        </button>
        <button
          type="button"
          className="cauldron-secondary-btn count-reset-btn"
          onClick={() => setProductionCount(MIN_PRODUCTION_COUNT)}
          disabled={isProcessing || productionCount === MIN_PRODUCTION_COUNT}
        >
          個数クリア
        </button>
      </div>

      <div className="pace-selector" aria-label="錬金ペース">
        <span className="production-controls-label">錬金ペース</span>
        {PACE_OPTIONS.map((opt) => (
          <label key={opt.value} className={`pace-option ${pace === opt.value ? 'is-selected' : ''}`}>
            <input
              type="radio"
              name="pace"
              value={opt.value}
              checked={pace === opt.value}
              onChange={() => setPace(opt.value)}
              disabled={isProcessing}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>

      <button
        className="mix-btn"
        onClick={handleMix}
        disabled={isProcessing || cauldronItems.length !== 2}
      >
        錬金する
      </button>
      {message && <p className="message-area">{message}</p>}
    </section>
  )
}
