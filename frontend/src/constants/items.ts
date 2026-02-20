// 基本素材定義（base-system から移植）

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

export const ITEMS_DB: Record<string, { name: string; icon: string; tier?: number; flavor?: string }> = {
  herb: { name: '薬草', icon: '🌿', tier: 0, flavor: 'けがの手当に使う草。どこにでもある。' },
  water: { name: '水', icon: '💧', tier: 0, flavor: 'きれいな水。調合の基本。' },
  slime: { name: 'スライム', icon: '🔵', tier: 0, flavor: 'ぷるぷるしたゼリーみたいなもの。' },
  fire_stone: { name: '火の石', icon: '🔥', tier: 0, flavor: 'ちょっと火がついている石。' },
  magic_sand: { name: '魔法の砂', icon: '✨', tier: 0, flavor: 'ぴかぴか光る砂。' },
  feather: { name: '羽根', icon: '🪶', tier: 0, flavor: '軽い。風がくる。' },
  iron_ore: { name: '鉄鉱石', icon: '🪨', tier: 0, flavor: 'きたえると鉄になる石。' },
  dark_dust: { name: '闇の粉', icon: '🌑', tier: 0, flavor: '暗い粉。' },
  elec_stone: { name: '電気石', icon: '⚡', tier: 0, flavor: 'さわるとびりっとする石。' },
  potion: { name: '回復薬', icon: '🍷', tier: 1, flavor: 'けがをなおす赤い薬。' },
  poison: { name: '毒薬', icon: '☠️', tier: 1, flavor: 'のむと危ない。気をつけて。' },
  bomb: { name: '爆弾', icon: '💣', tier: 1, flavor: 'さわると大変。' },
  steam: { name: '蒸気', icon: '☁️', tier: 1, flavor: 'あつい水のけむり。' },
  glass: { name: 'ガラス', icon: '🥃', tier: 1, flavor: 'すきとおってかたい。' },
  jewel: { name: '宝石', icon: '💎', tier: 1, flavor: 'きれいでたいせつ。' },
  holy_water: { name: '聖水', icon: '💧✨', tier: 1, flavor: 'よごれをきれいにする水。' },
  wing: { name: '翼', icon: '👼', tier: 1, flavor: '空をとぶつばさ。' },
  ingot: { name: '鉄のブロック', icon: '🧱', tier: 1, flavor: 'きたえた鉄のかたまり。' },
  thunder: { name: '雷', icon: '🌩️', tier: 1, flavor: 'いなずまをこめたもの。' },
  dark_matter: { name: '暗黒物質', icon: '🌌', tier: 1, flavor: 'やみそのもの。' },
  high_potion: { name: '上薬草', icon: '🍀✨', tier: 2, flavor: 'とてもいい回復の力。' },
  big_bomb: { name: '大爆発', icon: '💥', tier: 2, flavor: 'とても強い爆発。' },
  elixir: { name: 'エリクサー', icon: '🍷💎', tier: 2, flavor: 'でんせつの万能薬。' },
  hourglass: { name: '砂時計', icon: '⏳', tier: 2, flavor: '時間がわかる。' },
  sword: { name: '剣', icon: '⚔️', tier: 2, flavor: 'ゆうしゃのしるし。' },
  angel: { name: '天使', icon: '👱‍♀️', tier: 2, flavor: 'ひかりのすがた。' },
  demon: { name: '悪魔', icon: '👿', tier: 2, flavor: 'やみの子。' },
  robot: { name: 'ロボット', icon: '🤖', tier: 2, flavor: '鉄と雷でできたにんぎょう。' },
  light_bulb: { name: '電球', icon: '💡', tier: 2, flavor: '暗いところを照らす。' },
  philosopher_stone: { name: '賢者の石', icon: '🔴✨', tier: 3, flavor: '錬金術のいちばんすごいもの。' },
  hero: { name: '勇者', icon: '👑', tier: 3, flavor: 'せかいをすくうひと。' },
  maou: { name: '魔王', icon: '👹', tier: 3, flavor: 'せかいをほろぼすひと。' },
}

/** 売却価格（tierベースの目安） */
export function getSellValue(item: { id: string; tier?: number; value?: number }): number {
  const tier = item.tier ?? ITEMS_DB[item.id]?.tier ?? 0
  if (item.value != null) return item.value
  const base = tier === 0 ? 200 : tier === 1 ? 1000 : tier === 2 ? 4000 : 15000
  return base
}
