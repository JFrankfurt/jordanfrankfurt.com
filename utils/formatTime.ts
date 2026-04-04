/**
 * Format seconds into a running time string.
 * - Under 1 hour: M:SS (e.g., 5:42, 19:48)
 * - 1 hour+: H:MM:SS (e.g., 1:33:54, 3:21:08)
 */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
