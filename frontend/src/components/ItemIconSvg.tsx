/**
 * アイテムをSVGアイコンで表示するコンポーネント。
 * 1) 事前定義SVG 2) AI生成SVG（discoveredSvgIcons） 3) 絵文字フォールバック
 * 各アイコンは物が分かりやすいよう詳細にデザイン
 */
import type { ReactNode } from 'react'
import { ITEMS_DB } from '../constants/items'
import { useGame } from '../contexts/GameContext'

const VIEWBOX = '0 0 24 24'
const ITEM_ID_ALIASES: Record<string, string> = {
  slime: 'mysterious_meat',
  mystery_meat: 'mysterious_meat',
  iron_ore: 'crude_weapon',
  shabby_gear: 'crude_weapon',
}

const SVG_ICONS: Record<string, ReactNode> = {
  // === 素材 tier 0 ===
  herb: (
    <g>
      <path fill="#2e7d32" d="M12 22v-4l-2-2-1-4 1-2 2-1 2 1 1 2-1 4-2 2v4z" />
      <path fill="#4caf50" d="M12 11l-1-4 1-2 2 1v2l-2 3z" />
      <path fill="#66bb6a" d="M12 11l2-3V6l2-1 1 2-1 4-2 2z" />
      <path fill="#1b5e20" d="M11 8l1 1 1-1-1-2z" />
    </g>
  ),
  water: (
    <g>
      <path fill="#42a5f5" d="M12 2C8 6 6 10 6 14c0 3.3 2.7 6 6 6s6-2.7 6-6c0-4-2-8-6-12z" />
      <path fill="#90caf9" d="M12 6c2 2.5 2 5 2 8 0 2.2-1.8 4-4 4s-4-1.8-4-4c0-3 .5-5.5 2-8h4z" opacity="0.6" />
    </g>
  ),
  mysterious_meat: (
    <g>
      <path fill="#8d3b2f" d="M4 14c0-4 4-8 9-8 4 0 7 2 7 6 0 5-4 8-9 8-4 0-7-2-7-6z" />
      <path fill="#b84c3e" d="M6 14c0-3 3-6 7-6 3 0 5 2 5 4 0 4-3 6-7 6-3 0-5-1-5-4z" />
      <ellipse cx="10" cy="12" rx="1.8" ry="1.2" fill="#d97a6d" opacity="0.7" />
      <ellipse cx="14.5" cy="15.5" rx="2.2" ry="1.4" fill="#d97a6d" opacity="0.65" />
      <circle cx="18" cy="9" r="2" fill="#f5e7c8" />
      <circle cx="18" cy="9" r="1.1" fill="#fff6df" />
    </g>
  ),
  fire_stone: (
    <g>
      <path fill="#5d4037" d="M6 16l2-4 2 2 2-2 2 4 2 2H4l2-2z" />
      <path fill="#8d6e63" d="M8 12l2 2 2-2 2 2-1 4H9l-1-4 2-2z" />
      <path fill="#ff5722" d="M12 4l1 3 2 1-1 2 1 2-2-1-1-3-1 1z" />
      <path fill="#ff9800" d="M12 4l-1 3-2 1 1 2-1 2 2-1 1-3 1 1z" />
    </g>
  ),
  magic_sand: (
    <g>
      <circle cx="8" cy="9" r="2.5" fill="#ffc107" />
      <circle cx="16" cy="8" r="2" fill="#ffca28" />
      <circle cx="12" cy="15" r="2.5" fill="#ffb300" />
      <circle cx="12" cy="8" r="1" fill="#ffeb3b" opacity="0.9" />
      <circle cx="10" cy="12" r="1.2" fill="#ffca28" opacity="0.8" />
    </g>
  ),
  feather: (
    <g>
      <path fill="#8d6e63" d="M12 3l-6 18h2l2-6 2 6h2l-2-6 2 6h2L12 3z" />
      <path fill="#6d4c41" d="M11 5l-4 12h1l3-9z" />
      <path fill="#a1887f" d="M12 5l1 7-1 5h1l2-6z" />
    </g>
  ),
  crude_weapon: (
    <g>
      <path fill="#546e7a" d="M5 9h14l-1 10H6L5 9z" />
      <path fill="#78909c" d="M6 10h12v2l-1 6H7l-1-6v-2z" />
      <path fill="#37474f" d="M8 12h2v4H8zm6 0h2v4h-2z" />
      <path fill="#607d8b" d="M5 9l2-3h10l2 3H5z" />
    </g>
  ),
  dark_dust: (
    <g>
      <circle cx="12" cy="12" r="8" fill="#263238" />
      <circle cx="9" cy="10" r="1.5" fill="#37474f" opacity="0.8" />
      <circle cx="15" cy="9" r="1" fill="#455a64" opacity="0.6" />
      <circle cx="12" cy="14" r="1.5" fill="#546e7a" opacity="0.7" />
      <circle cx="10" cy="14" r="0.8" fill="#37474f" opacity="0.5" />
    </g>
  ),
  elec_stone: (
    <g>
      <path fill="#78909c" d="M8 6h8v12H8l4-6 2 4h2l-4-8 2-2z" />
      <path fill="#ffc107" d="M14 4l-4 8h3l-2 6 6-10h-3l2-4z" />
    </g>
  ),
  // === 生成物 tier 1 ===
  potion: (
    <g>
      <path fill="#e1bee7" d="M9 3h6v2H9z" />
      <path fill="#ce93d8" d="M8 5h8v2l-1 12c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2L8 7v-2z" />
      <path fill="#e91e63" d="M9 7h6v10c0 .6-.4 1-1 1h-4c-.6 0-1-.4-1-1V7z" />
      <path fill="#f48fb1" d="M10 8h4v2h-4z" opacity="0.6" />
    </g>
  ),
  poison: (
    <g>
      <path fill="#4a148c" d="M8 4h8v2l-1 14c0 1.1-.9 2-2 2H11c-1.1 0-2-.9-2-2L8 6V4z" />
      <path fill="#7b1fa2" d="M9 6h6v12c0 .6-.4 1-1 1h-4c-.6 0-1-.4-1-1V6z" />
      <path fill="#212121" d="M11 9c-1 1-1 2 0 3s2 1 3 0 1-2 0-3-2-1-3 0z" />
      <path fill="#424242" d="M13 10c-.3.3-.3.7 0 1 .3.3.7.3 1 0 .3-.3.3-.7 0-1-.3-.3-.7-.3-1 0z" />
    </g>
  ),
  bomb: (
    <g>
      <circle cx="12" cy="14" r="8" fill="#424242" />
      <path fill="#212121" d="M12 4v4l2 1-1 2" stroke="#616161" strokeWidth="0.5" />
      <circle cx="14" cy="8" r="0.8" fill="#ff5722" />
      <path fill="#757575" d="M10 6h4v1h-4z" />
      <ellipse cx="12" cy="14" rx="2" ry="1" fill="#616161" opacity="0.5" />
    </g>
  ),
  steam: (
    <g fill="#b0bec5" opacity="0.9">
      <ellipse cx="8" cy="16" rx="3" ry="2" />
      <ellipse cx="16" cy="15" rx="2.5" ry="1.5" />
      <ellipse cx="12" cy="12" rx="2" ry="1" opacity="0.8" />
      <ellipse cx="10" cy="9" rx="1.5" ry="0.8" opacity="0.6" />
      <ellipse cx="14" cy="10" rx="1.2" ry="0.6" opacity="0.6" />
    </g>
  ),
  glass: (
    <g>
      <path fill="#90a4ae" d="M7 4h10v2l1 12c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2L7 6V4z" />
      <path fill="#b0bec5" d="M8 6h8v12c0 .6-.4 1-1 1H9c-.6 0-1-.4-1-1V6z" />
      <path fill="#eceff1" d="M9 8h6v8H9z" opacity="0.6" />
    </g>
  ),
  jewel: (
    <g>
      <path fill="#7e57c2" d="M12 2l5 9 2 9h-14l2-9 5-9z" />
      <path fill="#9575cd" d="M12 5l3 6 1 6h-8l1-6 3-6z" />
      <path fill="#b39ddb" d="M12 8l2 4v4h-4v-4l2-4z" />
    </g>
  ),
  holy_water: (
    <g>
      <path fill="#e3f2fd" d="M9 3h6v2c0 1-1 2-3 2s-3-1-3-2V3z" />
      <path fill="#bbdefb" d="M8 5h8v2l-1 12c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2L8 7V5z" />
      <path fill="#e1f5fe" d="M9 7h6v10c0 .6-.4 1-1 1h-4c-.6 0-1-.4-1-1V7z" />
      <path fill="#fff" d="M11 9h2v2l-1 2-1-2V9z" opacity="0.8" />
    </g>
  ),
  wing: (
    <g>
      <path fill="#fff" d="M4 12c2-4 4-6 8-6s6 2 8 6c-1 2-3 4-6 6-3-2-5-4-7-6z" stroke="#e0e0e0" strokeWidth="0.5" />
      <path fill="#f5f5f5" d="M6 12c1.5-2.5 3-4 6-4s4.5 1.5 6 4c-.5 1-2 2-4 3-2-1-3.5-2-4-3z" />
    </g>
  ),
  ingot: (
    <g>
      <path fill="#78909c" d="M4 10h16v6c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2v-6z" />
      <path fill="#90a4ae" d="M5 11h14v4c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-4z" />
      <path fill="#607d8b" d="M6 12h12v1H6z" />
    </g>
  ),
  thunder: (
    <g>
      <path fill="#ffc107" d="M13 2L9 10h4l-2 10 8-12h-4l2-6z" />
    </g>
  ),
  dark_matter: (
    <g>
      <circle cx="12" cy="12" r="9" fill="#1a1a2e" />
      <path fill="#16213e" d="M6 8c2 2 4 4 6 4s4-2 6-4" opacity="0.8" />
      <circle cx="10" cy="12" r="1" fill="#0f3460" />
      <circle cx="14" cy="11" r="0.8" fill="#533483" />
      <circle cx="12" cy="15" r="1.2" fill="#16213e" />
    </g>
  ),
  // === tier 2 ===
  high_potion: (
    <g>
      <path fill="#c8e6c9" d="M9 2h6v2l1 1v2H8V5l1-1V2z" />
      <path fill="#81c784" d="M8 6h8v2l-1 12c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2L8 8V6z" />
      <path fill="#4caf50" d="M9 8h6v10c0 .6-.4 1-1 1h-4c-.6 0-1-.4-1-1V8z" />
      <path fill="#66bb6a" d="M11 10h2v2h-2z" opacity="0.7" />
    </g>
  ),
  big_bomb: (
    <g>
      <path fill="#ff5722" d="M12 6c-4 0-6 4-6 8 0 3 2 4 6 4s6-1 6-4c0-4-2-8-6-8z" />
      <path fill="#ff9800" d="M10 12c0 1 1 2 2 2s2-1 2-2" />
      <path fill="#424242" d="M12 2v4l2 1" stroke="#616161" strokeWidth="0.5" />
      <circle cx="14" cy="6" r="0.6" fill="#ffeb3b" />
    </g>
  ),
  elixir: (
    <g>
      <path fill="#ffd54f" d="M9 2h6v3l1 1v2H8V6l1-1V2z" />
      <path fill="#ffca28" d="M8 6h8v2l-1 12c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2L8 8V6z" />
      <path fill="#ffc107" d="M9 8h6v10c0 .6-.4 1-1 1h-4c-.6 0-1-.4-1-1V8z" />
      <path fill="#ffeb3b" d="M10 10h4v2l-2 4-2-4V10z" opacity="0.8" />
    </g>
  ),
  hourglass: (
    <g>
      <path fill="#8d6e63" d="M6 2h12v4l-4 6 4 6v4H6v-4l4-6-4-6V2z" />
      <path fill="#d7ccc8" d="M8 6h8v2l-4 6 4 2v2H8v-2l4-2-4-6V6z" />
      <path fill="#5d4037" d="M12 8l-2 4 2 4 2-4-2-4z" />
    </g>
  ),
  sword: (
    <g>
      <path fill="#90a4ae" d="M11 2h2v6l2 2-2 2v2l-2 4h2l2-4v-2l2-2-2-2V2h2l-1 4 2 2-2 2 1 4h-2l-2-4V8l-2-2 2-2V2z" />
      <path fill="#b0bec5" d="M12 4v4l1 1 1-1V4h-2z" />
      <path fill="#78909c" d="M11 14h2v6h-2z" />
    </g>
  ),
  angel: (
    <g>
      <path fill="#fff" d="M12 2c-2 0-4 2-4 5 0 2 1 4 4 6 3-2 4-4 4-6 0-3-2-5-4-5z" stroke="#e0e0e0" strokeWidth="0.5" />
      <circle cx="12" cy="6" r="2" fill="#ffccbc" />
      <path fill="#fff" d="M4 12c1-1 3-2 8-2s7 1 8 2" stroke="#e0e0e0" strokeWidth="0.5" />
    </g>
  ),
  demon: (
    <g>
      <path fill="#4a148c" d="M12 2c2 0 4 2 4 5 0 2-1 4-4 6-3-2-4-4-4-6 0-3 2-5 4-5z" />
      <path fill="#7b1fa2" d="M10 5h4v4h-4z" />
      <path fill="#212121" d="M10 7h1v1h-1zm3 0h1v1h-1z" />
      <path fill="#4a148c" d="M4 14c1 0 3-1 8-1s7 1 8 1" />
    </g>
  ),
  robot: (
    <g>
      <path fill="#78909c" d="M6 4h12v6h-2V6H8v4H6V4z" />
      <rect x="8" y="10" width="8" height="8" fill="#90a4ae" />
      <path fill="#37474f" d="M10 12h2v2h-2zm6 0h2v2h-2z" />
      <path fill="#ffc107" d="M12 14h2v2h-2z" />
    </g>
  ),
  light_bulb: (
    <g>
      <path fill="#fff9c4" d="M12 2c-3 0-5 2.5-5 5.5 0 2 1 4 3 5v2h4v-2c2-1 3-3 3-5 0-3-2-5.5-5-5.5z" />
      <path fill="#ffeb3b" d="M12 4c2 0 3 1.5 3 3.5 0 1.5-.5 3-2 4v1h-2v-1c-1.5-1-2-2.5-2-4 0-2 1-3.5 3-3.5z" />
      <path fill="#78909c" d="M10 18h4v2h-4z" />
      <path fill="#5d4037" d="M9 20h6v2H9z" />
    </g>
  ),
  // === tier 3 ===
  philosopher_stone: (
    <g>
      <circle cx="12" cy="12" r="10" fill="#c62828" />
      <circle cx="12" cy="12" r="7" fill="#e53935" />
      <circle cx="12" cy="12" r="4" fill="#ffeb3b" opacity="0.9" />
      <circle cx="11" cy="11" r="1" fill="#fff" opacity="0.6" />
    </g>
  ),
  hero: (
    <g>
      <path fill="#ffc107" d="M12 2l2 4 2 2-1 2 1 4-2 1-2-3-2 3-2-1 1-4-1-2 2-2 2-4z" />
      <path fill="#ffd54f" d="M12 5l1 2-1 2-1-2 1-2z" />
    </g>
  ),
  maou: (
    <g>
      <path fill="#4a148c" d="M12 2l-2 4H6l3 2-1 4 4-3 4 3-1-4 3-2h-4l-2-4z" />
      <path fill="#7b1fa2" d="M12 6l1 2-1 2-1-2 1-2z" />
      <path fill="#212121" d="M11 10h2v4h-2z" />
    </g>
  ),
}

interface ItemIconSvgProps {
  itemId: string
  className?: string
  /** インラインSVG（日替わりアイテムなどAPIから渡される） */
  svgPath?: string
  svgFill?: string
  /** フォールバック用（日替わり・錬金生成物などITEMS_DBにない場合の絵文字） */
  fallbackIcon?: string
}

export function ItemIconSvg({ itemId, className, svgPath: inlinePath, svgFill: inlineFill, fallbackIcon: propFallback }: ItemIconSvgProps) {
  const { saveData } = useGame()
  const normalizedItemId = ITEM_ID_ALIASES[itemId] ?? itemId
  const svgContent = SVG_ICONS[normalizedItemId]
  const aiSvg = saveData?.discoveredSvgIcons?.[itemId]
  const fallbackIcon = propFallback ?? ITEMS_DB[itemId]?.icon ?? '❓'

  // 1) インラインSVG（日替わりなどAPI経由で渡されたもの）最優先
  if (inlinePath) {
    return (
      <svg
        className={className}
        viewBox={VIEWBOX}
        width="24"
        height="24"
        role="img"
        aria-hidden
      >
        <path d={inlinePath} fill={inlineFill || '#666'} />
      </svg>
    )
  }

  // 2) 事前定義SVG
  if (svgContent) {
    return (
      <svg
        className={className}
        viewBox={VIEWBOX}
        width="24"
        height="24"
        role="img"
        aria-hidden
      >
        {svgContent}
      </svg>
    )
  }

  // 3) AI生成SVG（錬金で新規作成されたアイテム用）
  if (aiSvg?.path) {
    return (
      <svg
        className={className}
        viewBox={VIEWBOX}
        width="24"
        height="24"
        role="img"
        aria-hidden
      >
        <path d={aiSvg.path} fill={aiSvg.fill || '#666'} />
      </svg>
    )
  }

  // 4) 絵文字フォールバック
  return <span className={className} style={{ fontSize: '1.5rem' }}>{fallbackIcon}</span>
}
