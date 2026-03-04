import type { ItemCategory } from '../types'
import itemsDbJson from '../data/items-db.json'

export const BASIC_MATERIALS = [
  'herb',
  'water',
  'mysterious_meat',
  'fire_stone',
  'magic_sand',
  'feather',
  'crude_weapon',
  'dark_dust',
  'elec_stone',
] as const

export type BasicMaterialId = (typeof BASIC_MATERIALS)[number]

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  food: 'たべもの',
  weapon: 'ぶき',
  medicine: 'くすり',
  gem: 'ほうせき',
}

export const ITEM_CATEGORY_COLORS: Record<ItemCategory, string> = {
  food: '#f59f00',
  weapon: '#e03131',
  medicine: '#2f9e44',
  gem: '#1971c2',
}

const ITEM_CATEGORY_MAP: Record<string, ItemCategory> = {
  herb: 'medicine',
  water: 'food',
  mysterious_meat: 'food',
  fire_stone: 'gem',
  magic_sand: 'medicine',
  feather: 'weapon',
  crude_weapon: 'weapon',
  // backward compatibility for old saves
  mystery_meat: 'food',
  slime: 'food',
  shabby_gear: 'weapon',
  iron_ore: 'weapon',
  dark_dust: 'gem',
  elec_stone: 'weapon',
  potion: 'medicine',
  poison: 'medicine',
  bomb: 'weapon',
  steam: 'medicine',
  glass: 'gem',
  jewel: 'gem',
  holy_water: 'medicine',
  wing: 'gem',
  ingot: 'gem',
  thunder: 'weapon',
  dark_matter: 'medicine',
  high_potion: 'medicine',
  big_bomb: 'weapon',
  elixir: 'medicine',
  hourglass: 'gem',
  sword: 'weapon',
  angel: 'gem',
  demon: 'weapon',
  robot: 'weapon',
  light_bulb: 'gem',
  philosopher_stone: 'gem',
  hero: 'weapon',
  maou: 'weapon',
}

export function getItemCategory(itemId: string): ItemCategory {
  return ITEM_CATEGORY_MAP[itemId] ?? 'medicine'
}

const CATEGORY_KEYWORDS: Record<ItemCategory, string[]> = {
  food: ['パン', '料理', '食', 'ごはん', '肉', '魚', '果実', '飲み物', 'スープ', '菓子', 'food'],
  weapon: ['剣', '槍', '弓', '盾', '斧', '刃', '武器', '装備', '弾', 'weapon'],
  medicine: ['薬', '回復', '治', '治療', '毒', '薬草', '秘薬', 'medicine', 'potion', 'elixir'],
  gem: ['石', '宝', '結晶', '鉱', '晶', '鉱石', '宝石', '指輪', '首飾', 'gem', 'crystal'],
}

export function resolveItemCategory(input: {
  id: string
  name?: string
  description?: string
  category?: ItemCategory
  ingredientIds?: string[]
}): ItemCategory {
  if (input.category) return input.category
  const known = ITEM_CATEGORY_MAP[input.id]
  if (known) return known

  const text = `${input.name ?? ''} ${input.description ?? ''}`.toLowerCase()
  for (const category of ['food', 'weapon', 'medicine', 'gem'] as const) {
    if (CATEGORY_KEYWORDS[category].some((word) => text.includes(word.toLowerCase()))) {
      return category
    }
  }

  if (input.ingredientIds && input.ingredientIds.length > 0) {
    const score: Record<ItemCategory, number> = { food: 0, weapon: 0, medicine: 0, gem: 0 }
    input.ingredientIds.forEach((id) => {
      score[getItemCategory(id)] += 1
    })
    const sorted = (Object.keys(score) as ItemCategory[]).sort((a, b) => score[b] - score[a])
    if (score[sorted[0]] > 0) return sorted[0]
  }

  return 'medicine'
}

export const ITEMS_DB = itemsDbJson as Record<string, { name: string; icon: string; tier?: number; flavor?: string; category?: ItemCategory }>

export function getSellValue(item: { id: string; tier?: number; value?: number }): number {
  const tier = item.tier ?? ITEMS_DB[item.id]?.tier ?? 0
  if (item.value != null) return item.value
  const base = tier === 0 ? 200 : tier === 1 ? 1000 : tier === 2 ? 4000 : 15000
  return base
}
