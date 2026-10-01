'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function PoliticaPrivacidadePage() {
    const secoes = [
        {
            titulo: 'Coleta de dados',
            texto: 'Coletamos nome, e-mail, telefone, endereço e dados de pagamento apenas para processar pedidos e suporte. Não vendemos ou compartilhamos seus dados com terceiros para fins comerciais.'
        },
        {
            titulo: 'Uso das informações',
            texto: 'Usamos seus dados para faturamento, entrega, comunicação sobre pedidos, suporte e melhorias do site. Envio de ofertas só com seu consentimento, podendo ser revogado a qualquer momento.'
        },
        {
            titulo: 'Pagamentos',
            texto: 'Pagamentos são processados pelo Asaas. Não armazenamos dados completos de cartão; apenas referências necessárias para identificar e conciliar transações.'
        },
        {
            titulo: 'Segurança',
            texto: 'Utilizamos HTTPS, controles de acesso e chaves restritas. Acesso administrativo é limitado a pessoal autorizado.'
        },
        {
            titulo: 'Direitos do titular',
            texto: 'Você pode solicitar atualização, correção ou exclusão de seus dados, bem como revogar consentimentos. Contate-nos pelo e-mail contato@demirdiesel.com.br.'
        },
        {
            titulo: 'Retenção',
            texto: 'Mantemos dados apenas pelo tempo necessário para cumprir obrigações legais (fiscais, antifraude) e para histórico de pedidos.'
        }
    ];

    return (
        <div className="container mx-auto max-w-5xl px-4 pb-10 pt-4 md:pt-6">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-3">Política de Privacidade</h1>
            <p className="text-muted-foreground mb-8">Como tratamos e protegemos seus dados pessoais.</p>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Resumo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {secoes.map((sec) => (
                        <div key={sec.titulo} className="space-y-2">
                            <h2 className="text-lg font-semibold">{sec.titulo}</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed">{sec.texto}</p>
                            <Separator />
                        </div>
                    ))}
                    <p className="text-sm text-muted-foreground">
                        Em caso de dúvidas, escreva para <span className="text-primary font-semibold">contato@demirdiesel.com.br</span>.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
