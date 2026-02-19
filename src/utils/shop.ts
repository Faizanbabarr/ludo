import type { Profile } from '../types/database'

// ─── Avatars ───
export interface AvatarItem {
  id: string
  emoji: string
  name: string
  price: number
}

export const AVATARS: AvatarItem[] = [
  { id: 'default', emoji: '👤', name: 'Default', price: 0 },
  { id: 'gamer', emoji: '🎮', name: 'Gamer', price: 0 },
  { id: 'roller', emoji: '🎲', name: 'Roller', price: 0 },
  { id: 'crown', emoji: '👑', name: 'Crown', price: 0 },
  { id: 'lion', emoji: '🦁', name: 'Lion', price: 500 },
  { id: 'dragon', emoji: '🐉', name: 'Dragon', price: 500 },
  { id: 'fox', emoji: '🦊', name: 'Fox', price: 1000 },
  { id: 'wolf', emoji: '🐺', name: 'Wolf', price: 1000 },
  { id: 'diamond', emoji: '💎', name: 'Diamond', price: 2000 },
  { id: 'fire', emoji: '🔥', name: 'Fire', price: 2000 },
  { id: 'bolt', emoji: '⚡', name: 'Lightning', price: 3000 },
  { id: 'star', emoji: '🌟', name: 'Star', price: 5000 },
]

// ─── Dice Prices ───
export const DICE_PRICES: Record<string, number> = {
  'classic': 0,
  'royal-red': 0,
  'ocean-blue': 1000,
  'shadow': 2000,
  'golden': 5000,
  'emerald': 3000,
}

// ─── Owned Items ───
const DEFAULT_OWNED = ['default', 'gamer', 'roller', 'crown', 'classic', 'royal-red']

export function getOwnedItems(): string[] {
  try {
    const raw = localStorage.getItem('purchased_items')
    if (!raw) return [...DEFAULT_OWNED]
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [...DEFAULT_OWNED]
  } catch { return [...DEFAULT_OWNED] }
}

export function isOwned(id: string): boolean {
  return getOwnedItems().includes(id) || DEFAULT_OWNED.includes(id)
}

export function purchaseItem(id: string): void {
  const owned = getOwnedItems()
  if (!owned.includes(id)) {
    owned.push(id)
    localStorage.setItem('purchased_items', JSON.stringify(owned))
  }
}

// ─── Avatar Selection ───
export function getSelectedAvatar(): string {
  return localStorage.getItem('selected_avatar') || 'default'
}

export function setSelectedAvatar(id: string): void {
  localStorage.setItem('selected_avatar', id)
}

export function getAvatarEmoji(avatarId?: string | null): string {
  const id = avatarId || getSelectedAvatar()
  const found = AVATARS.find(a => a.id === id)
  return found?.emoji || '👤'
}

// ─── Settings ───
export function getSoundEnabled(): boolean {
  return localStorage.getItem('sound_enabled') !== 'false'
}

export function setSoundEnabled(v: boolean): void {
  localStorage.setItem('sound_enabled', v.toString())
}

export function getVibrationEnabled(): boolean {
  return localStorage.getItem('vibration_enabled') !== 'false'
}

export function setVibrationEnabled(v: boolean): void {
  localStorage.setItem('vibration_enabled', v.toString())
}

// ─── Login Streak ───
const STREAK_REWARDS = [
  { coins: 100, gems: 0 },
  { coins: 150, gems: 5 },
  { coins: 200, gems: 0 },
  { coins: 300, gems: 10 },
  { coins: 500, gems: 0 },
  { coins: 750, gems: 15 },
  { coins: 1000, gems: 25 },
]

export interface StreakInfo {
  currentDay: number
  canClaim: boolean
  rewards: { coins: number; gems: number }[]
}

export function getStreakInfo(): StreakInfo {
  const lastDate = localStorage.getItem('last_streak_date')
  const streak = parseInt(localStorage.getItem('login_streak') || '0', 10)
  const today = new Date().toDateString()

  if (lastDate === today) {
    return { currentDay: streak, canClaim: false, rewards: STREAK_REWARDS }
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  let nextDay: number
  if (lastDate === yesterday.toDateString() && streak > 0) {
    nextDay = streak >= 7 ? 1 : streak + 1
  } else {
    nextDay = 1
  }

  return { currentDay: nextDay, canClaim: true, rewards: STREAK_REWARDS }
}

export function claimStreak(): { coins: number; gems: number } {
  const info = getStreakInfo()
  if (!info.canClaim) return { coins: 0, gems: 0 }

  const reward = STREAK_REWARDS[info.currentDay - 1]
  localStorage.setItem('login_streak', info.currentDay.toString())
  localStorage.setItem('last_streak_date', new Date().toDateString())
  return reward
}

// ─── Achievements ───
export interface Achievement {
  id: string
  name: string
  desc: string
  icon: string
  check: (p: ProfileStats) => boolean
  progress: (p: ProfileStats) => number
}

interface ProfileStats {
  wins: number
  games_played: number
  best_streak: number
  level: number
  coins: number
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', name: 'First Blood', desc: 'Win your first game', icon: '⚔️',
    check: p => p.wins >= 1, progress: p => Math.min(p.wins / 1, 1) },
  { id: 'wins_10', name: 'Getting Good', desc: 'Win 10 games', icon: '🎯',
    check: p => p.wins >= 10, progress: p => Math.min(p.wins / 10, 1) },
  { id: 'wins_50', name: 'Veteran', desc: 'Win 50 games', icon: '🏅',
    check: p => p.wins >= 50, progress: p => Math.min(p.wins / 50, 1) },
  { id: 'wins_100', name: 'Century', desc: 'Win 100 games', icon: '💯',
    check: p => p.wins >= 100, progress: p => Math.min(p.wins / 100, 1) },
  { id: 'streak_3', name: 'On Fire', desc: '3-game win streak', icon: '🔥',
    check: p => p.best_streak >= 3, progress: p => Math.min(p.best_streak / 3, 1) },
  { id: 'streak_5', name: 'Hot Streak', desc: '5-game win streak', icon: '🌶️',
    check: p => p.best_streak >= 5, progress: p => Math.min(p.best_streak / 5, 1) },
  { id: 'streak_10', name: 'Unstoppable', desc: '10-game win streak', icon: '💪',
    check: p => p.best_streak >= 10, progress: p => Math.min(p.best_streak / 10, 1) },
  { id: 'games_25', name: 'Regular', desc: 'Play 25 games', icon: '🎮',
    check: p => p.games_played >= 25, progress: p => Math.min(p.games_played / 25, 1) },
  { id: 'games_100', name: 'Dedicated', desc: 'Play 100 games', icon: '🏆',
    check: p => p.games_played >= 100, progress: p => Math.min(p.games_played / 100, 1) },
  { id: 'level_5', name: 'Rising Star', desc: 'Reach level 5', icon: '⭐',
    check: p => p.level >= 5, progress: p => Math.min(p.level / 5, 1) },
  { id: 'level_10', name: 'Expert', desc: 'Reach level 10', icon: '🌟',
    check: p => p.level >= 10, progress: p => Math.min(p.level / 10, 1) },
  { id: 'rich', name: 'Rich', desc: 'Have 10,000 coins', icon: '💰',
    check: p => p.coins >= 10000, progress: p => Math.min(p.coins / 10000, 1) },
]

// ─── Rank ───
export function getRankTitle(level: number): string {
  if (level >= 50) return 'Legend'
  if (level >= 30) return 'Master'
  if (level >= 20) return 'Champion'
  if (level >= 15) return 'Warrior'
  if (level >= 10) return 'Expert'
  if (level >= 5) return 'Player'
  if (level >= 3) return 'Novice'
  return 'Beginner'
}

export function getRankIcon(level: number): string {
  if (level >= 50) return '👑'
  if (level >= 30) return '🏆'
  if (level >= 20) return '🥇'
  if (level >= 15) return '⚔️'
  if (level >= 10) return '🌟'
  if (level >= 5) return '🎯'
  if (level >= 3) return '🎮'
  return '🎲'
}

// ─── Tier Fees ───
export function parseTierEntry(entry: string): number {
  const clean = entry.replace(/[,\s]/g, '')
  if (clean.endsWith('K')) return parseFloat(clean) * 1000
  if (clean.endsWith('M')) return parseFloat(clean) * 1000000
  return parseFloat(clean) || 0
}

// ─── Guest coins helper ───
export function getGuestCoins(): number {
  const stored = localStorage.getItem('guest_coins')
  if (stored === null) { localStorage.setItem('guest_coins', '5000'); return 5000 }
  return parseInt(stored, 10) || 5000
}

export function getGuestGems(): number {
  const stored = localStorage.getItem('guest_gems')
  if (stored === null) { localStorage.setItem('guest_gems', '50'); return 50 }
  return parseInt(stored, 10) || 50
}

export function formatNum(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

export function getProfileStats(p: Profile | null) {
  return {
    wins: p?.wins ?? 0,
    losses: p?.losses ?? 0,
    games_played: p?.games_played ?? 0,
    best_streak: p?.best_streak ?? 0,
    win_streak: p?.win_streak ?? 0,
    level: p?.level ?? 1,
    xp: p?.xp ?? 0,
    coins: p?.coins ?? getGuestCoins(),
    gems: p?.gems ?? getGuestGems(),
  }
}
