import React from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, ShieldCheck, Truck, Wrench, MessageCircle } from "lucide-react";
import { getCategories } from "@/lib/catalog/categories";
import { siteConfig, buildWhatsAppUrl } from "@/lib/site-config";

export default async function Footer() {
  const categories = (await getCategories()).slice(0, 6);

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      {/* Faixa de Diferenciais de Engenharia */}
      <div className="container mx-auto px-4 pb-12 mb-12 border-b border-slate-850">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Garantia & Procedência</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Peças genuínas e módulos testados em bancadas de alta precisão.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Despacho para Todo Brasil</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Envio expresso aéreo e rodoviário para manter sua frota rodando.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Oficina & Laboratório</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Diagnóstico de injeção eletrônica common rail e reparo eletrônico.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Coluna 1: Sobre a Demir Diesel */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm">
                D
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                DEMIR <span className="text-primary">DIESEL</span>
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Referência regional no fornecimento de peças para motores diesel, componentes de
              injeção eletrônica, módulos e serviços especializados de oficina pesada.
            </p>

            <div className="pt-2">
              <a
                href={buildWhatsAppUrl("Olá, gostaria de um atendimento técnico.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Atendimento no WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Coluna 2: Principais Categorias */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Catálogo Diesel
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/produtos?category=${cat.slug}`}
                    className="hover:text-primary transition-colors block py-0.5"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/produtos"
                  className="text-primary hover:underline font-semibold block pt-1"
                >
                  Ver catálogo completo →
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Atendimento & Conta */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Minha Conta & Suporte
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/conta" className="hover:text-primary transition-colors block py-0.5">
                  Meu Perfil
                </Link>
              </li>
              <li>
                <Link href="/pedidos" className="hover:text-primary transition-colors block py-0.5">
                  Rastrear Meus Pedidos
                </Link>
              </li>
              <li>
                <Link href="/favoritos" className="hover:text-primary transition-colors block py-0.5">
                  Peças Favoritas
                </Link>
              </li>
              <li>
                <Link href="/enderecos" className="hover:text-primary transition-colors block py-0.5">
                  Endereços de Entrega
                </Link>
              </li>
              <li>
                <Link href="/politica-de-privacidade" className="hover:text-primary transition-colors block py-0.5">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/trocas-e-devolucoes" className="hover:text-primary transition-colors block py-0.5">
                  Garantia e Devoluções
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Unidade Física & Localização */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Unidade Operacional
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  {siteConfig.address.street}, {siteConfig.address.number}
                  <br />
                  {siteConfig.address.neighborhood}, {siteConfig.address.city} - {siteConfig.address.state}
                  <br />
                  CEP: {siteConfig.address.cep}
                </span>
              </li>
              {(siteConfig.phoneDisplay || siteConfig.phone) && (
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span>{siteConfig.phoneDisplay || siteConfig.phone}</span>
                </li>
              )}
              {siteConfig.email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span>{siteConfig.email}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Linha Inferior com Copyright e Segurança */}
        <div className="border-t border-slate-900 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>
            © {new Date().getFullYear()} {siteConfig.legalName}
            {siteConfig.cnpj ? ` CNPJ: ${siteConfig.cnpj}` : ""}.
          </p>
          <p className="text-slate-400">
            Tecnologia & Peças para manter sua operação em movimento.
          </p>
        </div>
      </div>
    </footer>
  );
}
