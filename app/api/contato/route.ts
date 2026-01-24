import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nome, email, assunto, mensagem } = body || {};

        if (!email || !assunto || !mensagem) {
            return NextResponse.json({ error: 'Informe e-mail, assunto e mensagem.' }, { status: 400 });
        }

        // Aqui poderíamos enviar e-mail via provider (SMTP/API) ou gravar em banco.
        console.log('Contato recebido:', { nome, email, assunto, mensagem });

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('Erro ao processar contato:', error);
        return NextResponse.json({ error: 'Falha ao enviar mensagem.' }, { status: 500 });
    }
}
