import "server-only";

const rawApiKey = process.env.ASAAS_API_KEY || "";
const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, "");
const environment = (process.env.ASAAS_ENVIRONMENT || "sandbox").trim().toLowerCase();
const configuredApiUrl = (process.env.ASAAS_API_URL || "").trim().replace(/\/+$/, "");

export const asaasApiUrl =
  configuredApiUrl ||
  (environment === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3");

export interface AsaasCustomer {
  id: string;
  name?: string;
  cpfCnpj?: string;
  externalReference?: string;
}

export interface AsaasPayment {
  refunds?: Array<{ status?: string }> | null;
  id: string;
  customer?: string;
  billingType?: string;
  status?: string;
  value?: number;
  netValue?: number;
  dueDate?: string;
  invoiceUrl?: string;
  externalReference?: string;
}

export interface AsaasCardToken {
  creditCardToken: string;
  creditCardNumber?: string;
  creditCardBrand?: string;
}

interface AsaasList<T> {
  data?: T[];
}

export class AsaasApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AsaasApiError";
  }
}

export function assertAsaasConfigured() {
  if (!apiKey) {
    throw new AsaasApiError("ASAAS_API_KEY não configurada no servidor.", 500);
  }
}

function extractErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return "Erro não identificado no Asaas.";

  const record = payload as Record<string, unknown>;
  const errors = Array.isArray(record.errors) ? record.errors : [];
  const messages = errors
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      return String((item as Record<string, unknown>).description || "").trim();
    })
    .filter(Boolean);

  return messages.join(" ") || String(record.message || "Erro não identificado no Asaas.");
}

export async function asaasRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  assertAsaasConfigured();

  const response = await fetch(`${asaasApiUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "DemirDieselStore/1.0",
      access_token: apiKey,
      ...(init.headers || {}),
    },
  });

  const raw = await response.text();
  let payload: unknown = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = { message: "Resposta inválida recebida do Asaas." };
  }

  if (!response.ok) {
    throw new AsaasApiError(extractErrorMessage(payload), response.status, payload);
  }

  return payload as T;
}

export async function findAsaasCustomer(cpfCnpj: string, externalReference: string) {
  const query = new URLSearchParams({ cpfCnpj, externalReference, limit: "1" });
  const result = await asaasRequest<AsaasList<AsaasCustomer>>(`/customers?${query.toString()}`);
  if (result.data?.[0]) return result.data[0];

  const fallback = new URLSearchParams({ cpfCnpj, limit: "1" });
  const byDocument = await asaasRequest<AsaasList<AsaasCustomer>>(
    `/customers?${fallback.toString()}`
  );
  return byDocument.data?.[0] || null;
}

export async function createAsaasCustomer(payload: Record<string, unknown>) {
  return asaasRequest<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createAsaasPayment(payload: Record<string, unknown>) {
  return asaasRequest<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function tokenizeAsaasCreditCard(payload: Record<string, unknown>) {
  return asaasRequest<AsaasCardToken>("/creditCard/tokenizeCreditCard", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAsaasPayment(paymentId: string) {
  return asaasRequest<AsaasPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

export async function refundAsaasPayment(paymentId: string, description: string) {
  return asaasRequest<AsaasPayment>(`/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    body: JSON.stringify({ description }),
    signal: AbortSignal.timeout(60_000),
  });
}

export async function refundAsaasBankSlip(paymentId: string) {
  return asaasRequest<{ requestUrl: string }>(`/payments/${encodeURIComponent(paymentId)}/bankSlip/refund`, {
    method: "POST", body: JSON.stringify({}), signal: AbortSignal.timeout(60_000),
  });
}
