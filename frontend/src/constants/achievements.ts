import type { Achievement, SaveData } from '../types'
import { ITEMS_DB } from './items'
import rankTitlesJson from '../data/rank-titles.json'
import achievementDefinitionsJson from '../data/achievement-definitions.json'
import retiredAchievementIdsJson from '../data/retired-achievement-ids.json'

export const RANK_TITLES = Object.fromEntries(
  Object.entries(rankTitlesJson).map(([k, v]) => [Number(k), v])
) as Record<number, string>

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

const ACHIEVEMENT_DEFINITIONS = achievementDefinitionsJson as AchievementDefinition[]

const RETIRED_ACHIEVEMENT_IDS = new Set(retiredAchievementIdsJson as string[])

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
