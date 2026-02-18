interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

const EMOJIS = ['👍', '😂', '😢', '😡', '🎉', '🤔', '❤️', '🔥']

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  return (
    <div className="emoji-picker-overlay">
      <div className="emoji-picker-backdrop" onClick={onClose} />
      <div className="emoji-picker">
        <div className="emoji-grid">
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              className="emoji-btn"
              onClick={() => { onSelect(emoji); onClose() }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
