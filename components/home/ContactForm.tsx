"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ContactForm() {
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [assunto, setAssunto] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    const enviar = async () => {
        if (!email || !assunto || !mensagem) {
            setFeedback("Informe e-mail, assunto e mensagem.");
            return;
        }
        setEnviando(true);
        setFeedback(null);
        try {
            const res = await fetch("/api/contato", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome, email, assunto, mensagem }),
            });
            if (!res.ok) throw new Error();
            setFeedback("Mensagem enviada! Responderemos em breve.");
            setNome("");
            setEmail("");
            setAssunto("");
            setMensagem("");
        } catch {
            setFeedback("Não foi possível enviar. Tente novamente mais tarde.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-medium">Nome</label>
                    <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-medium">E-mail*</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-medium">Título*</label>
                <Select value={assunto} onValueChange={setAssunto}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Escolha uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="duvida">Dúvida geral</SelectItem>
                        <SelectItem value="orcamento">Orçamento</SelectItem>
                        <SelectItem value="pedido">Status de pedido</SelectItem>
                        <SelectItem value="troca">Troca ou devolução</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-medium">Mensagem*</label>
                <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={4} placeholder="Como podemos ajudar?" />
            </div>
            {feedback && <p className="text-xs text-muted-foreground">{feedback}</p>}
            <Button className="w-full font-semibold" onClick={enviar} disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar Mensagem"}
            </Button>
        </div>
    );
}
