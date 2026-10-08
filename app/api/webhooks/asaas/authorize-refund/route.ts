import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { asaasRequest } from "@/lib/asaas";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.literal("PIX_REFUND"),
  pixRefund: z.object({
    id: z.string().uuid(),
    payment: z.string().regex(/^pay_[a-zA-Z0-9]+$/),
    value: z.number().positive().finite(),
    type: z.literal("CREDIT_REFUND"),
    originalTransaction: z.object({ id: z.string().uuid() }),
  }),
});

type Transaction = {
  id: string; payment?: string | null; type: string; value: number;
  status: string; dateCreated?: string;
  originalTransaction?: { id: string } | null;
};
type Payment = { id: string; billingType: string; status: string; value: number; externalReference: string; pixTransaction?: string | null };

function refused(reason: string) {
  return NextResponse.json({ status: "REFUSED", refuseReason: reason });
}

function operationDate(value: string) {
  const brazil = value.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2}:\d{2})$/);
  const iso = brazil ? `${brazil[3]}-${brazil[2]}-${brazil[1]}T${brazil[4]}-03:00`
    : /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? value.replace(" ", "T") + "-03:00" : value;
  return new Date(iso);
}

export async function POST(request: Request) {
  const expected = process.env.ASAAS_REFUND_AUTHORIZATION_TOKEN?.trim() || "";
  if (expected.length < 32) return NextResponse.json({ error: "Autorizacao nao configurada." }, { status: 503 });
  const received = request.headers.get("asaas-access-token") || "";
  const a = Buffer.from(expected), b = Buffer.from(received);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return refused("Operacao nao suportada ou dados invalidos.");

  try {
    const payload = parsed.data.pixRefund;
    // Re-read the operation and payment; authenticated payload alone is not proof.
    const [transaction, payment] = await Promise.all([
      asaasRequest<Transaction>(`/pix/transactions/${encodeURIComponent(payload.id)}`, { signal: AbortSignal.timeout(8000) }),
      asaasRequest<Payment>(`/payments/${encodeURIComponent(payload.payment)}`, { signal: AbortSignal.timeout(8000) }),
    ]);
    const cents = (amount: number) => Number.isFinite(amount) ? Math.round(amount * 100) : NaN;
    if (transaction.id !== payload.id || transaction.payment !== payload.payment || transaction.type !== "CREDIT_REFUND"
      || !["AWAITING_REQUEST", "AWAITING_CRITICAL_ACTION_AUTHORIZATION", "PENDING"].includes(transaction.status)
      || cents(transaction.value) !== cents(payload.value) || cents(payment.value) !== cents(payload.value)
      || payment.id !== payload.payment || payment.billingType !== "PIX" || !["RECEIVED", "CONFIRMED"].includes(payment.status)
      || !payment.pixTransaction || transaction.originalTransaction?.id !== payment.pixTransaction
      || payload.originalTransaction.id !== payment.pixTransaction) return refused("Estorno divergente da cobranca original.");
    const orderId = Number(payment.externalReference);
    const createdAt = operationDate(transaction.dateCreated || "");
    if (!Number.isSafeInteger(orderId) || orderId <= 0 || !Number.isFinite(createdAt.getTime())) return refused("Referencia ou data da operacao invalida.");

    const { data: approved, error } = await supabaseAdmin.rpc("fn_autorizar_estorno_pix_erp", {
      p_operation_id: transaction.id, p_order_id: orderId, p_payment_id: payment.id,
      p_amount: transaction.value, p_operation_created_at: createdAt.toISOString(),
    });
    if (error) throw error;
    if (approved !== true) return refused("Nao corresponde a um estorno integral ativo solicitado pelo ERP antes do envio.");
    return NextResponse.json({ status: "APPROVED" });
  } catch (error) {
    const dependencyError = error as { status?: number; details?: { errors?: Array<{ code?: string }> }; code?: string };
    const code = dependencyError.details?.errors?.[0]?.code || dependencyError.code;
    console.error("[asaas/authorize-refund] Validacao falhou; nenhuma aprovacao emitida.", {
      upstreamStatus: dependencyError.status, code,
    });
    return NextResponse.json({
      error: code === "insufficient_permission"
        ? "A chave Asaas da loja nao possui permissao para consultar a transacao Pix usada na autorizacao. Revise as permissoes da chave."
        : "Validacao temporariamente indisponivel.",
    }, { status: 503 });
  }
}
