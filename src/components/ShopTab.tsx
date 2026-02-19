import { useState } from 'react'
import { AVATARS, DICE_PRICES, getOwnedItems, purchaseItem, getSelectedAvatar, setSelectedAvatar } from '../utils/shop'
import { DICE_STYLES, Dice } from './Dice'
import type { DiceStyle } from './Dice'

interface ShopTabProps {
  coins: number
  onSpendCoins: (amount: number) => void
  diceStyle: DiceStyle
  onDiceStyleChange: (style: DiceStyle) => void
  onBack: () => void
}

export function ShopTab({ coins, onSpendCoins, diceStyle, onDiceStyleChange, onBack }: ShopTabProps) {
  const [, setRefresh] = useState(0)
  const owned = getOwnedItems()

  function handleBuy(id: string, price: number, category: 'avatar' | 'dice') {
    if (coins < price) return
    purchaseItem(id)
    onSpendCoins(price)
    if (category === 'dice') {
      const style = DICE_STYLES.find(s => s.id === id)
      if (style) onDiceStyleChange(style)
    } else {
      setSelectedAvatar(id)
    }
    setRefresh(n => n + 1)
  }

  return (
    <div className="tab-content shop-tab">
      <div className="tab-header">
        <button type="button" className="tab-back-btn" onClick={onBack}>&larr;</button>
        <h2 className="tab-title">Shop</h2>
      </div>
      <h3 className="tab-section-title">Dice Skins</h3>
      <div className="shop-grid">
        {DICE_STYLES.map((style, i) => {
          const price = DICE_PRICES[style.id] ?? 0
          const has = owned.includes(style.id) || price === 0
          const isSelected = diceStyle.id === style.id
          return (
            <div key={style.id} className={`shop-item ${isSelected ? 'selected' : ''}`}>
              <div className="shop-item-preview">
                <Dice value={[5, 6, 3, 4, 1, 2][i]} size={38} style={style} instanceId={`shop-${style.id}`} />
              </div>
              <span className="shop-item-name">{style.name}</span>
              {has ? (
                <button
                  type="button"
                  className={`shop-item-btn ${isSelected ? 'equipped' : ''}`}
                  onClick={() => onDiceStyleChange(style)}
                >
                  {isSelected ? 'Equipped' : 'Equip'}
                </button>
              ) : (
                <button
                  type="button"
                  className={`shop-item-btn buy ${coins < price ? 'cant-afford' : ''}`}
                  onClick={() => handleBuy(style.id, price, 'dice')}
                  disabled={coins < price}
                >
                  🪙 {price.toLocaleString()}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <h3 className="tab-section-title">Avatars</h3>
      <div className="shop-grid avatars-grid">
        {AVATARS.map(avatar => {
          const has = owned.includes(avatar.id) || avatar.price === 0
          const isActive = getSelectedAvatar() === avatar.id
          return (
            <div key={avatar.id} className={`shop-item avatar-item ${isActive ? 'selected' : ''}`}>
              <div className="shop-avatar-preview">{avatar.emoji}</div>
              <span className="shop-item-name">{avatar.name}</span>
              {has ? (
                <button
                  type="button"
                  className={`shop-item-btn ${isActive ? 'equipped' : ''}`}
                  onClick={() => { setSelectedAvatar(avatar.id); setRefresh(n => n + 1) }}
                >
                  {isActive ? 'Active' : 'Use'}
                </button>
              ) : (
                <button
                  type="button"
                  className={`shop-item-btn buy ${coins < avatar.price ? 'cant-afford' : ''}`}
                  onClick={() => handleBuy(avatar.id, avatar.price, 'avatar')}
                  disabled={coins < avatar.price}
                >
                  🪙 {avatar.price.toLocaleString()}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
