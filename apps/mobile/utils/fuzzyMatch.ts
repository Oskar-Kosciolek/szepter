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
