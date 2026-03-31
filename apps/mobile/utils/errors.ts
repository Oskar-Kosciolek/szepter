export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
      return 'Brak połączenia z internetem'
    }
    if (msg.includes('groq') || msg.includes('api') || msg.includes('500') || msg.includes('503')) {
      return 'Serwis niedostępny — spróbuj ponownie'
    }
    if (msg.includes('timeout')) {
      return 'Przekroczono czas oczekiwania'
    }
    return error.message
  }
  if (typeof error === 'string') return error
  return 'Wystąpił nieznany błąd'
}
