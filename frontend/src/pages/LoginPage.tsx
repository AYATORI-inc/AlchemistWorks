import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'
import { defaultSaveData } from '../contexts/GameContext'
import type { SaveData } from '../types'
import { api } from '../api/client'
import { resolveItemCategory } from '../constants/items'
import { PipetCharacter } from '../components/PipetCharacter'

const hasApi = () => !!import.meta.env.VITE_GAS_URL

function sanitizeProfileText(value: string) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 24)
}

function hasExistingProgress(data: Record<string, unknown>) {
  const inventory = Array.isArray(data.inventory) ? data.inventory : []
  const recipes = Array.isArray(data.recipes) ? data.recipes : []
  const achievements = Array.isArray(data.achievements) ? data.achievements : []
  const userName = typeof data.userName === 'string' ? data.userName.trim() : ''
  const workshopName = typeof data.workshopName === 'string' ? data.workshopName.trim() : ''
  const g = typeof data.g === 'number' ? data.g : 0
  const rank = typeof data.rank === 'number' ? data.rank : 1
  const totalSalesG = typeof data.totalSalesG === 'number' ? data.totalSalesG : 0
  const totalSalesCount = typeof data.totalSalesCount === 'number' ? data.totalSalesCount : 0
  const alchemyCount = typeof data.alchemyCount === 'number' ? data.alchemyCount : 0
  const missionCompletedCount = typeof data.missionCompletedCount === 'number' ? data.missionCompletedCount : 0

  return Boolean(
    userName ||
    workshopName ||
    inventory.length > 0 ||
    recipes.length > 0 ||
    achievements.length > 0 ||
    g > 0 ||
    rank > 1 ||
    totalSalesG > 0 ||
    totalSalesCount > 0 ||
    alchemyCount > 0 ||
    missionCompletedCount > 0
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isNewGame = location.pathname === '/login/new'
  const { setSaveData } = useGame()
  const [userName, setUserName] = useState('')
  const [workshopName, setWorkshopName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [duplicateConfirm, setDuplicateConfirm] = useState<{ userName: string; workshopName: string } | null>(null)

  const pipetSpeech = isNewGame
    ? 'はじめまして♪ あなたのお名前と工房名を教えてください！'
    : 'おかえりなさい♪ 確認のため、お名前と工房名を教えてください！'
  const pipetSubSpeech = userName.trim() || workshopName.trim()
    ? `確認中: ${userName.trim() || '（お名前）'} / ${workshopName.trim() || '（工房名）'}`
    : '入力してもらえたら、すぐに工房へ案内するよ'

  const loadContinueSave = async (sanitizedUserName: string, sanitizedWorkshopName: string) => {
    if (hasApi()) {
      const res = await api.auth.login(sanitizedUserName, sanitizedWorkshopName)
      const saveRes = await api.save.get(res.userId)
      const data = saveRes.data as Record<string, unknown>
      const loadedInventory = ((data.inventory as typeof defaultSaveData.inventory) ?? []).map((item) => ({
        ...item,
        category: resolveItemCategory({
          id: item.id,
          name: item.name,
          description: item.description,
          category: item.category,
        }),
      }))
      const loadedRecipes = ((data.recipes as typeof defaultSaveData.recipes) ?? []).map((recipe) => ({
        ...recipe,
        resultCategory: recipe.resultCategory ?? resolveItemCategory({
          id: recipe.result,
          name: recipe.resultName,
          description: recipe.resultFlavor,
          ingredientIds: recipe.ingredients,
        }),
      }))
      const saveData = {
        ...defaultSaveData,
        userId: res.userId,
        userName: (data.userName as string) || sanitizedUserName,
        workshopName: (data.workshopName as string) || sanitizedWorkshopName,
        g: (data.g as number) ?? res.g,
        inventory: loadedInventory,
        recipes: loadedRecipes,
        achievements: (data.achievements as typeof defaultSaveData.achievements) ?? [],
        rank: (data.rank as number) ?? 1,
        lastLoginDate: (data.lastLoginDate as string) ?? defaultSaveData.lastLoginDate,
        alchemyCount: (data.alchemyCount as number) ?? 0,
        missionCompletedCount: (data.missionCompletedCount as number) ?? 0,
        totalSalesG: (data.totalSalesG as number) ?? 0,
        totalSalesCount: (data.totalSalesCount as number) ?? 0,
        dailySalesLedger: (data.dailySalesLedger as SaveData['dailySalesLedger']) ?? defaultSaveData.dailySalesLedger,
        discoveredSvgIcons: (data.discoveredSvgIcons as SaveData['discoveredSvgIcons']) ?? {},
      }
      setSaveData(saveData)
    } else {
      const saveData = {
        ...defaultSaveData,
        userId: `user-${Date.now()}`,
        userName: sanitizedUserName,
        workshopName: sanitizedWorkshopName,
        inventory: [],
      }
      setSaveData(saveData)
    }
    navigate('/game')
  }

  const handleDuplicateConfirmContinue = async () => {
    if (!duplicateConfirm) return
    setError('')
    setIsLoading(true)
    try {
      await loadContinueSave(duplicateConfirm.userName, duplicateConfirm.workshopName)
      setDuplicateConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'つうしんができなかった')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const sanitizedUserName = sanitizeProfileText(userName)
    const sanitizedWorkshopName = sanitizeProfileText(workshopName)
    setUserName(sanitizedUserName)
    setWorkshopName(sanitizedWorkshopName)
    if (!sanitizedUserName || !sanitizedWorkshopName) return
    setError('')
    setDuplicateConfirm(null)
    setIsLoading(true)

    try {
      if (isNewGame) {
        if (hasApi()) {
          const res = await api.auth.login(sanitizedUserName, sanitizedWorkshopName)
          const saveRes = await api.save.get(res.userId)
          const existingData = saveRes.data as Record<string, unknown>
          if (hasExistingProgress(existingData)) {
            setDuplicateConfirm({ userName: sanitizedUserName, workshopName: sanitizedWorkshopName })
            return
          }
          const saveData = {
            ...defaultSaveData,
            userId: res.userId,
            userName: sanitizedUserName,
            workshopName: sanitizedWorkshopName,
            g: res.g,
            inventory: [],
          }
          setSaveData(saveData)
        } else {
          const saveData = {
            ...defaultSaveData,
            userId: `user-${Date.now()}`,
            userName: sanitizedUserName,
            workshopName: sanitizedWorkshopName,
            inventory: [],
          }
          setSaveData(saveData)
        }
        navigate('/game')
      } else {
        await loadContinueSave(sanitizedUserName, sanitizedWorkshopName)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'つうしんができなかった')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-scene">
      <div className="login-page">
        <div className="login-ledger-shell">
          <div className="login-ledger-pane">
            <section className="login-intro-panel">
              <p className="login-kicker">{isNewGame ? 'NEW WORKSHOP REGISTRATION' : 'WORKSHOP CHECK-IN'}</p>
              <h1>{isNewGame ? '工房をひらこう' : '工房にもどろう'}</h1>
              <p className="login-lead">
                {isNewGame
                  ? '名前と工房の名前をきめると、ホムンクルスのピペットが工房へ案内してくれます。'
                  : '名前と工房名を入れて、いつもの工房にもどります。'}
              </p>
              <PipetCharacter
                className="pipet-login-card"
                imageClassName="pipet-login-image"
                bubbleClassName="pipet-login-bubble"
                message={pipetSpeech}
                subMessage={pipetSubSpeech}
              />
            </section>

            <section className="login-form-panel" aria-label="名前と工房名の入力">
              <div className="login-form-panel-header">
                <h2>工房の登録帳</h2>
                <p>あとで続きから入るときも同じ名前を使うよ</p>
              </div>
              <form onSubmit={handleSubmit} className="login-form">
                <label>
                  名前
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(sanitizeProfileText(e.target.value))}
                    placeholder="あなたの名前"
                    maxLength={24}
                    required
                  />
                </label>
                <label>
                  工房名
                  <input
                    type="text"
                    value={workshopName}
                    onChange={(e) => setWorkshopName(sanitizeProfileText(e.target.value))}
                    placeholder="例：ひだりの工房"
                    maxLength={24}
                    required
                  />
                </label>
                {error && <p className="error-text">{error}</p>}
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'まっています…' : isNewGame ? '工房をひらく' : 'あそびにいく'}
                </button>
              </form>
              <Link to="/" className="back-link">← もどる</Link>
            </section>
          </div>
        </div>
      </div>

      {duplicateConfirm && (
        <div
          className="recipe-modal-backdrop login-duplicate-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="duplicate-login-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isLoading) setDuplicateConfirm(null)
          }}
        >
          <div className="login-duplicate-modal">
            <div className="login-duplicate-header">
              <h2 id="duplicate-login-title">工房名の確認</h2>
            </div>
            <PipetCharacter
              className="login-duplicate-pipet"
              imageClassName="login-duplicate-pipet-image"
              bubbleClassName="login-duplicate-pipet-bubble"
              message={`${duplicateConfirm.userName}さん、その工房名はもう使われてるよ。続きからはじめる？`}
              subMessage="新しく始めるなら、名前か工房名を少し変えてみてね"
            />
            <div className="login-duplicate-actions">
              <button
                type="button"
                className="login-duplicate-cancel"
                disabled={isLoading}
                onClick={() => setDuplicateConfirm(null)}
              >
                名前を変える
              </button>
              <button
                type="button"
                className="login-duplicate-continue"
                disabled={isLoading}
                onClick={handleDuplicateConfirmContinue}
              >
                {isLoading ? '確認中…' : '続きからはじめる'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
