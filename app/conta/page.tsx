"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Loader2,
  Mail,
  Phone,
  Save,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthContext";
import { AccountSectionHeader, AccountShell } from "@/components/account/AccountShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  cleanCpfCnpj,
  formatCpfCnpj,
  formatPhone,
  isValidCpfCnpj,
} from "@/lib/auth-utils";
import { ensureCustomerProfile } from "@/lib/customer-profile";
import { supabase } from "@/lib/supabase";

type PersonType = "FISICA" | "JURIDICA";

function userMetadataValue(
  metadata: Record<string, unknown> | undefined,
  key: string,
) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}

export default function ContaPage() {
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const attemptedProfileUserId = useRef<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
  const [personType, setPersonType] = useState<PersonType>("FISICA");
  const [isPreparingProfile, setIsPreparingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/conta");
      return;
    }

    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const metadataType =
      userMetadataValue(metadata, "person_type") === "JURIDICA"
        ? "JURIDICA"
        : "FISICA";

    setName(profile?.nomerazaosocial || userMetadataValue(metadata, "name"));
    setPhone(profile?.telefone || userMetadataValue(metadata, "phone"));
    setDocument(
      formatCpfCnpj(
        profile?.cpfcnpj || userMetadataValue(metadata, "cpf_cnpj"),
      ),
    );
    setPersonType(
      profile?.tipopessoa === "JURIDICA"
        ? "JURIDICA"
        : profile?.tipopessoa === "FISICA"
          ? "FISICA"
          : metadataType,
    );

    if (!profile?.id && attemptedProfileUserId.current !== user.id) {
      attemptedProfileUserId.current = user.id;
      setIsPreparingProfile(true);
      void ensureCustomerProfile(user)
        .then(() => refreshProfile())
        .catch((error) => {
          console.error("Erro ao preparar perfil:", error);
          toast.error("Não foi possível concluir seu perfil automaticamente.");
        })
        .finally(() => setIsPreparingProfile(false));
    }
  }, [
    authLoading,
    profile?.cpfcnpj,
    profile?.id,
    profile?.nomerazaosocial,
    profile?.telefone,
    profile?.tipopessoa,
    refreshProfile,
    router,
    user,
  ]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    if (!name.trim() || !phone.trim() || !document) {
      toast.warning("Preencha nome, telefone e CPF/CNPJ.");
      return;
    }

    if (!isValidCpfCnpj(document, personType)) {
      toast.error(personType === "FISICA" ? "CPF inválido." : "CNPJ inválido.");
      return;
    }

    setIsSaving(true);
    try {
      const cleanDocument = cleanCpfCnpj(document);

      if (!profile?.id) {
        await ensureCustomerProfile(user, {
          name,
          personType,
          document: cleanDocument,
          email: user.email || "",
          phone,
        });
      }

      const [{ error: profileError }, { error: metadataError }] =
        await Promise.all([
          supabase
            .from("cliente")
            .update({
              nomerazaosocial: name.trim(),
              telefone: phone.trim(),
              tipopessoa: personType,
              cpfcnpj: cleanDocument,
              updatedat: new Date().toISOString(),
            })
            .eq("user_id", user.id),
          supabase.auth.updateUser({
            data: {
              name: name.trim(),
              phone: phone.trim(),
              person_type: personType,
              cpf_cnpj: cleanDocument,
            },
          }),
        ]);

      if (profileError) throw profileError;
      if (metadataError) throw metadataError;

      await refreshProfile();
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message.includes("duplicate") || message.includes("unique")
          ? "Este CPF/CNPJ já está associado a outra conta."
          : "Erro ao atualizar seus dados.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (authLoading || isPreparingProfile) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">
          Preparando seu perfil...
        </span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AccountShell>
      <AccountSectionHeader
        icon={UserIcon}
        title="Meu perfil"
        description="Gerencie seus dados de identificação e contato."
      />

      <div className="min-h-[32rem] rounded-2xl bg-card p-5 shadow-lg shadow-slate-900/8 dark:shadow-black/25 sm:p-6 lg:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Tipo de pessoa</Label>
              <Tabs
                value={personType}
                onValueChange={(value) => setPersonType(value as PersonType)}
              >
                <TabsList className="grid h-11 w-full grid-cols-2 bg-muted/70 p-1">
                  <TabsTrigger
                    value="FISICA"
                    className="h-9 font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    Pessoa física
                  </TabsTrigger>
                  <TabsTrigger
                    value="JURIDICA"
                    className="h-9 font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    Pessoa jurídica
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account-name">
                  {personType === "FISICA" ? "Nome completo" : "Razão social"}
                </Label>
                <Input
                  id="account-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-email">E-mail da conta</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="account-email"
                    value={user.email || ""}
                    disabled
                    className="h-11 bg-muted/60 pl-10 text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account-document">
                  {personType === "FISICA" ? "CPF" : "CNPJ"}
                </Label>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="account-document"
                    value={document}
                    onChange={(event) =>
                      setDocument(formatCpfCnpj(event.target.value))
                    }
                    className="h-11 pl-10 font-mono"
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-phone">Telefone / WhatsApp</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="account-phone"
                    value={phone}
                    onChange={(event) =>
                      setPhone(formatPhone(event.target.value))
                    }
                    className="h-11 pl-10 font-mono"
                    inputMode="tel"
                    required
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="flex flex-col gap-4 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="size-4 text-emerald-600" />
              Dados protegidos por criptografia
            </span>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-11 w-full gap-2 font-semibold sm:w-auto"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isSaving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </div>
    </AccountShell>
  );
}
