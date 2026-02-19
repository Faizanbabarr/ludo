export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  level: number
  xp: number
  coins: number
  gems: number
  wins: number
  losses: number
  games_played: number
  win_streak: number
  best_streak: number
  created_at: string
  updated_at: string
}
