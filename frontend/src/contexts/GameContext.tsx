import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import type { SaveData, InventoryItem, Mission, MarketItem, Recipe, SalesLogEntry, ItemCategory } from '../types'
import { formatTierTextForUi, RANK_TITLES, syncAchievementsAndRank } from '../constants/achievements'

export interface AchievementToast {
  id: string
  kind: 'achievement' | 'rank'
  title: string
  message: string
}

interface GameState {
  saveData: SaveData | null
  missions: Mission[] | null
  missionsSource: 'ai' | 'fallback' | null
  marketData: { basic: MarketItem[]; daily: MarketItem[]; dailySource?: 'ai' | 'fallback' } | null
  isLoading: boolean
  isDeliveringMission: boolean
  recipeModalOpen: boolean
  missionModalOpen: boolean
  achievementModalOpen: boolean
  achievementToasts: AchievementToast[]
}

interface GameContextValue extends GameState {
  setSaveData: React.Dispatch<React.SetStateAction<SaveData | null>>
  setMissions: (
    arg: Mission[] | null | ((prev: Mission[] | null) => [Mission[] | null, 'ai' | 'fallback' | null]),
    source?: 'ai' | 'fallback'
  ) => void
  setMarketData: (data: { basic: MarketItem[]; daily: MarketItem[]; dailySource?: 'ai' | 'fallback' } | null) => void
  setIsLoading: (loading: boolean) => void
  setDeliveringMission: (delivering: boolean) => void
  setRecipeModalOpen: (open: boolean) => void
  setMissionModalOpen: (open: boolean) => void
  setAchievementModalOpen: (open: boolean) => void
  dismissAchievementToast: (id: string) => void
  addToInventory: (item: InventoryItem) => void
  removeFromInventory: (instanceId: string) => void
  addRecipe: (recipe: Recipe) => void
  addG: (amount: number) => void
  spendG: (amount: number) => boolean
  addDiscoveredSvgIcon: (itemId: string, path: string, fill?: string) => void
  addDiscoveredItemName: (itemId: string, name: string) => void
  addSalesLog: (payload: { category: ItemCategory; amountG: number; note: string }) => void
  addMissionCompletion: () => void
}

const todayStr = () => new Date().toISOString().slice(0, 10)

const defaultSaveData: SaveData = {
  userId: '',
  userName: '',
  workshopName: '',
  g: 0,
  totalSalesG: 0,
  totalSalesCount: 0,
  inventory: [],
  recipes: [],
  achievements: [],
  rank: 1,
  lastLoginDate: todayStr(),
  alchemyCount: 0,
  missionCompletedCount: 0,
  dailySalesLedger: { date: todayStr(), totalG: 0, entries: [] },
  discoveredSvgIcons: {},
  discoveredItemNames: {},
  recipeBookLastSeenAt: undefined,
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [saveData, setSaveData] = useState<SaveData | null>(null)
  const [missions, setMissionsState] = useState<Mission[] | null>(null)
  const [missionsSource, setMissionsSource] = useState<'ai' | 'fallback' | null>(null)
  const [marketData, setMarketData] = useState<{ basic: MarketItem[]; daily: MarketItem[]; dailySource?: 'ai' | 'fallback' } | null>(null)
  const [recipeModalOpen, setRecipeModalOpen] = useState(false)
  const [missionModalOpen, setMissionModalOpen] = useState(false)
  const [achievementModalOpen, setAchievementModalOpen] = useState(false)
  const [achievementToasts, setAchievementToasts] = useState<AchievementToast[]>([])
  const [isDeliveringMission, setIsDeliveringMission] = useState(false)
  const achievementSyncInitializedUserIdsRef = useRef<Set<string>>(new Set())

  const setMissions = useCallback(
    (arg: Mission[] | null | ((prev: Mission[] | null) => [Mission[] | null, 'ai' | 'fallback' | null]), source?: 'ai' | 'fallback') => {
      if (typeof arg === 'function') {
        setMissionsState((prev) => {
          const [next, src] = arg(prev)
          setMissionsSource(src ?? null)
          return next
        })
      } else {
        setMissionsState(arg)
        setMissionsSource(source ?? null)
      }
    },
    []
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!saveData) return
    const userId = saveData.userId || '__anonymous__'
    const isFirstAchievementSyncForUser = !achievementSyncInitializedUserIdsRef.current.has(userId)
    if (isFirstAchievementSyncForUser) {
      achievementSyncInitializedUserIdsRef.current.add(userId)
    }

    const synced = syncAchievementsAndRank(saveData)
    if (synced === saveData) return

    const prevUnlockedIds = new Set((saveData.achievements ?? []).filter((a) => a.unlocked).map((a) => a.id))
    const newlyUnlocked = (synced.achievements ?? []).filter((a) => a.unlocked && !prevUnlockedIds.has(a.id))
    const prevRank = saveData.rank ?? 1
    const nextRank = synced.rank ?? 1

    if (!isFirstAchievementSyncForUser && (newlyUnlocked.length > 0 || nextRank > prevRank)) {
      const nextToasts: AchievementToast[] = [
        ...newlyUnlocked.map((achievement) => ({
          id: `achv-${achievement.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          kind: 'achievement' as const,
          title: '実績を解放！',
          message: formatTierTextForUi(achievement.name),
        })),
        ...(nextRank > prevRank
          ? [{
              id: `rank-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              kind: 'rank' as const,
              title: '称号アップ！',
              message: RANK_TITLES[nextRank] ?? `ランク ${nextRank}`,
            }]
          : []),
      ]
      setAchievementToasts((prev) => [...prev, ...nextToasts].slice(-6))
    }

    setSaveData(synced)
  }, [saveData])

  const addToInventory = useCallback((item: InventoryItem) => {
    setSaveData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        inventory: [...prev.inventory, item],
      }
    })
  }, [])

  const removeFromInventory = useCallback((instanceId: string) => {
    setSaveData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        inventory: prev.inventory.filter((i) => i.instanceId !== instanceId),
      }
    })
  }, [])

  const addRecipe = useCallback((recipe: Recipe) => {
    setSaveData((prev) => {
      if (!prev) return prev
      const existing = prev.recipes.find((r) => r.id === recipe.id)
      if (existing) {
        const nextRecipes = prev.recipes.map((r) => {
          if (r.id !== recipe.id) return r
          return {
            ...r,
            ...recipe,
            discoveredAt: r.discoveredAt ?? recipe.discoveredAt,
            useCount: (r.useCount ?? 0) + (recipe.useCount ?? 0),
          }
        })
        return {
          ...prev,
          alchemyCount: (prev.alchemyCount ?? 0) + Math.max(1, recipe.useCount ?? 1),
          recipes: nextRecipes,
        }
      }
      return {
        ...prev,
        alchemyCount: (prev.alchemyCount ?? 0) + Math.max(1, recipe.useCount ?? 1),
        recipes: [
          ...prev.recipes,
          {
            ...recipe,
            useCount: recipe.useCount ?? 0,
          },
        ],
      }
    })
  }, [])

  const addDiscoveredSvgIcon = useCallback((itemId: string, path: string, fill?: string) => {
    if (!path || path.length < 5) return
    setSaveData((prev) => {
      if (!prev) return prev
      const icons = prev.discoveredSvgIcons ?? {}
      if (icons[itemId]) return prev
      return {
        ...prev,
        discoveredSvgIcons: { ...icons, [itemId]: { path, fill } },
      }
    })
  }, [])

  const addDiscoveredItemName = useCallback((itemId: string, name: string) => {
    if (!name || !itemId) return
    setSaveData((prev) => {
      if (!prev) return prev
      const names = prev.discoveredItemNames ?? {}
      if (names[itemId]) return prev
      return {
        ...prev,
        discoveredItemNames: { ...names, [itemId]: name },
      }
    })
  }, [])

  const addG = useCallback((amount: number) => {
    setSaveData((prev) => {
      if (!prev) return prev
      return { ...prev, g: prev.g + amount }
    })
  }, [])

  const spendG = useCallback((amount: number) => {
    setSaveData((prev) => {
      if (!prev || prev.g < amount) return prev
      return { ...prev, g: prev.g - amount }
    })
    return saveData !== null && (saveData?.g ?? 0) >= amount
  }, [saveData])

  const addSalesLog = useCallback((payload: { category: ItemCategory; amountG: number; note: string }) => {
    setSaveData((prev) => {
      if (!prev) return prev
      const today = todayStr()
      const current = prev.dailySalesLedger && prev.dailySalesLedger.date === today
        ? prev.dailySalesLedger
        : { date: today, totalG: 0, entries: [] as SalesLogEntry[] }
      const entry: SalesLogEntry = {
        id: `sale_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        soldAt: new Date().toISOString(),
        category: payload.category,
        amountG: payload.amountG,
        note: payload.note,
      }
      return {
        ...prev,
        totalSalesG: (prev.totalSalesG ?? 0) + payload.amountG,
        totalSalesCount: (prev.totalSalesCount ?? 0) + 1,
        dailySalesLedger: {
          date: today,
          totalG: current.totalG + payload.amountG,
          entries: [entry, ...current.entries].slice(0, 200),
        },
      }
    })
  }, [])

  const addMissionCompletion = useCallback(() => {
    setSaveData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        missionCompletedCount: (prev.missionCompletedCount ?? 0) + 1,
      }
    })
  }, [])

  const dismissAchievementToast = useCallback((id: string) => {
    setAchievementToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const value: GameContextValue = {
    saveData,
    missions,
    missionsSource,
    marketData,
    isLoading,
    isDeliveringMission,
    recipeModalOpen,
    missionModalOpen,
    achievementModalOpen,
    achievementToasts,
    setSaveData,
    setMissions,
    setMarketData,
    setIsLoading,
    setDeliveringMission: setIsDeliveringMission,
    setRecipeModalOpen,
    setMissionModalOpen,
    setAchievementModalOpen,
    dismissAchievementToast,
    addToInventory,
    removeFromInventory,
    addRecipe,
    addG,
    spendG,
    addDiscoveredSvgIcon,
    addDiscoveredItemName,
    addSalesLog,
    addMissionCompletion,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}

export { defaultSaveData }
