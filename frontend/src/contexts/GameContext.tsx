import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { SaveData, InventoryItem, Mission, MarketItem, Recipe, SalesLogEntry, ItemCategory } from '../types'

interface GameState {
  saveData: SaveData | null
  missions: Mission[] | null
  missionsSource: 'ai' | 'fallback' | null
  marketData: { basic: MarketItem[]; daily: MarketItem[]; dailySource?: 'ai' | 'fallback' } | null
  isLoading: boolean
  isDeliveringMission: boolean
  recipeModalOpen: boolean
  missionModalOpen: boolean
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
  addToInventory: (item: InventoryItem) => void
  removeFromInventory: (instanceId: string) => void
  addRecipe: (recipe: Recipe) => void
  addG: (amount: number) => void
  spendG: (amount: number) => boolean
  addDiscoveredSvgIcon: (itemId: string, path: string, fill?: string) => void
  addDiscoveredItemName: (itemId: string, name: string) => void
  addSalesLog: (payload: { category: ItemCategory; amountG: number; note: string }) => void
}

const todayStr = () => new Date().toISOString().slice(0, 10)

const defaultSaveData: SaveData = {
  userId: '',
  userName: '',
  workshopName: '',
  g: 0,
  inventory: [],
  recipes: [],
  achievements: [],
  rank: 1,
  lastLoginDate: todayStr(),
  alchemyCount: 0,
  dailySalesLedger: { date: todayStr(), totalG: 0, entries: [] },
  discoveredSvgIcons: {},
  discoveredItemNames: {},
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [saveData, setSaveData] = useState<SaveData | null>(null)
  const [missions, setMissionsState] = useState<Mission[] | null>(null)
  const [missionsSource, setMissionsSource] = useState<'ai' | 'fallback' | null>(null)
  const [marketData, setMarketData] = useState<{ basic: MarketItem[]; daily: MarketItem[]; dailySource?: 'ai' | 'fallback' } | null>(null)
  const [recipeModalOpen, setRecipeModalOpen] = useState(false)
  const [missionModalOpen, setMissionModalOpen] = useState(false)
  const [isDeliveringMission, setIsDeliveringMission] = useState(false)

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
          recipes: nextRecipes,
        }
      }
      return {
        ...prev,
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
        dailySalesLedger: {
          date: today,
          totalG: current.totalG + payload.amountG,
          entries: [entry, ...current.entries].slice(0, 200),
        },
      }
    })
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
    setSaveData,
    setMissions,
    setMarketData,
    setIsLoading,
    setDeliveringMission: setIsDeliveringMission,
    setRecipeModalOpen,
    setMissionModalOpen,
    addToInventory,
    removeFromInventory,
    addRecipe,
    addG,
    spendG,
    addDiscoveredSvgIcon,
    addDiscoveredItemName,
    addSalesLog,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}

export { defaultSaveData }
