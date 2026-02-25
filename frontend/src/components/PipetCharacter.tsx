interface PipetCharacterProps {
  message: string
  subMessage?: string
  className?: string
  imageClassName?: string
  bubbleClassName?: string
  nameLabel?: string
}

function formatPipetSpeech(text: string) {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return normalized

  const punctuated = normalized
    .replace(/([。！？!?♪])(?=[^\n])/g, '$1\n')
    .replace(/\n{2,}/g, '\n')

  if (punctuated.includes('\n') || punctuated.length <= 26) return punctuated

  const spaceIndex = punctuated.indexOf(' ')
  if (spaceIndex >= 8 && spaceIndex <= 26) {
    return `${punctuated.slice(0, spaceIndex)}\n${punctuated.slice(spaceIndex + 1)}`
  }

  const commaIndex = punctuated.indexOf('、')
  if (commaIndex >= 8 && commaIndex <= 24) {
    return `${punctuated.slice(0, commaIndex + 1)}\n${punctuated.slice(commaIndex + 1)}`
  }
  return punctuated
}

export function PipetCharacter({
  message,
  subMessage,
  className = '',
  imageClassName = '',
  bubbleClassName = '',
  nameLabel = 'ピペット',
}: PipetCharacterProps) {
  const formattedMessage = formatPipetSpeech(message)
  const formattedSubMessage = subMessage ? formatPipetSpeech(subMessage) : undefined

  return (
    <div className={`pipet-character ${className}`.trim()}>
      <div className="pipet-character-figure">
        {nameLabel && <p className="pipet-character-name">{nameLabel}</p>}
        <img
          src="/images/pipet.png"
          alt="サポート妖精ピペット"
          className={`pipet-character-image ${imageClassName}`.trim()}
        />
      </div>
      <div className={`pipet-character-bubble ${bubbleClassName}`.trim()}>
        <p className="pipet-character-message">{formattedMessage}</p>
        {formattedSubMessage && <p className="pipet-character-sub-message">{formattedSubMessage}</p>}
      </div>
    </div>
  )
}
