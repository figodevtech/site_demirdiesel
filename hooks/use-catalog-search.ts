import * as React from "react"
import type { PublicProduct } from "@/lib/catalog/types"

const DEBOUNCE_MS = 200
const MIN_LENGTH = 2
const CACHE_LIMIT = 40

// Cache em memória compartilhado (busca rápida do header + tela /buscar): apagar e redigitar
// ou voltar de um produto mostra o resultado na hora, sem nova requisição.
const resultCache = new Map<string, PublicProduct[]>()

function cacheKey(query: string) {
  return query.trim().toLowerCase()
}

function remember(key: string, results: PublicProduct[]) {
  resultCache.delete(key)
  resultCache.set(key, results)
  if (resultCache.size > CACHE_LIMIT) {
    const oldest = resultCache.keys().next().value
    if (oldest !== undefined) resultCache.delete(oldest)
  }
}

export type CatalogSearchStatus = "idle" | "loading" | "success" | "error"

interface SearchState {
  key: string
  results: PublicProduct[]
  status: CatalogSearchStatus
}

/**
 * Busca no catálogo com debounce, cancelamento de requisições antigas e cache.
 * Os resultados anteriores continuam visíveis enquanto a nova busca carrega (sem flicker).
 */
export function useCatalogSearch(query: string) {
  const key = cacheKey(query)
  const enabled = key.length >= MIN_LENGTH
  const cached = enabled ? resultCache.get(key) : undefined

  const [state, setState] = React.useState<SearchState>({ key: "", results: [], status: "idle" })

  React.useEffect(() => {
    if (!enabled) return

    const hit = resultCache.get(key)
    if (hit) {
      // Sincroniza a "última lista exibida" para a próxima busca começar a partir dela.
      const timer = window.setTimeout(() => setState({ key, results: hit, status: "success" }), 0)
      return () => window.clearTimeout(timer)
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setState((prev) => ({ ...prev, status: "loading" }))
      try {
        const response = await fetch(`/api/catalog/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const json = await response.json()
        const results: PublicProduct[] = json.results || []
        remember(key, results)
        setState({ key, results, status: "success" })
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("Erro na busca do catálogo:", error)
        setState({ key, results: [], status: "error" })
      }
    }, DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [enabled, key, query])

  if (!enabled) {
    return { results: [] as PublicProduct[], status: "idle" as const, isRefreshing: false, hasResultsFor: false }
  }

  if (cached) {
    return { results: cached, status: "success" as const, isRefreshing: false, hasResultsFor: true }
  }

  // Ainda sem resposta para o termo atual: mantém a lista anterior (esmaecida) e sinaliza carregamento.
  const isPending = state.key !== key
  return {
    results: state.results,
    status: (state.status === "error" && !isPending ? "error" : "loading") as CatalogSearchStatus,
    isRefreshing: state.results.length > 0,
    hasResultsFor: false,
  }
}
