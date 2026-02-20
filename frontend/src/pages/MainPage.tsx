import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Header } from '../components/Header'
import { Cauldron } from '../components/Cauldron'
import { InventoryPanel } from '../components/InventoryPanel'
import { MarketPanel } from '../components/MarketPanel'
import { useGame } from '../contexts/GameContext'
import { api } from '../api/client'
import type { Mission, MarketItem } from '../types'

const hasApi = () => !!import.meta.env.VITE_GAS_URL

export function MainPage() {
  const navigate = useNavigate()
  const { hash, search } = useLocation()
  const { saveData, setSaveData, setMissions, setMarketData, setIsLoading, isLoading, setRecipeModalOpen } = useGame()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [marketJustOpened, setMarketJustOpened] = useState(false)
  const [missionsJustLoaded, setMissionsJustLoaded] = useState(false)

  useEffect(() => {
    if (!saveData?.userId) {
      navigate('/')
    }
  }, [navigate, saveData])

  // 工房初回表示時: save だけ読み込み、揃い次第プレイ可能に
  // missions / 市場は別でバックグラウンド取得
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
          if (!merged.userName) merged.userName = prev.userName
          if (!merged.workshopName) merged.workshopName = prev.workshopName
          if (merged.lastLoginDate !== today) {
            const rank = merged.rank ?? 1
            merged.g = (merged.g ?? 0) + 5000 + 5000 * rank
            merged.lastLoginDate = today
          }
          return merged
        })
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [saveData?.userId, setSaveData, setIsLoading])

  // 依頼をバックグラウンドで取得し、揃ったら「依頼が届きました」表示
  useEffect(() => {
    if (!saveData?.userId || !hasApi()) return
    setMissions(null) // 前の情報をクリアして準備中表示にする
    api.missions
      .get(saveData.userId)
      .then((missionsRes) => {
        setMissions((prev: Mission[] | null) => {
          const apiList = (missionsRes.missions || []) as Mission[]
          const prevList = prev || []
          const merged = apiList.map((m) => {
            const prevM = prevList.find((p: Mission) => p.id === m.id)
            if (prevM?.completed) {
              return { ...m, completed: true, description: prevM.description, actualRewardG: prevM.actualRewardG }
            }
            return m
          })
          return [merged, (missionsRes.missionsSource as 'ai' | 'fallback') ?? null]
        })
        setMissionsJustLoaded(true)
      })
      .catch(() => {})
  }, [saveData?.userId, setMissions])

  // 市場データをバックグラウンドで取得し、揃ったら「市場が開きました」表示
  useEffect(() => {
    if (!saveData?.userId || !hasApi()) return
    setMarketData(null) // 前の情報をクリアして準備中表示にする
    api.market
      .get(saveData.userId)
      .then((marketRes) => {
        setMarketData({
          basic: (marketRes.basic || []) as MarketItem[],
          daily: (marketRes.daily || []) as MarketItem[],
          dailySource: marketRes.dailySource,
        })
        setMarketJustOpened(true)
      })
      .catch(() => {})
  }, [saveData?.userId, setMarketData])

  useEffect(() => {
    if (!marketJustOpened) return
    const t = setTimeout(() => setMarketJustOpened(false), 4000)
    return () => clearTimeout(t)
  }, [marketJustOpened])

  useEffect(() => {
    if (!missionsJustLoaded) return
    const t = setTimeout(() => setMissionsJustLoaded(false), 4000)
    return () => clearTimeout(t)
  }, [missionsJustLoaded])

  // オートセーブ: セーブデータ変更時にバックエンドへ保存（既存ユーザー続きプレイ用）
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
  }, [search, hash, navigate, setRecipeModalOpen])

  return (
    <div className="main-layout">
      {isLoading && (
        <div className="loading-overlay">
          <span>工房のデータを読んでいるよ…</span>
        </div>
      )}
      {marketJustOpened && (
        <div className="market-opened-toast" role="status">
          🏪 市場が開きました
        </div>
      )}
      {missionsJustLoaded && (
        <div className="market-opened-toast" role="status">
          ✦ 依頼が届きました
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
          <InventoryPanel />
          <MarketPanel />
          <Cauldron />
        </main>
      </div>
    </div>
  )
}
