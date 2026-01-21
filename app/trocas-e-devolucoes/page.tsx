'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function TrocasDevolucoesPage() {
    const itens = [
        { titulo: 'Prazo', texto: 'Você pode solicitar troca ou devolução em até 7 dias corridos após o recebimento (direito de arrependimento) ou em até 30 dias para itens com defeito aparente.' },
        { titulo: 'Condições', texto: 'O produto deve estar sem uso, com embalagem original e acessórios. Para defeito, descreva o problema e, se possível, envie fotos.' },
        { titulo: 'Custos de envio', texto: 'Em caso de defeito ou erro no pedido, o frete é por nossa conta. Para arrependimento, o frete de devolução pode ser cobrado.' },
        { titulo: 'Reembolsos', texto: 'Após recebermos e conferirmos o produto, o estorno é solicitado no mesmo meio de pagamento (cartão, PIX ou boleto). Prazos variam conforme o emissor.' },
        { titulo: 'Passo a passo', texto: '1) Abra um chamado em contato@demirdiesel.com.br ou WhatsApp. 2) Informe número do pedido, motivo e fotos. 3) Aguarde o código de postagem ou coleta. 4) Após conferência, seguimos com troca ou reembolso.' },
    ];

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
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
                        Para iniciar, envie e-mail para <span className="text-primary font-semibold">contato@demirdiesel.com.br</span> ou chame no WhatsApp (83) 99873-7170.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
