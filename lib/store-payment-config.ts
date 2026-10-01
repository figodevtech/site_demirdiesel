import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type StorePaymentConfig = {
  enabled: boolean;
  commissionEnabled: boolean;
  commissionPercent: number;
  commissionWalletId: string | null;
  revision: number;
};

const SAFE_DEFAULT: StorePaymentConfig = {
  enabled: true,
  commissionEnabled: false,
  commissionPercent: 0,
  commissionWalletId: null,
  revision: 0,
};

type CentralResponse = {
  installationId?: string;
  storeName?: string;
  enabled?: boolean;
  commission?: {
    enabled?: boolean;
    percent?: number;
    walletId?: string | null;
  };
  revision?: number;
  effectiveAt?: string;
  updatedAt?: string;
};

function normalize(input: CentralResponse): StorePaymentConfig | null {
  const percent = Number(input.commission?.percent || 0);
  const walletId = String(input.commission?.walletId || "").trim() || null;
  const revision = Number(input.revision || 0);
  const commissionEnabled = input.commission?.enabled === true;

  if (!Number.isInteger(revision) || revision < 1) return null;
  if (!Number.isFinite(percent) || percent < 0 || percent >= 100) return null;
  if (commissionEnabled && (percent <= 0 || !walletId)) return null;

  return {
    enabled: input.enabled !== false,
    commissionEnabled,
    commissionPercent: commissionEnabled ? percent : 0,
    commissionWalletId: commissionEnabled ? walletId : null,
    revision,
  };
}

async function readLocalConfig(): Promise<StorePaymentConfig> {
  const { data, error } = await supabaseAdmin
    .from("store_payment_config")
    .select("enabled, commission_enabled, commission_percent, commission_wallet_id, revision")
    .eq("id", true)
    .maybeSingle();

  if (error || !data) return SAFE_DEFAULT;
  return {
    enabled: data.enabled !== false,
    commissionEnabled: data.commission_enabled === true,
    commissionPercent: Number(data.commission_percent) || 0,
    commissionWalletId: data.commission_wallet_id || null,
    revision: Number(data.revision) || 0,
  };
}

async function pullCentralConfig(): Promise<StorePaymentConfig | null> {
  const baseUrl = String(process.env.CENTRAL_STOREFRONT_CONFIG_URL || "").trim();
  const installationId = String(process.env.CENTRAL_INSTALLATION_ID || "").trim();
  const token = String(process.env.CENTRAL_STOREFRONT_TOKEN || "").trim();
  if (!baseUrl || !installationId || !token) return null;

  const url = new URL(baseUrl);
  url.searchParams.set("installationId", installationId);
  const response = await fetch(url, {
    headers: { Authorization: "Bearer " + token, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(1800),
  });
  if (!response.ok) throw new Error("Central respondeu HTTP " + response.status);

  const central = (await response.json()) as CentralResponse;
  const normalized = normalize(central);
  if (!normalized) throw new Error("Configuração financeira inválida recebida da Central.");

  const { error } = await supabaseAdmin.from("store_payment_config").upsert({
    id: true,
    central_installation_id: central.installationId || installationId,
    store_name: central.storeName || "Demir Diesel",
    enabled: normalized.enabled,
    commission_enabled: normalized.commissionEnabled,
    commission_percent: normalized.commissionPercent,
    commission_wallet_id: normalized.commissionWalletId,
    revision: normalized.revision,
    effective_at: central.effectiveAt || null,
    central_updated_at: central.updatedAt || null,
    synced_at: new Date().toISOString(),
  });
  if (error) throw error;
  return normalized;
}

export async function getStorePaymentConfig(): Promise<StorePaymentConfig> {
  try {
    const central = await pullCentralConfig();
    if (central) return central;
  } catch (error) {
    console.warn("[payment-config] Central indisponível; usando cópia local.", error);
  }
  return readLocalConfig();
}
