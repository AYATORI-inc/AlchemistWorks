import { useState } from 'react'
import { useGame } from '../contexts/GameContext'
import { ItemCard } from './ItemCard'
import { TipsDisplay } from './TipsDisplay'
import { api } from '../api/client'
import type { InventoryItem, AlchemyPace } from '../types'
import { TIPS } from '../constants/tips'
import { ITEMS_DB, BASIC_MATERIALS } from '../constants/items'

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

export function Cauldron() {
  const { saveData, addToInventory, removeFromInventory, addRecipe, addDiscoveredSvgIcon } = useGame()
  const [cauldronItems, setCauldronItems] = useState<InventoryItem[]>([])
  const [pace, setPace] = useState<AlchemyPace>('normal')
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [showTips, setShowTips] = useState(false)

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
      if (item) setCauldronItems((prev) => [...prev, item])
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
    let succeeded = false

    try {
      if (hasApi()) {
        const knownRecipes = (saveData?.recipes ?? []).map((r) => ({
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
        ) as { success?: boolean; result?: { id: string; name: string; icon: string; description?: string; quality?: string; value?: number; tier?: number; isNewRecipe?: boolean; svgPath?: string; svgFill?: string }; error?: string }
        const r = res.result
        if ('error' in res && res.error) {
          setMessage(res.error)
        } else if (res.success && r) {
          const newItem: InventoryItem = {
            instanceId: `inst-${Date.now()}`,
            id: r.id,
            name: r.name,
            icon: r.icon,
            tier: (r.tier ?? 1) as 0 | 1 | 2 | 3,
            quality: (r.quality as InventoryItem['quality']) ?? 'normal',
            value: r.value ?? 1000,
            description: r.description,
          }
          addToInventory(newItem)
          if (r.svgPath) {
            addDiscoveredSvgIcon(r.id, r.svgPath, r.svgFill)
          }
          if (r.isNewRecipe) {
            const [a, b] = [cauldronItems[0].id, cauldronItems[1].id].sort()
            const ingA = cauldronItems.find((i) => i.id === a)
            const ingB = cauldronItems.find((i) => i.id === b)
            addRecipe({
              id: `${a}_${b}`,
              ingredients: [a, b],
              result: r.id,
              discovered: true,
              discoveredAt: new Date().toISOString(),
              useCount: 1,
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
            })
            setMessage(`できた！${r.name}ができた！ 新しいレシピを見つけた！`)
          } else {
            setMessage(`できた！${r.name}ができた！`)
          }
          succeeded = true
        } else {
          setMessage('調合がうまくいかなかった')
        }
      } else {
        const duration = TIPS_DURATION[pace]
        await new Promise((r) => setTimeout(r, duration))
        const mockResult: InventoryItem = {
          instanceId: `mock-${Date.now()}`,
          id: 'potion',
          name: '回復薬',
          icon: '🍷',
          tier: 1,
          quality: 'normal',
          value: 1500,
        }
        addToInventory(mockResult)
        const [a, b] = [cauldronItems[0].id, cauldronItems[1].id].sort()
        const ingA = cauldronItems.find((i) => i.id === a)
        const ingB = cauldronItems.find((i) => i.id === b)
        addRecipe({
          id: `${a}_${b}`,
          ingredients: [a, b],
          result: 'potion',
          discovered: true,
          discoveredAt: new Date().toISOString(),
          useCount: 1,
          resultName: '回復薬',
          resultIcon: '🍷',
          resultFlavor: ITEMS_DB.potion?.flavor,
          ingredientNames: [ingA?.name ?? a, ingB?.name ?? b],
          ingredientFlavors: [ITEMS_DB[a]?.flavor, ITEMS_DB[b]?.flavor],
          pace,
        })
          setMessage('できた！回復薬ができた！ 新しいレシピを見つけた！')
        succeeded = true
      }
    } catch {
      setMessage('調合がうまくいかなかった')
    }
    if (succeeded) {
      cauldronItems.forEach((i) => {
        if (!i.instanceId.startsWith('basic_')) {
          removeFromInventory(i.instanceId)
        }
      })
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
          <span className="placeholder">上のストックからひっぱって、ここに入れてね</span>
        )}
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
