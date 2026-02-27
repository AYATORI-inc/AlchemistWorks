import type { Achievement, SaveData } from '../types'
import { ITEMS_DB } from './items'

export const RANK_TITLES: Record<number, string> = {
  1: 'みならい錬金術師',
  2: 'かけだし錬金術師',
  3: 'アマチュア錬金術師',
  4: 'ウワサの錬金術師',
  5: 'スゴウデ錬金術師',
  6: '宮廷錬金術師',
  7: '伝説級錬金術師',
  8: '究極の錬金術師',
}

export const RANK_UNLOCK_STEP = 6
export const MAX_RANK = 8

export function formatTierTextForUi(text: string) {
  return text
    .replaceAll('T3', 'すごい')
    .replaceAll('T2', 'いいもの')
    .replaceAll('T1', 'ふつう')
}

type MetricKey =
  | 'alchemyCount'
  | 'recipeCount'
  | 'gold'
  | 'totalSalesG'
  | 'totalSalesCount'
  | 'dailySalesG'
  | 'dailySalesCount'
  | 'producedTier1Count'
  | 'producedTier2Count'
  | 'producedTier3Count'
  | 'displayedCount'
  | 'displayedUniqueCount'
  | 'inventoryCount'
  | 'recipeCategoryCount'
  | 'discoveredIconCount'
  | 'masterAchievementCount'

interface AchievementDefinition {
  id: string
  name: string
  description: string
  metricKey: MetricKey
  target: number
  conditionLabel: string
}

export interface AchievementProgressItem {
  id: string
  name: string
  description: string
  unlocked: boolean
  unlockedAt?: string
  current: number
  target: number
  progressRate: number
  conditionLabel: string
}

const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  { id: 'alchemy_1', name: 'はじめての錬金', description: '錬金を1個成功させる', metricKey: 'alchemyCount', target: 1, conditionLabel: '錬金成功 1個' },
  { id: 'alchemy_10', name: '釜の相棒', description: '錬金を200個成功させる', metricKey: 'alchemyCount', target: 200, conditionLabel: '錬金成功 200個' },
  { id: 'alchemy_50', name: '工房の量産職人', description: '錬金を500個成功させる', metricKey: 'alchemyCount', target: 500, conditionLabel: '錬金成功 500個' },
  { id: 'alchemy_200', name: '伝説の釜さばき', description: '錬金を1,000個成功させる', metricKey: 'alchemyCount', target: 1000, conditionLabel: '錬金成功 1,000個' },
  { id: 'recipe_1', name: 'ひらめきの一冊目', description: 'レシピを1件発見する', metricKey: 'recipeCount', target: 1, conditionLabel: 'レシピ発見 1件' },
  { id: 'recipe_3', name: '秘伝の収集家', description: 'レシピを10件発見する', metricKey: 'recipeCount', target: 10, conditionLabel: 'レシピ発見 10件' },
  { id: 'recipe_5', name: '工房の研究者頭領', description: 'レシピを20件発見する', metricKey: 'recipeCount', target: 20, conditionLabel: 'レシピ発見 20件' },
  { id: 'recipe_10', name: '万巻の錬金書庫', description: 'レシピを40件発見する', metricKey: 'recipeCount', target: 40, conditionLabel: 'レシピ発見 40件' },
  { id: 'craft_t1_first', name: 'はじめての品物', description: 'T1の品物をはじめて作る', metricKey: 'producedTier1Count', target: 1, conditionLabel: 'T1の品物 1個作成' },
  { id: 'craft_t2_first', name: 'いいもの誕生', description: 'T2の品物をはじめて作る', metricKey: 'producedTier2Count', target: 1, conditionLabel: 'T2の品物 1個作成' },
  { id: 'craft_t3_first', name: 'すごい発明', description: 'T3の品物をはじめて作る', metricKey: 'producedTier3Count', target: 1, conditionLabel: 'T3の品物 1個作成' },
  { id: 'craft_t1_20', name: 'ふつう品の職人', description: 'T1の品物を20個作る', metricKey: 'producedTier1Count', target: 20, conditionLabel: 'T1の品物 20個作成' },
  { id: 'craft_t1_80', name: 'ふつう品の量産工房', description: 'T1の品物を80個作る', metricKey: 'producedTier1Count', target: 80, conditionLabel: 'T1の品物 80個作成' },
  { id: 'craft_t2_10', name: 'いいもの量産', description: 'T2の品物を10個作る', metricKey: 'producedTier2Count', target: 10, conditionLabel: 'T2の品物 10個作成' },
  { id: 'craft_t2_30', name: 'いいもの専門工房', description: 'T2の品物を30個作る', metricKey: 'producedTier2Count', target: 30, conditionLabel: 'T2の品物 30個作成' },
  { id: 'craft_t3_5', name: 'すごい品の名工', description: 'T3の品物を5個作る', metricKey: 'producedTier3Count', target: 5, conditionLabel: 'T3の品物 5個作成' },
  { id: 'craft_t3_15', name: 'すごい品の伝説工匠', description: 'T3の品物を15個作る', metricKey: 'producedTier3Count', target: 15, conditionLabel: 'T3の品物 15個作成' },
  { id: 'gold_1000', name: '初売上の手応え', description: '所持金を1,000G以上にする', metricKey: 'gold', target: 1000, conditionLabel: '所持金 1,000G' },
  { id: 'gold_10000', name: '王都級の資金力', description: '所持金を200,000G以上にする', metricKey: 'gold', target: 200000, conditionLabel: '所持金 200,000G' },
  { id: 'gold_50000', name: '貴族御用達の金庫番', description: '所持金を500,000G以上にする', metricKey: 'gold', target: 500000, conditionLabel: '所持金 500,000G' },
  { id: 'gold_200000', name: '国宝級の資産家工房', description: '所持金を1,000,000G以上にする', metricKey: 'gold', target: 1000000, conditionLabel: '所持金 1,000,000G' },
  { id: 'sales_count_1', name: 'はじめての接客', description: '商品を1回売る', metricKey: 'totalSalesCount', target: 1, conditionLabel: '売上件数 1件' },
  { id: 'sales_count_10', name: '行列のできる工房', description: '商品を30回売る', metricKey: 'totalSalesCount', target: 30, conditionLabel: '売上件数 30件' },
  { id: 'sales_count_30', name: '町いちばんの人気店', description: '商品を60回売る', metricKey: 'totalSalesCount', target: 60, conditionLabel: '売上件数 60件' },
  { id: 'sales_total_5000', name: '売上の手応え', description: '累計売上5,000Gを達成する', metricKey: 'totalSalesG', target: 5000, conditionLabel: '累計売上 5,000G' },
  { id: 'sales_total_30000', name: '市場の有名店', description: '累計売上100,000Gを達成する', metricKey: 'totalSalesG', target: 100000, conditionLabel: '累計売上 100,000G' },
  { id: 'sales_total_100000', name: '王都に名が届く工房', description: '累計売上250,000Gを達成する', metricKey: 'totalSalesG', target: 250000, conditionLabel: '累計売上 250,000G' },
  { id: 'daily_sales_g_3000', name: '本日の売れ行き上々', description: '1日の売上が3,000Gに到達する', metricKey: 'dailySalesG', target: 3000, conditionLabel: '本日の売上 3,000G' },
  { id: 'daily_sales_g_15000', name: '本日の大繁盛', description: '1日の売上が15,000Gに到達する', metricKey: 'dailySalesG', target: 15000, conditionLabel: '本日の売上 15,000G' },
  { id: 'daily_sales_g_40000', name: '本日の伝説営業', description: '1日の売上が40,000Gに到達する', metricKey: 'dailySalesG', target: 40000, conditionLabel: '本日の売上 40,000G' },
  { id: 'daily_sales_count_10', name: '接客ラッシュ', description: '1日に10件の販売を達成する', metricKey: 'dailySalesCount', target: 10, conditionLabel: '本日の販売件数 10件' },
  { id: 'daily_sales_count_25', name: '満員御礼の一日', description: '1日に25件の販売を達成する', metricKey: 'dailySalesCount', target: 25, conditionLabel: '本日の販売件数 25件' },
  { id: 'daily_sales_count_40', name: '休む間もない人気店', description: '1日に40件の販売を達成する', metricKey: 'dailySalesCount', target: 40, conditionLabel: '本日の販売件数 40件' },
  { id: 'display_1', name: 'はじめての陳列', description: '商品棚に1個並べる', metricKey: 'displayedCount', target: 1, conditionLabel: '陳列商品 1個' },
  { id: 'display_4', name: '見応えのある売り場', description: '商品棚に8個並べる', metricKey: 'displayedCount', target: 8, conditionLabel: '陳列商品 8個' },
  { id: 'display_8', name: '圧巻のフルディスプレイ', description: '商品棚に12個並べる', metricKey: 'displayedCount', target: 12, conditionLabel: '陳列商品 12個' },
  { id: 'inventory_10', name: '倉庫番の気配', description: '在庫を10個以上持つ', metricKey: 'inventoryCount', target: 10, conditionLabel: '所持在庫 10個' },
  { id: 'inventory_30', name: '素材と商品の山', description: '在庫を30個以上持つ', metricKey: 'inventoryCount', target: 30, conditionLabel: '所持在庫 30個' },
  { id: 'category_2', name: '品ぞろえの工夫', description: 'レシピで2種類以上のカテゴリを作る', metricKey: 'recipeCategoryCount', target: 2, conditionLabel: '作成カテゴリ 2種' },
  { id: 'category_4', name: '何でも屋の工房', description: 'レシピで4種類のカテゴリを作る', metricKey: 'recipeCategoryCount', target: 4, conditionLabel: '作成カテゴリ 4種' },
  { id: 'recipe_new_10', name: '個性ある作品たち', description: '商品棚に8種類以上並べる', metricKey: 'displayedUniqueCount', target: 8, conditionLabel: '陳列の種類数 8種' },
  { id: 'alchemy_master', name: '錬金術マスター', description: 'これ以外の実績をすべて集める', metricKey: 'masterAchievementCount', target: 0, conditionLabel: '他の実績を全取得' },
]

const RETIRED_ACHIEVEMENT_IDS = new Set(['mission_1', 'mission_5', 'mission_15', 'icon_5'])

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

function getMetrics(saveData: SaveData) {
  const inventory = saveData.inventory ?? []
  const recipes = saveData.recipes ?? []
  const displayedItems = inventory.filter((item) => item.isDisplayed)
  const displayedUniqueCount = new Set(displayedItems.map((item) => item.name || item.id)).size
  const producedTierCounts = recipes.reduce(
    (acc, recipe) => {
      const tier = recipe.resultTier ?? ITEMS_DB[recipe.result]?.tier ?? 0
      const count = Math.max(0, recipe.useCount ?? 0)
      if (tier === 1) acc.t1 += count
      else if (tier === 2) acc.t2 += count
      else if (tier === 3) acc.t3 += count
      return acc
    },
    { t1: 0, t2: 0, t3: 0 }
  )
  const recipeCategoryCount = new Set(
    recipes
      .map((recipe) => recipe.resultCategory)
      .filter((category): category is NonNullable<typeof category> => !!category)
  ).size

  return {
    alchemyCount: Math.max(0, saveData.alchemyCount ?? 0),
    recipeCount: recipes.length,
    gold: Math.max(0, saveData.g ?? 0),
    totalSalesG: Math.max(0, saveData.totalSalesG ?? saveData.dailySalesLedger?.totalG ?? 0),
    totalSalesCount: Math.max(0, saveData.totalSalesCount ?? saveData.dailySalesLedger?.entries?.length ?? 0),
    dailySalesG: Math.max(0, saveData.dailySalesLedger?.totalG ?? 0),
    dailySalesCount: Math.max(0, saveData.dailySalesLedger?.entries?.length ?? 0),
    producedTier1Count: producedTierCounts.t1,
    producedTier2Count: producedTierCounts.t2,
    producedTier3Count: producedTierCounts.t3,
    displayedCount: displayedItems.length,
    displayedUniqueCount,
    inventoryCount: inventory.length,
    recipeCategoryCount,
    discoveredIconCount: Object.keys(saveData.discoveredSvgIcons ?? {}).length,
    masterAchievementCount: 0,
  }
}

function getCurrentValue(metrics: ReturnType<typeof getMetrics>, key: MetricKey) {
  return metrics[key] ?? 0
}

export function getAchievementProgressList(saveData: SaveData): AchievementProgressItem[] {
  const metrics = getMetrics(saveData)
  const unlockedMap = new Map((saveData.achievements ?? []).map((a) => [a.id, a]))
  const masterId = 'alchemy_master'
  const definitions = ACHIEVEMENT_DEFINITIONS
  const baseDefinitions = definitions.filter((def) => def.id !== masterId)

  const baseProgress = baseDefinitions.map((def) => {
    const current = getCurrentValue(metrics, def.metricKey)
    const saved = unlockedMap.get(def.id)
    const unlocked = !!saved?.unlocked || current >= def.target
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      unlocked,
      unlockedAt: saved?.unlockedAt,
      current,
      target: def.target,
      progressRate: clamp01(def.target <= 0 ? 1 : current / def.target),
      conditionLabel: def.conditionLabel,
    }
  })

  const baseProgressMap = new Map(baseProgress.map((item) => [item.id, item]))
  const masterDef = definitions.find((def) => def.id === masterId)
  if (masterDef) {
    const unlockedOtherCount = baseProgress.filter((item) => item.unlocked).length
    const totalOtherCount = baseDefinitions.length
    const saved = unlockedMap.get(masterId)
    const unlocked = totalOtherCount > 0 ? unlockedOtherCount >= totalOtherCount : true
    baseProgressMap.set(masterId, {
      id: masterDef.id,
      name: masterDef.name,
      description: masterDef.description,
      unlocked,
      unlockedAt: saved?.unlockedAt,
      current: unlockedOtherCount,
      target: totalOtherCount,
      progressRate: clamp01(totalOtherCount <= 0 ? 1 : unlockedOtherCount / totalOtherCount),
      conditionLabel: masterDef.conditionLabel,
    })
  }

  return definitions.map((def) => baseProgressMap.get(def.id)!).filter(Boolean)
}

export function getRankFromUnlockedCount(unlockedCount: number) {
  return Math.min(MAX_RANK, Math.floor(Math.max(0, unlockedCount) / RANK_UNLOCK_STEP) + 1)
}

export function getRankProgress(unlockedCount: number) {
  const rank = getRankFromUnlockedCount(unlockedCount)
  if (rank >= MAX_RANK) {
    return {
      rank,
      title: RANK_TITLES[rank],
      nextTitle: null as string | null,
      currentStepCount: RANK_UNLOCK_STEP,
      requiredForNext: RANK_UNLOCK_STEP,
      remainingToNext: 0,
    }
  }
  const stepBase = (rank - 1) * RANK_UNLOCK_STEP
  const currentStepCount = unlockedCount - stepBase
  return {
    rank,
    title: RANK_TITLES[rank],
    nextTitle: RANK_TITLES[rank + 1],
    currentStepCount: Math.max(0, currentStepCount),
    requiredForNext: RANK_UNLOCK_STEP,
    remainingToNext: Math.max(0, RANK_UNLOCK_STEP - currentStepCount),
  }
}

export function syncAchievementsAndRank(saveData: SaveData): SaveData {
  const progressList = getAchievementProgressList(saveData)
  const prevById = new Map((saveData.achievements ?? []).map((achievement) => [achievement.id, achievement]))
  const nowIso = new Date().toISOString()

  const canonicalAchievements: Achievement[] = progressList.map((progress) => {
    const prev = prevById.get(progress.id)
    const unlocked = progress.unlocked
    return {
      id: progress.id,
      name: progress.name,
      description: progress.description,
      unlocked,
      unlockedAt: unlocked ? (prev?.unlockedAt ?? nowIso) : prev?.unlockedAt,
    }
  })

  const customAchievements = (saveData.achievements ?? []).filter(
    (achievement) =>
      !RETIRED_ACHIEVEMENT_IDS.has(achievement.id) &&
      !ACHIEVEMENT_DEFINITIONS.some((def) => def.id === achievement.id)
  )
  const nextAchievements = [...canonicalAchievements, ...customAchievements]
  const unlockedCount = nextAchievements.filter((achievement) => achievement.unlocked).length
  const nextRank = getRankFromUnlockedCount(unlockedCount)

  const sameRank = saveData.rank === nextRank
  const sameAchievements =
    (saveData.achievements ?? []).length === nextAchievements.length &&
    (saveData.achievements ?? []).every((achievement, index) => {
      const next = nextAchievements[index]
      return (
        achievement.id === next.id &&
        achievement.name === next.name &&
        achievement.description === next.description &&
        achievement.unlocked === next.unlocked &&
        achievement.unlockedAt === next.unlockedAt
      )
    })

  if (sameRank && sameAchievements) return saveData

  return {
    ...saveData,
    rank: nextRank,
    achievements: nextAchievements,
  }
}
