export function extractVariables(text: string): string[] {
  const words = text
    .split(/\s+/)
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length > 0)

  return Array.from(new Set(words))
}

const LOCAL_STORAGE_KEY = 'definedVariables'

export const loadStoredVariables = (): string[] => {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
  return raw ? JSON.parse(raw) : []
}
export const storeVariable = (name: string) => {
  const current = loadStoredVariables()
  if (!current.includes(name)) {
    current.push(name)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current))
  }
}


