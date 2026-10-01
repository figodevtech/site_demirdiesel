import { siteConfig } from "@/lib/site-config";

export type DeliveryMethod = "delivery" | "pickup";

export interface ShippingOption {
  id: DeliveryMethod;
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
  shippingAmount: number;
  pickupEligible: boolean;
}

export interface ShippingLocation {
  city?: string | null;
  state?: string | null;
}

export const LOCAL_PICKUP_CITIES = [
  "João Pessoa",
  "Bayeux",
  "Cabedelo",
  "Conde",
  "Santa Rita",
] as const;

export function isPickupEligible(location: ShippingLocation) {
  if (normalize(location.state) !== "pb") return false;
  const city = normalize(location.city);
  return LOCAL_PICKUP_CITIES.some((allowedCity) => normalize(allowedCity) === city);
}

export function getShippingEstimate(cep: string, location: ShippingLocation = {}): ShippingQuoteResult {
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length !== 8) {
    return {
      hasValidCep: false,
      status: "pending_analysis",
      message: "Digite um CEP válido com 8 dígitos.",
      options: [],
      shippingAmount: 0,
      pickupEligible: false,
    };
  }

  const pickupEligible = isPickupEligible(location);
  const options: ShippingOption[] = [
    {
      id: "delivery",
      type: "Entrega por transportadora",
      price: 0,
      formattedPrice: "A calcular",
      daysText: "Prazo informado após cotação",
      description: "O valor será confirmado conforme endereço, peso e dimensões do pedido.",
    },
  ];

  if (pickupEligible) {
    options.unshift({
      id: "pickup",
      type: "Retirada no local",
      price: 0,
      formattedPrice: "Grátis",
      daysText: "Após confirmação de que o pedido está pronto",
      description: siteConfig.address.full,
    });
  }

  return {
    hasValidCep: true,
    status: "pending_analysis",
    message: pickupEligible
      ? "Este endereço pode retirar gratuitamente na Demir Diesel ou solicitar entrega."
      : "O frete será confirmado após a análise do endereço e da cubagem.",
    options,
    shippingAmount: 0,
    pickupEligible,
  };
}

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}
