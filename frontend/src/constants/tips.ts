// 合成中に表示するTips（仕様 6.3）
import tipsJson from '../data/tips.json'

export interface Tip {
  category: 'synthesis' | 'operation' | 'pace' | 'system' | 'lore'
  text: string
}

export const TIPS = tipsJson as Tip[]
