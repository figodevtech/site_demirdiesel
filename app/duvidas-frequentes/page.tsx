'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
    { q: 'Quais formas de pagamento aceitam?', a: 'Cartão de crédito, PIX e boleto via Pagar.me.' },
    { q: 'Qual o prazo de entrega?', a: 'O prazo varia por região; exibimos o prazo estimado no checkout ao informar o CEP.' },
    { q: 'Como acompanhar meu pedido?', a: 'Acesse “Meus Pedidos”. Quando houver código de rastreio, ele aparecerá lá.' },
    { q: 'Posso alterar ou cancelar um pedido?', a: 'Se o pedido ainda não foi enviado, fale conosco rapidamente por WhatsApp ou e-mail para tentar alterar ou cancelar.' },
    { q: 'Como funciona a troca ou devolução?', a: 'Você tem 7 dias para arrependimento e 30 dias para defeito aparente. Entre em contato para receber instruções e o código de postagem quando aplicável.' },
    { q: 'Vocês guardam dados de cartão?', a: 'Não. O processamento é feito pelo Pagar.me; não armazenamos dados completos de cartão.' },
    { q: 'O frete é calculado como?', a: 'Calculamos no checkout com base no CEP, peso e volume dos itens.' },
];

export default function DuvidasFrequentesPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-3">Dúvidas Frequentes</h1>
            <p className="text-muted-foreground mb-8">Principais respostas sobre pagamentos, prazos e suporte.</p>

            <Accordion type="single" collapsible className="w-full">
                {faqs.map((item, idx) => (
                    <AccordionItem key={idx} value={`faq-${idx}`}>
                        <AccordionTrigger>{item.q}</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">
                            {item.a}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
