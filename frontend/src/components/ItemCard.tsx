import { useState, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import type { InventoryItem, ItemCategory } from '../types'
import { ITEMS_DB, getItemCategory, ITEM_CATEGORY_LABELS } from '../constants/items'
import { ItemIconSvg } from './ItemIconSvg'
import { formatG } from '../utils/format'

export interface ItemDisplayMinimal {
  id: string
  name: string
  icon: string
  tier?: number
  flavor?: string
  category?: ItemCategory
  svgPath?: string
  svgFill?: string
}

interface ItemCardProps {
  item: InventoryItem | ItemDisplayMinimal
  onClick?: () => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  price?: number
  value?: number
  IconComponent?: React.ComponentType<{ itemId: string; className?: string }>
}

const TIER_LABELS: Record<number, string> = {
  0: 'ざいりょう',
  1: 'ふつう',
  2: 'いいもの',
  3: 'すごい',
  4: 'でんせつ',
}

export function ItemCard({
  item,
  onClick,
  draggable = false,
  onDragStart,
  price,
  value,
  IconComponent,
}: ItemCardProps) {
  const [showPopup, setShowPopup] = useState(false)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})
  const cardRef = useRef<HTMLDivElement>(null)

  const meta = ITEMS_DB[item.id] ?? { name: item.name, icon: item.icon, flavor: undefined }
  const tier = item.tier ?? meta.tier ?? 0
  const tierLabel = TIER_LABELS[tier] ?? `すごさ${tier}`
  const category = item.category ?? meta.category ?? getItemCategory(item.id)
  const flavor = meta.flavor ?? ('flavor' in item ? item.flavor : undefined) ?? ('description' in item ? item.description : undefined)
  const IconRender = IconComponent ?? ItemIconSvg
  const inlineSvg = 'svgPath' in item && item.svgPath ? { path: item.svgPath, fill: item.svgFill } : undefined

  useLayoutEffect(() => {
    if (!showPopup) return
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const popupHeight = 120
    const margin = 8
    const showAbove = rect.top > popupHeight + margin
    setPopupStyle({
      position: 'fixed',
      left: rect.left + rect.width / 2,
      top: showAbove ? rect.top - margin : rect.bottom + margin,
      transform: showAbove ? 'translate(-50%, -100%)' : 'translateX(-50%)',
    })
  }, [showPopup])

  const handleMouseEnter = () => setShowPopup(true)
  const handleMouseLeave = () => setShowPopup(false)

  const popupContent = showPopup && (
    <div
      className="item-card-popup item-card-popup-portal"
      style={popupStyle}
      role="tooltip"
    >
      <div className="item-card-popup-name">{meta.name}</div>
      <div className="item-card-popup-value">すごさ: {tierLabel}</div>
      <div className="item-card-popup-value">カテゴリ: {ITEM_CATEGORY_LABELS[category]}</div>
      {price != null && (
        <div className="item-card-popup-price">ねだん: {formatG(price)}</div>
      )}
      {value != null && (
        <div className="item-card-popup-value">{formatG(value)}</div>
      )}
      {flavor && (
        <div className="item-card-popup-flavor">{flavor}</div>
      )}
    </div>
  )

  return (
    <>
      <div
        ref={cardRef}
        className={`item-card tier-${tier} category-${category}`}
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="item-card-icon-wrap">
          <IconRender itemId={item.id} className="item-icon item-icon-svg" svgPath={inlineSvg?.path} svgFill={inlineSvg?.fill} fallbackIcon={meta.icon} />
        </span>
        <span className="item-card-name">{meta.name}</span>
        {price != null && (
          <span className="item-card-price">ねだん: {formatG(price)}</span>
        )}
        {value != null && (
          <span className="item-card-value">{formatG(value)}</span>
        )}
        <span className="tier-badge">{tierLabel}</span>
      </div>
      {showPopup && createPortal(popupContent, document.body)}
    </>
  )
}
