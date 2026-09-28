/**
 * Configuração central da empresa Demir Diesel.
 * Nenhum dado fictício (telefones com 99999, CNPJ zerado) deve ser hardcoded no projeto.
 * Se uma informação real não estiver configurada via variáveis de ambiente,
 * o campo correspondente permanece vazio ou é omitido na interface.
 */

export interface SiteConfig {
  name: string;
  legalName: string;
  cnpj: string;
  phone: string;
  phoneDisplay: string;
  whatsapp: string; // formato internacional apenas números: ex. 5583988887777
  whatsappDisplay: string;
  email: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
    full: string;
    googleMapsEmbedUrl?: string;
  };
  openingHours: string;
  url: string;
}

export const siteConfig: SiteConfig = {
  name: "Demir Diesel",
  legalName: process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME || "Demir Diesel Peças e Serviços Ltda.",
  // Se não houver CNPJ real nas variáveis de ambiente, não exibe CNPJ fictício (00.000.000/0001-00)
  cnpj: process.env.NEXT_PUBLIC_COMPANY_CNPJ || "",
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "",
  phoneDisplay: process.env.NEXT_PUBLIC_COMPANY_PHONE_DISPLAY || "",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  whatsappDisplay: process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY || "",
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || "contato@demirdiesel.com.br",
  address: {
    street: "R. Jorn. João José Ramalho",
    number: "33",
    neighborhood: "Costa e Silva",
    city: "João Pessoa",
    state: "PB",
    cep: "58081-110",
    full: "R. Jorn. João José Ramalho, 33 - Costa e Silva, João Pessoa - PB, 58081-110",
    googleMapsEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3958.835489814522!2d-34.8876495!3d-7.1449835!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7ace8397a66b931%3A0x6a1005fa75775aa7!2sR.%20Jorn.%20Jo%C3%A3o%20Jos%C3%A9%20Ramalho%2C%2033%20-%20Costa%20e%20Silva%2C%20Jo%C3%A3o%20Pessoa%20-%20PB%2C%2058081-110!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr",
  },
  openingHours: "Segunda a Sexta: 07h30 às 17h30 | Sábado: 07h30 às 12h00",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://demirdiesel.com.br",
};

/**
 * Constrói URL do WhatsApp caso o número esteja configurado.
 * Caso o número não esteja definido em variáveis de ambiente, retorna rota interna /fale-conosco.
 */
export function buildWhatsAppUrl(messageText?: string): string {
  const number = siteConfig.whatsapp.replace(/\D/g, "");
  if (!number) {
    return "/fale-conosco";
  }
  const base = `https://wa.me/${number}`;
  if (!messageText) return base;
  return `${base}?text=${encodeURIComponent(messageText)}`;
}
