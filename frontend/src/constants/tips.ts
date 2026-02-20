// 合成中に表示するTips（仕様 6.3）

export interface Tip {
  category: 'synthesis' | 'operation' | 'pace' | 'system' | 'lore'
  text: string
}

export const TIPS: Tip[] = [
  // 合成ヒント
  { category: 'synthesis', text: '作ったものも釜に入れると、もっとすごいものが作れるよ' },
  { category: 'synthesis', text: '同じようなもの同士を合わせると、新しい発見があるかも' },
  { category: 'synthesis', text: '数字が大きいものほど、とくべつなものができやすくなる' },
  // 操作マニュアル
  { category: 'operation', text: 'ひっぱって釜に落とすと入るよ' },
  { category: 'operation', text: '作ったものは市場でお金にできる' },
  { category: 'operation', text: '基本素材はいつでも工房にあるよ。買わなくて大丈夫' },
  // 調合ペース
  { category: 'pace', text: 'はやい＝びっくりする結果、ゆっくり＝きれいな結果。やってみよう' },
  { category: 'pace', text: 'ゆっくりやると、いいものができやすいよ' },
  // システムTips
  { category: 'system', text: '依頼をとおすとお金と実績がもらえる' },
  { category: 'system', text: '日替わりの品は毎日変わるよ' },
  { category: 'system', text: '日が変わるとお金が少しもらえる' },
  // 世界観
  { category: 'lore', text: '国でいちばんの錬金術師をめざそう' },
  { category: 'lore', text: 'きみだけのレシピを、この工房で見つけよう' },
]
