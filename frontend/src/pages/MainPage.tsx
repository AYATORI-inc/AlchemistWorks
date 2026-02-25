import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Header } from '../components/Header'
import { Cauldron } from '../components/Cauldron'
import { InventoryPanel } from '../components/InventoryPanel'
import { DisplayShelfPanel } from '../components/DisplayShelfPanel'
import { CustomerQueuePanel } from '../components/CustomerQueuePanel'
import { PipetCharacter } from '../components/PipetCharacter'
import { useGame } from '../contexts/GameContext'
import { api } from '../api/client'
import { resolveItemCategory } from '../constants/items'

const hasApi = () => !!import.meta.env.VITE_GAS_URL

export function MainPage() {
  const navigate = useNavigate()
  const { hash, search } = useLocation()
  const { saveData, setSaveData, setIsLoading, isLoading, setRecipeModalOpen, setAchievementModalOpen } = useGame()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [initialWorkshopLoadDone, setInitialWorkshopLoadDone] = useState(!hasApi())
  const [isShopOpen, setIsShopOpen] = useState(false)
  const [isMobileLayout, setIsMobileLayout] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 900px)').matches
  })

  useEffect(() => {
    if (!saveData?.userId) {
      navigate('/')
    }
  }, [navigate, saveData])

  useEffect(() => {
    if (!saveData?.userId || !hasApi()) return
    setIsLoading(true)
    api.save
      .get(saveData.userId)
      .then((saveRes) => {
        const d = saveRes.data as Partial<typeof saveData>
        const today = new Date().toISOString().slice(0, 10)
        setSaveData((prev) => {
          if (!prev) return null
          const merged = { ...prev, ...d }
          merged.inventory = (merged.inventory ?? []).map((item) => ({
            ...item,
            category: resolveItemCategory({
              id: item.id,
              name: item.name,
              description: item.description,
              category: item.category,
            }),
          }))
          merged.recipes = (merged.recipes ?? []).map((recipe) => ({
            ...recipe,
            resultCategory: recipe.resultCategory ?? resolveItemCategory({
              id: recipe.result,
              name: recipe.resultName,
              description: recipe.resultFlavor,
              ingredientIds: recipe.ingredients,
            }),
          }))
          if (!merged.userName) merged.userName = prev.userName
          if (!merged.workshopName) merged.workshopName = prev.workshopName
          const ledger = merged.dailySalesLedger
          merged.dailySalesLedger = ledger && ledger.date === today
            ? ledger
            : { date: today, totalG: 0, entries: [] }
          merged.lastLoginDate = today
          return merged
        })
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false)
        setInitialWorkshopLoadDone(true)
      })
  }, [saveData?.userId, setSaveData, setIsLoading])

  useEffect(() => {
    if (!saveData?.userId || !hasApi()) return
    setSaveError(null)
    const timer = setTimeout(() => {
      api.save.post(saveData.userId, saveData)
        .then((res: { ok?: boolean; error?: string }) => {
          if (res?.error) {
            setSaveError(res.error)
          } else {
            setSaveError(null)
          }
        })
        .catch((err: { error?: string; message?: string }) => {
          const msg = (typeof err === 'object' && (err?.error ?? err?.message)) || 'セーブに失敗しました'
          setSaveError(String(msg))
        })
    }, 1500)
    return () => clearTimeout(timer)
  }, [saveData])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(max-width: 900px)')
    const update = () => setIsMobileLayout(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const id = hash.slice(1)
    if (id) {
      const el = document.getElementById(id)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [hash])

  useEffect(() => {
    if (search.includes('open=recipes')) {
      setRecipeModalOpen(true)
      navigate('/game' + hash, { replace: true })
    }
    if (search.includes('open=achievements')) {
      setAchievementModalOpen(true)
      navigate('/game' + hash, { replace: true })
    }
  }, [search, hash, navigate, setRecipeModalOpen, setAchievementModalOpen])

  const showPipetWorkshopLoading = isLoading && !initialWorkshopLoadDone

  return (
    <div className="main-layout">
      {showPipetWorkshopLoading && (
        <div className="loading-overlay pipet-loading-overlay" role="status" aria-live="polite">
          <PipetCharacter
            className="pipet-loading-card"
            imageClassName="pipet-loading-image"
            bubbleClassName="pipet-loading-bubble"
            message={`${saveData?.workshopName || '工房'}の準備をしています、少しお待ちください`}
            subMessage="棚とお客様の案内を整えています…"
          />
        </div>
      )}
      {saveError && (
        <div className="save-error-banner" role="alert">
          ⚠️ {saveError}
        </div>
      )}
      <Header />
      <div className="game-wrapper">
        <main className="main-content">
          <InventoryPanel mobileCauldron={isMobileLayout ? <Cauldron /> : null} />
          <section className="shop-interior-panel" aria-label="お店の中と商品棚">
            <div className="shop-interior-decor" aria-hidden>
              <span className="shop-decor-lantern left">🏮</span>
              <span className={`shop-decor-sign ${isShopOpen ? 'is-open' : 'is-closed'}`}>
                {isShopOpen ? 'OPEN' : 'CLOSED'}
              </span>
              <span className="shop-decor-lantern right">🏮</span>
            </div>
            <div className="shop-interior-window" aria-hidden />
            <div className="shop-interior-counterline" aria-hidden />
            <div className="shop-interior-grid">
              <CustomerQueuePanel embedded onShopOpenChange={setIsShopOpen} />
              {!isMobileLayout && <Cauldron />}
              <DisplayShelfPanel embedded />
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
