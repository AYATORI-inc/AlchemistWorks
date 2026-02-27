// 合成中に表示するTips（仕様 6.3）

export interface Tip {
  category: 'synthesis' | 'operation' | 'pace' | 'system' | 'lore'
  text: string
}

export const TIPS: Tip[] = [
  // 合成ヒント
  { category: 'synthesis', text: '釜には素材を2つ入れると錬金できるよ' },
  { category: 'synthesis', text: '作ったものも釜に入れると、もっとすごいものが作れるよ' },
  { category: 'synthesis', text: '生産個数は1〜20個。+5ボタンでまとめて増やせるよ' },
  { category: 'synthesis', text: '同じ組み合わせで作ると、レシピの累計制作数が増えるよ' },
  { category: 'synthesis', text: '陳列中の商品は釜に入れられないよ。棚から戻して使おう' },
  // 操作マニュアル
  { category: 'operation', text: '素材をひっぱって釜にドロップすると入るよ' },
  { category: 'operation', text: '作ったものは「店に出す」ボタンで販売棚へ移せる' },
  { category: 'operation', text: '商品棚の「もどす」で在庫に戻して、もう一度錬金に使えるよ' },
  { category: 'operation', text: '基本素材はいつでも工房にあるよ。買わなくて大丈夫' },
  { category: 'operation', text: 'ヘッダーからレシピブックと実績をいつでも開けるよ' },
  // 錬金ペース
  { category: 'pace', text: '素早く・普通・ゆっくりで、錬金中の待ち時間と結果の傾向が変わるよ' },
  { category: 'pace', text: '素早くは短時間で終わりやすく、意外な結果が出やすいよ' },
  { category: 'pace', text: 'ゆっくりは待ち時間が長め。そのぶん安定した結果になりやすいよ' },
  // システムTips
  { category: 'system', text: '店をあけるとお客さんが来る。閉めると新しいお客さんは来ない' },
  { category: 'system', text: 'お客さんには欲しいカテゴリがあるよ。棚の品ぞろえが大事！' },
  { category: 'system', text: 'ログアウト前の出納帳で、今日の売上と販売内容を確認できるよ' },
  { category: 'system', text: '実績を集めると称号（ランク）が上がっていくよ' },
  { category: 'system', text: '錬金・売上・陳列の数も実績の対象になるよ' },
  { category: 'system', text: 'たまに低予算のお客さんが来るよ。1000G以下の商品もそろえておこう' },
  // 世界観
  { category: 'lore', text: '国でいちばんの錬金術師をめざそう' },
  { category: 'lore', text: 'きみだけのレシピを、この工房で見つけよう' },
  { category: 'lore', text: 'ホムンクルスのピペットが、工房のおしごとを手伝ってくれるよ' },
]
