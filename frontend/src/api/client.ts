// GAS API クライアント（外形）
// デプロイ後、VITE_GAS_URL に GAS WebアプリURLを設定
// GASは単一URLのため、path をクエリ（GET）または body（POST）で渡す
// 開発時はプロキシ経由で CORS を回避

const GAS_URL = import.meta.env.VITE_GAS_URL || ''
const useProxy = import.meta.env.DEV && GAS_URL

interface FetchApiOptions extends Omit<RequestInit, 'body'> {
  body?: object
}

async function fetchApi<T>(path: string, options: FetchApiOptions = {}): Promise<T> {
  const [pathPart, query] = path.split('?')
  const pathParam = `path=${encodeURIComponent(pathPart)}`
  const url = useProxy
    ? `/api/${path}`
    : GAS_URL
      ? `${GAS_URL}?${pathParam}${query ? '&' + query : ''}`
      : `/api/${path}`
  const { body: bodyObj, ...restOptions } = options
  const bodyStr = bodyObj ? JSON.stringify(bodyObj) : undefined
  const headers = new Headers(restOptions.headers || {})
  if (bodyStr && !headers.has('Content-Type')) {
    // GAS cross-origin calls must stay "simple request" to avoid OPTIONS preflight.
    headers.set('Content-Type', 'text/plain;charset=utf-8')
  }
  const res = await fetch(url, {
    ...restOptions,
    body: bodyStr,
    headers,
  })
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  auth: {
    login: (userName: string, workshopName: string) =>
      fetchApi<{ userId: string; folderId: string; g: number }>('auth/login', {
        method: 'POST',
        body: { path: 'auth/login', userName, workshopName },
      }),
  },
  save: {
    get: (userId: string) => fetchApi<{ data: object }>(`save?userId=${userId}`),
    post: (userId: string, data: object) =>
      fetchApi<{ ok: boolean }>('save', { method: 'POST', body: { path: 'save', userId, ...data } }),
  },
  market: {
    get: (userId: string) =>
      fetchApi<{ basic: object[]; daily: object[]; dailySource?: 'ai' | 'fallback' }>(`market?userId=${userId}`),
    purchase: (userId: string, itemId: string, quantity: number) =>
      fetchApi<{ ok: boolean; g: number }>('market/purchase', {
        method: 'POST',
        body: { path: 'market/purchase', userId, itemId, quantity },
      }),
    sell: (userId: string, instanceId: string) =>
      fetchApi<{ ok: boolean; g: number; value: number }>('market/sell', {
        method: 'POST',
        body: { path: 'market/sell', userId, instanceId },
      }),
  },
  alchemy: {
    execute: (
      userId: string,
      ingredients: [string, string] | [{ id: string; name: string }, { id: string; name: string }],
      pace: string,
      knownRecipes?: Array<{ id: string; ingredients: [string, string]; result: string; pace?: string; resultName?: string; resultIcon?: string; resultFlavor?: string; resultValue?: number; resultTier?: number; resultQuality?: string; resultCategory?: 'food' | 'weapon' | 'medicine' | 'gem' }>
    ) =>
      fetchApi<object>('alchemy', {
        method: 'POST',
        body: { path: 'alchemy', userId, ingredients, pace, knownRecipes: knownRecipes ?? [] },
      }),
  },
  missions: {
    get: (userId: string) =>
      fetchApi<{ missions: object[]; missionsSource?: 'ai' | 'fallback' }>(`missions?userId=${userId}`),
    complete: (
      userId: string,
      missionId: string,
      instanceId: string,
      options?: { itemId?: string; itemName?: string; missionTitle?: string; missionDescription?: string; baseRewardG?: number }
    ) =>
      fetchApi<{ ok: boolean; rewardG: number; feedback?: string }>('missions/complete', {
        method: 'POST',
        body: {
          path: 'missions/complete',
          userId,
          missionId,
          instanceId,
          ...options,
        },
      }),
  },
  recipes: {
    get: (userId: string) =>
      fetchApi<{ recipes: object[] }>(`recipes?userId=${userId}`),
  },
  shop: {
    comment: (payload: {
      userId?: string
      workshopName?: string
      customerName: string
      categoryName: string
      eventType: 'sale' | 'no-sale'
      purchasedItemText?: string
      quantity?: number
      customerReason?: string
      customerTemperament?: string
      totalPriceG?: number
      isWholesale?: boolean
    }) =>
      fetchApi<{ ok: boolean; source?: 'ai' | 'fallback'; comment: string }>('shop/comment', {
        method: 'POST',
        body: { path: 'shop/comment', ...payload },
      }),
  },
}
