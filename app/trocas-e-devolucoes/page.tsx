'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { siteConfig, buildWhatsAppUrl } from '@/lib/site-config';

export default function TrocasDevolucoesPage() {
    const itens = [
        { titulo: 'Prazo', texto: 'Você pode solicitar troca ou devolução em até 7 dias corridos após o recebimento (direito de arrependimento) ou em até 30 dias para itens com defeito aparente.' },
        { titulo: 'Condições', texto: 'O produto deve estar sem uso, com embalagem original e acessórios. Para defeito, descreva o problema e, se possível, envie fotos.' },
        { titulo: 'Custos de envio', texto: 'Em caso de defeito ou erro no pedido, o frete é por nossa conta. Para arrependimento, o frete de devolução pode ser cobrado.' },
        { titulo: 'Reembolsos', texto: 'Após recebermos e conferirmos o produto, o estorno é solicitado no mesmo meio de pagamento (cartão, PIX ou boleto). Prazos variam conforme o emissor.' },
        { titulo: 'Passo a passo', texto: `1) Abra um chamado em ${siteConfig.email} ou WhatsApp. 2) Informe número do pedido, motivo e fotos. 3) Aguarde o código de postagem ou coleta. 4) Após conferência, seguimos com troca ou reembolso.` },
    ];

    return (
        <div className="container mx-auto max-w-5xl px-4 pb-10 pt-4 md:pt-6">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-3">Trocas e Devoluções</h1>
            <p className="text-muted-foreground mb-8">Regras e procedimentos para trocar ou devolver um produto.</p>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Como funciona</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {itens.map((item) => (
                        <div key={item.titulo} className="space-y-2">
                            <h2 className="text-lg font-semibold">{item.titulo}</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed">{item.texto}</p>
                            <Separator />
                        </div>
                    ))}
                    <p className="text-sm text-muted-foreground">
                        Para iniciar, envie e-mail para{' '}
                        <a href={`mailto:${siteConfig.email}`} className="text-primary font-semibold hover:underline">
                            {siteConfig.email}
                        </a>{' '}
                        ou chame no{' '}
                        <a
                            href={buildWhatsAppUrl("Olá, gostaria de orientações sobre troca ou devolução de um pedido.")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 font-semibold hover:underline"
                        >
                            WhatsApp {siteConfig.whatsappDisplay}
                        </a>.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
