import { useState, useEffect } from 'react'
import type { Tip } from '../constants/tips'

interface TipsDisplayProps {
  tips: Tip[]
  duration: number
}

function getRandomTip(tips: Tip[]): Tip {
  return tips[Math.floor(Math.random() * tips.length)]
}

export function TipsDisplay({ tips, duration }: TipsDisplayProps) {
  const [tip, setTip] = useState<Tip>(() => getRandomTip(tips))

  useEffect(() => {
    const interval = Math.max(2500, duration)
    const id = setInterval(() => {
      setTip(getRandomTip(tips))
    }, interval)
    return () => clearInterval(id)
  }, [tips, duration])

  return (
    <div className="tips-display">
      <p className="tips-label">💡 Tips</p>
      <p className="tips-text">{tip.text}</p>
    </div>
  )
}
