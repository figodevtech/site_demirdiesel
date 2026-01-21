'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function FaleConoscoPage() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    const enviar = async () => {
        if (!email || !mensagem) {
            setFeedback('Preencha e-mail e mensagem.');
            return;
        }
        setEnviando(true);
        setFeedback(null);
        try {
            const res = await fetch('/api/contato', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, mensagem }),
            });
            if (!res.ok) throw new Error();
            setFeedback('Mensagem enviada! Responderemos em breve.');
            setNome('');
            setEmail('');
            setMensagem('');
        } catch {
            setFeedback('Não foi possível enviar. Tente novamente mais tarde.');
        } finally {
            setEnviando(false);
        }
    };

    const contatos = [
        { icon: <Phone className="w-5 h-5 text-primary" />, label: 'Telefone', value: '(00) 00000-0000' },
        { icon: <Mail className="w-5 h-5 text-primary" />, label: 'E-mail', value: 'contato@demirdiesel.com.br' },
        { icon: <MapPin className="w-5 h-5 text-primary" />, label: 'Endereço', value: 'R. Jorn. João José Ramalho, 33 - João Pessoa/PB' },
        { icon: <Clock className="w-5 h-5 text-primary" />, label: 'Horário', value: 'Seg a Sex, 8h às 18h | Sáb, 8h às 12h' },
    ];

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-3">Fale Conosco</h1>
            <p className="text-muted-foreground mb-8">Estamos prontos para ajudar no que precisar. Escolha o canal que preferir.</p>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Contatos Rápidos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {contatos.map((item) => (
                            <div key={item.label} className="flex items-start gap-3">
                                <div className="mt-1">{item.icon}</div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{item.label}</p>
                                    <p className="font-semibold text-foreground">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Envie uma mensagem</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <div className="space-y-3">
                            <div className="grid gap-2">
                                <label className="text-xs uppercase tracking-wide text-muted-foreground">Nome</label>
                                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs uppercase tracking-wide text-muted-foreground">E-mail*</label>
                                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs uppercase tracking-wide text-muted-foreground">Mensagem*</label>
                                <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={4} placeholder="Como podemos ajudar?" />
                            </div>
                            {feedback && <p className="text-xs text-muted-foreground">{feedback}</p>}
                            <Button onClick={enviar} disabled={enviando} className="w-full">
                                {enviando ? 'Enviando...' : 'Enviar'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
