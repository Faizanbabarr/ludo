export function useSound() {
  const play = (name: 'roll' | 'move' | 'capture' | 'win') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (name === 'roll') navigator.vibrate(30)
      if (name === 'move') navigator.vibrate(15)
      if (name === 'capture') navigator.vibrate([20, 30, 20])
      if (name === 'win') navigator.vibrate([50, 30, 50])
    }
  }
  return { play }
}
