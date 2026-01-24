"use client";

import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "@/components/home/ContactForm";

export default function FaleConoscoPage() {
    const contatos = [
        { icon: <Phone className="w-5 h-5 text-primary" />, label: "Telefone", value: "(00) 00000-0000" },
        { icon: <Mail className="w-5 h-5 text-primary" />, label: "E-mail", value: "contato@demirdiesel.com.br" },
        { icon: <MapPin className="w-5 h-5 text-primary" />, label: "Endereço", value: "R. Jorn. João José Ramalho, 33 - João Pessoa/PB" },
        { icon: <Clock className="w-5 h-5 text-primary" />, label: "Horário", value: "Seg a Sex, 8h às 18h | Sáb, 8h às 12h" },
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
                    <CardContent>
                        <ContactForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
