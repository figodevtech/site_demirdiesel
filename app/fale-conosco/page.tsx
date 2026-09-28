"use client";

import React from "react";
import { Mail, Phone, MapPin, Clock, MessageCircle, ShieldCheck } from "lucide-react";
import { ContactForm } from "@/components/home/ContactForm";

export default function FaleConoscoPage() {
  const contatos = [
    {
      icon: Phone,
      label: "Telefone Comercial",
      value: "(83) 3000-0000",
      link: "tel:8330000000",
    },
    {
      icon: MessageCircle,
      label: "Plantão WhatsApp",
      value: "(83) 99999-9999",
      link: "https://wa.me/5583999999999?text=Ol%C3%A1%2C%20gostaria%20de%20um%20or%C3%A7amento%20t%C3%A9cnico.",
    },
    {
      icon: Mail,
      label: "E-mail de Contato",
      value: "contato@demirdiesel.com.br",
      link: "mailto:contato@demirdiesel.com.br",
    },
    {
      icon: MapPin,
      label: "Endereço Físico",
      value: "R. Jorn. João José Ramalho, 33 - Costa e Silva, João Pessoa - PB, 58081-110",
      link: "https://maps.google.com/?q=Demir+Diesel+João+Pessoa",
    },
    {
      icon: Clock,
      label: "Horário de Atendimento",
      value: "Seg a Sex: 07:30 às 17:30 | Sábado: 07:30 às 12:00",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-14 max-w-5xl">
      <div className="mb-8 pb-6 border-b border-border/80">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Atendimento & Suporte Técnico
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground mt-1">
          Fale Conosco
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-xl">
          Nossa equipe de consultores técnicos e especialistas em diesel está à disposição
          para orçamentos, diagnósticos de módulos e envio de peças.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contatos Rápidos & Localização */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-2xs space-y-5">
            <h2 className="font-extrabold text-base text-foreground">Canais Diretos</h2>

            <div className="space-y-4 text-xs">
              {contatos.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">{item.label}</span>
                      {item.link ? (
                        <a
                          href={item.link}
                          target={item.link.startsWith("http") ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="font-semibold text-foreground hover:text-primary transition-colors block text-xs"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <span className="font-semibold text-foreground block text-xs">
                          {item.value}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-600/20 text-xs flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-emerald-900 dark:text-emerald-300">
              Atendimento com especialistas em motores pesados e bancadas de teste eletrônicas.
            </span>
          </div>
        </div>

        {/* Formulário de Mensagem */}
        <div className="lg:col-span-7 bg-card rounded-2xl border border-border/80 p-6 md:p-8 shadow-2xs">
          <h2 className="font-extrabold text-lg text-foreground mb-1">
            Envie sua Mensagem
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            Preencha os campos abaixo e entraremos em contato com você o mais breve possível.
          </p>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
