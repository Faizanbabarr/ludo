import { DICE_STYLES, Dice } from './Dice'
import type { DiceStyle } from './Dice'

interface DiceSelectorProps {
  selected: DiceStyle
  onSelect: (style: DiceStyle) => void
  onClose: () => void
}

const PREVIEW_VALUES = [5, 6, 3, 4, 1, 2]

export function DiceSelector({ selected, onSelect, onClose }: DiceSelectorProps) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content dice-selector-modal">
        <div className="modal-header">
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
          <span className="modal-header-icon">🎲</span>
          <h2 className="modal-title">CHOOSE DICE</h2>
        </div>

        <div className="dice-grid">
          {DICE_STYLES.map((style, i) => (
            <button
              key={style.id}
              type="button"
              className={`dice-option ${selected.id === style.id ? 'dice-option-active' : ''}`}
              onClick={() => onSelect(style)}
            >
              <div className="dice-option-preview">
                <Dice value={PREVIEW_VALUES[i]} size={44} style={style} instanceId={`sel-${style.id}`} />
              </div>
              <span className="dice-option-name">{style.name}</span>
              {selected.id === style.id && (
                <span className="dice-option-check">✓</span>
              )}
            </button>
          ))}
        </div>

        <button type="button" className="dice-confirm-btn" onClick={onClose}>
          CONFIRM
        </button>
      </div>
    </div>
  )
}
