/**
 * Módulo de cotação e cálculo de frete da Demir Diesel.
 * 
 * Regra: Enquanto não houver integração oficial com transportadoras (ex: Frenet, Correios, Jadlog),
 * nenhum valor fixo fictício (ex: R$ 38,50 ou R$ 68,00) deve ser exibido ou cobrado no checkout.
 * O frete é tratado como "A calcular", sendo acordado após a análise do endereço e cubagem da peça.
 */

export interface ShippingOption {
  type: string;
  price: number;
  formattedPrice: string;
  daysText: string;
  description: string;
}

export interface ShippingQuoteResult {
  hasValidCep: boolean;
  status: "pending_analysis" | "calculated";
  message: string;
  options: ShippingOption[];
  shippingAmount: number; // 0 para evitar cobrança arbitrária
}

export function getShippingEstimate(cep: string): ShippingQuoteResult {
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length < 8) {
    return {
      hasValidCep: false,
      status: "pending_analysis",
      message: "Digite um CEP válido com 8 dígitos.",
      options: [],
      shippingAmount: 0,
    };
  }

  return {
    hasValidCep: true,
    status: "pending_analysis",
    message: "Frete a combinar após confirmação do pedido e cubagem da peça.",
    options: [
      {
        type: "Transportadora / Carga Pesada",
        price: 0,
        formattedPrice: "A calcular",
        daysText: "Prazo informado após cotação",
        description: "Despacho especializado para motores, blocos, injeção e módulos eletrônicos.",
      },
      {
        type: "Envio Aéreo Expresso",
        price: 0,
        formattedPrice: "A calcular",
        daysText: "Sob consulta técnica",
        description: "Envio prioritário para peças urgentes e paradas de frota.",
      },
    ],
    shippingAmount: 0,
  };
}
