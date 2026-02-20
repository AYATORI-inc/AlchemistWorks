import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'
import { defaultSaveData } from '../contexts/GameContext'
import type { SaveData } from '../types'
import { api } from '../api/client'

const hasApi = () => !!import.meta.env.VITE_GAS_URL

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isNewGame = location.pathname === '/login/new'
  const { setSaveData } = useGame()
  const [userName, setUserName] = useState('')
  const [workshopName, setWorkshopName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName.trim() || !workshopName.trim()) return
    setError('')
    setIsLoading(true)

    try {
      if (isNewGame) {
        if (hasApi()) {
          const res = await api.auth.login(userName.trim(), workshopName.trim())
          const saveData = {
            ...defaultSaveData,
            userId: res.userId,
            userName: userName.trim(),
            workshopName: workshopName.trim(),
            g: res.g,
            inventory: [],
          }
          setSaveData(saveData)
        } else {
          const saveData = {
            ...defaultSaveData,
            userId: `user-${Date.now()}`,
            userName: userName.trim(),
            workshopName: workshopName.trim(),
            inventory: [],
          }
          setSaveData(saveData)
        }
        navigate('/game')
      } else {
        // コンティニュー: 同じ名前+工房名で deterministic userId → save.get で既存データ取得
        if (hasApi()) {
          const res = await api.auth.login(userName.trim(), workshopName.trim())
          const saveRes = await api.save.get(res.userId)
          const data = saveRes.data as Record<string, unknown>
          const saveData = {
            ...defaultSaveData,
            userId: res.userId,
            userName: (data.userName as string) || userName.trim(),
            workshopName: (data.workshopName as string) || workshopName.trim(),
            g: (data.g as number) ?? res.g,
            inventory: (data.inventory as typeof defaultSaveData.inventory) ?? [],
            recipes: (data.recipes as typeof defaultSaveData.recipes) ?? [],
            achievements: (data.achievements as typeof defaultSaveData.achievements) ?? [],
            rank: (data.rank as number) ?? 1,
            lastLoginDate: (data.lastLoginDate as string) ?? defaultSaveData.lastLoginDate,
            alchemyCount: (data.alchemyCount as number) ?? 0,
            discoveredSvgIcons: (data.discoveredSvgIcons as SaveData['discoveredSvgIcons']) ?? {},
          }
          setSaveData(saveData)
        } else {
          const saveData = {
            ...defaultSaveData,
            userId: `user-${Date.now()}`,
            userName: userName.trim(),
            workshopName: workshopName.trim(),
            inventory: [],
          }
          setSaveData(saveData)
        }
        navigate('/game')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'つうしんができなかった')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <h1>{isNewGame ? 'はじめる' : 'つづきから'}</h1>
      <p>
        {isNewGame
          ? '名前と工房の名前を入れて、工房をひらこう'
          : '名前と工房の名前を入れて、またあそぼう'}
      </p>
      <form onSubmit={handleSubmit} className="login-form">
        <label>
          名前
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="あなたの名前"
            required
          />
        </label>
        <label>
          工房名
          <input
            type="text"
            value={workshopName}
            onChange={(e) => setWorkshopName(e.target.value)}
            placeholder="例：ひだりの工房"
            required
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'まっています…' : isNewGame ? '工房をひらく' : 'あそびにいく'}
        </button>
      </form>
      <Link to="/" className="back-link">← もどる</Link>
    </div>
  )
}
