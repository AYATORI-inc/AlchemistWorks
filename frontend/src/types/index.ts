export type AlchemyPace = 'fast' | 'normal' | 'slow'

export type ItemCategory = 'food' | 'weapon' | 'medicine' | 'gem'

export const PACE_LABELS: Record<AlchemyPace, string> = {
  fast: '素早く',
  normal: '普通',
  slow: 'ゆっくり',
}

export type ItemQuality = 'crude' | 'normal' | 'fine' | 'legendary'

export interface Item {
  id: string
  name: string
  icon: string
  category?: ItemCategory
  tier?: 0 | 1 | 2 | 3
  quality?: ItemQuality
  description?: string
  value?: number
}

export interface InventoryItem extends Item {
  instanceId: string
  isDisplayed?: boolean
}

export interface Recipe {
  id: string
  ingredients: [string, string]
  result: string
  discovered: boolean
  discoveredAt?: string
  useCount?: number
  resultName?: string
  resultIcon?: string
  resultFlavor?: string
  ingredientNames?: [string, string]
  ingredientFlavors?: [string | undefined, string | undefined]
  pace?: AlchemyPace
  resultValue?: number
  resultTier?: number
  resultQuality?: string
  resultCategory?: ItemCategory
}

export interface Mission {
  id: string
  title: string
  description: string
  rewardG: number
  completed: boolean
  submittedAt?: string
  actualRewardG?: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  unlocked: boolean
  unlockedAt?: string
}

export interface MarketItem {
  itemId: string
  name: string
  icon: string
  price: number
  isDaily?: boolean
}

export interface DiscoveredSvgIcon {
  path: string
  fill?: string
}

export interface SalesLogEntry {
  id: string
  soldAt: string
  category: ItemCategory
  amountG: number
  note: string
}

export interface DailySalesLedger {
  date: string
  totalG: number
  entries: SalesLogEntry[]
}

export interface SaveData {
  userId: string
  userName: string
  workshopName: string
  g: number
  inventory: InventoryItem[]
  recipes: Recipe[]
  achievements: Achievement[]
  rank: number
  lastLoginDate: string
  alchemyCount: number
  dailySalesLedger?: DailySalesLedger
  discoveredSvgIcons?: Record<string, DiscoveredSvgIcon>
  discoveredItemNames?: Record<string, string>
}

export interface AlchemyResult {
  success: boolean
  result?: {
    id: string
    name: string
    icon: string
    quality: ItemQuality
    description?: string
    value: number
    tier: number
    category?: ItemCategory
    isNewRecipe: boolean
  }
  byproduct?: Item
}
