import React from "react";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { ContactForm } from "./ContactForm";
import { siteConfig, buildWhatsAppUrl } from "@/lib/site-config";

export function WorkshopLocation() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-20" id="oficina">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Lado Esquerdo: Localização & Atendimento */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Atendimento Físico & Especializado
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
              Visite nossa Oficina & Balcão de Peças
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Traga seu veículo, módulo ou bico injetor para diagnóstico em João Pessoa.
              Dispomos de bancada de testes, estacionamento e equipe técnica especializada.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border/80">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-xs leading-relaxed">
                <strong className="text-foreground block text-sm">Endereço</strong>
                <span className="text-muted-foreground">
                  {siteConfig.address.full}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border/80">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong className="text-foreground block">Horário de Funcionamento</strong>
                  <span className="text-muted-foreground block mt-0.5">{siteConfig.openingHours}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border/80">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong className="text-foreground block">Telefones & WhatsApp</strong>
                  {siteConfig.phoneDisplay && (
                    <span className="text-muted-foreground block mt-0.5">{siteConfig.phoneDisplay}</span>
                  )}
                  {siteConfig.whatsapp ? (
                    <a
                      href={buildWhatsAppUrl("Olá, gostaria de falar com a oficina Demir Diesel.")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 font-semibold hover:underline block mt-0.5"
                    >
                      {siteConfig.whatsappDisplay || "WhatsApp de Atendimento"}
                    </a>
                  ) : (
                    <span className="text-muted-foreground block mt-0.5">
                      Atendimento via formulário online
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Iframe Mapa */}
          <div className="w-full h-64 rounded-2xl overflow-hidden border border-border/80 shadow-xs relative">
            <iframe
              src="https://maps.google.com/maps?q=R.+Jorn.+Jo%C3%A3o+Jos%C3%A9+Ramalho,+33+-+Costa+e+Silva,+Jo%C3%A3o+Pessoa+-+PB,+58081-110&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização Demir Diesel no Google Maps"
            />
          </div>
        </div>

        {/* Lado Direito: Formulário de Contato Rápido */}
        <div className="lg:col-span-6 bg-card rounded-2xl border border-border/80 p-6 md:p-8 shadow-xs">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-foreground">Envie uma Solicitação Técnica</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Informe a peça ou serviço desejado para que nossa equipe técnica analise e retorne com o orçamento.
            </p>
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
