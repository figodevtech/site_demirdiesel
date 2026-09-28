import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawNome = body?.nome || body?.name;
    const rawEmail = body?.email;
    const rawTelefone = body?.telefone || body?.phone;
    const rawAssunto = body?.assunto || body?.subject;
    const rawMensagem = body?.mensagem || body?.message;

    if (!rawEmail || typeof rawEmail !== "string" || !rawEmail.includes("@")) {
      return NextResponse.json(
        { error: "EMAIL_INVALIDO", message: "Informe um e-mail válido para retorno." },
        { status: 400 }
      );
    }

    if (!rawAssunto || typeof rawAssunto !== "string" || !rawAssunto.trim()) {
      return NextResponse.json(
        { error: "ASSUNTO_OBRIGATORIO", message: "Informe o assunto do contato." },
        { status: 400 }
      );
    }

    if (!rawMensagem || typeof rawMensagem !== "string" || rawMensagem.trim().length < 5) {
      return NextResponse.json(
        { error: "MENSAGEM_OBRIGATORIA", message: "Escreva uma mensagem com pelo menos 5 caracteres." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const cleanEmail = rawEmail.trim().toLowerCase();
    const cleanNome = (rawNome && typeof rawNome === "string" ? rawNome.trim() : "Cliente / Visitante").slice(0, 150);
    const cleanAssunto = rawAssunto.trim().slice(0, 200);
    const cleanMensagem = rawMensagem.trim().slice(0, 3000);
    const cleanTelefone = rawTelefone ? String(rawTelefone).replace(/[^\d+()\s-]/g, "").slice(0, 30) : null;

    // Persistência real no banco de dados
    const { data, error } = await supabaseAdmin
      .from("contato_lead")
      .insert({
        nome: cleanNome,
        email: cleanEmail,
        telefone: cleanTelefone,
        assunto: cleanAssunto,
        mensagem: cleanMensagem,
        status: "NOVO",
        origem: "SITE",
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[contato] Falha ao persistir lead:", error.message, error.code);
      return NextResponse.json(
        {
          error: "ERRO_GRAVACAO",
          message: "Não foi possível registrar seu contato no momento. Por favor, tente novamente ou fale pelo WhatsApp.",
        },
        { status: 500 }
      );
    }

    console.log(`[contato] Lead #${data?.id} registrado com sucesso para assunto: "${cleanAssunto}"`);

    return NextResponse.json({ ok: true, leadId: data?.id });
  } catch (error: any) {
    console.error("[contato] Exceção ao processar contato:", error.message);
    return NextResponse.json(
      { error: "FALHA_PROCESSAMENTO", message: "Falha interna ao processar envio." },
      { status: 500 }
    );
  }
}
