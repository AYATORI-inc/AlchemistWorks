import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { SaveData, InventoryItem, Mission, MarketItem, Recipe } from '../types'

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
}

const defaultSaveData: SaveData = {
  userId: '',
  userName: '',
  workshopName: '',
  g: 10000,
  inventory: [],
  recipes: [],
  achievements: [],
  rank: 1,
  lastLoginDate: new Date().toISOString().slice(0, 10),
  alchemyCount: 0,
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
      const exists = prev.recipes.some((r) => r.id === recipe.id)
      if (exists) return prev
      return {
        ...prev,
        recipes: [...prev.recipes, recipe],
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
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}

export { defaultSaveData }
