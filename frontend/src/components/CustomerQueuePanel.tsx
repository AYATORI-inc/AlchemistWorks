import { useEffect, useMemo, useState } from 'react'
import { useRef } from 'react'
import { useGame } from '../contexts/GameContext'
import type { ItemCategory } from '../types'
import { getItemCategory, getSellValue, ITEM_CATEGORY_LABELS } from '../constants/items'
import { PipetCharacter } from './PipetCharacter'
import { api } from '../api/client'
import { formatG } from '../utils/format'
import customersJson from '../data/customers.json'

type Temperament = 'impatient' | 'normal' | 'relaxed'
type CustomerType = 'normal' | 'budget' | 'wholesale'

interface Customer {
  id: string
  name: string
  desiredCategory: ItemCategory
  type: CustomerType
  isWholesale: boolean
  maxItemPriceG: number | null
  temperament: Temperament
  patienceMs: number
  arrivedAt: number
  reason: string
}

interface PipetShopEvent {
  id: string
  kind: 'sale' | 'no-sale'
  speech: string
  customerComment: string
  isCustomerCommentPending: boolean
}

interface ShopToast {
  id: string
  kind: 'sale' | 'no-sale'
  message: string
}

const CATEGORIES: ItemCategory[] = ['food', 'weapon', 'medicine', 'gem']
const BUDGET_CUSTOMER_RATE = 0.08
const WHOLESALE_RATE = 0.04
const BUDGET_CUSTOMER_MAX_ITEM_PRICE_G = 1000
const MAX_QUEUE = 10
const FIRST_ARRIVAL_DELAY_MS = 3500
const ARRIVAL_INTERVAL_MS = 45000
const CHECK_INTERVAL_MS = 500
const PIPET_EVENT_INTERVAL_MS = 4000
const PENDING_CUSTOMER_COMMENT_TEXT_SALE = 'お会計中……'
const PENDING_CUSTOMER_COMMENT_TEXT_NO_SALE = 'お見送り中……'

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

const CUSTOMER_DATA = customersJson as {
  titles: string[]
  names: string[]
  categoryReasons: Record<ItemCategory, string[]>
}
const CATEGORY_REASONS = CUSTOMER_DATA.categoryReasons
const CUSTOMER_TITLES = CUSTOMER_DATA.titles
const CUSTOMER_NAMES = CUSTOMER_DATA.names

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
  const roll = Math.random()
  const type: CustomerType = roll < BUDGET_CUSTOMER_RATE
    ? 'budget'
    : roll < BUDGET_CUSTOMER_RATE + WHOLESALE_RATE
      ? 'wholesale'
      : 'normal'
  return {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: pickCustomerName(),
    desiredCategory,
    type,
    isWholesale: type === 'wholesale',
    maxItemPriceG: type === 'budget' ? BUDGET_CUSTOMER_MAX_ITEM_PRICE_G : null,
    temperament,
    patienceMs: TEMPERAMENT_PATIENCE_MS[temperament],
    arrivedAt: 0,
    reason: pickReason(desiredCategory),
  }
}

function generateCustomerComment(customer: Customer, category: ItemCategory, kind: 'sale' | 'no-sale', purchasedText?: string): string {
  const categoryLabel = ITEM_CATEGORY_LABELS[category]
  if (kind === 'sale') {
    const variants = [
      `${purchasedText ?? '品物'}、ちょうど探していた雰囲気でした。次も${categoryLabel}を見に来ます。`,
      `品ぞろえが良くて助かりました。${categoryLabel}の棚、また期待しています。`,
      `見つかってよかったです。工房のセンス、仲間にも伝えておきますね。`,
    ]
    return `${customer.name}: ${variants[Math.floor(Math.random() * variants.length)]}`
  }

  const variants = [
    `${categoryLabel}を目当てに来たので、また棚をのぞきに来ます。`,
    `今日は見つからなかったけど、次回の入荷を楽しみにしています。`,
    `欲しい品はなかったですが、工房の雰囲気は良かったです。また来ます。`,
  ]
  return `${customer.name}: ${variants[Math.floor(Math.random() * variants.length)]}`
}

function ensureCustomerPrefix(customerName: string, rawComment: string): string {
  const comment = rawComment.trim()
  if (!comment) return `${customerName}:`
  const escapedName = customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const duplicatedPrefix = new RegExp(`^${escapedName}\\s*[:：]\\s*`)
  const body = comment.replace(duplicatedPrefix, '').trim()
  return `${customerName}: ${body}`
}

const hasApi = () => !!import.meta.env.VITE_GAS_URL

interface CustomerQueuePanelProps {
  embedded?: boolean
  onShopOpenChange?: (isOpen: boolean) => void
}

export function CustomerQueuePanel({ embedded = false, onShopOpenChange }: CustomerQueuePanelProps = {}) {
  const { saveData, setSaveData, addSalesLog } = useGame()
  const [queue, setQueue] = useState<Customer[]>([])
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [isOpen, setIsOpen] = useState(false)
  const [pipetEvent, setPipetEvent] = useState<PipetShopEvent | null>(null)
  const customerCommentRef = useRef<HTMLParagraphElement | null>(null)
  const [shopToast, setShopToast] = useState<ShopToast | null>(null)

  const displayedItems = useMemo(
    () => (saveData?.inventory ?? []).filter((item) => item.isDisplayed),
    [saveData?.inventory]
  )
  const hasAllCategoriesOnShelf = useMemo(() => {
    const categories = new Set<ItemCategory>()
    displayedItems.forEach((item) => {
      categories.add(item.category ?? getItemCategory(item.id))
    })
    return categories.size >= 4
  }, [displayedItems])

  const requestAiCustomerComment = async (
    eventId: string,
    customer: Customer,
    category: ItemCategory,
    kind: 'sale' | 'no-sale',
    fallbackComment: string,
    purchasedText?: string,
    quantity?: number,
    totalPriceG?: number,
  ) => {
    const finalizeCustomerComment = (commentText: string) => {
      setPipetEvent((prev) => {
        if (!prev || prev.id !== eventId) return prev
        return {
          ...prev,
          customerComment: commentText,
          isCustomerCommentPending: false,
        }
      })
    }

    if (!hasApi()) {
      finalizeCustomerComment(fallbackComment)
      return
    }
    try {
      const res = await api.shop.comment({
        userId: saveData?.userId,
        workshopName: saveData?.workshopName,
        customerName: customer.name,
        categoryName: ITEM_CATEGORY_LABELS[category],
        eventType: kind,
        purchasedItemText: purchasedText,
        quantity,
        customerReason: customer.reason,
        customerTemperament: TEMPERAMENT_LABEL[customer.temperament],
        customerType: customer.type,
        maxItemPriceG: customer.maxItemPriceG,
        totalPriceG,
        isWholesale: customer.isWholesale,
      })
      const comment = (res?.comment ?? '').trim()
      if (!comment) {
        finalizeCustomerComment(fallbackComment)
        return
      }
      finalizeCustomerComment(ensureCustomerPrefix(customer.name, comment))
    } catch (_err) {
      finalizeCustomerComment(fallbackComment)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const enqueueCustomer = () => {
      setQueue((prev) => {
        if (prev.length >= MAX_QUEUE) return prev
        return [...prev, createCustomer()]
      })
    }

    let intervalId: number | null = null
    const firstTimer = window.setTimeout(() => {
      enqueueCustomer()
      intervalId = window.setInterval(enqueueCustomer, ARRIVAL_INTERVAL_MS)
    }, FIRST_ARRIVAL_DELAY_MS)

    return () => {
      window.clearTimeout(firstTimer)
      if (intervalId != null) window.clearInterval(intervalId)
    }
  }, [isOpen])

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now())
    }, CHECK_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!pipetEvent || pipetEvent.isCustomerCommentPending) return
    const timer = window.setTimeout(() => {
      setPipetEvent(null)
    }, PIPET_EVENT_INTERVAL_MS)
    return () => window.clearTimeout(timer)
  }, [pipetEvent])

  useEffect(() => {
    if (!shopToast) return
    const timer = window.setTimeout(() => {
      setShopToast((prev) => (prev?.id === shopToast.id ? null : prev))
    }, 2400)
    return () => window.clearTimeout(timer)
  }, [shopToast])

  useEffect(() => {
    if (!pipetEvent || pipetEvent.isCustomerCommentPending) return
    customerCommentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [pipetEvent?.customerComment, pipetEvent?.isCustomerCommentPending, pipetEvent?.id])

  useEffect(() => {
    setQueue((prev) => {
      const front = prev[0]
      if (!front || front.arrivedAt > 0) return prev
      return [{ ...front, arrivedAt: Date.now() }, ...prev.slice(1)]
    })
  }, [queue])

  useEffect(() => {
    const front = queue[0]
    if (!front || front.arrivedAt <= 0 || pipetEvent) return

    const matches = displayedItems.filter((item) => {
      if ((item.category ?? getItemCategory(item.id)) !== front.desiredCategory) return false
      if (front.maxItemPriceG != null && getSellValue(item) > front.maxItemPriceG) return false
      return true
    })
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
      const totalCount = targets.length

      setSaveData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          g: prev.g + reward,
          inventory: prev.inventory.filter((item) => !targetIds.has(item.instanceId)),
        }
      })

      setQueue((prev) => (isOpen ? [...prev.slice(1), createCustomer()] : prev.slice(1)))
      const suffix = front.isWholesale
        ? `大口で${totalCount}個まとめ買い`
        : front.type === 'budget'
          ? `低予算客（${front.maxItemPriceG}G以下）・1個購入`
          : '1個購入'
      addSalesLog({
        category: front.desiredCategory,
        amountG: reward,
        note: `${front.name}が${purchasedItemText}を${totalCount}個購入（${suffix}）`,
      })
      const eventId = `sale-${Date.now()}`
      const fallbackComment = generateCustomerComment(front, front.desiredCategory, 'sale', purchasedItemText)
      setPipetEvent({
        id: eventId,
        kind: 'sale',
        speech: `${purchasedItemText}を${totalCount}個お買い上げいただきました♪ 合計 ${formatG(reward)} です。`,
        customerComment: PENDING_CUSTOMER_COMMENT_TEXT_SALE,
        isCustomerCommentPending: true,
      })
      setShopToast({
        id: `toast-${eventId}`,
        kind: 'sale',
        message: 'お買い上げです♪',
      })
      void requestAiCustomerComment(eventId, front, front.desiredCategory, 'sale', fallbackComment, purchasedItemText, totalCount, reward)
      return
    }

    const elapsed = nowMs - front.arrivedAt
    if (elapsed >= front.patienceMs) {
      setQueue((prev) => (isOpen ? [...prev.slice(1), createCustomer()] : prev.slice(1)))
      const eventId = `nosale-${Date.now()}`
      const fallbackComment = generateCustomerComment(front, front.desiredCategory, 'no-sale')
      setPipetEvent({
        id: eventId,
        kind: 'no-sale',
        speech: front.type === 'budget'
          ? `${ITEM_CATEGORY_LABELS[front.desiredCategory]}で${front.maxItemPriceG}G以下の商品が見つからないみたいです💦`
          : `${ITEM_CATEGORY_LABELS[front.desiredCategory]}の商品が足りてないみたいです💦`,
        customerComment: PENDING_CUSTOMER_COMMENT_TEXT_NO_SALE,
        isCustomerCommentPending: true,
      })
      setShopToast({
        id: `toast-${eventId}`,
        kind: 'no-sale',
        message: `${ITEM_CATEGORY_LABELS[front.desiredCategory]}が足りてないです……`,
      })
      void requestAiCustomerComment(eventId, front, front.desiredCategory, 'no-sale', fallbackComment)
    }
  }, [queue, displayedItems, nowMs, setSaveData, isOpen, addSalesLog, pipetEvent, saveData?.userId, saveData?.workshopName])

  const front = queue[0]
  const queueMeepleSlots = Array.from({ length: MAX_QUEUE }, (_, index) => queue[index] ?? null)
  const renderCustomerComment = (comment: string) => {
    const separatorIndex = comment.indexOf(': ')
    if (separatorIndex === -1) {
      return comment
    }
    const name = comment.slice(0, separatorIndex)
    const body = comment.slice(separatorIndex + 2)
    return (
      <>
        <strong className="pipet-customer-name">{name}</strong>: {body}
      </>
    )
  }
  const handleToggleShop = () => {
    setIsOpen((prev) => {
      const next = !prev
      if (!next) {
        setQueue([])
        setPipetEvent(null)
      }
      onShopOpenChange?.(next)
      return next
    })
  }

  return (
    <section className={`customer-queue-panel sidebar-section ${embedded ? 'embedded-shop-block' : ''}`.trim()}>
      <div className="shop-header-row">
        <div className="shop-header-title-cluster">
          <h2>🏠 お店の中</h2>
          <div className="customer-meeple-strip" aria-label={`お客様待機列 ${queue.length}人 / 最大${MAX_QUEUE}人`}>
            {queueMeepleSlots.map((customer, index) => (
              <span
                key={customer ? customer.id : `slot-${index}`}
                className={[
                  'customer-meeple-slot',
                  customer ? 'filled' : 'empty',
                  customer ? `category-${customer.desiredCategory}` : '',
                  customer?.isWholesale ? 'wholesale' : '',
                ].filter(Boolean).join(' ')}
                title={customer ? `${customer.name}（${ITEM_CATEGORY_LABELS[customer.desiredCategory]}）` : '空き'}
              >
                {customer?.isWholesale && <span className="customer-meeple-crown" aria-hidden>👑</span>}
                <span className="customer-meeple-token" aria-hidden />
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          className={[
            'shop-toggle-btn',
            isOpen ? 'close-action' : 'open-action',
            !isOpen && hasAllCategoriesOnShelf ? 'is-ready' : '',
          ].filter(Boolean).join(' ')}
          onClick={handleToggleShop}
        >
          {isOpen ? '店をしめる' : '店をあける'}
        </button>
      </div>
      <div className="shop-panel-body">
        {isOpen && shopToast && (
          <div className="shop-toast-stack" aria-live="polite">
            <div key={shopToast.id} className={`shop-toast ${shopToast.kind}`}>
              {shopToast.message}
            </div>
          </div>
        )}
        <p className="market-hint">お客さんにはピペットが応対します。<br />閉店中は新しいお客さんは来ません。</p>

      {!isOpen && (
        <div className="shop-closed-pipet-card">
          <PipetCharacter
            className="pipet-shop-closed"
            imageClassName="pipet-shop-full-image"
            bubbleClassName="pipet-shop-bubble"
            message="閉店中です。開店したら、お客様のご案内をはじめますね"
            subMessage="商品だなに商品をそろえてから『店をあける』を押してね"
          />
        </div>
      )}

      {isOpen && front && (
        <div className="front-customer-card">
          {front.type === 'budget' && <span className="customer-corner-ribbon budget">低予算</span>}
          {front.isWholesale && <span className="customer-corner-ribbon wholesale">大口</span>}
          <div className="front-line-1">
            <span className={`customer-name category-text-${front.desiredCategory}`}>
              先頭: {front.name}（{ITEM_CATEGORY_LABELS[front.desiredCategory]}希望）
            </span>
            <span className={`temperament-badge temperament-${front.temperament}`}>{TEMPERAMENT_LABEL[front.temperament]}</span>
          </div>
          <p className="customer-reason">用件: {front.reason}</p>
          <p className="customer-speech">{getPatienceHint(front, nowMs)}</p>
        </div>
      )}

      {isOpen && (
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
      )}

        {isOpen && pipetEvent && (
          <div
            className={`shop-event-modal-backdrop ${embedded ? 'embedded' : ''}`.trim()}
            role="dialog"
            aria-modal={embedded ? undefined : 'true'}
            aria-live="polite"
            aria-label={pipetEvent.kind === 'sale' ? '売却イベント' : 'お客様退店イベント'}
          >
            <div className={`shop-event-modal-card ${pipetEvent.kind}`}>
              <div className="shop-event-modal-header">
                <span className={`shop-event-kind-badge ${pipetEvent.kind}`}>
                  {pipetEvent.kind === 'sale' ? 'ご購入' : 'お帰り'}
                </span>
                <span className="shop-event-wait-text">次のお客様のご案内まで少し間を置きます…</span>
              </div>
              <PipetCharacter
                className="pipet-shop-event"
                imageClassName="pipet-shop-full-image"
                bubbleClassName={`pipet-shop-bubble ${pipetEvent.kind === 'sale' ? 'success' : 'warn'}`}
                message={pipetEvent.speech}
              />
              <p className="pipet-customer-comment-label">お客様の反応</p>
              <p
                key={pipetEvent.id}
                ref={customerCommentRef}
                className="pipet-customer-comment"
              >
                {renderCustomerComment(pipetEvent.customerComment)}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
