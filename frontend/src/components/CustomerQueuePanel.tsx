import { useEffect, useMemo, useState } from 'react'
import { useGame } from '../contexts/GameContext'
import type { ItemCategory } from '../types'
import { getItemCategory, getSellValue, ITEM_CATEGORY_LABELS } from '../constants/items'

type Temperament = 'impatient' | 'normal' | 'relaxed'

interface Customer {
  id: string
  name: string
  desiredCategory: ItemCategory
  isWholesale: boolean
  temperament: Temperament
  patienceMs: number
  arrivedAt: number
  reason: string
}

const CATEGORIES: ItemCategory[] = ['food', 'weapon', 'medicine', 'gem']
const WHOLESALE_RATE = 0.12
const MAX_QUEUE = 8
const ARRIVAL_INTERVAL_MS = 10000
const CHECK_INTERVAL_MS = 500

const TEMPERAMENT_LABEL: Record<Temperament, string> = {
  impatient: 'せっかち',
  normal: 'ふつう',
  relaxed: 'のんびり',
}

const TEMPERAMENT_PATIENCE_MS: Record<Temperament, number> = {
  impatient: 30000,
  normal: 45000,
  relaxed: 60000,
}

const CATEGORY_REASONS: Record<ItemCategory, string[]> = {
  food: [
    '今日の晩ごはんに良さそうな品を探している',
    '旅の保存食をまとめて持っていきたい',
    '子どものおやつ用に安心な品がほしい',
    '王都への長旅に耐える滋養食を探している',
    '錬金釜で温め直せる保存料理を試したい',
    '珍しい香辛料入りの新作料理素材を仕入れたい',
  ],
  weapon: [
    '護衛依頼の前に装備を新調したい',
    '採掘遠征に向けて丈夫な武具を見たい',
    '訓練用に手頃な武器を買い足したい',
    '魔獣討伐に備えて対属性武器を探している',
    '古い家宝の剣を錬成強化できる素材がほしい',
    '王国騎士団の規格に合う装備を確認したい',
  ],
  medicine: [
    '体調を崩した仲間のために薬が必要',
    '遠征前に回復薬を備蓄しておきたい',
    '診療所への納入分を仕入れたい',
    '呪いを和らげる中和薬を探している',
    '徹夜続きでも効く覚醒ポーションを試したい',
    '希少な霊草を使った上級薬の相談をしたい',
  ],
  gem: [
    '工芸師から宝飾素材の指定が入った',
    '儀式用に質の良い宝石を探している',
    '贈り物用に目立つ石を選びたい',
    '魔力を蓄積できる触媒石を探している',
    '王家紋章に合う色味の宝玉を見繕いたい',
    '欠けた魔導結晶の代替品を求めている',
  ],
}

const CUSTOMER_TITLES = [
  '宝石商',
  '旅商人',
  '薬師',
  '鍛冶師',
  '狩人',
  '書記官',
  '調査員',
  '学者',
  '魔導士',
  '錬金術師見習い',
  '王国騎士',
  '冒険者',
  '神殿司祭',
  '宮廷料理人',
  '採掘師',
  '結界術師',
]

const CUSTOMER_NAMES = [
  'アルバート',
  'エマ',
  'クララ',
  'ノア',
  'ミラ',
  'ルーク',
  'セシル',
  'レオン',
  'イザベラ',
  'オリヴィア',
  'フェリクス',
  'アストラ',
  'リオネル',
  'カミラ',
  'エドガー',
  'ソフィア',
]

function randomCategory(): ItemCategory {
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
}

function randomTemperament(): Temperament {
  const roll = Math.random()
  if (roll < 0.35) return 'impatient'
  if (roll < 0.75) return 'normal'
  return 'relaxed'
}

function pickReason(category: ItemCategory): string {
  const options = CATEGORY_REASONS[category]
  return options[Math.floor(Math.random() * options.length)]
}

function pickCustomerName(): string {
  const title = CUSTOMER_TITLES[Math.floor(Math.random() * CUSTOMER_TITLES.length)]
  const name = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)]
  return `${title}${name}`
}

function getPatienceHint(customer: Customer, nowMs: number): string {
  if (customer.arrivedAt <= 0) return 'あるかな……？'
  const remainingMs = Math.max(0, customer.patienceMs - (nowMs - customer.arrivedAt))
  if (remainingMs <= 5000) return '帰ろうかな？'
  if (remainingMs <= customer.patienceMs / 2) return 'なさそう'
  return 'あるかな……？'
}

function createCustomer(): Customer {
  const desiredCategory = randomCategory()
  const temperament = randomTemperament()
  return {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: pickCustomerName(),
    desiredCategory,
    isWholesale: Math.random() < WHOLESALE_RATE,
    temperament,
    patienceMs: TEMPERAMENT_PATIENCE_MS[temperament],
    arrivedAt: 0,
    reason: pickReason(desiredCategory),
  }
}

export function CustomerQueuePanel() {
  const { saveData, setSaveData, addSalesLog } = useGame()
  const [queue, setQueue] = useState<Customer[]>([])
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [isOpen, setIsOpen] = useState(false)

  const displayedItems = useMemo(
    () => (saveData?.inventory ?? []).filter((item) => item.isDisplayed),
    [saveData?.inventory]
  )

  useEffect(() => {
    if (!isOpen) return
    const timer = setInterval(() => {
      setQueue((prev) => {
        if (prev.length >= MAX_QUEUE) return prev
        return [...prev, createCustomer()]
      })
    }, ARRIVAL_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [isOpen])

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now())
    }, CHECK_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setQueue((prev) => {
      const front = prev[0]
      if (!front || front.arrivedAt > 0) return prev
      return [{ ...front, arrivedAt: Date.now() }, ...prev.slice(1)]
    })
  }, [queue])

  useEffect(() => {
    const front = queue[0]
    if (!front || front.arrivedAt <= 0) return

    const matches = displayedItems.filter((item) => (item.category ?? getItemCategory(item.id)) === front.desiredCategory)
    if (matches.length > 0) {
      const targets = front.isWholesale ? matches : [matches[0]]
      const targetIds = new Set(targets.map((item) => item.instanceId))
      const reward = targets.reduce((sum, item) => sum + getSellValue(item), 0)
      const purchasedItems = new Map<string, number>()
      targets.forEach((item) => {
        const itemName = item.name || item.id
        purchasedItems.set(itemName, (purchasedItems.get(itemName) ?? 0) + 1)
      })
      const purchasedItemText = Array.from(purchasedItems.entries())
        .map(([name, count]) => (count > 1 ? `${name}×${count}` : name))
        .join('、')

      setSaveData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          g: prev.g + reward,
          inventory: prev.inventory.filter((item) => !targetIds.has(item.instanceId)),
        }
      })

      setQueue((prev) => (isOpen ? [...prev.slice(1), createCustomer()] : prev.slice(1)))
      const suffix = front.isWholesale ? `大口で${targets.length}個まとめ買い` : '1個購入'
      addSalesLog({
        category: front.desiredCategory,
        amountG: reward,
        note: `${front.name}が${purchasedItemText}を${targets.length}個購入（${suffix}）`,
      })
      return
    }

    const elapsed = nowMs - front.arrivedAt
    if (elapsed >= front.patienceMs) {
      setQueue((prev) => (isOpen ? [...prev.slice(1), createCustomer()] : prev.slice(1)))
    }
  }, [queue, displayedItems, nowMs, setSaveData, isOpen, addSalesLog])

  const front = queue[0]
  const handleToggleShop = () => {
    setIsOpen((prev) => {
      const next = !prev
      if (!next) {
        setQueue([])
      }
      return next
    })
  }

  return (
    <section className="customer-queue-panel sidebar-section">
      <div className="shop-header-row">
        <h2>🏠 お店の中</h2>
        <button
          type="button"
          className={`shop-toggle-btn ${isOpen ? 'close-action' : 'open-action'}`}
          onClick={handleToggleShop}
        >
          {isOpen ? '店をしめる' : '店をあける'}
        </button>
      </div>
      <p className="market-hint">客は自動で棚を確認。閉店中は新しい客は来ない。</p>

      {front && (
        <div className="front-customer-card">
          <div className="front-line-1">
            <span className={`customer-name category-text-${front.desiredCategory}`}>
              先頭: {front.name}（{ITEM_CATEGORY_LABELS[front.desiredCategory]}希望）
            </span>
            <span className={`temperament-badge temperament-${front.temperament}`}>{TEMPERAMENT_LABEL[front.temperament]}</span>
            {front.isWholesale && <span className="wholesale-badge">大口</span>}
          </div>
          <p className="customer-reason">用件: {front.reason}</p>
          <p className="customer-speech">{getPatienceHint(front, nowMs)}</p>
        </div>
      )}

      <ul className="customer-queue-list">
        {queue.slice(1).map((customer) => (
          <li key={customer.id} className="customer-row">
            <span className={`customer-name category-text-${customer.desiredCategory}`}>
              {customer.name}（{ITEM_CATEGORY_LABELS[customer.desiredCategory]}）
            </span>
            <span className={`temperament-badge temperament-${customer.temperament}`}>{TEMPERAMENT_LABEL[customer.temperament]}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
