import { useRouter } from "nextjs-toploader/app"

// Quantas navegações internas aconteceram nesta sessão (atualizado por PwaProvider).
let inAppNavigations = 0

export function recordInAppNavigation() {
  inAppNavigations += 1
}

/**
 * Voltar como em um app: usa o histórico quando o usuário já navegou dentro da loja; se a tela
 * foi aberta direto (atalho do ícone, link externo, app recém-aberto), vai para o fallback em vez
 * de não fazer nada ou fechar o app.
 */
export function useSafeBack(fallback = "/") {
  const router = useRouter()

  return () => {
    if (inAppNavigations > 0 && window.history.length > 1) router.back()
    else router.push(fallback)
  }
}
