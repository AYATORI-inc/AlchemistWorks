// 錬金術シミュレータ 型定義

/** 調合ペース */
export type AlchemyPace = 'fast' | 'normal' | 'slow'

/** 錬金速度の表示ラベル */
export const PACE_LABELS: Record<AlchemyPace, string> = {
  fast: '素早く',
  normal: '普通',
  slow: 'ゆっくり',
}

/** アイテム品質 */
export type ItemQuality = 'crude' | 'normal' | 'fine' | 'legendary'

/** アイテム（素材 or 生成物） */
export interface Item {
  id: string
  name: string
  icon: string
  tier?: 0 | 1 | 2 | 3
  quality?: ItemQuality
  description?: string
  value?: number
}

/** 所持アイテム（インベントリ用） */
export interface InventoryItem extends Item {
  instanceId: string
}

/** レシピ（発見済み） */
export interface Recipe {
  id: string
  ingredients: [string, string]
  result: string
  discovered: boolean
  discoveredAt?: string
  useCount?: number
  /** 表示用（追加時に保存） */
  resultName?: string
  resultIcon?: string
  resultFlavor?: string
  ingredientNames?: [string, string]
  ingredientFlavors?: [string | undefined, string | undefined]
  /** 発見時に使用した錬金速度 */
  pace?: AlchemyPace
  /** 発見時の結果（再現用） */
  resultValue?: number
  resultTier?: number
  resultQuality?: string
}

/** ミッション */
export interface Mission {
  id: string
  title: string
  description: string
  rewardG: number
  completed: boolean
  submittedAt?: string
  /** 納品後の実際の報酬額（AI判定による増減後） */
  actualRewardG?: number
}

/** 実績 */
export interface Achievement {
  id: string
  name: string
  description: string
  unlocked: boolean
  unlockedAt?: string
}

/** 市場の販売アイテム */
export interface MarketItem {
  itemId: string
  name: string
  icon: string
  price: number
  isDaily?: boolean
}

/** AI生成SVGアイコン（itemId -> path情報） */
export interface DiscoveredSvgIcon {
  path: string
  fill?: string
}

/** セーブデータ */
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
  /** AI生成されたアイテムのSVGアイコン（itemId -> {path, fill}） */
  discoveredSvgIcons?: Record<string, DiscoveredSvgIcon>
  /** 発見済みアイテムの表示名（日替わり・錬金生成物など itemId -> name） */
  discoveredItemNames?: Record<string, string>
}

/** 錬金結果（APIレスポンス） */
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
    isNewRecipe: boolean
  }
  byproduct?: Item
}
