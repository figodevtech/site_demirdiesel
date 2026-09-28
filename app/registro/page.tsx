"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Phone, FileText, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatCpfCnpj, cleanCpfCnpj, formatPhone, isValidCpfCnpj } from "@/lib/auth-utils";
import { useAuth } from "@/components/providers/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tipoPessoa, setTipoPessoa] = useState<"FISICA" | "JURIDICA">("FISICA");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [phone, setPhone] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !cpfCnpj || !phone) {
      toast.warning("Preencha todos os campos obrigatórios.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (!isValidCpfCnpj(cpfCnpj, tipoPessoa)) {
      toast.error(
        tipoPessoa === "FISICA"
          ? "CPF inválido. Por favor, verifique os dígitos informados."
          : "CNPJ inválido. Por favor, verifique os dígitos informados."
      );
      return;
    }

    setIsLoading(true);
    try {
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (authError) throw authError;

      if (!authData.session && !authData.user) {
        toast.success("Conta criada! Verifique seu e-mail para confirmar seu cadastro.");
        router.push("/login");
        return;
      }

      if (authData.user) {
        // 2. Verifica se o perfil de cliente já existe para evitar duplicidades
        const { data: existingProfile } = await supabase
          .from("cliente")
          .select("id")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (!existingProfile) {
          const cleanDoc = cleanCpfCnpj(cpfCnpj);
          const { error: dbError } = await supabase.from("cliente").insert({
            user_id: authData.user.id,
            nomerazaosocial: name.trim(),
            tipopessoa: tipoPessoa,
            cpfcnpj: cleanDoc,
            email: email.trim().toLowerCase(),
            telefone: phone.trim(),
          });

          if (dbError) {
            console.error("Erro no cadastro de perfil do cliente:", dbError);
            toast.error(
              dbError.message.includes("duplicate") || dbError.message.includes("unique")
                ? "Este CPF/CNPJ ou e-mail já está associado a outro cadastro."
                : "Sua conta de login foi criada, mas ocorreu uma falha ao registrar o perfil: " + dbError.message
            );
            return;
          }
        }

        toast.success("Cadastro concluído com sucesso!");
        await refreshProfile();
        router.push("/conta");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao realizar cadastro.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-card rounded-3xl border border-border/80 p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl mx-auto mb-4 border border-slate-800 shadow-sm">
            <span className="text-primary">D</span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Criar Conta na Demir Diesel
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Cadastre-se para faturar pedidos, salvar orçamentos e agilizar suas compras
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Tipo de Pessoa Toggle */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-2">
            <button
              type="button"
              onClick={() => setTipoPessoa("FISICA")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tipoPessoa === "FISICA"
                  ? "bg-white dark:bg-slate-900 text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pessoa Física (CPF)
            </button>
            <button
              type="button"
              onClick={() => setTipoPessoa("JURIDICA")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tipoPessoa === "JURIDICA"
                  ? "bg-white dark:bg-slate-900 text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pessoa Jurídica (CNPJ)
            </button>
          </div>

          {/* Nome / Razão Social */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {tipoPessoa === "FISICA" ? "Nome Completo*" : "Razão Social / Nome da Empresa*"}
            </Label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tipoPessoa === "FISICA" ? "Ex: Carlos Eduardo Silva" : "Ex: Auto Peças & Transportes Ltda"}
                className="pl-9 h-10 text-xs rounded-xl"
                required
              />
            </div>
          </div>

          {/* CPF / CNPJ e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {tipoPessoa === "FISICA" ? "CPF*" : "CNPJ*"}
              </Label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                  placeholder={tipoPessoa === "FISICA" ? "000.000.000-00" : "00.000.000/0000-00"}
                  className="pl-9 h-10 text-xs font-mono rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Telefone / WhatsApp*
              </Label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="pl-9 h-10 text-xs font-mono rounded-xl"
                  required
                />
              </div>
            </div>
          </div>

          {/* E-mail */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              E-mail para Login*
            </Label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-10 text-xs rounded-xl"
                required
              />
            </div>
          </div>

          {/* Senhas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Senha*
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="password"
                  placeholder="Mínimo 6 dígitos"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Confirmar Senha*
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-xl"
                  required
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Criando Cadastro...
              </>
            ) : (
              <>
                <span>Concluir Cadastro</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border/60 text-center">
          <p className="text-xs text-muted-foreground">
            Já possui uma conta?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Fazer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
