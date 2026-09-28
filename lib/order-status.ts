/**
 * Regras Canônicas de Status de Pedido - Demir Diesel
 *
 * STATUS FINAIS DE PAGAMENTO CONCLUÍDO (Capturado/Liquidado):
 * - "PAGO"
 * - "FINALIZADA"
 *
 * STATUS DE PAGAMENTO AUTORIZADO (Não capturado ainda):
 * - "AUTORIZADO" -> Operação de pré-autorização de cartão aprovada, aguardando captura/liquidação.
 *   NÃO deve limpar carrinho, NÃO baixa estoque, NÃO deve mostrar "Pagamento Confirmado".
 *
 * STATUS PENDENTES:
 * - "PENDENTE", "PAGAMENTO", "AUTORIZADO", "ORCAMENTO"
 *
 * STATUS CANCELADOS/FALHA:
 * - "CANCELADO", "CANCELADA", "FALHA"
 */

export function isOrderPaid(status?: string | null): boolean {
  const s = String(status ?? "").trim().toUpperCase();
  return s === "PAGO" || s === "FINALIZADA";
}

export function isOrderAuthorized(status?: string | null): boolean {
  const s = String(status ?? "").trim().toUpperCase();
  return s === "AUTORIZADO";
}

export function isOrderPending(status?: string | null): boolean {
  const s = String(status ?? "").trim().toUpperCase();
  return (
    s === "PENDENTE" ||
    s === "PAGAMENTO" ||
    s === "AUTORIZADO" ||
    s === "ORCAMENTO"
  );
}

export function isOrderCancelled(status?: string | null): boolean {
  const s = String(status ?? "").trim().toUpperCase();
  return s === "CANCELADO" || s === "CANCELADA" || s === "FALHA";
}
