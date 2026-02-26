import type { ItemCategory } from '../types'

export const BASIC_MATERIALS = [
  'herb',
  'water',
  'slime',
  'fire_stone',
  'magic_sand',
  'feather',
  'iron_ore',
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
  slime: 'food',
  fire_stone: 'gem',
  magic_sand: 'medicine',
  feather: 'weapon',
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

export const ITEMS_DB: Record<string, { name: string; icon: string; tier?: number; flavor?: string; category?: ItemCategory }> = {
  herb: { name: '薬草', icon: '🌿', tier: 0, flavor: 'けがの手当に使える。どこにでもある。' },
  water: { name: '水', icon: '💧', tier: 0, flavor: 'きれいな水。錬金の基本。' },
  slime: { name: 'なぞの肉', icon: '🥩', tier: 0, flavor: '正体不明だが、うまみが濃い赤い肉。' },
  fire_stone: { name: '火の石', icon: '🔥', tier: 0, flavor: 'ちょっと火がついている石。' },
  magic_sand: { name: '魔法の粉', icon: '✨', tier: 0, flavor: 'ひかるふしぎな粉。' },
  feather: { name: '羽根', icon: '🪶', tier: 0, flavor: '軽い。風がよく通る。' },
  iron_ore: { name: '粗末な武具', icon: '🗡️', tier: 0, flavor: '使い古された武具。素材として再利用できる。' },
  dark_dust: { name: '闇のかけら', icon: '🌫️', tier: 0, flavor: '暗い気配をまとった欠片。' },
  elec_stone: { name: '電気石', icon: '⚡', tier: 0, flavor: 'さわるとびりっとする石。' },
  potion: { name: '回復薬', icon: '🍷', tier: 1, flavor: 'けがをなおす薬。' },
  poison: { name: '毒薬', icon: '☠️', tier: 1, flavor: 'のむと危ない。気をつけて。' },
  bomb: { name: '爆弾', icon: '💣', tier: 1, flavor: 'さわると大変。' },
  steam: { name: '蒸気', icon: '♨️', tier: 1, flavor: 'あつい空気のけむり。' },
  glass: { name: 'ガラス', icon: '🔮', tier: 1, flavor: 'すきとおってかたい。' },
  jewel: { name: '宝石', icon: '💎', tier: 1, flavor: 'きれいでたかい。' },
  holy_water: { name: '聖水', icon: '💧✨', tier: 1, flavor: 'よごれをきれいにする水。' },
  wing: { name: '翼', icon: '🕊️', tier: 1, flavor: '空をとぶためのもの。' },
  ingot: { name: '鉄のインゴット', icon: '🧱', tier: 1, flavor: 'かためた鉄のかたまり。' },
  thunder: { name: '雷', icon: '⚡🌩️', tier: 1, flavor: 'いなずまをこめたもの。' },
  dark_matter: { name: '暗黒物質', icon: '🕳️', tier: 1, flavor: 'よくわからないもの。' },
  high_potion: { name: '上級薬', icon: '🍷✨', tier: 2, flavor: 'とてもよい回復の薬。' },
  big_bomb: { name: '大爆弾', icon: '💥', tier: 2, flavor: 'とても強い。危険。' },
  elixir: { name: 'エリクサー', icon: '🍷💎', tier: 2, flavor: 'でんせつの万能薬。' },
  hourglass: { name: '砂時計', icon: '⏳', tier: 2, flavor: '時間がわかる。' },
  sword: { name: '剣', icon: '⚔️', tier: 2, flavor: 'つよい武器のしるし。' },
  angel: { name: '天使', icon: '👼✨🪽', tier: 2, flavor: 'ひかりのすがた。' },
  demon: { name: '悪魔', icon: '👹', tier: 2, flavor: 'やみの姿。' },
  robot: { name: 'ロボット', icon: '🤖', tier: 2, flavor: '鉄と電気でできたにんぎょう。' },
  light_bulb: { name: '電灯', icon: '💡', tier: 2, flavor: '明るいところを作り出す。' },
  philosopher_stone: { name: '賢者の石', icon: '🪨✨', tier: 3, flavor: '錬金術のいちばんすごいもの。' },
  hero: { name: '勇者', icon: '🦸', tier: 3, flavor: 'せかいをすくうひとのしるし。' },
  maou: { name: '魔王', icon: '😈', tier: 3, flavor: 'せかいをほろぼすもののしるし。' },
}

export function getSellValue(item: { id: string; tier?: number; value?: number }): number {
  const tier = item.tier ?? ITEMS_DB[item.id]?.tier ?? 0
  if (item.value != null) return item.value
  const base = tier === 0 ? 200 : tier === 1 ? 1000 : tier === 2 ? 4000 : 15000
  return base
}
