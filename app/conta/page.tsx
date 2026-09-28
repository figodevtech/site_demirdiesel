"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User as UserIcon, Save, Loader2, ArrowLeft, Shield, Mail, Phone } from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function ContaPage() {
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/conta");
      } else if (profile?.id) {
        setName(profile.nomerazaosocial || "");
        setPhone(profile.telefone || "");
      }
    }
  }, [user?.id, profile?.id, authLoading, router]);

  if (authLoading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Carregando seu perfil...</span>
      </div>
    );
  }

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("cliente")
        .update({
          nomerazaosocial: name,
          telefone: phone,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      await refreshProfile();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar seus dados.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
            <UserIcon className="w-7 h-7 text-primary" />
            <span>Meu Perfil</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie seus dados de identificação e contato
          </p>
        </div>

        <Link
          href="/pedidos"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <span>Meus Pedidos</span>
        </Link>
      </div>

      <div className="bg-card rounded-2xl border border-border/80 p-6 md:p-8 shadow-2xs">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            {/* E-mail (somente leitura) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                E-mail da Conta
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={user.email || ""}
                  disabled
                  className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 text-xs text-muted-foreground cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-muted-foreground block">
                O e-mail é utilizado para login e notificações de faturamento.
              </span>
            </div>

            {/* Documento e Tipo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  CPF / CNPJ
                </Label>
                <Input
                  value={profile?.cpfcnpj || "—"}
                  disabled
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 text-xs font-mono text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Classificação Fiscal
                </Label>
                <Input
                  value={profile?.tipopessoa === "FISICA" ? "Pessoa Física (CPF)" : "Pessoa Jurídica (CNPJ)"}
                  disabled
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 text-xs text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            {/* Nome / Razão Social */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nome Completo ou Razão Social
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome ou nome da empresa"
                className="text-xs h-10"
              />
            </div>

            {/* Telefone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Telefone / WhatsApp
              </Label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="pl-9 text-xs h-10 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dados protegidos por criptografia</span>
            </span>

            <Button
              type="submit"
              disabled={isSaving}
              className="text-xs font-semibold h-10 px-5 rounded-xl gap-2 bg-primary hover:bg-primary/90 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
