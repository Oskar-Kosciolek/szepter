const WAKE_WORD = 'szepter'

export function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase().trim()
  const t = target.toLowerCase().trim()

  if (t.includes(q)) return true

  const queryWords = q.split(/\s+/).filter(w => w.length > 2)
  if (queryWords.length === 0) return false
  return queryWords.every(word => t.includes(word))
}

export function findBestMatch<T>(
  query: string,
  items: T[],
  getLabel: (item: T) => string
): T | null {
  if (!query) return null
  return items.find(item => fuzzyMatch(query, getLabel(item))) ?? null
}

/** Prosta odległość Levenshteina dla krótkich stringów. */
export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[m][n]
}

/** Sprawdza czy transkrypt zawiera wake word (tolerancja ±2 litery). */
export function containsWakeWord(transcript: string): boolean {
  const words = transcript.toLowerCase().split(/\s+/)
  return words.some(word => levenshtein(word, WAKE_WORD) <= 2)
}